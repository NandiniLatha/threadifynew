import { embedText, getEmbeddingExtractor } from "../lib/rag/embeddings";
import { searchFashionKnowledge } from "../lib/rag/knowledge-store";
import { buildFashionRagQuery } from "../lib/rag/query-builder";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function runTest() {
  console.log("\n==========================================================================");
  console.log("THREADIFY — RAG PHASE 3B RETRIEVAL & EMBEDDING TEST");
  console.log("==========================================================================\n");

  // 1. Measure Model Initialization Time
  console.log("Initializing ONNX embedding model ('Xenova/all-MiniLM-L6-v2')...");
  const { initializationTimeMs } = await getEmbeddingExtractor();
  console.log(`[PERFORMANCE] Model initialization completed in ${initializationTimeMs}ms.\n`);

  // 2. Validate Query Builder
  const sampleVisionResult = {
    garmentType: "Half Saree",
    category: "Indian Traditional Wear",
    colour: "Gold",
    pattern: "Embroidered",
    style: "Traditional Langa Voni",
    complexity: "Bespoke Luxury",
    gender: "Women",
  };
  const constructedQuery = buildFashionRagQuery(sampleVisionResult, { extraIntent: "South Indian traditional bridal" });
  console.log(`[QUERY BUILDER TEST] Constructed Query:\n  "${constructedQuery}"\n`);

  // 3. Exact 4 Queries required by Phase 3B
  const testQueries = [
    { name: "Query 1", query: "Half Saree South Indian traditional bridal" },
    { name: "Query 2", query: "Banarasi silk saree embroidery" },
    { name: "Query 3", query: "Men's formal three piece suit" },
    { name: "Query 4", query: "Designer Kurti ethnic wear" },
  ];

  for (const tq of testQueries) {
    console.log("--------------------------------------------------------------------------");
    console.log(`${tq.name}: "${tq.query}"`);
    console.log("--------------------------------------------------------------------------");

    const embedStart = Date.now();
    const embedding = await embedText(tq.query);
    const embedTimeMs = Date.now() - embedStart;

    console.log(`Embedding Dimension: ${embedding.length}d | Embedding Time: ${embedTimeMs}ms`);

    const rpcStart = Date.now();
    const searchResponse = await searchFashionKnowledge(embedding, {
      matchCount: 5,
      garmentTypeFilter: undefined, // Pure vector retrieval across all 30 documents
    });
    const rpcTimeMs = Date.now() - rpcStart;

    console.log(`RPC Retrieval Time: ${rpcTimeMs}ms | DB Available: ${searchResponse.databaseAvailable}`);

    if (searchResponse.success && searchResponse.results.length > 0) {
      console.log("\nTop 5 Results:");
      console.log("| Rank | Document ID | Garment Type | Category | Similarity | Short Content Summary |");
      console.log("|---|---|---|---|---|---|");

      searchResponse.results.slice(0, 5).forEach((item, index) => {
        const shortSummary = item.content.split("\n").slice(0, 2).join(" | ");
        console.log(
          `| ${index + 1} | ${item.document_id} | ${item.garment_type} | ${item.category} | ${item.similarity.toFixed(4)} | ${shortSummary} |`
        );
      });
    } else {
      console.log(`⚠️ Retrieval Error / No Results: ${searchResponse.message || "Unknown error"}`);
    }
    console.log("\n");
  }
}

runTest().catch((err) => {
  console.error("RAG Phase 3B Retrieval test failed:", err);
  process.exit(1);
});

