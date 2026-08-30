/**
 * Threadify Bespoke Pricing Engine
 * 
 * Computes realistic, transparent stitching, fabric, and embellishment quotations
 * based on canonical garment type, structural complexity, design attributes, and tailoring craftsmanship.
 */

export type GarmentComplexity =
  | "Basic"
  | "Simple"
  | "Moderate"
  | "Detailed"
  | "Heavy"
  | "Bridal"
  | "Bespoke Luxury";

export interface PricingEngineInput {
  garmentType: string;
  category?: string;
  complexity?: GarmentComplexity | string;
  sleeveType?: string;
  neckline?: string;
  pattern?: string;
  style?: string;
  labels?: string[];
  fabricSelected?: string;
  fabricCostPerMeterINR?: number;
  estimatedMeters?: number;
  customizationNotes?: string;
  occasion?: string;
  userBudgetMaxINR?: number;
}

export interface PricingBreakdownItem {
  item: string;
  costMin: number;
  costMax: number;
  description?: string;
}

export interface PricingCalculationResult {
  garmentType: string;
  complexityGrade: GarmentComplexity;
  stitchingCost: {
    min: number;
    max: number;
  };
  fabricCost?: {
    min: number;
    max: number;
    fabricName: string;
  };
  additionalWorkCost?: {
    min: number;
    max: number;
    items: string[];
  };
  totalEstimate: {
    min: number;
    max: number;
  };
  turnaroundDays: {
    min: number;
    max: number;
  };
  breakdown: PricingBreakdownItem[];
  explanation: string;
  disclaimer: string;
}

// ─── Base Stitching Ranges by Garment & Complexity (Labor Only, in INR) ────

interface ComplexityPriceTiers {
  basic: [number, number];
  moderate: [number, number];
  detailed: [number, number];
  luxury: [number, number];
}

const GARMENT_STITCHING_BASE: Record<string, ComplexityPriceTiers> = {
  // Simple Top / T-Shirt
  "Top": {
    basic: [300, 650],
    moderate: [600, 1100],
    detailed: [1000, 1800],
    luxury: [1600, 2800],
  },
  "T-Shirt": {
    basic: [250, 550],
    moderate: [500, 950],
    detailed: [850, 1500],
    luxury: [1400, 2400],
  },
  // Saree Blouse
  "Blouse": {
    basic: [400, 850],
    moderate: [800, 1600],
    detailed: [1600, 3500],
    luxury: [3200, 7500],
  },
  // Shirt
  "Shirt": {
    basic: [450, 900],
    moderate: [800, 1450],
    detailed: [1350, 2200],
    luxury: [2000, 3800],
  },
  // Kurti / Tunics
  "Kurti": {
    basic: [500, 950],
    moderate: [900, 1800],
    detailed: [1700, 3200],
    luxury: [3000, 5500],
  },
  // Salwar Kameez
  "Salwar Kameez": {
    basic: [750, 1400],
    moderate: [1300, 2400],
    detailed: [2200, 4200],
    luxury: [3800, 7800],
  },
  // Saree (Drape Ensemble / Blouse + Finishing)
  "Saree": {
    basic: [500, 1200], // Fall, pico, basic unlined blouse
    moderate: [1200, 2800], // Lined designer blouse + pico + tassels
    detailed: [2500, 5500], // Heritage weave finishing + designer blouse
    luxury: [4500, 12000], // Bridal / Zardozi complete ensemble
  },
  // Half Saree
  "Half Saree": {
    basic: [1800, 3500],
    moderate: [3200, 6000],
    detailed: [5500, 10500],
    luxury: [9000, 18000],
  },
  // Lehenga Choli
  "Lehenga Choli": {
    basic: [1800, 3600],
    moderate: [3400, 7000],
    detailed: [6500, 14000],
    luxury: [12000, 28000],
  },
  // Dress / Western Dress
  "Dress": {
    basic: [600, 1300],
    moderate: [1200, 2600],
    detailed: [2400, 4800],
    luxury: [4500, 9500],
  },
  // Evening / Wedding Gown
  "Gown": {
    basic: [1800, 3800],
    moderate: [3500, 7500],
    detailed: [7000, 15000],
    luxury: [14000, 32000],
  },
  // Sherwani
  "Sherwani": {
    basic: [2500, 5000],
    moderate: [4500, 8500],
    detailed: [8000, 16000],
    luxury: [15000, 30000],
  },
  // Suit / Blazer / Tuxedo
  "Suit": {
    basic: [2500, 5000], // Single blazer / basic 2pc
    moderate: [4500, 8500], // Standard 2pc tailored suit
    detailed: [6000, 12000], // 3-piece bespoke suit with vest
    luxury: [11000, 24000], // Tuxedo / Italian wool tailored bespoke
  },
  // Custom Garment default
  "Custom Garment": {
    basic: [450, 950],
    moderate: [900, 2000],
    detailed: [1900, 4200],
    luxury: [4000, 9500],
  },
};

