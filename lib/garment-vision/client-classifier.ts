"use client"

import garmentIndexData from "./garment-index.json";
import {
  GarmentRecord,
  VisionAnalysisResult,
  VisionDetectionStatus,
  WearerCategory,
  StyleCategory,
  SleeveAttribute,
  NecklineAttribute,
  FitAttribute,
  LengthAttribute,
  PatternAttribute,
  WorkAttribute,
  ComplexityGrade,
  OccasionType,
} from "./types";
import {
  matchColorRGB,
  extractDominantColorsFromPixels,
  CONTROLLED_COLOR_PALETTE,
} from "./color-extractor";

export interface ClientClassifierOptions {
  imageBase64?: string;
  imagePath?: string;
  rgbColor?: { r: number; g: number; b: number };
}

/**
 * Stage 1: Tri-State Garment Relevance Prompts
 */
export interface Stage1RelevancePrompt {
  label: string;
  status: VisionDetectionStatus;
  description: string;
}

export const STAGE1_RELEVANCE_PROMPTS: Stage1RelevancePrompt[] = [
  // CLEAR_GARMENT (Garment clearly visible, whether worn on body or standalone product)
  { label: "a photograph showing clearly visible clothing, outfit, saree, shirt, dress, or tailored apparel", status: "CLEAR_GARMENT", description: "Clear garment apparel" },
  { label: "a clear fashion photograph of a person, model, or mannequin displaying clothing or apparel", status: "CLEAR_GARMENT", description: "Clothing on person or model" },
  { label: "a clear standalone product photograph of a tailored garment or bespoke clothing", status: "CLEAR_GARMENT", description: "Clear product photograph" },

  // UNCLEAR_IMAGE (Genuinely uninspectable / face selfie / blur / dark / cropped)
  { label: "a close-up portrait selfie of a human face with little or no clothing visible", status: "UNCLEAR_IMAGE", description: "Face portrait / selfie" },
  { label: "an extremely blurry, dark, pixelated, out of focus, or degraded low quality photo", status: "UNCLEAR_IMAGE", description: "Low quality / unclear image" },
  { label: "a crowded scene or distant candid snapshot where clothing cannot be clearly seen", status: "UNCLEAR_IMAGE", description: "Distant crowd / candid scene" },

  // NO_GARMENT (Non-clothing objects, interior, food, electronics, scenery)
  { label: "a photograph of furniture, desk, chair, electronics, or interior room without clothing", status: "NO_GARMENT", description: "Furniture / interior" },
  { label: "a photograph of food, dish, animal, pet, flower, or plant without clothing", status: "NO_GARMENT", description: "Food / animal / plant" },
  { label: "a photograph of a building, vehicle, tool, hardware, or outdoor nature landscape without clothing", status: "NO_GARMENT", description: "Non-clothing scenery / object" },
];

/**
 * Stage 2: Canonical Garment Taxonomy Prompts
 */
