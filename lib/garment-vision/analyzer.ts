import { findClosestMatches } from "./matcher";
import { VisionAnalysisResult, GarmentSuggestions } from "./types";

export interface GraniteDetectionResult {
  garmentType?: string;
  category?: string;
  gender?: string;
  colour?: string;
  pattern?: string;
  sleeveType?: string;
  neckline?: string;
  style?: string;
  complexity?: string;
  confidenceScore?: number;
  reason?: string;
}

export interface AnalyzeOptions {
  imageBase64?: string;
  labels?: string[];
  graniteDetection?: GraniteDetectionResult;
}

/**
 * Helper to infer garment details and patterns from visual labels / nearest match
 */
function deriveGarmentAttributes(labels: string[], matchedGarment?: any) {
  const labelText = (labels || []).join(" ").toLowerCase();

  let garmentType = matchedGarment?.articleType || "Custom Garment";
  let category = matchedGarment?.subCategory || "Custom Apparel";
  let gender = matchedGarment?.gender || "Unknown";
  let colour = matchedGarment?.baseColour || "Custom Palette";
  let pattern = "Unknown";
  let sleeveType = "Unknown";
  let neckline = "Unknown";
  let style = "Custom Style";
  let complexity = matchedGarment?.complexity || "Basic";

  // Distinguish Indian Traditional & Contemporary Garments
  if (
    labelText.includes("half saree") ||
    labelText.includes("langa voni") ||
    labelText.includes("pattu pavadai") ||
    labelText.includes("voni") ||
    labelText.includes("davani")
  ) {
    garmentType = "Half Saree";
    category = "Indian Traditional Wear";
    style = "Traditional Langa Voni";
    complexity = "Bespoke Luxury";
    gender = "Women";
  } else if (
    labelText.includes("saree") ||
    labelText.includes("sari") ||
    labelText.includes("banarasi") ||
    labelText.includes("kanjeevaram")
  ) {
    garmentType = "Saree";
    category = "Indian Traditional Wear";
    style = "Traditional Saree Drape";
    gender = "Women";
  } else if (labelText.includes("lehenga") || labelText.includes("choli")) {
    garmentType = "Lehenga Choli";
    category = "Indian Traditional Wear";
    style = "Flared Lehenga";
    gender = "Women";
  } else if (labelText.includes("anarkali")) {
    garmentType = "Anarkali Suit";
    category = "Indian Traditional Wear";
    style = "Anarkali Flare";
    gender = "Women";
  } else if (labelText.includes("salwar") || labelText.includes("churidar") || labelText.includes("kameez")) {
    garmentType = "Salwar Kameez";
    category = "Indian Traditional Wear";
    style = "Salwar Suit";
    gender = "Women";
  } else if (labelText.includes("sherwani")) {
    garmentType = "Sherwani";
    category = "Men's Ethnic Wear";
    style = "Regal Sherwani";
    gender = "Men";
    complexity = "High";
  } else if (labelText.includes("kurti") || labelText.includes("kurta")) {
    garmentType = "Kurti / Kurta";
    category = "Ethnic Wear";
    style = "Contemporary Kurti";
  } else if (labelText.includes("designer blouse") || labelText.includes("blouse")) {
    garmentType = "Designer Blouse";
    category = "Ethnic Topwear";
    style = "Fitted Blouse";
    gender = "Women";
  } else if (labelText.includes("indo-western") || labelText.includes("fusion")) {
    garmentType = "Indo-Western";
    category = "Contemporary Fusion";
    style = "Indo-Western Fusion";
  } else if (labelText.includes("gown") || labelText.includes("evening gown")) {
    garmentType = "Gown";
    category = "Formal / Evening Wear";
    style = "Floor Length Gown";
    gender = "Women";
  } else if (
    labelText.includes("western suit") ||
    labelText.includes("tuxedo") ||
    labelText.includes("three piece suit") ||
    labelText.includes("business suit") ||
    (labelText.includes("suit") && (labelText.includes("men") || labelText.includes("formal") || labelText.includes("coat")))
  ) {
    garmentType = "Suit";
    category = "Formal Wear";
    style = "Tailored Fit";
    gender = labelText.includes("women") ? "Women" : "Men";
  } else if (labelText.includes("blazer")) {
    garmentType = "Blazer";
    category = "Formal Topwear";
    style = "Tailored Blazer";
  } else if (labelText.includes("dress")) {
    garmentType = "Dress";
    category = "Apparel";
    style = "A-Line Dress";
    gender = "Women";
  }

  // Infer Pattern
  if (labelText.includes("zari") || labelText.includes("zardozi") || labelText.includes("embroid")) pattern = "Embroidered / Zari";
  else if (labelText.includes("floral") || labelText.includes("flower")) pattern = "Floral";
  else if (labelText.includes("stripe") || labelText.includes("striped")) pattern = "Striped";
  else if (labelText.includes("printed") || labelText.includes("print")) pattern = "Printed";
  else if (labelText.includes("check") || labelText.includes("plaid")) pattern = "Checked";
  else if (labelText.includes("solid") || labelText.includes("plain")) pattern = "Solid";

  // Infer Sleeve Type
  if (labelText.includes("full sleeve") || labelText.includes("long sleeve")) sleeveType = "Full Length";
  else if (labelText.includes("elbow") || labelText.includes("elbow-length")) sleeveType = "Elbow-Length";
  else if (labelText.includes("short sleeve") || labelText.includes("short")) sleeveType = "Short Sleeve";
  else if (labelText.includes("sleeveless")) sleeveType = "Sleeveless";
  else if (labelText.includes("bell sleeve")) sleeveType = "Bell Sleeve";

  // Infer Neckline
  if (labelText.includes("sweetheart")) neckline = "Sweetheart Neck";
  else if (labelText.includes("mandarin") || labelText.includes("band collar") || labelText.includes("stand collar")) neckline = "Mandarin Collar";
  else if (labelText.includes("boat neck")) neckline = "Boat Neck";
  else if (labelText.includes("round neck") || labelText.includes("round")) neckline = "Round Neck";
  else if (labelText.includes("v-neck") || labelText.includes("v neck")) neckline = "V-Neck";
  else if (labelText.includes("square neck")) neckline = "Square Neck";
  else if (labelText.includes("high neck") || labelText.includes("halter")) neckline = "High Neck";

  // Infer Colour if present in labels
  const colorKeywords = [
    "maroon", "crimson", "red", "gold", "yellow", "mustard", "emerald green", "green", "mint",
    "royal blue", "navy blue", "blue", "teal", "cyan", "purple", "violet", "lavender", "pink", "rose", "coral", "peach",
    "ivory", "cream", "white", "black", "charcoal", "beige", "nude"
  ];
  for (const c of colorKeywords) {
    if (labelText.includes(c)) {
      colour = c.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
  const g = options.graniteDetection;

  // 1. Compare with Garment Vision Library
  const matchedGarments = await findClosestMatches({
    labels: initialLabels,
  });

  const bestMatch = matchedGarments[0]?.garment;

  // 2. Extract Garment Attributes
  const derived = deriveGarmentAttributes(initialLabels, bestMatch);

  // Overlay Granite's actual AI vision detection when available and valid
  const garmentType = (g?.garmentType && g.garmentType !== "Unknown") ? g.garmentType : derived.garmentType;
  const category = (g?.category && g.category !== "Unknown") ? g.category : derived.category;
  const gender = (g?.gender && g.gender !== "Unknown") ? g.gender : derived.gender;
  const colour = (g?.colour && g.colour !== "Unknown") ? g.colour : derived.colour;
  const pattern = (g?.pattern && g.pattern !== "Unknown") ? g.pattern : derived.pattern;
  const sleeveType = (g?.sleeveType && g.sleeveType !== "Unknown") ? g.sleeveType : derived.sleeveType;
  const neckline = (g?.neckline && g.neckline !== "Unknown") ? g.neckline : derived.neckline;
  const style = (g?.style && g.style !== "Unknown") ? g.style : derived.style;
  const complexity = (g?.complexity && g.complexity !== "Unknown") ? g.complexity : derived.complexity;
  const confidenceScore = g?.confidenceScore ? Math.min(1, Math.max(0, g.confidenceScore / 100)) : 0.94;

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
    garmentCategory: category,
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

  // Build clean visual tags list for Design Studio (no 'Unknown' or invalid labels)
  const graniteLabels: string[] = [];
  if (g?.garmentType && g.garmentType !== "Unknown") graniteLabels.push(g.garmentType);
  if (g?.category && g.category !== "Unknown") {
    if (g.category === "Men's Wear" || g.category === "Women's Wear") {
      if (gender === "Men" || gender === "Women") {
        graniteLabels.push(g.category);
      } else {
        graniteLabels.push("Traditional Wear");
      }
    } else {
      graniteLabels.push(g.category);
    }
  }
  if (g?.colour && g.colour !== "Unknown") graniteLabels.push(g.colour);
  if (g?.pattern && g.pattern !== "Unknown") graniteLabels.push(g.pattern);
  if (g?.style && g.style !== "Unknown") graniteLabels.push(g.style);
  if (g?.sleeveType && g.sleeveType !== "Unknown") graniteLabels.push(g.sleeveType.includes("Sleeve") ? g.sleeveType : `${g.sleeveType} Sleeves`);
  if (g?.neckline && g.neckline !== "Unknown") graniteLabels.push(g.neckline);
  if (g?.complexity && g.complexity !== "Unknown") graniteLabels.push(`${g.complexity} Design`);

  // Combine Granite tags with initial labels (excluding 'Unknown' or empty entries)
  const filteredInitial = initialLabels.filter((l) => l && l !== "Unknown" && !graniteLabels.includes(l));
  const enrichedLabels = Array.from(
    new Set([
      ...graniteLabels,
      ...filteredInitial,
    ])
  );

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
    confidenceScore,
    labels: enrichedLabels.length > 0 ? enrichedLabels : [garmentType, category, colour],
    matchedGarments,
    suggestions,
  };
}