// ─── Standard Fabric Price Tiers (INR per meter) ───────────────────────────

export interface FabricRateTier {
  rateMin: number;
  rateMax: number;
  tier: "Basic" | "Standard" | "Premium" | "Luxury";
}

export const STANDARD_FABRIC_RATES: Record<string, FabricRateTier> = {
  "Cotton": { rateMin: 180, rateMax: 320, tier: "Basic" },
  "Mulmul": { rateMin: 200, rateMax: 350, tier: "Basic" },
  "Rayon": { rateMin: 180, rateMax: 300, tier: "Basic" },
  "Linen": { rateMin: 350, rateMax: 650, tier: "Standard" },
  "Chiffon": { rateMin: 300, rateMax: 550, tier: "Standard" },
  "Georgette": { rateMin: 350, rateMax: 600, tier: "Standard" },
  "Crepe": { rateMin: 400, rateMax: 700, tier: "Standard" },
  "Organza": { rateMin: 450, rateMax: 850, tier: "Standard" },
  "Raw Silk": { rateMin: 700, rateMax: 1200, tier: "Premium" },
  "Chanderi Silk": { rateMin: 650, rateMax: 1100, tier: "Premium" },
  "Tussar Silk": { rateMin: 800, rateMax: 1400, tier: "Premium" },
  "Velvet": { rateMin: 600, rateMax: 1200, tier: "Premium" },
  "Brocade": { rateMin: 750, rateMax: 1500, tier: "Premium" },
  "Italian Wool": { rateMin: 1200, rateMax: 2500, tier: "Luxury" },
  "Banarasi Silk": { rateMin: 1100, rateMax: 2400, tier: "Luxury" },
  "Kanchipuram Silk": { rateMin: 1400, rateMax: 3200, tier: "Luxury" },
};

function resolveFabricRate(fabricName: string): FabricRateTier {
  const f = fabricName.toLowerCase().trim();
  for (const [key, tier] of Object.entries(STANDARD_FABRIC_RATES)) {
    if (f.includes(key.toLowerCase())) {
      return tier;
    }
  }
  return { rateMin: 350, rateMax: 650, tier: "Standard" };
}

/**
 * Normalizes garment type to a key in GARMENT_STITCHING_BASE
 */
function resolveGarmentKey(type: string): string {
  const t = (type || "").toLowerCase().trim();
  if (t.includes("half saree") || t.includes("langa voni")) return "Half Saree";
  if (t.includes("saree") || t.includes("sari")) return "Saree";
  if (t.includes("top") || t.includes("crop top") || t.includes("tank")) return "Top";
  if (t.includes("t-shirt") || t.includes("tshirt") || t.includes("tee")) return "T-Shirt";
  if (t.includes("blouse")) return "Blouse";
  if (t.includes("shirt")) return "Shirt";
  if (t.includes("kurti") || t.includes("kurta") || t.includes("tunic")) return "Kurti";
  if (t.includes("lehenga")) return "Lehenga Choli";
  if (t.includes("salwar") || t.includes("anarkali") || t.includes("churidar")) return "Salwar Kameez";
  if (t.includes("gown")) return "Gown";
  if (t.includes("dress")) return "Dress";
  if (t.includes("sherwani")) return "Sherwani";
  if (t.includes("suit") || t.includes("blazer") || t.includes("tuxedo")) return "Suit";
  return "Custom Garment";
}

/**
 * Derives normalized complexity category based on garment tags, pattern, notes, and vision attributes
 */
