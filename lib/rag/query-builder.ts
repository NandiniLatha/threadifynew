import { VisionAnalysisResult } from "../garment-vision/types";

export interface QueryBuilderOptions {
  extraIntent?: string;
}

/**
 * Converts structured vision output into a rich semantic fashion RAG query string
 */
export function buildFashionRagQuery(
  vision: Partial<VisionAnalysisResult>,
  options: QueryBuilderOptions = {}
): string {
  const parts: string[] = [];

  // 1. Canonical Garment Type
  if (vision.garmentType && vision.garmentType !== "Custom Garment") {
    parts.push(vision.garmentType);
  }

  // 2. Include specific detected labels from vision (e.g. "Banarasi Saree", "Three Piece Suit")
  if (Array.isArray(vision.labels)) {
    for (const label of vision.labels) {
      const l = label.trim();
      if (
        l &&
        l !== "Custom Palette" &&
        l !== "Solid" &&
        l !== "Unknown" &&
        l !== "Bespoke" &&
        l !== "Custom" &&
        !parts.includes(l)
      ) {
        parts.push(l);
      }
    }
  }

  // 3. Category
  if (vision.category && !parts.includes(vision.category)) {
    parts.push(vision.category);
  }

  // 4. Target Gender Profile
  if (vision.gender && vision.gender !== "Unisex" && !parts.includes(vision.gender)) {
    parts.push(vision.gender);
  }

  // 5. Colour
  if (vision.colour && vision.colour !== "Custom Palette" && !parts.includes(vision.colour)) {
    parts.push(vision.colour);
  }

  // 6. Pattern
  if (vision.pattern && vision.pattern !== "Unknown" && vision.pattern !== "Solid" && !parts.includes(vision.pattern)) {
    parts.push(vision.pattern);
  }

  // 7. Style
  if (vision.style && vision.style !== "Traditional" && !parts.includes(vision.style)) {
    parts.push(vision.style);
  }

  // 8. Complexity Rating
  if (vision.complexity && !parts.some((p) => p.includes("Craftsmanship"))) {
    parts.push(`${vision.complexity} Craftsmanship`);
  }

  // 9. Extra Domain Intent (if explicitly provided)
  if (options.extraIntent && options.extraIntent.trim().length > 0) {
    parts.push(options.extraIntent.trim());
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

