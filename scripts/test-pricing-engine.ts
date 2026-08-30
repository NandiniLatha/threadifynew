import { calculateRealisticPrice, PricingEngineInput } from "../lib/pricing/pricing-engine";
import { generateFashionRecommendation } from "../lib/rag/generator";
import { embedText } from "../lib/rag/embeddings";
import { searchFashionKnowledge } from "../lib/rag/knowledge-store";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function runPricingTests() {
  console.log("==========================================================================");
  console.log("THREADIFY — BESPOKE PRICING ENGINE & SANITY TEST SUITE");
  console.log("==========================================================================\n");

  const testCases: { name: string; input: PricingEngineInput; expectedLevel: string }[] = [
    {
      name: "Case 1: Simple Top",
      input: {
        garmentType: "Top",
        complexity: "Basic",
        pattern: "Solid",
        neckline: "Round Neck",
        sleeveType: "Sleeveless",
        category: "Casual Wear",
        labels: ["Top", "Casual", "Solid"],
      },
      expectedLevel: "LOW (₹300 - ₹700)",
    },
    {
      name: "Case 2: Simple Blouse",
      input: {
        garmentType: "Blouse",
        complexity: "Basic",
        pattern: "Solid",
        neckline: "U Neck",
        sleeveType: "Short Sleeve",
        category: "Ethnic Wear",
        labels: ["Blouse", "Saree Blouse", "Solid", "Basic"],
      },
      expectedLevel: "LOW-TO-MODERATE (₹400 - ₹850)",
    },
    {
      name: "Case 3: Simple Shirt",
      input: {
        garmentType: "Shirt",
        complexity: "Basic",
        pattern: "Solid",
        neckline: "Collar Neck",
        sleeveType: "Full Sleeve",
        category: "Formal Wear",
        labels: ["Shirt", "Formal Shirt", "Solid", "Basic"],
      },
      expectedLevel: "LOW-TO-MODERATE (₹450 - ₹900)",
    },
    {
      name: "Case 4: Designer Kurti",
      input: {
        garmentType: "Kurti",
        complexity: "Moderate",
        pattern: "Printed",
        style: "Contemporary Kurti",
        category: "Ethnic Wear",
        labels: ["Kurti", "Contemporary Kurti", "Designer Kurti", "Moderate Craftsmanship"],
      },
      expectedLevel: "MEDIUM (₹900 - ₹1,800)",
    },
    {
      name: "Case 5: Banarasi Saree Ensemble",
      input: {
        garmentType: "Saree",
        complexity: "Detailed",
        pattern: "Embroidered / Zari",
        style: "Traditional Saree Drape",
        category: "Indian Traditional Wear",
        labels: ["Saree", "Banarasi Saree", "High Craftsmanship", "Zari", "Embroidery"],
      },
      expectedLevel: "HIGHER (₹2,500 - ₹6,500)",
    },
    {
      name: "Case 6: Three Piece Suit",
      input: {
        garmentType: "Suit",
        complexity: "Detailed",
        pattern: "Solid",
        style: "Tailored Suit",
        category: "Formal Wear",
        labels: ["Suit", "Three Piece Suit", "Vest", "High Craftsmanship"],
      },
      expectedLevel: "FORMAL BESPOKE (₹6,000 - ₹12,000)",
    },
    {
      name: "Case 7: Bridal Lehenga",
      input: {
        garmentType: "Lehenga Choli",
        complexity: "Bridal",
        pattern: "Embroidered / Zari",
        style: "Bridal Lehenga Flared",
        category: "Bridal Wear",
        customizationNotes: "Heavy zardozi embroidery, can-can multi-layer flare, double dupatta",
        labels: ["Lehenga Choli", "Bridal Lehenga", "Zardozi", "Can-Can", "Bespoke Luxury"],
      },
      expectedLevel: "HIGH / LUXURY (₹12,000 - ₹28,000+)",
    },
  ];

  const results: any[] = [];

  for (const tc of testCases) {
    console.log("--------------------------------------------------------------------------");
    console.log(`TEST: ${tc.name}`);
    console.log(`Expected Level: ${tc.expectedLevel}`);
    console.log("--------------------------------------------------------------------------");

    const priceRes = calculateRealisticPrice(tc.input);

    console.log(`Complexity Grade:       ${priceRes.complexityGrade}`);
    console.log(`Estimated Stitching:    ₹${priceRes.stitchingCost.min.toLocaleString()} - ₹${priceRes.stitchingCost.max.toLocaleString()} INR`);
    if (priceRes.additionalWorkCost) {
      console.log(`Additional Work:        ₹${priceRes.additionalWorkCost.min.toLocaleString()} - ₹${priceRes.additionalWorkCost.max.toLocaleString()} INR (${priceRes.additionalWorkCost.items.join(", ")})`);
    }
    if (priceRes.fabricCost) {
      console.log(`Fabric Material:        ₹${priceRes.fabricCost.min.toLocaleString()} - ₹${priceRes.fabricCost.max.toLocaleString()} INR (${priceRes.fabricCost.fabricName})`);
    }
    console.log(`Total Estimated Range:  ₹${priceRes.totalEstimate.min.toLocaleString()} - ₹${priceRes.totalEstimate.max.toLocaleString()} INR`);
    console.log(`Estimated Turnaround:   ${priceRes.turnaroundDays.min} - ${priceRes.turnaroundDays.max} Business Days`);
    console.log(`Breakdown Count:        ${priceRes.breakdown.length} items`);
    console.log(`Explanation:            "${priceRes.explanation}"`);
    console.log("\n");

    results.push({
      name: tc.name,
      garment: tc.input.garmentType,
      complexity: priceRes.complexityGrade,
      stitching: `₹${priceRes.stitchingCost.min} - ₹${priceRes.stitchingCost.max}`,
      total: `₹${priceRes.totalEstimate.min} - ₹${priceRes.totalEstimate.max}`,
      minVal: priceRes.stitchingCost.min,
      maxVal: priceRes.stitchingCost.max,
    });
  }

  // ------------------------------------------------------------------------
  // PRICE SANITY CHECKS (Monotonicity & Non-Inverted Complexity)
  // ------------------------------------------------------------------------
  console.log("==========================================================================");
  console.log("PRICE SANITY CHECKS");
  console.log("==========================================================================\n");

  const top = results.find((r) => r.garment === "Top");
  const blouse = results.find((r) => r.garment === "Blouse");
  const shirt = results.find((r) => r.garment === "Shirt");
  const kurti = results.find((r) => r.garment === "Kurti");
  const banarasi = results.find((r) => r.garment === "Saree");
  const suit = results.find((r) => r.garment === "Suit");
  const lehenga = results.find((r) => r.garment === "Lehenga Choli");

  let sanityPassed = true;

  // Check 1: Simple Top is affordable (under ₹800)
  if (top.maxVal > 1000) {
    console.error(`❌ Check 1 Failed: Simple Top max price (₹${top.maxVal}) is unrealistically high.`);
    sanityPassed = false;
  } else {
    console.log(`✅ Check 1 Passed: Simple Top stitching (₹${top.stitching}) is realistic and affordable.`);
  }

  // Check 2: Simple Top < Designer Kurti
  if (top.minVal >= kurti.minVal || top.maxVal >= kurti.maxVal) {
    console.error(`❌ Check 2 Failed: Simple Top (₹${top.stitching}) >= Kurti (₹${kurti.stitching}).`);
    sanityPassed = false;
  } else {
    console.log(`✅ Check 2 Passed: Simple Top (₹${top.stitching}) < Designer Kurti (₹${kurti.stitching}).`);
  }

  // Check 3: Designer Kurti < Three Piece Suit
  if (kurti.maxVal >= suit.maxVal) {
    console.error(`❌ Check 3 Failed: Kurti (₹${kurti.stitching}) >= Suit (₹${suit.stitching}).`);
    sanityPassed = false;
  } else {
    console.log(`✅ Check 3 Passed: Designer Kurti (₹${kurti.stitching}) < Three Piece Suit (₹${suit.stitching}).`);
  }

  // Check 4: Three Piece Suit < Bridal Lehenga
  if (suit.maxVal > lehenga.maxVal) {
    console.error(`❌ Check 4 Failed: Suit (₹${suit.stitching}) > Bridal Lehenga (₹${lehenga.stitching}).`);
    sanityPassed = false;
  } else {
    console.log(`✅ Check 4 Passed: Three Piece Suit (₹${suit.stitching}) <= Bridal Lehenga (₹${lehenga.stitching}).`);
  }

  // Check 5: Simple Blouse & Shirt are modest
  if (blouse.maxVal > 1200 || shirt.maxVal > 1200) {
    console.error(`❌ Check 5 Failed: Basic Blouse or Shirt stitching exceeds modest range.`);
    sanityPassed = false;
  } else {
    console.log(`✅ Check 5 Passed: Basic Blouse (₹${blouse.stitching}) & Basic Shirt (₹${shirt.stitching}) are in modest range.`);
  }

  console.log(`\nOverall Price Sanity Status: ${sanityPassed ? "✅ PASS" : "❌ FAIL"}\n`);

  // ------------------------------------------------------------------------
  // RAG RETRIEVAL & GROUNDING REGRESSION CHECK
  // ------------------------------------------------------------------------
  console.log("==========================================================================");
  console.log("RAG RETRIEVAL REGRESSION VERIFICATION");
  console.log("==========================================================================\n");

  const ragChecks = [
    { query: "Half Saree South Indian traditional bridal", expectedDoc: "doc_builtin_half_saree_png" },
    { query: "Banarasi silk saree embroidery", expectedDoc: "doc_builtin_banarasi_saree_png" },
    { query: "Men's formal three piece suit", expectedDoc: "doc_builtin_three_piece_suit_png" },
    { query: "Designer Kurti ethnic wear", expectedDoc: "doc_builtin_designer_kurti_png" },
  ];

  let ragPassed = true;
  for (const rc of ragChecks) {
    const emb = await embedText(rc.query);
    const searchRes = await searchFashionKnowledge(emb, { matchCount: 5 });
    const topDoc = searchRes.results[0];
    const ok = topDoc?.document_id === rc.expectedDoc;
    if (!ok) ragPassed = false;
    console.log(`Query: "${rc.query}" -> Top: ${topDoc?.document_id} (${topDoc ? (topDoc.similarity * 100).toFixed(2) : 0}%) | Expected: ${rc.expectedDoc} [${ok ? "✅ PASS" : "❌ FAIL"}]`);
  }

  console.log(`\nRAG Retrieval Regression Status: ${ragPassed ? "✅ PASS" : "❌ FAIL"}\n`);
}

runPricingTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
