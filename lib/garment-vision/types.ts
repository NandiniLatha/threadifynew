export interface GarmentRecord {
  id: string;
  imagePath: string;
  productName: string;
  gender: string;
  masterCategory: string;
  subCategory: string;
  articleType: string;
  baseColour: string;
  season: string;
  usage: string;
  tags: string[];
  complexity: "Basic" | "Moderate" | "High" | "Bespoke Luxury";
  pattern?: string;
  sleeveType?: string;
  neckline?: string;
  fabricRecommendations: string[];
  tailorRecommendations: string[];
  estimatedStitchingCost: {
    min: number;
    max: number;
    currency: string;
  };
  deliveryTimeDays: {
    min: number;
    max: number;
  };
}

export interface RawDatasetStyle {
  id: string;
  gender: string;
  masterCategory: string;
  subCategory: string;
  articleType: string;
  baseColour: string;
  season: string;
  year?: string;
  usage: string;
  productDisplayName: string;
}

export interface GarmentSimilarityMatch {
  garment: GarmentRecord;
  similarityScore: number;
  matchReasons: string[];
}

export interface DynamicQuoteItem {
  item: string;
  cost: number;
}

export interface GarmentSuggestions {
  garmentCategory: string;
  suggestedFabric: string[];
  tailorRecommendation: string;
  estimatedStitchingCost: {
    min: number;
    max: number;
    formatted: string;
  };
  deliveryTime: string;
  dynamicQuotes: DynamicQuoteItem[];
}

export type VisionDetectionStatus = "CLEAR_GARMENT" | "UNCLEAR_IMAGE" | "NO_GARMENT";

export type WearerCategory = "Men's Wear" | "Women's Wear" | "Kids Wear" | "Unisex" | "Unknown";
export type StyleCategory = "Ethnic Wear" | "Western Wear" | "Indo-Western" | "Unknown";
export type SleeveAttribute = "Sleeveless" | "Short Sleeve" | "Half Sleeve" | "3/4 Sleeve" | "Full Sleeve" | "Unknown";
export type NecklineAttribute = "Round" | "V-Neck" | "Boat Neck" | "Square Neck" | "Collar" | "High Neck" | "Sweetheart" | "Unknown";
export type FitAttribute = "Regular" | "Slim" | "Loose" | "Relaxed" | "Flared" | "Unknown";
export type LengthAttribute = "Short" | "Knee" | "Midi" | "Ankle" | "Full Length" | "Unknown";
export type PatternAttribute = "Plain" | "Printed" | "Striped" | "Checked" | "Floral" | "Geometric" | "Embroidered" | "Embellished" | "Unknown";
export type WorkAttribute = "Embroidery" | "Zari" | "Beading" | "Sequins" | "Print" | "Applique" | "Plain" | "Unknown";
export type ComplexityGrade = "Basic" | "Moderate" | "Detailed" | "Bridal";
export type OccasionType = "Casual" | "Formal" | "Festive" | "Party" | "Wedding" | "Bridal" | "Traditional" | "Everyday" | "Unknown";

export interface VisionAnalysisResult {
  garmentType: string;
  category: string;
  gender: string;
  colour: string;
  colors?: string[];
  pattern: string;
  sleeveType: string;
  sleeves?: SleeveAttribute;
  neckline: string;
  style: string;
  wearerCategory?: WearerCategory;
  styleCategory?: StyleCategory;
  fit?: FitAttribute;
  length?: LengthAttribute;
  work?: WorkAttribute;
  complexity: string;
  occasion?: OccasionType;
  tailoringRequirements?: string[];
  confidenceScore: number;
  labels: string[];
  matchedGarments: GarmentSimilarityMatch[];
  suggestions: GarmentSuggestions;
  detectionStatus?: VisionDetectionStatus;
  userMessage?: string;
  classifierSource?: string;
  isConfident?: boolean;
}

export interface GarmentIndexCache {
  totalProcessed: number;
  importedClothingCount: number;
  ignoredNonClothingCount: number;
  categoriesDetected: string[];
  subCategoriesDetected: string[];
  articleTypesDetected: string[];
  lastUpdated: string;
  records: GarmentRecord[];
}