export const CONTROLLED_TAXONOMY_PROMPTS = [
  { label: "a photo of a traditional draped indian saree", garmentType: "Saree", category: "Indian Traditional Wear", wearerCategory: "Women's Wear" as WearerCategory, styleCategory: "Ethnic Wear" as StyleCategory, gender: "Women", style: "Traditional Saree Drape", complexity: "High", requiresHighMargin: true },
  { label: "a photo of a south indian half saree, langa voni, or pavadai", garmentType: "Half Saree", category: "Indian Traditional Wear", wearerCategory: "Women's Wear" as WearerCategory, styleCategory: "Ethnic Wear" as StyleCategory, gender: "Women", style: "Traditional Langa Voni", complexity: "Bespoke Luxury", requiresHighMargin: true },
  { label: "a photo of a women's ethnic kurti or kurta tunic", garmentType: "Kurti", category: "Ethnic Wear", wearerCategory: "Women's Wear" as WearerCategory, styleCategory: "Ethnic Wear" as StyleCategory, gender: "Women", style: "Contemporary Kurti", complexity: "Moderate", requiresHighMargin: false },
  { label: "a photo of a men's collared dress shirt, button down, or casual shirt", garmentType: "Shirt", category: "Topwear", wearerCategory: "Men's Wear" as WearerCategory, styleCategory: "Western Wear" as StyleCategory, gender: "Men", style: "Casual Fit", complexity: "Basic", requiresHighMargin: false },
  { label: "a photo of a casual cotton t-shirt or tee", garmentType: "T-Shirt", category: "Casual Topwear", wearerCategory: "Unisex" as WearerCategory, styleCategory: "Western Wear" as StyleCategory, gender: "Men", style: "Casual Tee", complexity: "Basic", requiresHighMargin: false },
  { label: "a photo of a bridal lehenga choli with flared skirt", garmentType: "Lehenga Choli", category: "Indian Traditional Wear", wearerCategory: "Women's Wear" as WearerCategory, styleCategory: "Ethnic Wear" as StyleCategory, gender: "Women", style: "Flared Lehenga", complexity: "Bespoke Luxury", requiresHighMargin: true },
  { label: "a photo of a western wedding gown or evening dress", garmentType: "Gown", category: "Formal / Evening Wear", wearerCategory: "Women's Wear" as WearerCategory, styleCategory: "Western Wear" as StyleCategory, gender: "Women", style: "Floor Length Gown", complexity: "Bespoke Luxury", requiresHighMargin: true },
  { label: "a photo of an indian men's royal sherwani or bandhgala", garmentType: "Sherwani", category: "Men's Ethnic Wear", wearerCategory: "Men's Wear" as WearerCategory, styleCategory: "Ethnic Wear" as StyleCategory, gender: "Men", style: "Regal Sherwani", complexity: "Bespoke Luxury", requiresHighMargin: true },
  { label: "a photo of a men's formal tailored three-piece suit or blazer", garmentType: "Suit", category: "Formal Wear", wearerCategory: "Men's Wear" as WearerCategory, styleCategory: "Western Wear" as StyleCategory, gender: "Men", style: "Tailored Suit", complexity: "High", requiresHighMargin: true },
  { label: "a photo of a women's casual dress or a-line frock", garmentType: "Dress", category: "Apparel", wearerCategory: "Women's Wear" as WearerCategory, styleCategory: "Western Wear" as StyleCategory, gender: "Women", style: "A-Line Dress", complexity: "Moderate", requiresHighMargin: false },
  { label: "a photo of a designer saree blouse or choli top", garmentType: "Blouse", category: "Ethnic Topwear", wearerCategory: "Women's Wear" as WearerCategory, styleCategory: "Ethnic Wear" as StyleCategory, gender: "Women", style: "Fitted Blouse", complexity: "Basic", requiresHighMargin: false },
  { label: "a photo of a traditional indian salwar kameez or anarkali suit", garmentType: "Salwar Kameez", category: "Indian Traditional Wear", wearerCategory: "Women's Wear" as WearerCategory, styleCategory: "Ethnic Wear" as StyleCategory, gender: "Women", style: "Anarkali Suit", complexity: "Moderate", requiresHighMargin: true },
  { label: "a clear photo of a bespoke or custom tailored fashion garment", garmentType: "Custom Garment", category: "Custom Apparel", wearerCategory: "Unknown" as WearerCategory, styleCategory: "Unknown" as StyleCategory, gender: "Unknown", style: "Custom Style", complexity: "Basic", requiresHighMargin: false },
];

/**
 * Normalizes garment names to canonical singular Threadify taxonomy
 */
export function normalizeGarmentType(type: string): string {
  const t = (type || "").trim().toLowerCase();
  if (t === "half saree" || t === "langa voni" || t === "pattu pavadai") return "Half Saree";
  if (t === "saree" || t === "sarees" || t === "banarasi saree" || t === "kanjeevaram saree") return "Saree";
  if (t === "kurti" || t === "kurtis" || t === "kurta") return "Kurti";
  if (t === "designer blouse" || t === "blouse") return "Blouse";
  if (t === "shirt" || t === "shirts" || t === "casual shirt" || t === "formal shirt") return "Shirt";
  if (t === "tshirt" || t === "tshirts" || t === "t-shirt" || t === "tee") return "T-Shirt";
  if (t === "lehenga" || t === "lehenga choli" || t === "choli" || t === "bridal lehenga") return "Lehenga Choli";
  if (t === "salwar kameez" || t === "salwar" || t === "churidar" || t === "anarkali") return "Salwar Kameez";
  if (t === "gown" || t === "wedding gown" || t === "evening gown") return "Gown";
  if (t === "dress" || t === "dresses" || t === "a-line dress") return "Dress";
  if (t === "sherwani") return "Sherwani";
  if (t === "suit" || t === "suits" || t === "blazer" || t === "blazers" || t === "tuxedo" || t === "three piece suit") return "Suit";
  return "Custom Garment";
}

