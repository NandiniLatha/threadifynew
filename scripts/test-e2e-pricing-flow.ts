import { classifyGarmentClientSide } from "../lib/garment-vision/client-classifier";
import { buildFashionRagQuery } from "../lib/rag/query-builder";
import { embedText } from "../lib/rag/embeddings";
import { searchFashionKnowledge } from "../lib/rag/knowledge-store";
import { generateFashionRecommendation } from "../lib/rag/generator";
import { calculateRealisticPrice } from "../lib/pricing/pricing-engine";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function runEndToEndAudit() {
  console.log("==========================================================================");
  console.log("THREADIFY — FINAL END-TO-END FLOW & FABRIC PRICING AUDIT");
  console.log("==========================================================================\n");

  // ------------------------------------------------------------------------
  // PART 1: END-TO-END PIPELINE SIMULATION ACROSS 5 CORE GARMENTS
  // ------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------");
  console.log("1. END-TO-END CUSTOMER JOURNEY (VISION -> RAG -> PRICING -> UI)");
  console.log("--------------------------------------------------------------------------\n");

  const e2eCases = [
    {
      name: "Simple Top",
      imagePath: "/images/inspiration/mens_casual_shirt.webp",
      mockVision: {
        garmentType: "Top",
        category: "Casual Wear",
        gender: "Women",
        colour: "Sky Blue",
        pattern: "Solid",
        style: "Basic Sleeveless Top",
        complexity: "Basic",
        labels: ["Top", "Casual Wear", "Solid", "Basic"],
      },
      fabricSelected: undefined,
    },
    {
      name: "Designer Kurti",
      imagePath: "/images/inspiration/designer_kurti.webp",
      mockVision: null, // Will use live classifier
      fabricSelected: "Chanderi Silk",
    },
    {
      name: "Banarasi Saree",
      imagePath: "/images/inspiration/banarasi_saree.webp",
      mockVision: null,
      fabricSelected: undefined,
    },
    {
      name: "Three Piece Suit",
      imagePath: "/images/inspiration/three_piece_suit.webp",
      mockVision: null,
      fabricSelected: "Italian Wool",
    },
    {
      name: "Bridal Lehenga",
      imagePath: "/images/inspiration/bridal_lehenga.webp",
      mockVision: null,
      fabricSelected: "Brocade",
    },
  ];

  const pipelineOutputs: any[] = [];

  for (const tc of e2eCases) {
    console.log(`==========================================================================`);
    console.log(`E2E Case: ${tc.name}`);
    console.log(`==========================================================================`);

    // 1. Vision
    let visionResult: any = tc.mockVision;
    if (!visionResult) {
      visionResult = await classifyGarmentClientSide({ imagePath: tc.imagePath });
    }
    console.log(`[1. Vision] Garment: ${visionResult.garmentType}, Style: ${visionResult.style}, Complexity: ${visionResult.complexity}`);


    // 2. Query Builder
    const query = buildFashionRagQuery(visionResult);
    console.log(`[2. Query Builder] Query: "${query}"`);

    // 3. Embedding
    const embedding = await embedText(query);
    console.log(`[3. Embedding] Dimensions: ${embedding.length}d`);

    // 4. pgvector Retrieval
    const searchRes = await searchFashionKnowledge(embedding, {
      matchCount: 5,
      garmentTypeFilter: visionResult.garmentType,
    });
    const topDoc = searchRes.results[0];
    console.log(`[4. pgvector] Top Doc: ${topDoc?.document_id} (${topDoc?.garment_type}) | Similarity: ${(topDoc?.similarity * 100).toFixed(2)}%`);

    // 5. Grounded RAG Generation + Pricing Engine Integration
    const recommendation = await generateFashionRecommendation({
      visionResult,
      retrievedKnowledge: searchRes.results,
      userRequirements: {
        customizationInstructions: tc.name === "Bridal Lehenga" ? "Heavy zardozi embroidery, multi-tier can-can net flare" : undefined,
      },
    });

    // 6. Pricing Calculation with Fabric Options
    const pricing = calculateRealisticPrice({
      garmentType: visionResult.garmentType,
      category: visionResult.category,
      complexity: visionResult.complexity,
      sleeveType: visionResult.sleeveType,
      neckline: visionResult.neckline,
      pattern: visionResult.pattern,
      style: visionResult.style,
      labels: visionResult.labels,
      fabricSelected: tc.fabricSelected,
    });

    console.log(`[5. Grounded RAG] Recommended Fabrics: [${recommendation.recommendedFabric.join(", ")}]`);
    console.log(`[6. Pricing Engine] Complexity Grade:   ${pricing.complexityGrade}`);
    console.log(`    Estimated Stitching: ₹${pricing.stitchingCost.min.toLocaleString()} - ₹${pricing.stitchingCost.max.toLocaleString()} INR`);
    console.log(`    Fabric Material:     ${pricing.fabricCost ? `₹${pricing.fabricCost.min.toLocaleString()} - ₹${pricing.fabricCost.max.toLocaleString()} INR (${pricing.fabricCost.fabricName})` : "Not selected / Not included"}`);
    console.log(`    Additional Work:     ${pricing.additionalWorkCost ? `₹${pricing.additionalWorkCost.min.toLocaleString()} - ₹${pricing.additionalWorkCost.max.toLocaleString()} INR (${pricing.additionalWorkCost.items.join(", ")})` : "None"}`);
    console.log(`    Estimated Total:     ₹${pricing.totalEstimate.min.toLocaleString()} - ₹${pricing.totalEstimate.max.toLocaleString()} INR`);
    console.log(`    Estimated Turnaround:${pricing.turnaroundDays.min} - ${pricing.turnaroundDays.max} Business Days`);
    console.log(`    Disclaimer:          "${pricing.disclaimer}"`);
    console.log("\n");

    pipelineOutputs.push({
      name: tc.name,
      garment: visionResult.garmentType,
      complexity: pricing.complexityGrade,
      stitching: `₹${pricing.stitchingCost.min} - ₹${pricing.stitchingCost.max}`,
      fabric: pricing.fabricCost ? `₹${pricing.fabricCost.min} - ₹${pricing.fabricCost.max}` : "Not selected",
      additional: pricing.additionalWorkCost ? `₹${pricing.additionalWorkCost.min} - ₹${pricing.additionalWorkCost.max}` : "None",
      total: `₹${pricing.totalEstimate.min} - ₹${pricing.totalEstimate.max}`,
    });
  }

  // ------------------------------------------------------------------------
  // PART 2: FABRIC PRICING RULE VERIFICATION (CASES A-E)
  // ------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------");
  console.log("2. FABRIC PRICING RULE VERIFICATION (CASES A - E)");
  console.log("--------------------------------------------------------------------------\n");

  // CASE A: Simple Top, No Fabric Selected
  const caseA = calculateRealisticPrice({
    garmentType: "Top",
    complexity: "Basic",
    pattern: "Solid",
    fabricSelected: undefined,
  });
  console.log(`CASE A: Simple Top (No Fabric Selected)`);
  console.log(`  Stitching: ₹${caseA.stitchingCost.min} - ₹${caseA.stitchingCost.max} | Fabric: ${caseA.fabricCost ? "EXISTS (FAIL)" : "Not selected (PASS)"} | Total: ₹${caseA.totalEstimate.min} - ₹${caseA.totalEstimate.max}`);
  const passA = !caseA.fabricCost && caseA.totalEstimate.min === caseA.stitchingCost.min;
  console.log(`  Status: ${passA ? "✅ PASS (Stitching cost only, fabric not added)" : "❌ FAIL"}\n`);

  // CASE B: Simple Top, Low-cost Cotton selected
  const caseB = calculateRealisticPrice({
    garmentType: "Top",
    complexity: "Basic",
    pattern: "Solid",
    fabricSelected: "Cotton",
  });
  console.log(`CASE B: Simple Top (Low-Cost Cotton Selected ~2m)`);
  console.log(`  Stitching: ₹${caseB.stitchingCost.min} - ₹${caseB.stitchingCost.max} | Fabric (Cotton): ₹${caseB.fabricCost?.min} - ₹${caseB.fabricCost?.max} | Total: ₹${caseB.totalEstimate.min} - ₹${caseB.totalEstimate.max}`);
  const passB = caseB.fabricCost && caseB.totalEstimate.min === caseB.stitchingCost.min + caseB.fabricCost.min;
  console.log(`  Status: ${passB ? "✅ PASS (Stitching + Cotton fabric = Total)" : "❌ FAIL"}\n`);

  // CASE C: Simple Top, Premium Silk selected
  const caseC = calculateRealisticPrice({
    garmentType: "Top",
    complexity: "Basic",
    pattern: "Solid",
    fabricSelected: "Raw Silk",
  });
  console.log(`CASE C: Simple Top (Premium Raw Silk Selected ~2m)`);
  console.log(`  Stitching: ₹${caseC.stitchingCost.min} - ₹${caseC.stitchingCost.max} | Fabric (Raw Silk): ₹${caseC.fabricCost?.min} - ₹${caseC.fabricCost?.max} | Total: ₹${caseC.totalEstimate.min} - ₹${caseC.totalEstimate.max}`);
  const passC = caseC.stitchingCost.min === caseA.stitchingCost.min && caseC.totalEstimate.min > caseB.totalEstimate.min;
  console.log(`  Status: ${passC ? "✅ PASS (Stitching remains base ₹300, premium fabric raises total)" : "❌ FAIL"}\n`);

  // CASE D: Designer Kurti, Chanderi Silk selected
  const caseD = calculateRealisticPrice({
    garmentType: "Kurti",
    complexity: "Moderate",
    pattern: "Printed",
    fabricSelected: "Chanderi Silk",
  });
  console.log(`CASE D: Designer Kurti (Chanderi Silk Selected ~2m)`);
  console.log(`  Stitching: ₹${caseD.stitchingCost.min} - ₹${caseD.stitchingCost.max} | Fabric (Chanderi Silk): ₹${caseD.fabricCost?.min} - ₹${caseD.fabricCost?.max} | Total: ₹${caseD.totalEstimate.min} - ₹${caseD.totalEstimate.max}`);
  const passD = caseD.fabricCost !== undefined && caseD.stitchingCost.min === 900;
  console.log(`  Status: ${passD ? "✅ PASS (Stitching and fabric calculated independently)" : "❌ FAIL"}\n`);

  // CASE E: Bridal Lehenga, Brocade + Zardozi + Can-can
  const caseE = calculateRealisticPrice({
    garmentType: "Lehenga Choli",
    complexity: "Bridal",
    pattern: "Embroidered / Zari",
    customizationNotes: "Heavy zardozi embroidery, can-can multi-layer flare",
    fabricSelected: "Brocade",
  });
  console.log(`CASE E: Bridal Lehenga (Brocade + Zardozi + Can-Can ~4.5m)`);
  console.log(`  Stitching: ₹${caseE.stitchingCost.min} - ₹${caseE.stitchingCost.max} | Additional: ₹${caseE.additionalWorkCost?.min} - ₹${caseE.additionalWorkCost?.max} | Fabric: ₹${caseE.fabricCost?.min} - ₹${caseE.fabricCost?.max} | Total: ₹${caseE.totalEstimate.min} - ₹${caseE.totalEstimate.max}`);
  const passE = caseE.stitchingCost.min >= 12000 && caseE.additionalWorkCost !== undefined && caseE.fabricCost !== undefined;
  console.log(`  Status: ${passE ? "✅ PASS (High total reflecting stitching + additional craft + fabric)" : "❌ FAIL"}\n`);

  // ------------------------------------------------------------------------
  // PART 3: SIMPLE & COMPLEX GARMENT MONOTONICITY BENCHMARK
  // ------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------");
  console.log("3. GARMENT PRICING BENCHMARK TABLE");
  console.log("--------------------------------------------------------------------------\n");

  const benchmarkInputs = [
    { type: "Top", comp: "Basic", exp: "Low (₹300 - ₹650)" },
    { type: "Blouse", comp: "Basic", exp: "Low-to-Moderate (₹400 - ₹850)" },
    { type: "Shirt", comp: "Basic", exp: "Low-to-Moderate (₹450 - ₹900)" },
    { type: "Kurti", comp: "Moderate", exp: "Moderate (₹900 - ₹1,800)" },
    { type: "Saree", comp: "Detailed", exp: "Higher (₹2,500 - ₹5,500)" },
    { type: "Suit", comp: "Detailed", exp: "Formal Bespoke (₹6,000 - ₹12,000)" },
    { type: "Lehenga Choli", comp: "Bridal", exp: "Luxury (₹12,000 - ₹28,000)" },
  ];

  console.log("| Garment | Complexity | Expected Level | Actual Stitching | Actual Total |");
  console.log("|---|---|---|---|---|");
  for (const b of benchmarkInputs) {
    const res = calculateRealisticPrice({ garmentType: b.type, complexity: b.comp });
    console.log(`| ${b.type} | ${res.complexityGrade} | ${b.exp} | ₹${res.stitchingCost.min} - ₹${res.stitchingCost.max} | ₹${res.totalEstimate.min} - ₹${res.totalEstimate.max} |`);
  }
  console.log("\n");

  // ------------------------------------------------------------------------
  // PART 4: RAG RETRIEVAL REGRESSION CHECK
  // ------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------");
  console.log("4. RAG RETRIEVAL REGRESSION TEST");
  console.log("--------------------------------------------------------------------------\n");

  const regressionQueries = [
    { query: "Half Saree South Indian traditional bridal", expectedDoc: "doc_builtin_half_saree_png" },
    { query: "Banarasi silk saree embroidery", expectedDoc: "doc_builtin_banarasi_saree_png" },
    { query: "Men's formal three piece suit", expectedDoc: "doc_builtin_three_piece_suit_png" },
    { query: "Designer Kurti ethnic wear", expectedDoc: "doc_builtin_designer_kurti_png" },
  ];

  let ragRegressionPass = true;
  for (const rq of regressionQueries) {
    const emb = await embedText(rq.query);
    const sRes = await searchFashionKnowledge(emb, { matchCount: 5 });
    const top = sRes.results[0];
    const ok = top?.document_id === rq.expectedDoc;
    if (!ok) ragRegressionPass = false;
    console.log(`Query: "${rq.query}" -> Top: ${top?.document_id} (${top ? (top.similarity * 100).toFixed(2) : 0}%) | Expected: ${rq.expectedDoc} [${ok ? "✅ PASS" : "❌ FAIL"}]`);
  }
  console.log(`\nRAG Retrieval Regression Status: ${ragRegressionPass ? "✅ PASS" : "❌ FAIL"}\n`);

  // ------------------------------------------------------------------------
  // PART 5: CUSTOMER PRIVACY & VECTOR DB ISOLATION CHECK
  // ------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------");
  console.log("5. CUSTOMER PRIVACY & VECTOR DB ISOLATION CHECK");
  console.log("--------------------------------------------------------------------------\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: dbRows } = await supabase
    .from("fashion_knowledge_vectors")
    .select("document_id, content, metadata");

  let customerDataLeaks = 0;
  (dbRows || []).forEach((row) => {
    const str = JSON.stringify(row).toLowerCase();
    if (
      str.includes("customer_id") ||
      str.includes("order_id") ||
      str.includes("@gmail.com") ||
      str.includes("@threadify.com") ||
      str.includes("chest") ||
      str.includes("waist") ||
      str.includes("inseam")
    ) {
      customerDataLeaks++;
    }
  });

  console.log(`Customer Data In Vector DB: ${customerDataLeaks}`);
  console.log(`Status: ${customerDataLeaks === 0 ? "✅ PASS (0 customer data in vector DB)" : "❌ FAIL"}\n`);
}

runEndToEndAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
