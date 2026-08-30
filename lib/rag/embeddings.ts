import { pipeline } from "@xenova/transformers";

let extractorPipeline: any = null;
let initializationTimeMs = 0;

/**
 * Initializes and returns the local ONNX feature-extraction pipeline (Xenova/all-MiniLM-L6-v2)
 */
export async function getEmbeddingExtractor() {
  if (!extractorPipeline) {
    const startTime = Date.now();
    try {
      extractorPipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      initializationTimeMs = Date.now() - startTime;
    } catch (err) {
      console.error("[RAG Embeddings] Failed to initialize feature-extraction model:", err);
      throw new Error(`Embedding model initialization failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { extractor: extractorPipeline, initializationTimeMs };
}

/**
 * Generates a 384-dimensional normalized vector embedding suitable for cosine similarity search
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty or blank text.");
  }

  const { extractor } = await getEmbeddingExtractor();
  const cleanInput = text.replace(/\s+/g, " ").trim();

  try {
    const output = await extractor(cleanInput, { pooling: "mean", normalize: true });
    const embedding = Array.from(output.data) as number[];

    if (embedding.length !== 384) {
      throw new Error(`Embedding dimension mismatch: Expected 384, received ${embedding.length}`);
    }

    return embedding;
  } catch (err) {
    console.error("[RAG Embeddings] Feature extraction error:", err);
    throw err;
  }
}
