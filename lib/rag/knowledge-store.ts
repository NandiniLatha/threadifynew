import { createClient } from "@supabase/supabase-js";

/**
 * Threadify Canonical Garment Taxonomy
 */
export const CANONICAL_GARMENT_TAXONOMY = new Set([
  "Saree",
  "Half Saree",
  "Kurti",
  "Blouse",
  "Shirt",
  "T-Shirt",
  "Lehenga Choli",
  "Salwar Kameez",
  "Dress",
  "Gown",
  "Sherwani",
  "Suit",
  "Custom Garment",
]);

export interface SearchKnowledgeOptions {
  matchCount?: number;
  garmentTypeFilter?: string;
  similarityThreshold?: number;
}

export interface FashionKnowledgeResult {
  document_id: string;
  garment_type: string;
  category: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

export interface SearchKnowledgeResponse {
  success: boolean;
  results: FashionKnowledgeResult[];
  databaseAvailable: boolean;
  message?: string;
}

/**
 * Searches the public fashion_knowledge_vectors table using Supabase match_fashion_knowledge RPC
 */
export async function searchFashionKnowledge(
  queryEmbedding: number[],
  options: SearchKnowledgeOptions = {}
): Promise<SearchKnowledgeResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      results: [],
      databaseAvailable: false,
      message: "Retrieval execution blocked because vector database is not available / environment variables missing.",
    };
  }

  const matchCount = options.matchCount || 5;
  const threshold = options.similarityThreshold || 0.0;

  // Validate garment type filter against canonical taxonomy
  let validGarmentType: string | null = null;
  if (options.garmentTypeFilter) {
    const trimmed = options.garmentTypeFilter.trim();
    if (CANONICAL_GARMENT_TAXONOMY.has(trimmed) && trimmed !== "Custom Garment") {
      validGarmentType = trimmed;
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Primary retrieval query (filtered if valid canonical garmentType provided)
    const { data, error } = await supabase.rpc("match_fashion_knowledge", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_garment_type: validGarmentType,
    });

    if (error) {
      return {
        success: false,
        results: [],
        databaseAvailable: false,
        message: `Retrieval execution blocked because vector database is not available / migration unexecuted (${error.message}).`,
      };
    }

    let results = (data || []) as FashionKnowledgeResult[];

    // If filtered retrieval yielded 0 results, fallback to unfiltered semantic search
    if (results.length === 0 && validGarmentType) {
      const fallbackQuery = await supabase.rpc("match_fashion_knowledge", {
        query_embedding: queryEmbedding,
        match_count: matchCount,
        filter_garment_type: null,
      });
      if (!fallbackQuery.error && fallbackQuery.data) {
        results = fallbackQuery.data as FashionKnowledgeResult[];
      }
    }

    const filtered = results.filter((item) => item.similarity >= threshold);

    return {
      success: true,
      results: filtered,
      databaseAvailable: true,
    };
  } catch (err) {
    return {
      success: false,
      results: [],
      databaseAvailable: false,
      message: `Retrieval execution blocked because vector database connection failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

