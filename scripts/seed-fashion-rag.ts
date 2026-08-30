import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Canonical Threadify Garment Taxonomy
const CANONICAL_TAXONOMY = new Set([
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

/**
 * Normalizes raw garment names to canonical singular Threadify taxonomy
 */
function normalizeGarmentType(type: string): string {
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

/**
 * Derives regional style metadata
 */
function deriveRegionalStyle(garmentType: string, tags: string[]): string {
  const tagStr = tags.join(" ").toLowerCase();
  if (garmentType === "Half Saree" || tagStr.includes("south indian") || tagStr.includes("kanjeevaram")) return "South Indian";
  if (tagStr.includes("banarasi") || tagStr.includes("chanderi")) return "North Indian / Traditional Heritage";
  if (garmentType === "Sherwani" || garmentType === "Lehenga Choli") return "North Indian Royal Couture";
  if (garmentType === "Suit" || garmentType === "Dress" || garmentType === "Gown") return "Contemporary / Western";
  return "Pan-Indian Bespoke";
}

/**
 * Derives alternate traditional names for indexing
 */
function deriveAlternateNames(garmentType: string): string[] {
  if (garmentType === "Half Saree") return ["Langa Voni", "Pattu Pavadai", "Davani", "Voni"];
  if (garmentType === "Saree") return ["Sari", "Nivi Drape", "Kanjeevaram", "Banarasi"];
  if (garmentType === "Kurti") return ["Kurta", "Tunics", "Kameez"];
  if (garmentType === "Lehenga Choli") return ["Ghagra Choli", "Bridal Lehenga", "Chaniya Choli"];
  if (garmentType === "Salwar Kameez") return ["Anarkali", "Churidar Suit", "Salwar Suit"];
  if (garmentType === "Suit") return ["Three Piece Suit", "Tuxedo", "Blazer & Trousers"];
  return [];
}

export interface RagDocument {
  documentId: string;
  garmentType: string;
  category: string;
  content: string;
  metadata: {
    regional_style: string;
    alternate_names: string[];
    fabrics: string[];
    complexity: string;
    stitching_cost_range_inr: [number, number];
    delivery_days_range: [number, number];
    tailor_specialization: string[];
    source: string;
  };
  embedding?: number[];
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run") || !process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("\n==========================================================================");
  console.log(`THREADIFY FASHION RAG — PHASE 1 SEEDING (${isDryRun ? "DRY-RUN MODE" : "PRODUCTION SEED MODE"})`);
  console.log("==========================================================================\n");

  // 1. Read garment index data
  const indexPath = path.join(__dirname, "../lib/garment-vision/garment-index.json");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Garment index file not found at ${indexPath}`);
  }

  const rawData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const allRecords = rawData.records || [];

  console.log(`Loaded ${allRecords.length} raw records from garment-index.json.`);

  // 2. Filter & transform to canonical RAG documents (prevent legacy duplicate noise)
  const ragDocuments: RagDocument[] = [];
  const processedDocIds = new Set<string>();

  for (const record of allRecords) {
    // Filter legacy Kaggle collision items with empty imagePath or non-builtin duplicates
    if (!record.id.startsWith("builtin_")) {
      continue;
    }

    const garmentType = normalizeGarmentType(record.articleType || record.productName || "");
    if (!CANONICAL_TAXONOMY.has(garmentType)) {
      console.warn(`Skipping non-canonical garment type: ${record.articleType}`);
      continue;
    }

    const documentId = `doc_${record.id}`;
    if (processedDocIds.has(documentId)) {
      continue; // Enforce idempotency
    }
    processedDocIds.add(documentId);

    const category = record.subCategory === "Inspiration Garment" ? "Bespoke Couture" : record.subCategory || "Apparel";
    const regionalStyle = deriveRegionalStyle(garmentType, record.tags || []);
    const alternateNames = deriveAlternateNames(garmentType);
    const fabrics = record.fabricRecommendations || ["Premium Silk", "Cotton Blend"];
    const complexity = record.complexity || "Moderate";
    const minCost = record.estimatedStitchingCost?.min || 1800;
    const maxCost = record.estimatedStitchingCost?.max || 4500;
    const minDays = record.deliveryTimeDays?.min || 4;
    const maxDays = record.deliveryTimeDays?.max || 7;
    const tailorSpecs = record.tailorRecommendations || ["Master Bespoke Craftsman"];

    // 3. Generate clean natural language content string for vector embedding
    const contentLines = [
      `Garment: ${garmentType}`,
      `Product Title: ${record.productName}`,
      `Category: ${category}`,
      `Gender Profile: ${record.gender || "Unisex"}`,
      `Regional Style: ${regionalStyle}`,
      alternateNames.length > 0 ? `Alternate Traditional Names: ${alternateNames.join(", ")}` : "",
      `Suitable Fabrics: ${fabrics.join(", ")}`,
      `Tailoring Specialization: ${tailorSpecs.join(", ")}`,
      `Complexity Rating: ${complexity}`,
      `Stitching Cost Range: ₹${minCost.toLocaleString()} - ₹${maxCost.toLocaleString()} INR`,
      `Estimated Turnaround: ${minDays}-${maxDays} Business Days`,
      `Design & Craft Tags: ${(record.tags || []).join(", ")}`,
    ].filter(Boolean);

    const content = contentLines.join("\n");

    ragDocuments.push({
      documentId,
      garmentType,
      category,
      content,
      metadata: {
        regional_style: regionalStyle,
        alternate_names: alternateNames,
        fabrics,
        complexity,
        stitching_cost_range_inr: [minCost, maxCost],
        delivery_days_range: [minDays, maxDays],
        tailor_specialization: tailorSpecs,
        source: "garment-index.json",
      },
    });
  }

  console.log(`Successfully generated ${ragDocuments.length} canonical RAG knowledge documents.\n`);

  // 4. Initialize Local Embedding Extractor (@xenova/transformers - 384 dimensions)
  console.log("Initializing @xenova/transformers feature-extractor ('Xenova/all-MiniLM-L6-v2')...");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  console.log("Generating 384-dimensional embeddings for all documents...\n");

  let vectorDim = 0;

  for (let i = 0; i < ragDocuments.length; i++) {
    const doc = ragDocuments[i];
    const output = await extractor(doc.content, { pooling: "mean", normalize: true });
    const embedding = Array.from(output.data) as number[];

    doc.embedding = embedding;
    vectorDim = embedding.length;

    console.log(`  [${i + 1}/${ragDocuments.length}] Embedded Document: ${doc.documentId} | Type: ${doc.garmentType} | Vector Dim: ${vectorDim}`);
  }

  console.log(`\nVector Embeddings Generated Successfully! (Dimension: ${vectorDim})\n`);

  // 5. Output Verification & Idempotency Test
  console.log("--------------------------------------------------------------------------");
  console.log("SAMPLE RAG KNOWLEDGE DOCUMENT & EMBEDDING VERIFICATION");
  console.log("--------------------------------------------------------------------------");
  const sampleDoc = ragDocuments[0];
  console.log(`Document ID:   ${sampleDoc.documentId}`);
  console.log(`Garment Type:  ${sampleDoc.garmentType}`);
  console.log(`Category:      ${sampleDoc.category}`);
  console.log(`Vector Length: ${sampleDoc.embedding?.length}`);
  console.log(`Sample Vector: [${sampleDoc.embedding?.slice(0, 5).map((n) => n.toFixed(4)).join(", ")}, ...]`);
  console.log(`Content:\n${sampleDoc.content}`);
  console.log("--------------------------------------------------------------------------\n");

  if (isDryRun) {
    console.log("✅ DRY-RUN COMPLETED SUCCESSFULLY.");
    console.log("   - 0 production database mutations were executed.");
    console.log("   - Idempotency verified (duplicate document IDs filtered).");
    console.log("   - 384-dimensional embeddings generated with 0 third-party API calls.\n");
  } else {
    console.log("Executing Production database seeding into public.fashion_knowledge_vectors...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const rowsToInsert = ragDocuments.map((doc) => ({
      document_id: doc.documentId,
      garment_type: doc.garmentType,
      category: doc.category,
      content: doc.content,
      metadata: doc.metadata,
      embedding: doc.embedding,
    }));

    const { data, error } = await supabase
      .from("fashion_knowledge_vectors")
      .upsert(rowsToInsert, { onConflict: "document_id" })
      .select("id, document_id");

    if (error) {
      throw new Error(`Failed to seed production database: ${error.message}`);
    }

    console.log(`✅ PRODUCTION SEED COMPLETED SUCCESSFULLY!`);
    console.log(`   - Seeded ${data?.length || rowsToInsert.length} documents into public.fashion_knowledge_vectors.\n`);
  }
}

main().catch((err) => {
  console.error("RAG Seeding failed:", err);
  process.exit(1);
});
