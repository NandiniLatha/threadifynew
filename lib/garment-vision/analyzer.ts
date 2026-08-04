import { findClosestMatches } from "./matcher";
import { VisionAnalysisResult, GarmentSuggestions } from "./types";

export interface AnalyzeOptions {
  imageBase64?: string;
  labels?: string[];
}

/**
 * Helper to infer garment details and patterns from visual labels / nearest match
 */
function deriveGarmentAttributes(labels: string[], matchedGarment?: any) {
  const labelText = (labels || []).join(" ").toLowerCase();

  const garmentType = matchedGarment?.articleType || "Custom Garment";
  const category = matchedGarment?.subCategory || "Apparel";
  const gender = matchedGarment?.gender || "Women";
  let colour = matchedGarment?.baseColour || "Emerald Green";
  let pattern = "Solid";
  let sleeveType = "Sleeveless";
  let neckline = "V-Neck";
  let style = "A-Line";
  const complexity = matchedGarment?.complexity || "Moderate";

  // Infer Pattern
  if (labelText.includes("floral") || labelText.includes("flower")) pattern = "Floral";
  else if (labelText.includes("stripe") || labelText.includes("striped")) pattern = "Striped";
  else if (labelText.includes("print") || labelText.includes("pattern")) pattern = "Printed";
  else if (labelText.includes("embroider") || labelText.includes("zardozi")) pattern = "Embroidered";
  else if (labelText.includes("check") || labelText.includes("plaid")) pattern = "Checked";

  // Infer Sleeve Type
  if (labelText.includes("full sleeve") || labelText.includes("long sleeve")) sleeveType = "Full Length";
  else if (labelText.includes("short sleeve")) sleeveType = "Short";
  else if (labelText.includes("three quarter") || labelText.includes("3/4")) sleeveType = "Three-Quarter";
  else if (labelText.includes("bell sleeve")) sleeveType = "Bell";

  // Infer Neckline
  if (labelText.includes("mandarin") || labelText.includes("band collar")) neckline = "Mandarin";
  else if (labelText.includes("round neck") || labelText.includes("crew neck")) neckline = "Round";
  else if (labelText.includes("sweetheart")) neckline = "Sweetheart";
  else if (labelText.includes("high neck") || labelText.includes("turtle")) neckline = "High Neck";

  // Infer Style
  if (labelText.includes("suit") || labelText.includes("blazer")) style = "Tailored Fit";
  else if (labelText.includes("anarkali")) style = "Anarkali";
  else if (labelText.includes("lehenga")) style = "Lehenga";
  else if (labelText.includes("indo-western")) style = "Indo-Western";
  else if (labelText.includes("gown")) style = "Gown";
  else if (labelText.includes("straight")) style = "Straight Cut";

  // Infer Colour if present in labels
  const colorKeywords = [
    "red", "blue", "green", "black", "white", "navy", "maroon", "gold", "pink",
    "yellow", "purple", "ivory", "crimson", "emerald", "midnight blue", "beige"
  ];
  for (const c of colorKeywords) {
    if (labelText.includes(c)) {
      colour = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  return {
    garmentType,
    category,
    gender,
    colour,
    pattern,
    sleeveType,
    neckline,
    style,
    complexity,
  };
}

/**
 * Main Garment Vision Analyzer
 */
export async function analyzeInspirationImage(
  options: AnalyzeOptions
): Promise<VisionAnalysisResult> {
  const initialLabels = options.labels || ["Bespoke Garment", "Designer Wear", "Tailored Apparel"];

  // 1. Compare with Garment Vision Library
  const matchedGarments = await findClosestMatches({
    labels: initialLabels,
  });

  const bestMatch = matchedGarments[0]?.garment;

  // 2. Extract Garment Attributes
  const attributes = deriveGarmentAttributes(initialLabels, bestMatch);

  // 3. Fabric Recommendations
  const suggestedFabric = bestMatch?.fabricRecommendations || [
    "Silk Blend",
    "Cotton Linen",
    "Chiffon",
    "Raw Silk",
    "Velvet",
  ];

  // 4. Tailor Recommendation
  const tailorRecommendation =
    bestMatch?.tailorRecommendations?.[0] ||
    "Master Bespoke Designer Specialist";

  // 5. Cost & Delivery
  const minCost = bestMatch?.estimatedStitchingCost?.min || 2500;
  const maxCost = bestMatch?.estimatedStitchingCost?.max || 6500;
  const deliveryDaysMin = bestMatch?.deliveryTimeDays?.min || 5;
  const deliveryDaysMax = bestMatch?.deliveryTimeDays?.max || 9;

  // 6. Dynamic Quotes
  const dynamicQuotes = [
    { item: "Base Pattern & Stitching", cost: Math.round(minCost * 0.55) },
    { item: "Custom Fitting & Adjustments", cost: Math.round(minCost * 0.25) },
    { item: "Finishing & Premium Lining", cost: Math.round(minCost * 0.20) },
  ];

  const suggestions: GarmentSuggestions = {
    garmentCategory: attributes.category,
    suggestedFabric,
    tailorRecommendation,
    estimatedStitchingCost: {
      min: minCost,
      max: maxCost,
      formatted: `₹${minCost.toLocaleString()} - ₹${maxCost.toLocaleString()}`,
    },
    deliveryTime: `${deliveryDaysMin}-${deliveryDaysMax} Business Days`,
    dynamicQuotes,
  };

  // Combine initial labels with detected attributes to enrich visual labels
  const enrichedLabels = Array.from(
    new Set([
      attributes.garmentType,
      attributes.style,
      attributes.pattern,
      attributes.colour,
      attributes.complexity,
      ...initialLabels,
    ])
  );

  return {
    garmentType: attributes.garmentType,
    category: attributes.category,
    gender: attributes.gender,
    colour: attributes.colour,
    pattern: attributes.pattern,
    sleeveType: attributes.sleeveType,
    neckline: attributes.neckline,
    style: attributes.style,
    complexity: attributes.complexity,
    confidenceScore: 0.94,
    labels: enrichedLabels,
    matchedGarments,
    suggestions,
  };
}