export function deriveGarmentComplexity(input: PricingEngineInput): GarmentComplexity {
  const combinedText = [
    input.complexity || "",
    input.style || "",
    input.pattern || "",
    input.customizationNotes || "",
    input.occasion || "",
    ...(input.labels || []),
  ].join(" ").toLowerCase();

  if (
    combinedText.includes("bridal") ||
    combinedText.includes("zardozi") ||
    combinedText.includes("wedding") ||
    combinedText.includes("maggam") ||
    combinedText.includes("heavy embroidery") ||
    combinedText.includes("royal") ||
    combinedText.includes("three piece suit")
  ) {
    if (combinedText.includes("bridal") || combinedText.includes("heavy embroidery")) {
      return "Bridal";
    }
    return "Detailed";
  }

  if (
    combinedText.includes("embroidered") ||
    combinedText.includes("zari") ||
    combinedText.includes("designer") ||
    combinedText.includes("kadhwa") ||
    combinedText.includes("banarasi") ||
    combinedText.includes("kanjeevaram") ||
    combinedText.includes("pleat") ||
    combinedText.includes("layer") ||
    combinedText.includes("flared") ||
    combinedText.includes("vest")
  ) {
    return "Detailed";
  }

  if (
    combinedText.includes("contemporary") ||
    combinedText.includes("a-line") ||
    combinedText.includes("lined") ||
    combinedText.includes("collar") ||
    combinedText.includes("moderate") ||
    combinedText.includes("custom fit")
  ) {
    return "Moderate";
  }

  if (
    combinedText.includes("basic") ||
    combinedText.includes("simple") ||
    combinedText.includes("solid") ||
    combinedText.includes("casual") ||
    combinedText.includes("sleeveless") ||
    combinedText.includes("plain")
  ) {
    return "Basic";
  }

  // Default fallback based on canonical garment baseline
  const garmentKey = resolveGarmentKey(input.garmentType);
  if (garmentKey === "Top" || garmentKey === "T-Shirt") return "Basic";
  if (garmentKey === "Blouse" || garmentKey === "Shirt") return "Basic";
  if (garmentKey === "Suit" || garmentKey === "Lehenga Choli" || garmentKey === "Half Saree") return "Detailed";

  return "Moderate";
}

/**
 * Calculates a grounded, realistic pricing quotation for custom tailoring
 */