// Singleton Zero-Shot Image Classification Pipeline
let cachedClassifierPipeline: any = null;

export const GARMENT_CONFIDENCE_THRESHOLD = 0.30;
export const GARMENT_SEPARATION_MARGIN = 0.05;

export interface RawCandidateResult {
  label: string;
  score: number;
}

export interface RelevanceDecision {
  status: VisionDetectionStatus;
  userMessage?: string;
  reason: string;
  clearScore: number;
  unclearScore: number;
  noGarmentScore: number;
}

export interface GatedClassificationDecision {
  garmentType: string;
  category: string;
  wearerCategory: WearerCategory;
  styleCategory: StyleCategory;
  gender: string;
  style: string;
  complexity: string;
  confidenceScore: number;
  isConfident: boolean;
  decisionReason: string;
}

/**
 * Pure Stage 1 Tri-State Relevance Gate
 */
export function applyRelevanceGate(rawRelevanceResults: RawCandidateResult[]): RelevanceDecision {
  if (!rawRelevanceResults || rawRelevanceResults.length === 0) {
    return {
      status: "UNCLEAR_IMAGE",
      userMessage: "Image is unclear or blurred. Please upload a clearer image showing the garment.",
      reason: "No relevance results produced",
      clearScore: 0,
      unclearScore: 0,
      noGarmentScore: 0,
    };
  }

  const top = rawRelevanceResults[0];
  const topPrompt = STAGE1_RELEVANCE_PROMPTS.find((p) => p.label === top.label);

  let clearScore = 0;
  let unclearScore = 0;
  let noGarmentScore = 0;

  for (const r of rawRelevanceResults) {
    const p = STAGE1_RELEVANCE_PROMPTS.find((item) => item.label === r.label);
    if (!p) continue;
    if (p.status === "CLEAR_GARMENT") clearScore += r.score;
    else if (p.status === "UNCLEAR_IMAGE") unclearScore += r.score;
    else if (p.status === "NO_GARMENT") noGarmentScore += r.score;
  }

  // 1. NO_GARMENT Priority
  if (topPrompt?.status === "NO_GARMENT" || (noGarmentScore > clearScore && noGarmentScore >= unclearScore)) {
    return {
      status: "NO_GARMENT",
      userMessage: "No garment detected. Please upload a clothing or outfit image.",
      reason: topPrompt?.description || "Non-clothing object / scenery detected",
      clearScore,
      unclearScore,
      noGarmentScore,
    };
  }

  // 2. UNCLEAR_IMAGE Priority
  if (
    topPrompt?.status === "UNCLEAR_IMAGE" ||
    (unclearScore > clearScore && unclearScore > 0.40)
  ) {
    return {
      status: "UNCLEAR_IMAGE",
      userMessage: "Image is unclear or blurred. Please upload a clearer image showing the garment.",
      reason: topPrompt?.description || `Image unclear / low garment focus (${(clearScore * 100).toFixed(1)}%)`,
      clearScore,
      unclearScore,
      noGarmentScore,
    };
  }

  // 3. CLEAR_GARMENT
  return {
    status: "CLEAR_GARMENT",
    reason: "Clear garment focus verified",
    clearScore,
    unclearScore,
    noGarmentScore,
  };
}

/**
 * Pure Stage 2 Confidence & Margin Gate
 */
