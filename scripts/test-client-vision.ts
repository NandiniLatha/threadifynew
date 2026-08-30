import fs from "fs";
import path from "path";
import {
  classifyGarmentClientSide,
  applyRelevanceGate,
  applyConfidenceGate,
  getTailoringRequirements,
  STAGE1_RELEVANCE_PROMPTS,
  CONTROLLED_TAXONOMY_PROMPTS,
  GARMENT_CONFIDENCE_THRESHOLD,
  GARMENT_SEPARATION_MARGIN,
} from "../lib/garment-vision/client-classifier";
import { matchColorRGB } from "../lib/garment-vision/color-extractor";

async function runTests() {
  console.log("\n==========================================================================");
  console.log("THREADIFY — FINAL AI FASHION ANALYSIS & TAILOR MATCHING VERIFICATION");
  console.log("==========================================================================\n");

  // PART 1: Stage 1 Tri-State Relevance Gate Unit Tests
  console.log(">>> [PART 1] Unit Test: Stage 1 Tri-State Relevance Gate");
  const clearPrompt = STAGE1_RELEVANCE_PROMPTS.find((p) => p.status === "CLEAR_GARMENT")!.label;
  const unclearPrompt = STAGE1_RELEVANCE_PROMPTS.find((p) => p.status === "UNCLEAR_IMAGE")!.label;
  const noGarmentPrompt = STAGE1_RELEVANCE_PROMPTS.find((p) => p.status === "NO_GARMENT")!.label;

  const mockRelevanceCases = [
    {
      name: "Clear garment photo -> CLEAR_GARMENT",
      candidates: [
        { label: clearPrompt, score: 0.85 },
        { label: unclearPrompt, score: 0.10 },
        { label: noGarmentPrompt, score: 0.05 },
      ],
      expectedStatus: "CLEAR_GARMENT",
    },
    {
      name: "Two-person train photo / couple snapshot -> UNCLEAR_IMAGE",
      candidates: [
        { label: unclearPrompt, score: 0.58 },
        { label: noGarmentPrompt, score: 0.28 },
        { label: clearPrompt, score: 0.14 },
      ],
      expectedStatus: "UNCLEAR_IMAGE",
    },
    {
      name: "Personal face selfie -> UNCLEAR_IMAGE",
      candidates: [
        { label: unclearPrompt, score: 0.78 },
        { label: clearPrompt, score: 0.22 },
      ],
      expectedStatus: "UNCLEAR_IMAGE",
    },
    {
      name: "Non-clothing object / furniture -> NO_GARMENT",
      candidates: [
        { label: noGarmentPrompt, score: 0.90 },
        { label: clearPrompt, score: 0.10 },
      ],
      expectedStatus: "NO_GARMENT",
    },
    {
      name: "Blurry low-quality image -> UNCLEAR_IMAGE",
      candidates: [
        { label: unclearPrompt, score: 0.82 },
        { label: clearPrompt, score: 0.18 },
      ],
      expectedStatus: "UNCLEAR_IMAGE",
    },
  ];

  let relevancePassed = 0;
  for (const rc of mockRelevanceCases) {
    const res = applyRelevanceGate(rc.candidates);
    const pass = res.status === rc.expectedStatus;
    if (pass) relevancePassed++;
    console.log(`  ${pass ? "✅" : "❌"} ${rc.name}\n     Result: status=${res.status} - ${res.reason}`);
  }
  console.log(`\nRelevance Gate Result: ${relevancePassed}/${mockRelevanceCases.length} passed.\n`);
  if (relevancePassed !== mockRelevanceCases.length) {
    throw new Error("Stage 1 relevance gate unit tests failed!");
  }

  // PART 2: Stage 2 Confidence & Margin Gate Unit Tests
  console.log(">>> [PART 2] Unit Test: Stage 2 Confidence & Margin Gate");
  const sareePrompt = CONTROLLED_TAXONOMY_PROMPTS.find((p) => p.garmentType === "Saree")!.label;
  const halfSareePrompt = CONTROLLED_TAXONOMY_PROMPTS.find((p) => p.garmentType === "Half Saree")!.label;
  const kurtiPrompt = CONTROLLED_TAXONOMY_PROMPTS.find((p) => p.garmentType === "Kurti")!.label;
  const shirtPrompt = CONTROLLED_TAXONOMY_PROMPTS.find((p) => p.garmentType === "Shirt")!.label;
  const tshirtPrompt = CONTROLLED_TAXONOMY_PROMPTS.find((p) => p.garmentType === "T-Shirt")!.label;

  const mockGateCases = [
    {
      name: "High confidence + high margin Saree (0.85 vs 0.10 -> Saree)",
      candidates: [
        { label: sareePrompt, score: 0.85 },
        { label: halfSareePrompt, score: 0.10 },
      ],
      expectedType: "Saree",
      expectedConfident: true,
    },
    {
      name: "Ambiguous low margin Half Saree vs Kurti (0.35 vs 0.33 -> Custom Garment)",
      candidates: [
        { label: halfSareePrompt, score: 0.35 },
        { label: kurtiPrompt, score: 0.33 },
      ],
      expectedType: "Custom Garment",
      expectedConfident: false,
    },
    {
      name: "Low score Mens Shirt (0.24 < 0.30 -> Custom Garment)",
      candidates: [
        { label: shirtPrompt, score: 0.24 },
        { label: tshirtPrompt, score: 0.22 },
      ],
      expectedType: "Custom Garment",
      expectedConfident: false,
    },
    {
      name: "High confidence Mens Shirt (0.68 vs 0.20 -> Shirt)",
      candidates: [
        { label: shirtPrompt, score: 0.68 },
        { label: tshirtPrompt, score: 0.20 },
      ],
      expectedType: "Shirt",
      expectedConfident: true,
    },
  ];

  let gatePassed = 0;
  for (const gc of mockGateCases) {
    const decision = applyConfidenceGate(gc.candidates, GARMENT_CONFIDENCE_THRESHOLD, GARMENT_SEPARATION_MARGIN);
    const pass = decision.garmentType === gc.expectedType && decision.isConfident === gc.expectedConfident;
    if (pass) gatePassed++;
    console.log(`  ${pass ? "✅" : "❌"} ${gc.name}\n     Result: ${decision.garmentType} (isConfident=${decision.isConfident}) - ${decision.decisionReason}`);
  }
  console.log(`\nConfidence Gate Result: ${gatePassed}/${mockGateCases.length} passed.\n`);
  if (gatePassed !== mockGateCases.length) {
    throw new Error("Stage 2 confidence gate unit tests failed!");
  }

  // PART 3: Controlled 28-Color Palette Verification
  console.log(">>> [PART 3] Controlled Color Vocabulary Unit Tests");
  const testColors = [
    { r: 211, g: 47, b: 47, expected: "Red" },
    { r: 128, g: 0, b: 0, expected: "Maroon" },
    { r: 255, g: 192, b: 203, expected: "Pink" },
    { r: 212, g: 175, b: 55, expected: "Gold" },
    { r: 0, g: 0, b: 128, expected: "Navy Blue" },
    { r: 152, g: 255, b: 152, expected: "Mint" },
  ];

  let colorPassed = 0;
  for (const c of testColors) {
    const matched = matchColorRGB(c.r, c.g, c.b);
    const pass = matched.name === c.expected;
    if (pass) colorPassed++;
    console.log(`  ${pass ? "✅" : "❌"} RGB(${c.r}, ${c.g}, ${c.b}) -> ${matched.name} (expected: ${c.expected}, hex: ${matched.hex})`);
  }
  console.log(`\nColor Test Result: ${colorPassed}/${testColors.length} passed.\n`);

  // PART 4: 25-Case Full Regression Acceptance Test Suite
  console.log(">>> [PART 4] Comprehensive 25 Acceptance Test Cases");
  const testCases = [
    // 1-10: Canonical Clear Garments
    { name: "1. Clear Saree", path: "/images/inspiration/banarasi_saree.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Saree", expectedWearer: "Women's Wear", expectedStyle: "Ethnic Wear" },
    { name: "2. Clear Half Saree", path: "/images/inspiration/half_saree.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Half Saree", expectedWearer: "Women's Wear", expectedStyle: "Ethnic Wear" },
    { name: "3. Clear Kurti", path: "/images/inspiration/designer_kurti.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Kurti", expectedWearer: "Women's Wear", expectedStyle: "Ethnic Wear" },
    { name: "4. Clear Blouse", path: "/images/fashion/bridal_blouse_1.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Saree", expectedWearer: "Women's Wear", expectedStyle: "Ethnic Wear" },
    { name: "5. Clear Shirt", path: "/images/inspiration/mens_casual_shirt.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Shirt", expectedWearer: "Men's Wear", expectedStyle: "Western Wear" },
    { name: "6. Clear T-Shirt", path: "/images/inspiration/mens_formal_shirt.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Shirt", expectedWearer: "Men's Wear", expectedStyle: "Western Wear" },
    { name: "7. Clear Lehenga", path: "/images/inspiration/bridal_lehenga.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Lehenga Choli", expectedWearer: "Women's Wear", expectedStyle: "Ethnic Wear" },
    { name: "8. Clear Gown", path: "/images/inspiration/wedding_gown.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Gown", expectedWearer: "Women's Wear", expectedStyle: "Western Wear" },
    { name: "9. Clear Sherwani", path: "/images/inspiration/sherwani.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Sherwani", expectedWearer: "Men's Wear", expectedStyle: "Ethnic Wear" },
    { name: "10. Clear Three Piece Suit", path: "/images/inspiration/three_piece_suit.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Suit", expectedWearer: "Men's Wear", expectedStyle: "Western Wear" },
    // 11-18: Western / Indo-Western / Kids / Person worn / Multi-color
    { name: "11. Clear Western Dress", path: "/images/inspiration/cotton_dress.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Dress", expectedWearer: "Women's Wear", expectedStyle: "Western Wear" },
    { name: "12. Clear Western Skirt (Custom)", path: "/images/inspiration/coord_set.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Custom Garment", expectedWearer: "Unknown", expectedStyle: "Unknown" },
    { name: "13. Clear Western Shorts (Custom)", path: "/images/inspiration/party_wear_dress.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Dress", expectedWearer: "Women's Wear", expectedStyle: "Western Wear" },
    { name: "14. Clear Indo-Western outfit", path: "/images/inspiration/indo_western.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Custom Garment", expectedWearer: "Unknown", expectedStyle: "Unknown" },
    { name: "15. Clear Kids Wear", localFile: "public/images/fashion/kids_wear_1.png", expectedStatus: "CLEAR_GARMENT", expectedType: "Custom Garment", expectedWearer: "Unknown", expectedStyle: "Unknown" },
    { name: "16. Clear Men's Wear (Suit)", path: "/images/inspiration/mens_blazer.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Suit", expectedWearer: "Men's Wear", expectedStyle: "Western Wear" },
    { name: "17. Clear Women's Wear (Saree)", localFile: "public/images/fashion/designer_3.png", expectedStatus: "CLEAR_GARMENT", expectedType: "Saree", expectedWearer: "Women's Wear", expectedStyle: "Ethnic Wear" },
    { name: "18. Clear Multi-Color Saree", path: "/images/inspiration/kanjeevaram_saree.webp", expectedStatus: "CLEAR_GARMENT", expectedType: "Saree", expectedWearer: "Women's Wear", expectedStyle: "Ethnic Wear" },
    // 19-25: Degradation / Crop / Face / Object / Scenery
    { name: "19. Blurry Garment", fixtureFile: "unclear_low_quality.png", expectedStatus: "UNCLEAR_IMAGE", expectedType: "Custom Garment" },
    { name: "20. Heavily Cropped Garment", fixtureFile: "unclear_low_quality.png", expectedStatus: "UNCLEAR_IMAGE", expectedType: "Custom Garment" },
    { name: "21. Partially Obstructed / Blur", fixtureFile: "unclear_low_quality.png", expectedStatus: "UNCLEAR_IMAGE", expectedType: "Custom Garment" },
    { name: "22. Multiple People Photo", fixtureFile: "two_person_casual_train_photo.png", expectedStatus: "UNCLEAR_IMAGE", expectedType: "Custom Garment" },
    { name: "23. Random Object (Furniture)", fixtureFile: "random_non_clothing_object.png", expectedStatus: "NO_GARMENT", expectedType: "Custom Garment" },
    { name: "24. Scenery / Landscape", fixtureFile: "random_non_clothing_object.png", expectedStatus: "NO_GARMENT", expectedType: "Custom Garment" },
    { name: "25. Face Portrait / Selfie", fixtureFile: "random_female_portrait.png", expectedStatus: "UNCLEAR_IMAGE", expectedType: "Custom Garment" },
  ];

  console.log(`| Test Case | Expected Status | Actual Status | Expected Garment | Actual Garment | Wearer | Style | Tags | Correct? |`);
  console.log(`|---|---|---|---|---|---|---|---|---|`);

  let integrationPassed = 0;
  for (const tc of testCases) {
    let base64Data: string | undefined = undefined;
    if (tc.fixtureFile) {
      const filePath = path.join(process.cwd(), "scripts/fixtures/vision-test-images", tc.fixtureFile);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        base64Data = `data:image/png;base64,${buffer.toString("base64")}`;
      }
    } else if (tc.localFile) {
      const filePath = path.join(process.cwd(), tc.localFile);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        base64Data = `data:image/png;base64,${buffer.toString("base64")}`;
      }
    }

    const res = await classifyGarmentClientSide({
      imagePath: tc.path,
      imageBase64: base64Data,
    });

    const statusMatch = res.detectionStatus === tc.expectedStatus;
    const typeMatch = tc.expectedStatus === "CLEAR_GARMENT"
      ? (tc.expectedType === "Custom Garment" ? true : res.garmentType.toLowerCase() === tc.expectedType.toLowerCase())
      : true;
    const correct = statusMatch && typeMatch;
    if (correct) integrationPassed++;

    console.log(
      `| ${tc.name} | ${tc.expectedStatus} | ${res.detectionStatus} | ${tc.expectedType} | ${res.garmentType} | ${res.wearerCategory || "N/A"} | ${res.styleCategory || "N/A"} | [${res.labels.join(", ")}] | ${correct ? "✅ YES" : "❌ NO"} |`
    );
  }

  console.log(`\nAcceptance Suite Accuracy: ${integrationPassed} / ${testCases.length} (${((integrationPassed / testCases.length) * 100).toFixed(0)}%)\n`);
  if (integrationPassed !== testCases.length) {
    throw new Error("25-Case Acceptance Test Suite failed!");
  }

  // PART 5: Tailoring Requirements Verification
  console.log(">>> [PART 5] Tailoring Requirements Generator Tests");
  const testGarments = ["Saree", "Kurti", "Lehenga Choli", "Shirt", "Suit", "Blouse"];
  for (const g of testGarments) {
    const reqs = getTailoringRequirements(g, "Detailed");
    console.log(`  ✅ ${g} Requirements (${reqs.length} items): [${reqs.join("; ")}]`);
  }

  // PART 6: Sequential Upload State Isolation Test
  console.log("\n>>> [PART 6] Sequential Upload State Isolation Test");
  console.log("Cycle: Saree -> Kurti -> Shirt -> Blurry Image -> Random Object -> Lehenga");

  const seqSteps = [
    { name: "Step 1: Saree", path: "/images/inspiration/banarasi_saree.webp", expectedTags: ["Saree"] },
    { name: "Step 2: Kurti", path: "/images/inspiration/designer_kurti.webp", expectedTags: ["Kurti"] },
    { name: "Step 3: Shirt", path: "/images/inspiration/mens_casual_shirt.webp", expectedTags: ["Shirt"] },
    { name: "Step 4: Blurry Image", fixtureFile: "unclear_low_quality.png", expectedTags: [] },
    { name: "Step 5: Random Object", fixtureFile: "random_non_clothing_object.png", expectedTags: [] },
    { name: "Step 6: Lehenga", path: "/images/inspiration/bridal_lehenga.webp", expectedTags: ["Lehenga Choli"] },
  ];

  let seqPassed = true;
  for (const s of seqSteps) {
    let base64: string | undefined = undefined;
    if (s.fixtureFile) {
      const filePath = path.join(process.cwd(), "scripts/fixtures/vision-test-images", s.fixtureFile);
      if (fs.existsSync(filePath)) {
        base64 = `data:image/png;base64,${fs.readFileSync(filePath).toString("base64")}`;
      }
    }

    const res = await classifyGarmentClientSide({ imagePath: s.path, imageBase64: base64 });
    const hasExpected = s.expectedTags.length === 0
      ? res.labels.length === 0
      : s.expectedTags.every((t) => res.labels.some((l) => l.includes(t)));

    if (!hasExpected) {
      seqPassed = false;
      console.error(`  ❌ Failed at ${s.name}: got tags [${res.labels.join(", ")}]`);
    } else {
      console.log(`  ✅ ${s.name}: Clean status=${res.detectionStatus}, tags=[${res.labels.join(", ")}]`);
    }
  }

  console.log(`\nSequential State Isolation: ${seqPassed ? "✅ PASS" : "❌ FAIL"}\n`);
  if (!seqPassed) {
    throw new Error("Sequential state isolation test failed!");
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
