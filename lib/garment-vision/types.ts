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

export interface VisionAnalysisResult {
  garmentType: string;
  category: string;
  gender: string;
  colour: string;
  pattern: string;
  sleeveType: string;
  neckline: string;
  style: string;
  complexity: string;
  confidenceScore: number;
  labels: string[];
  matchedGarments: GarmentSimilarityMatch[];
  suggestions: GarmentSuggestions;
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