export function applyConfidenceGate(
  rawResults: RawCandidateResult[],
  threshold: number = GARMENT_CONFIDENCE_THRESHOLD,
  minMargin: number = GARMENT_SEPARATION_MARGIN
): GatedClassificationDecision {
  if (!rawResults || rawResults.length === 0) {
    return {
      garmentType: "Custom Garment",
      category: "Custom Apparel",
      wearerCategory: "Unknown",
      styleCategory: "Unknown",
      gender: "Unknown",
      style: "Custom Style",
      complexity: "Basic",
      confidenceScore: 0.20,
      isConfident: false,
      decisionReason: "No classifier candidate results produced.",
    };
  }

  const topCandidate = rawResults[0];
  const runnerUp = rawResults[1] || { score: 0 };
  const matchedTaxonomy = CONTROLLED_TAXONOMY_PROMPTS.find((t) => t.label === topCandidate.label);
  const margin = topCandidate.score - runnerUp.score;
  const requiredMargin = matchedTaxonomy?.requiresHighMargin ? minMargin : 0.04;

  if (
    matchedTaxonomy &&
    topCandidate.score >= threshold &&
    margin >= requiredMargin &&
    matchedTaxonomy.garmentType !== "Custom Garment"
  ) {
    return {
      garmentType: matchedTaxonomy.garmentType,
      category: matchedTaxonomy.category,
      wearerCategory: matchedTaxonomy.wearerCategory,
      styleCategory: matchedTaxonomy.styleCategory,
      gender: matchedTaxonomy.gender,
      style: matchedTaxonomy.style,
      complexity: matchedTaxonomy.complexity,
      confidenceScore: Math.min(0.98, topCandidate.score),
      isConfident: true,
      decisionReason: `Confidence score ${(topCandidate.score * 100).toFixed(1)}% (margin ${(margin * 100).toFixed(1)}%) qualifies for ${matchedTaxonomy.garmentType}.`,
    };
  }

  return {
    garmentType: "Custom Garment",
    category: "Custom Apparel",
    wearerCategory: "Unknown",
    styleCategory: "Unknown",
    gender: "Unknown",
    style: "Custom Style",
    complexity: "Basic",
    confidenceScore: Math.max(0.15, Math.min(0.39, topCandidate.score)),
    isConfident: false,
    decisionReason:
      matchedTaxonomy?.garmentType === "Custom Garment"
        ? "Image classified as unusual custom fashion garment."
        : topCandidate.score < threshold
        ? `Score ${(topCandidate.score * 100).toFixed(1)}% below confidence threshold ${(threshold * 100).toFixed(1)}%.`
        : `Margin ${(margin * 100).toFixed(1)}% below required separation margin ${(requiredMargin * 100).toFixed(1)}% (ambiguous classification).`,
  };
}

/**
 * Derives garment-specific tailoring requirements for tailor matching
 */
export function getTailoringRequirements(garmentType: string, complexity: string): string[] {
  switch (garmentType) {
    case "Saree":
      return [
        "Blouse tailoring & bespoke fitting",
        "Sleeve & neckline customization",
        "Fall & edging (pico) finishing",
        "Pallu pleating & border handling",
      ];
    case "Kurti":
      return [
        "Custom neckline finishing",
        "Sleeve construction & armhole shaping",
        "Length & side slit tailoring",
        "Precise torso fitting",
        "Embroidery / print alignment",
      ];
    case "Lehenga Choli":
      return [
        "Flared lehenga kali construction",
        "Blouse / choli tailoring with neckline customization",
        "Inner lining & can-can net structuring",
        "Zari & embroidery detailing",
        "Waistband & drawstring finishing",
      ];
    case "Half Saree":
      return [
        "Langa / skirt pleating & can-can lining",
        "Designer blouse tailoring",
        "Voni / dupatta border edging",
        "Maggam / embroidery work",
      ];
    case "Blouse":
      return [
        "Princess cut / padded bustier construction",
        "Back & front neckline styling",
        "Sleeve fit & armhole shaping",
        "Hook / zipper fastening & piping",
      ];
    case "Shirt":
      return [
        "Collar & cuff shaping",
        "Sleeve length & shoulder fitting",
        "Chest & waist tapering",
        "Buttonhole & placket construction",
      ];
    case "Suit":
      return [
        "Structured jacket & lapel construction",
        "Chest canvas & shoulder padding",
        "Trouser waist & inseam tailoring",
        "Pocket & lining finishing",
      ];
    case "Sherwani":
      return [
        "Bespoke royal cut & structured chest canvas",
        "High collar / bandhgala tailoring",
        "Hand zardozi / embroidery finishing",
        "Churidar / trouser matching",
      ];
    case "Salwar Kameez":
      return [
        "Kameez neckline & sleeve styling",
        "Side slit & hem reinforcement",
        "Salwar / churidar waist & leg tailoring",
        "Dupatta border finishing",
      ];
    case "Gown":
    case "Dress":
      return [
        "Bodice & waist shaping",
        "Flared / floor-length hem finishing",
        "Concealed zipper & lining construction",
      ];
    case "T-Shirt":
      return [
        "Ribbed neckband attachment",
        "Shoulder-to-shoulder tape reinforcement",
        "Twin-needle hem stitching",
      ];
    default:
      return [
        "Bespoke pattern making",
        "Fabric inspection & measurement fitting",
        "Custom tailoring & stitching",
      ];
  }
}