export function calculateRealisticPrice(input: PricingEngineInput): PricingCalculationResult {
  const garmentKey = resolveGarmentKey(input.garmentType);
  const complexityGrade = deriveGarmentComplexity(input);
  const tiers = GARMENT_STITCHING_BASE[garmentKey] || GARMENT_STITCHING_BASE["Custom Garment"];

  // 1. Base Stitching Labor
  let baseStitchingRange: [number, number];
  switch (complexityGrade) {
    case "Basic":
    case "Simple":
      baseStitchingRange = [...tiers.basic];
      break;
    case "Moderate":
      baseStitchingRange = [...tiers.moderate];
      break;
    case "Detailed":
    case "Heavy":
      baseStitchingRange = [...tiers.detailed];
      break;
    case "Bridal":
    case "Bespoke Luxury":
      baseStitchingRange = [...tiers.luxury];
      break;
    default:
      baseStitchingRange = [...tiers.moderate];
  }

  let [stitchingMin, stitchingMax] = baseStitchingRange;

  // 2. Specific Design Details Adjustments
  const breakdown: PricingBreakdownItem[] = [];
  const additionalWorkItems: string[] = [];
  let additionalMin = 0;
  let additionalMax = 0;

  breakdown.push({
    item: `Base Bespoke Stitching (${garmentKey})`,
    costMin: stitchingMin,
    costMax: stitchingMax,
    description: `Pattern drafting, cutting, and standard fitting for ${complexityGrade.toLowerCase()} complexity.`,
  });

  const combinedNotes = [
    input.pattern || "",
    input.customizationNotes || "",
    ...(input.labels || []),
  ].join(" ").toLowerCase();

  // Embroidery / Zari embellishment
  if (combinedNotes.includes("zardozi") || combinedNotes.includes("maggam")) {
    const addMin = 1500;
    const addMax = 4000;
    additionalMin += addMin;
    additionalMax += addMax;
    additionalWorkItems.push("Hand Zardozi / Maggam Embroidery Work");
    breakdown.push({
      item: "Handcrafted Zardozi / Maggam Work",
      costMin: addMin,
      costMax: addMax,
      description: "Intricate hand needlework with metallic threads and bead embellishments.",
    });
  } else if (combinedNotes.includes("embroid") || combinedNotes.includes("zari")) {
    const addMin = 500;
    const addMax = 1400;
    additionalMin += addMin;
    additionalMax += addMax;
    additionalWorkItems.push("Threadwork & Zari Border Accents");
    breakdown.push({
      item: "Embroidery / Zari Detailing",
      costMin: addMin,
      costMax: addMax,
      description: "Decorative border finishing and delicate embroidery motifs.",
    });
  }

  // Multi-layer / Can-can structure
  if (combinedNotes.includes("can-can") || combinedNotes.includes("cancan") || (garmentKey === "Lehenga Choli" && complexityGrade === "Bridal")) {
    const addMin = 600;
    const addMax = 1200;
    additionalMin += addMin;
    additionalMax += addMax;
    additionalWorkItems.push("Structured Inner Lining & Can-Can Net");
    breakdown.push({
      item: "Structured Can-Can & Volume Flare",
      costMin: addMin,
      costMax: addMax,
      description: "Heavy multi-tier net crinoline for bridal flare silhouette.",
    });
  }

  // 3. Optional Fabric Cost Calculation (ONLY if user explicitly selected/specified fabric)
  let fabricCost: { min: number; max: number; fabricName: string } | undefined = undefined;
  if (
    input.fabricSelected &&
    input.fabricSelected !== "Customer Provided" &&
    input.fabricSelected !== "Not Selected" &&
    input.fabricSelected.trim().length > 0
  ) {
    const meters = input.estimatedMeters || (garmentKey === "Lehenga Choli" ? 4.5 : garmentKey === "Suit" ? 3.5 : garmentKey === "Saree" ? 5.5 : 2.0);
    const fabricRate = resolveFabricRate(input.fabricSelected);
    const rateMin = input.fabricCostPerMeterINR ? Math.round(input.fabricCostPerMeterINR * 0.85) : fabricRate.rateMin;
    const rateMax = input.fabricCostPerMeterINR ? Math.round(input.fabricCostPerMeterINR * 1.25) : fabricRate.rateMax;

    const fMin = Math.round(meters * rateMin);
    const fMax = Math.round(meters * rateMax);

    fabricCost = {
      min: fMin,
      max: fMax,
      fabricName: input.fabricSelected,
    };

    breakdown.push({
      item: `Selected Fabric Material (${input.fabricSelected} ~${meters}m)`,
      costMin: fMin,
      costMax: fMax,
      description: `Bespoke fabric sourcing (${fabricRate.tier} tier) at ₹${rateMin}-₹${rateMax}/m.`,
    });
  }

  // 4. Compute Total Estimate
  const totalMin = stitchingMin + additionalMin + (fabricCost?.min || 0);
  const totalMax = stitchingMax + additionalMax + (fabricCost?.max || 0);

  // 5. Compute Realistic Turnaround Days based on complexity
  let turnaroundDays: { min: number; max: number };
  switch (complexityGrade) {
    case "Basic":
    case "Simple":
      turnaroundDays = { min: 3, max: 5 };
      break;
    case "Moderate":
      turnaroundDays = { min: 4, max: 7 };
      break;
    case "Detailed":
      turnaroundDays = { min: 7, max: 12 };
      break;
    case "Heavy":
    case "Bridal":
    case "Bespoke Luxury":
      turnaroundDays = { min: 12, max: 24 };
      break;
    default:
      turnaroundDays = { min: 4, max: 7 };
  }

  // 6. Natural Language Explanation
  const explanation = [
    `Estimated for ${complexityGrade} complexity ${input.garmentType}.`,
    `Pure Stitching Labor: ₹${stitchingMin.toLocaleString()} - ₹${stitchingMax.toLocaleString()} INR.`,
    additionalWorkItems.length > 0 ? `Additional Work (${additionalWorkItems.join(", ")}): ₹${additionalMin.toLocaleString()} - ₹${additionalMax.toLocaleString()} INR.` : null,
    fabricCost ? `Fabric Material (${fabricCost.fabricName}): ₹${fabricCost.min.toLocaleString()} - ₹${fabricCost.max.toLocaleString()} INR.` : "Fabric cost not included (customer provides fabric or procures independently).",
  ].filter(Boolean).join(" ");

  const disclaimer = "Final price may vary based on fabric, measurements, design complexity and tailor quotation.";

  return {
    garmentType: input.garmentType,
    complexityGrade,
    stitchingCost: {
      min: stitchingMin,
      max: stitchingMax,
    },
    fabricCost,
    additionalWorkCost: additionalWorkItems.length > 0 ? { min: additionalMin, max: additionalMax, items: additionalWorkItems } : undefined,
    totalEstimate: {
      min: totalMin,
      max: totalMax,
    },
    turnaroundDays,
    breakdown,
    explanation,
    disclaimer,
  };
}
