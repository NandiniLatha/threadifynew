import { NextResponse } from "next/server";
import { analyzeInspirationImage } from "@/lib/garment-vision/analyzer";

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json(
        { error: "Please upload an image first." },
        { status: 400 }
      );
    }

    let rawLabels: string[] = [];
    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (apiKey) {
      try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const res = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requests: [
                {
                  image: {
                    content: base64Data,
                  },
                  features: [
                    {
                      type: "LABEL_DETECTION",
                      maxResults: 8,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (res.ok) {
          const result = await res.json();
          const annotations = result.responses?.[0]?.labelAnnotations || [];
          rawLabels = annotations.map(
            (ann: { description: string }) => ann.description
          );
        }
      } catch {
        // Fall back gracefully to Garment Vision Library
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

    // Run Garment Vision Library analysis & matching
    const analysis = await analyzeInspirationImage({
      imageBase64,
      labels: rawLabels,
    });

    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "We couldn't analyze that image — try a clearer photo." },
      { status: 500 }
    );
  }
}