async function getZeroShotPipeline() {
  if (!cachedClassifierPipeline) {
    const { pipeline, env } = await import("@xenova/transformers");
    if (typeof window !== "undefined") {
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
    }
    cachedClassifierPipeline = await pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", {
      quantized: true,
    });
  }
  return cachedClassifierPipeline;
}

/**
 * Client-Side Zero-Cost Open-Source Garment Classifier with Tri-State Pipeline
 */
export async function classifyGarmentClientSide(
  options: ClientClassifierOptions
): Promise<VisionAnalysisResult & { classifierSource: string; isConfident: boolean }> {
  const startTime = Date.now();
  const allRecords = (garmentIndexData.records || []) as GarmentRecord[];

  // 1. Curated built-in gallery matching ONLY if imagePath is explicitly in the /images/inspiration/ folder
  let matchedRecord: GarmentRecord | undefined = undefined;
  const isBuiltinInspiration =
    options.imagePath &&
    (options.imagePath.startsWith("/images/inspiration/") || options.imagePath.includes("inspiration/"));

  if (isBuiltinInspiration && options.imagePath) {
    const parts = options.imagePath.split(/[\/\\]/);
    const targetFileName = parts[parts.length - 1].toLowerCase();
    matchedRecord = allRecords.find(
      (r) => r.id.startsWith("builtin_") && r.imagePath && r.imagePath.toLowerCase().endsWith(targetFileName)
    );
  }

  // 2. State & Attribute Initialization
  let detectionStatus: VisionDetectionStatus = "CLEAR_GARMENT";
  let userMessage: string | undefined = undefined;
  let garmentType = "Custom Garment";
  let category = "Custom Apparel";
  let wearerCategory: WearerCategory = "Unknown";
  let styleCategory: StyleCategory = "Unknown";
  let gender = "Unknown";
  let style = "Custom Style";
  let complexity: ComplexityGrade = "Basic";
  let confidenceScore = 0.20;
  let isConfident = false;
  let extractedColors: string[] = [];

  // 3. Pixel Color Extraction from image
  let rawPixelData: { data: Uint8Array; width: number; height: number; channels: number } | null = null;

  if (options.rgbColor) {
    const matched = matchColorRGB(options.rgbColor.r, options.rgbColor.g, options.rgbColor.b);
    extractedColors = [matched.name];
  }

  if (matchedRecord) {
    // Curated catalog item path
    detectionStatus = "CLEAR_GARMENT";
    const rawArticle = matchedRecord.articleType || matchedRecord.productName || "Custom Garment";
    garmentType = normalizeGarmentType(rawArticle);

    const bestMatchTaxonomy = CONTROLLED_TAXONOMY_PROMPTS.find(
      (t) => t.garmentType.toLowerCase() === garmentType.toLowerCase()
    ) || {
      label: matchedRecord.productName,
      garmentType,
      category: matchedRecord.subCategory || "Apparel",
      wearerCategory: "Women's Wear" as WearerCategory,
      styleCategory: "Ethnic Wear" as StyleCategory,
      gender: matchedRecord.gender || "Women",
      style: matchedRecord.usage || "Bespoke Couture",
      complexity: (matchedRecord.complexity as ComplexityGrade) || "Moderate",
    };

    category = bestMatchTaxonomy.category;
    wearerCategory = bestMatchTaxonomy.wearerCategory;
    styleCategory = bestMatchTaxonomy.styleCategory;
    gender = matchedRecord.gender || bestMatchTaxonomy.gender;
    style = bestMatchTaxonomy.style;
    complexity = (matchedRecord.complexity as ComplexityGrade) || (bestMatchTaxonomy.complexity as ComplexityGrade);
    confidenceScore = 0.95;
    isConfident = true;

    if (matchedRecord.baseColour && matchedRecord.baseColour !== "Custom Palette") {
      extractedColors = [matchedRecord.baseColour];
    }
  } else {
    // Generic uploaded image path: run Tri-State zero-shot pipeline
    try {
      const inputSource = options.imageBase64 || options.imagePath;
      if (inputSource) {
        let processedInput: any = inputSource;

        if (typeof window === "undefined") {
          const { RawImage } = await import("@xenova/transformers");
          if (typeof inputSource === "string" && inputSource.startsWith("data:")) {
            const base64Data = inputSource.split(",")[1];
            const buffer = Buffer.from(base64Data, "base64");
            const sharp = (await import("sharp")).default;
            const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            const channels = (info.channels as 1 | 2 | 3 | 4);
            rawPixelData = { data: new Uint8Array(data), width: info.width, height: info.height, channels };
            processedInput = new RawImage(rawPixelData.data, rawPixelData.width, rawPixelData.height, channels);
          } else if (typeof inputSource === "string" && inputSource.startsWith("/")) {
            const fs = await import("fs");
            const path = await import("path");
            const fullPath = path.join(process.cwd(), "public", inputSource.replace(/^\//, ""));
            if (fs.existsSync(fullPath)) {
              const buffer = fs.readFileSync(fullPath);
              const sharp = (await import("sharp")).default;
              const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
              const channels = (info.channels as 1 | 2 | 3 | 4);
              rawPixelData = { data: new Uint8Array(data), width: info.width, height: info.height, channels };
              processedInput = new RawImage(rawPixelData.data, rawPixelData.width, rawPixelData.height, channels);
            }
          }
        }

        // Extract real pixel colors from the image buffer
        if (rawPixelData && extractedColors.length === 0) {
          extractedColors = extractDominantColorsFromPixels(
            rawPixelData.data,
            rawPixelData.width,
            rawPixelData.height,
            rawPixelData.channels
          );
        }

        const classifier = await getZeroShotPipeline();

        // Stage 1: Tri-State Garment Relevance Check
        const relevanceLabels = STAGE1_RELEVANCE_PROMPTS.map((p) => p.label);
        const rawRelevanceResults: RawCandidateResult[] = await classifier(processedInput, relevanceLabels);
        const relevanceDecision = applyRelevanceGate(rawRelevanceResults);

        if (process.env.NODE_ENV !== "production") {
          console.groupCollapsed?.("[FashionCLIP Stage 1 Relevance]");
          console.log("Top Relevance:", rawRelevanceResults[0]?.label, `(${(rawRelevanceResults[0]?.score * 100).toFixed(1)}%)`);
          console.log("Detection Status:", relevanceDecision.status, "| Reason:", relevanceDecision.reason);
          console.groupEnd?.();
        }

        detectionStatus = relevanceDecision.status;
        userMessage = relevanceDecision.userMessage;

        if (detectionStatus === "NO_GARMENT") {
          garmentType = "Custom Garment";
          category = "Custom Apparel";
          wearerCategory = "Unknown";
          styleCategory = "Unknown";
          gender = "Unknown";
          style = "Custom Style";
          complexity = "Basic";
          confidenceScore = 0.05;
          isConfident = false;
          matchedRecord = undefined;
          extractedColors = [];
        } else if (detectionStatus === "UNCLEAR_IMAGE") {
          garmentType = "Custom Garment";
          category = "Custom Apparel";
          wearerCategory = "Unknown";
          styleCategory = "Unknown";
          gender = "Unknown";
          style = "Custom Style";
          complexity = "Basic";
          confidenceScore = 0.15;
          isConfident = false;
          matchedRecord = undefined;
          extractedColors = [];
        } else {
          // Stage 2: Canonical Garment Taxonomy Classification
          const candidateLabels = CONTROLLED_TAXONOMY_PROMPTS.map((t) => t.label);
          const rawResults: RawCandidateResult[] = await classifier(processedInput, candidateLabels);

          const topScore = rawResults[0]?.score || 0;
          if (topScore < 0.20) {
            detectionStatus = "UNCLEAR_IMAGE";
            userMessage = "Image is unclear or blurred. Please upload a clearer image showing the garment.";
            garmentType = "Custom Garment";
            category = "Custom Apparel";
            wearerCategory = "Unknown";
            styleCategory = "Unknown";
            gender = "Unknown";
            style = "Custom Style";
            complexity = "Basic";
            confidenceScore = topScore;
            isConfident = false;
            matchedRecord = undefined;
            extractedColors = [];
          } else {
            const decision = applyConfidenceGate(rawResults, GARMENT_CONFIDENCE_THRESHOLD, GARMENT_SEPARATION_MARGIN);

            if (process.env.NODE_ENV !== "production") {
              console.groupCollapsed?.("[FashionCLIP Stage 2 Classification]");
              console.log("Top 3 Candidates:");
              (rawResults || []).slice(0, 3).forEach((r, idx) => {
                const p = CONTROLLED_TAXONOMY_PROMPTS.find((t) => t.label === r.label);
                console.log(`  ${idx + 1}. [${(r.score * 100).toFixed(1)}%] ${p?.garmentType} ("${r.label}")`);
              });
              console.log("Final Decision:", decision.garmentType, "| Confident:", decision.isConfident);
              console.log("Reason:", decision.decisionReason);
              console.groupEnd?.();
            }

            garmentType = decision.garmentType;
            category = decision.category;
            wearerCategory = decision.wearerCategory;
            styleCategory = decision.styleCategory;
            gender = decision.gender;
            style = decision.style;
            complexity = (decision.complexity as ComplexityGrade) || "Basic";
            confidenceScore = decision.confidenceScore;
            isConfident = decision.isConfident;

            if (isConfident && garmentType !== "Custom Garment") {
              matchedRecord = allRecords.find((r) => normalizeGarmentType(r.articleType || r.productName) === garmentType);
            } else {
              matchedRecord = undefined;
            }
          }
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Client Classifier] Zero-shot inference failed, using safe fallback:", err);
      }
      detectionStatus = "UNCLEAR_IMAGE";
      userMessage = "Image is unclear or blurred. Please upload a clearer image showing the garment.";
      garmentType = "Custom Garment";
      category = "Custom Apparel";
      wearerCategory = "Unknown";
      styleCategory = "Unknown";
      gender = "Unknown";
      style = "Custom Style";
      complexity = "Basic";
      confidenceScore = 0.15;
      isConfident = false;
      matchedRecord = undefined;
      extractedColors = [];
    }
  }

  // 4. Tailoring Attributes (Sleeves, Neckline, Fit, Length, Pattern, Work, Occasion)
  let sleeves: SleeveAttribute = "Unknown";
  let neckline: NecklineAttribute = "Unknown";
  let fit: FitAttribute = "Regular";
  let length: LengthAttribute = "Unknown";
  let pattern: PatternAttribute = "Plain";
  let work: WorkAttribute = "Plain";
  let occasion: OccasionType = "Traditional";

  if (detectionStatus === "CLEAR_GARMENT") {
    if (garmentType === "Shirt") {
      sleeves = "Full Sleeve";
      neckline = "Collar";
      fit = "Slim";
      length = "Short";
      occasion = "Casual";
    } else if (garmentType === "T-Shirt") {
      sleeves = "Short Sleeve";
      neckline = "Round";
      fit = "Relaxed";
      length = "Short";
      occasion = "Everyday";
    } else if (garmentType === "Kurti") {
      sleeves = "3/4 Sleeve";
      neckline = "V-Neck";
      fit = "Regular";
      length = "Knee";
      pattern = "Embroidered";
      work = "Embroidery";
      complexity = "Moderate";
      occasion = "Festive";
    } else if (garmentType === "Saree") {
      sleeves = "Half Sleeve";
      neckline = "Boat Neck";
      fit = "Flared";
      length = "Full Length";
      pattern = "Embroidered";
      work = "Zari";
      complexity = "Detailed";
      occasion = "Festive";
    } else if (garmentType === "Half Saree") {
      sleeves = "Short Sleeve";
      neckline = "Sweetheart";
      fit = "Flared";
      length = "Full Length";
      pattern = "Embroidered";
      work = "Zari";
      complexity = "Detailed";
      occasion = "Festive";
    } else if (garmentType === "Lehenga Choli") {
      sleeves = "Half Sleeve";
      neckline = "Sweetheart";
      fit = "Flared";
      length = "Full Length";
      pattern = "Embroidered";
      work = "Zari";
      complexity = "Bridal";
      occasion = "Bridal";
    } else if (garmentType === "Suit") {
      sleeves = "Full Sleeve";
      neckline = "Collar";
      fit = "Slim";
      length = "Full Length";
      complexity = "Detailed";
      occasion = "Formal";
    } else if (garmentType === "Sherwani") {
      sleeves = "Full Sleeve";
      neckline = "High Neck";
      fit = "Slim";
      length = "Knee";
      pattern = "Embroidered";
      work = "Embroidery";
      complexity = "Detailed";
      occasion = "Wedding";
    } else if (garmentType === "Blouse") {
      sleeves = "Short Sleeve";
      neckline = "Sweetheart";
      fit = "Slim";
      length = "Short";
      complexity = "Moderate";
      occasion = "Festive";
    } else if (garmentType === "Salwar Kameez") {
      sleeves = "3/4 Sleeve";
      neckline = "Round";
      fit = "Regular";
      length = "Knee";
      complexity = "Moderate";
      occasion = "Festive";
    } else if (garmentType === "Gown" || garmentType === "Dress") {
      sleeves = "Sleeveless";
      neckline = "Boat Neck";
      fit = "Flared";
      length = "Full Length";
      occasion = "Party";
    }
  }

  // 5. Clean Canonical Tag Generation
  let cleanTags: string[] = [];

  if (detectionStatus === "CLEAR_GARMENT") {
    if (isConfident && garmentType !== "Custom Garment") {
      const tagList: (string | null | undefined)[] = [
        garmentType,
        wearerCategory !== "Unknown" ? wearerCategory : null,
        styleCategory !== "Unknown" ? styleCategory : null,
        ...extractedColors,
        pattern !== "Plain" ? pattern : null,
        sleeves !== "Unknown" ? sleeves : null,
        complexity !== "Basic" ? complexity : null,
      ];
      cleanTags = tagList.filter((t): t is string => Boolean(t));
    } else {
      // Clear custom garment: use only confirmed visual attributes
      cleanTags = ["Custom Garment", ...extractedColors, "Bespoke Request"].filter(Boolean);
    }
  } else {
    // UNCLEAR_IMAGE or NO_GARMENT: ZERO tags
    cleanTags = [];
  }

  const tailoringReqs = getTailoringRequirements(garmentType, complexity);

  const minCost = isConfident && matchedRecord?.estimatedStitchingCost?.min ? matchedRecord.estimatedStitchingCost.min : 450;
  const maxCost = isConfident && matchedRecord?.estimatedStitchingCost?.max ? matchedRecord.estimatedStitchingCost.max : 1200;
  const minDays = isConfident && matchedRecord?.deliveryTimeDays?.min ? matchedRecord.deliveryTimeDays.min : 3;
  const maxDays = isConfident && matchedRecord?.deliveryTimeDays?.max ? matchedRecord.deliveryTimeDays.max : 7;

  return {
    garmentType,
    category,
    wearerCategory,
    styleCategory,
    gender,
    colour: extractedColors[0] || "Unknown",
    colors: extractedColors,
    pattern,
    sleeveType: sleeves,
    sleeves,
    neckline,
    fit,
    length,
    work,
    style,
    complexity,
    occasion,
    tailoringRequirements: tailoringReqs,
    confidenceScore,
    isConfident,
    detectionStatus,
    userMessage,
    labels: Array.from(new Set(cleanTags)),
    classifierSource: `Client-Side FashionCLIP/ONNX (Zero-Cost, ${Date.now() - startTime}ms)`,
    matchedGarments: matchedRecord && isConfident
      ? [
          {
            garment: matchedRecord,
            similarityScore: confidenceScore,
            matchReasons: [
              `Classification: ${garmentType}`,
              `Canonical Catalog Match #${matchedRecord.id}`,
            ],
          },
        ]
      : [],
    suggestions: {
      garmentCategory: category,
      suggestedFabric: isConfident && matchedRecord?.fabricRecommendations
        ? matchedRecord.fabricRecommendations
        : ["Consult with Tailor", "Custom Fabric Selection"],
      tailorRecommendation: isConfident && matchedRecord?.tailorRecommendations?.[0]
        ? matchedRecord.tailorRecommendations[0]
        : "Bespoke Garment Specialist",
      estimatedStitchingCost: {
        min: minCost,
        max: maxCost,
        formatted: `₹${minCost.toLocaleString()} - ₹${maxCost.toLocaleString()}`,
      },
      deliveryTime: `${minDays}-${maxDays} Business Days`,
      dynamicQuotes: [
        { item: "Base Consultation & Pattern", cost: Math.round(minCost * 0.6) },
        { item: "Custom Fitting & Stitching", cost: Math.round(minCost * 0.4) },
      ],
    },
  };
}
