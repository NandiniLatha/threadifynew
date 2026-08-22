import { NextResponse } from "next/server";
import http from "http";
import { analyzeInspirationImage, GraniteDetectionResult } from "@/lib/garment-vision/analyzer";

function callOllamaNative(url: string, payload: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(payload);
    const parsedUrl = new URL(url);

    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 11434,
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(dataString),
      },
      timeout: 0, // No timeout
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve(body);
        } else {
          reject(new Error(`Ollama returned status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(dataString);
    req.end();
  });
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

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    let graniteDetection: GraniteDetectionResult | undefined = undefined;
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

    // Attempt local Ollama Granite 3.2 Vision detection via native http.request
    try {
      const prompt = `Inspect this clothing/fashion image carefully. Return ONLY a raw JSON object with this exact schema:

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
- garmentType: primary visible garment or outfit (e.g. Saree, Half Saree, Lehenga Choli, Salwar Kameez, Anarkali, Kurti, Kurta, Blouse, Gown, Dress, Shirt, T-shirt, Jeans, Skirt, Trousers, Blazer, Suit, Sherwani, Dhoti, Indo-Western, Traditional Wear, Western Wear, Custom Garment, etc.).
- category: general style category (e.g. Traditional Wear, Western Wear, Indo-Western, Ethnic Wear, Formal Wear, Casual Wear, etc.). Do NOT include gender in category unless the wearer's gender is visually clear.
- gender: MUST ONLY be "Women" or "Men" if a human model/person of that gender is clearly visible wearing the item. If the image shows only a garment on a hanger, mannequin, flat lay, or if gender cannot be undeniably determined from visual features alone, return "Unknown".
- colour: visible primary color(s).
- pattern: pattern if visible, otherwise "Unknown".
- sleeveType: sleeve style if visible, otherwise "Unknown".
- neckline: neckline if visible, otherwise "Unknown".
- style: visual style description supported by the image, otherwise "Unknown".
- complexity: "Simple", "Moderate", or "Elaborate".
- confidenceScore: integer 0 to 100.
- reason: short explanation of the visual evidence used for garment identification.

CRITICAL: Never guess gender or assume gender from the garment category alone. If a person of a clear gender is not wearing the garment in the photo, return "Unknown" for gender.

Return ONLY raw JSON. No markdown backticks. Return "Unknown" for unidentifiable attributes.`;

      const responseText = await callOllamaNative(`${ollamaBaseUrl}/api/generate`, {
        model: "granite3.2-vision:2b",
        prompt: prompt,
        images: [base64Data],
        stream: false,
        keep_alive: "1h",
      });

      const data = JSON.parse(responseText);
      const outputText = data.response || "";

      // Safely extract JSON substring in case model included markdown or surrounding text
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && typeof parsed.garmentType === "string") {
          graniteDetection = {
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
        }
      }
    } catch {
      // Ollama offline, unreachable, or timed out -> gracefully fall back
    }

    let rawLabels: string[] = [];

    // Extract labels if Granite vision detection was successful
    if (graniteDetection && graniteDetection.garmentType && graniteDetection.garmentType !== "Unknown") {
      if (graniteDetection.garmentType) rawLabels.push(graniteDetection.garmentType);
      if (graniteDetection.category && graniteDetection.category !== "Unknown") rawLabels.push(graniteDetection.category);
      if (graniteDetection.colour && graniteDetection.colour !== "Unknown") rawLabels.push(graniteDetection.colour);
      if (graniteDetection.pattern && graniteDetection.pattern !== "Unknown") rawLabels.push(graniteDetection.pattern);
      if (graniteDetection.style && graniteDetection.style !== "Unknown") rawLabels.push(graniteDetection.style);
    } else {
      // Fallback: Google Vision API or Default Fallback Labels
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
        } catch {
          // Graceful fallback
        }
      }

      if (rawLabels.length === 0) {
        rawLabels = [
          "Coat",
          "Tailored Suit",
          "Bespoke Collar",
          "Linen Pattern",
          "Fall Wear",
        ];
      }
    }

    // Run Garment Vision Library analysis & matching
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
