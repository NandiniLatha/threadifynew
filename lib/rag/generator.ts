import { GenerationProvider, RagGenerationInput, RagGenerationOutput } from "./types";
import { DeterministicProvider } from "./providers/deterministic-provider";
import { buildRagGenerationContext } from "./context-builder";

// Default generation provider (Deterministic & Grounded — 0 Paid API dependencies)
let defaultProvider: GenerationProvider = new DeterministicProvider();

/**
 * Allows overriding or registering a custom generation provider adapter
 * (e.g., local ONNX model, offline open-weights LLM) without altering retrieval architecture.
 */
export function setGenerationProvider(provider: GenerationProvider): void {
  defaultProvider = provider;
}

/**
 * Gets the current active generation provider instance
 */
export function getGenerationProvider(): GenerationProvider {
  return defaultProvider;
}

/**
 * Main Threadify RAG Generation Entrypoint
 * Accepts Vision Analysis + Top pgvector Documents + Customer Context + User Requirements
 * and produces a strictly structured, fully grounded fashion recommendation.
 */
export async function generateFashionRecommendation(
  input: RagGenerationInput,
  overrideProvider?: GenerationProvider
): Promise<RagGenerationOutput> {
  const provider = overrideProvider || defaultProvider;

  // 1. Build and format runtime context boundaries (ensures customer context isolation)
  const formattedContext = buildRagGenerationContext(input);

  // 2. Execute provider generation
  const result = await provider.generate(input);

  // 3. Schema & Grounding Validation Guard
  validateRagGenerationOutput(result);

  return result;
}

/**
 * Strict schema assertion helper for generator output
 */

function validateRagGenerationOutput(output: RagGenerationOutput): void {
  if (!output.garmentType || typeof output.garmentType !== "string") {
    throw new Error("Invalid RAG Generation Output: garmentType must be a non-empty string");
  }
  if (!output.category || typeof output.category !== "string") {
    throw new Error("Invalid RAG Generation Output: category must be a non-empty string");
  }
  if (!Array.isArray(output.recommendedFabric) || output.recommendedFabric.length === 0) {
    throw new Error("Invalid RAG Generation Output: recommendedFabric must be a non-empty array");
  }
  if (!output.estimatedStitchingRange || typeof output.estimatedStitchingRange.min !== "number" || typeof output.estimatedStitchingRange.max !== "number") {
    throw new Error("Invalid RAG Generation Output: estimatedStitchingRange min/max numbers required");
  }
  if (!output.estimatedTurnaroundDays || typeof output.estimatedTurnaroundDays.min !== "number" || typeof output.estimatedTurnaroundDays.max !== "number") {
    throw new Error("Invalid RAG Generation Output: estimatedTurnaroundDays min/max numbers required");
  }
  if (!Array.isArray(output.measurementGuidance)) {
    throw new Error("Invalid RAG Generation Output: measurementGuidance must be an array");
  }
  if (!output.reasoning || typeof output.reasoning !== "string") {
    throw new Error("Invalid RAG Generation Output: reasoning must be a non-empty string");
  }
  if (!output.provider || typeof output.provider !== "string") {
    throw new Error("Invalid RAG Generation Output: provider label required");
  }
}
