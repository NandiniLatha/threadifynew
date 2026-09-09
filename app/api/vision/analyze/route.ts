import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import http from "http";
import { analyzeInspirationImage, GraniteDetectionResult } from "@/lib/garment-vision/analyzer";

const GARMENT_VISION_PROMPT = `Inspect this clothing/fashion image carefully. Return a JSON object with this exact schema:

{
  "garmentType": "string",
  "category": "string",
  "gender": "string",
  "colour": "string",
  "pattern": "string",
  "sleeveType": "string",
  "neckline": "string",
  "style": "string",
  "complexity": "string",
  "confidenceScore": 0,
  "reason": "string"
}

Rules:
- Identify the actual visible garment and prioritize it over the background or person.
- garmentType: primary visible garment or outfit (e.g. Saree, Lehenga Choli, Salwar Kameez, Kurti, Kurta, Sherwani, Dhoti, Suit, Dress, Shirt, T-shirt, Jeans, etc.).
- category: general style category. Explicitly distinguish between Ethnic/Traditional vs Western/Formal/Casual.
- gender: MUST ONLY be "Women" or "Men" if a human model of that gender is clearly visible. Do NOT infer gender from the appearance of a person if unclear. If on a hanger/flat lay, return "Unknown".
- colour, pattern, sleeveType, neckline: describe only when visually supported. Do not invent attributes that cannot be visually determined. Otherwise "Unknown".
- style: visual style description supported by the image, otherwise "Unknown".
- complexity: "Simple", "Moderate", or "Elaborate".
- confidenceScore: integer 0 to 100. Return low confidence (e.g. < 50) when uncertain.
- reason: short explanation of the visual evidence used for garment identification.

Return "Unknown" for unidentifiable attributes.`;

/**
 * Call Gemini 2.5 Flash-Lite for Vision Analysis
 */
async function analyzeWithGemini(base64Data: string, mimeType: string): Promise<GraniteDetectionResult | undefined> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`[Gemini Route] API Key present: ${!!apiKey}`);
  
  if (!apiKey) {
    return undefined;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: GARMENT_VISION_PROMPT },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    console.log("[Gemini Raw Response] text:", response.text);

    if (response.text) {
      const parsed = JSON.parse(response.text);
      console.log("[Gemini Parsed Object]:", parsed);
      if (parsed && typeof parsed.garmentType === "string") {
        return {
          garmentType: parsed.garmentType,
          category: parsed.category,
          gender: parsed.gender,
          colour: parsed.colour,
          pattern: parsed.pattern,
          sleeveType: parsed.sleeveType,
          neckline: parsed.neckline,
          style: parsed.style,
          complexity: parsed.complexity,
          confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 85,
          reason: parsed.reason,
        };
      } else {
        console.log("[Gemini Validation Failed] Missing garmentType string");
      }
    } else {
      console.log("[Gemini Empty Response] response.text is falsy");
    }
  } catch (error) {
    console.error("[Gemini Vision API Error]", error);
  }

  return undefined;
}

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json(
        { error: "Please upload an image first." },
        { status: 400 }
      );
    }

    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // PRIMARY GATEWAY: Gemini 2.5 Flash-Lite
    let graniteDetection = await analyzeWithGemini(base64Data, mimeType);

    let rawLabels: string[] = [];

    // Extract labels if Granite / Cloudflare vision detection succeeded
    if (graniteDetection && graniteDetection.garmentType && graniteDetection.garmentType !== "Unknown") {
      if (graniteDetection.garmentType) rawLabels.push(graniteDetection.garmentType);
      if (graniteDetection.category && graniteDetection.category !== "Unknown") rawLabels.push(graniteDetection.category);
      if (graniteDetection.colour && graniteDetection.colour !== "Unknown") rawLabels.push(graniteDetection.colour);
      if (graniteDetection.pattern && graniteDetection.pattern !== "Unknown") rawLabels.push(graniteDetection.pattern);
      if (graniteDetection.style && graniteDetection.style !== "Unknown") rawLabels.push(graniteDetection.style);
    } else {
      // Fallback: Google Vision API or Default Baseline Labels
      const apiKey = process.env.GOOGLE_VISION_API_KEY;
      if (apiKey) {
        try {
          const res = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requests: [
                  {
                    image: { content: base64Data },
                    features: [{ type: "LABEL_DETECTION", maxResults: 8 }],
                  },
                ],
              }),
            }
          );
          if (res.ok) {
            const result = await res.json();
            const annotations = result.responses?.[0]?.labelAnnotations || [];
            rawLabels = annotations.map((ann: { description: string }) => ann.description);
          }
        } catch (error) {
          console.error("[Google Vision API Error]", error);
        }
      }

      // Removed hardcoded fallback labels to avoid inventing fashion tags when vision fails
    }

    // Run Garment Vision Library analysis & tag formatting
    const analysis = await analyzeInspirationImage({
      imageBase64,
      labels: rawLabels,
      graniteDetection,
    });

    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "We couldn't analyze that image — try a clearer photo." },
      { status: 500 }
    );
  }
}
