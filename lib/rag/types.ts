import { FashionKnowledgeResult } from "./knowledge-store";

export interface VisionAnalysisResult {
  garmentType: string;
  category?: string;
  colour?: string;
  pattern?: string;
  style?: string;
  complexity?: string;
  gender?: string;
  sleeveType?: string;
  neckline?: string;
  labels?: string[];
}


export interface CustomerMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  shoulderWidth?: number;
  sleeveLength?: number;
  height?: number;
  inseam?: number;
  neck?: number;
  preferredFit?: "regular" | "slim" | "relaxed" | "bespoke";
  notes?: string;
}

export interface CustomerContext {
  customerId?: string;
  measurements?: CustomerMeasurements;
  genderProfile?: string;
}

export interface UserRequirements {
  budgetINR?: {
    min?: number;
    max?: number;
  };
  deadlineDays?: number;
  preferredGarmentType?: string;
  customizationInstructions?: string;
  occasion?: string;
}

export interface RagGenerationInput {
  visionResult: VisionAnalysisResult;
  retrievedKnowledge: FashionKnowledgeResult[];
  customerContext?: CustomerContext;
  userRequirements?: UserRequirements;
}

export interface RagGenerationOutput {
  garmentType: string;
  category: string;
  recommendedFabric: string[];
  recommendedConstruction: string[];
  customizationSuggestions: string[];
  estimatedStitchingRange: {
    min: number;
    max: number;
  };
  estimatedTurnaroundDays: {
    min: number;
    max: number;
  };
  measurementGuidance: string[];
  tailorSpecialization: string[];
  reasoning: string;
  provider: string;
  pricingDetails?: {
    stitchingMin: number;
    stitchingMax: number;
    fabricMin?: number;
    fabricMax?: number;
    additionalWorkMin?: number;
    additionalWorkMax?: number;
    totalMin: number;
    totalMax: number;
    complexity: string;
    explanation: string;
    disclaimer: string;
  };
}

export interface GenerationProvider {
  name: string;
  generate(input: RagGenerationInput): Promise<RagGenerationOutput>;
}

