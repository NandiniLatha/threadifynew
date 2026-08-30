import { GenerationProvider, RagGenerationInput, RagGenerationOutput } from "../types";
import { calculateRealisticPrice } from "../../pricing/pricing-engine";

export class DeterministicProvider implements GenerationProvider {
  name = "Deterministic grounded generation";

  async generate(input: RagGenerationInput): Promise<RagGenerationOutput> {
    const { visionResult, retrievedKnowledge, customerContext, userRequirements } = input;

    // 1. Primary Garment Type & Category Grounding
    const topDoc = retrievedKnowledge && retrievedKnowledge.length > 0 ? retrievedKnowledge[0] : null;
    const garmentType = visionResult.garmentType || topDoc?.garment_type || "Custom Garment";
    const category = topDoc?.category || visionResult.category || "Bespoke Couture";

    // 2. Extract Fabrics from Retrieved Knowledge metadata / content
    let recommendedFabric: string[] = [];
    if (topDoc?.metadata?.fabrics && Array.isArray(topDoc.metadata.fabrics) && topDoc.metadata.fabrics.length > 0) {
      recommendedFabric = [...topDoc.metadata.fabrics];
    } else if (topDoc?.content) {
      const match = topDoc.content.match(/Suitable Fabrics:\s*(.*)/i);
      if (match && match[1]) {
        recommendedFabric = match[1].split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    if (recommendedFabric.length === 0) {
      recommendedFabric = ["Not available from current fashion knowledge"];
    }

    // 3. Extract Tailor Specialization from Retrieved Knowledge
    let tailorSpecialization: string[] = [];
    if (topDoc?.metadata?.tailor_specialization && Array.isArray(topDoc.metadata.tailor_specialization) && topDoc.metadata.tailor_specialization.length > 0) {
      tailorSpecialization = [...topDoc.metadata.tailor_specialization];
    } else if (topDoc && garmentType && garmentType !== "Custom Garment") {
      tailorSpecialization = [`${garmentType} Bespoke Tailor`];
    } else {
      tailorSpecialization = ["Not available from current fashion knowledge"];
    }

    // 4. Construction & Craftsmanship Guidance
    const recommendedConstruction: string[] = [];
    const complexity = topDoc?.metadata?.complexity || visionResult.complexity;
    if (complexity) {
      recommendedConstruction.push(`Complexity Grade: ${complexity}`);
    }

    if (topDoc?.metadata?.regional_style) {
      recommendedConstruction.push(`Regional Heritage Style: ${topDoc.metadata.regional_style}`);
    }
    if (visionResult.pattern && visionResult.pattern !== "Unknown") {
      recommendedConstruction.push(`Pattern Craft: ${visionResult.pattern}`);
    }
    if (visionResult.colour && visionResult.colour !== "Custom Palette") {
      recommendedConstruction.push(`Colour Tone Alignment: ${visionResult.colour}`);
    }
    if (recommendedConstruction.length === 0) {
      recommendedConstruction.push("Not available from current fashion knowledge");
    }

    // 5. Calculate Realistic Pricing via Dedicated Pricing Engine
    const pricingResult = calculateRealisticPrice({
      garmentType,
      category,
      complexity: topDoc?.metadata?.complexity || visionResult.complexity,
      sleeveType: visionResult.sleeveType,
      neckline: visionResult.neckline,
      pattern: visionResult.pattern,
      style: visionResult.style,
      labels: visionResult.labels,
      customizationNotes: userRequirements?.customizationInstructions,
      occasion: userRequirements?.occasion,
      userBudgetMaxINR: userRequirements?.budgetINR?.max,
    });

    const estimatedStitchingRange = pricingResult.stitchingCost;
    const estimatedTurnaroundDays = pricingResult.turnaroundDays;

    // Compare with user budget constraint if provided (do NOT modify source price)
    if (userRequirements?.budgetINR?.max && estimatedStitchingRange.min > 0 && userRequirements.budgetINR.max < estimatedStitchingRange.min) {
      recommendedConstruction.push(`Budget Alert: User max budget (₹${userRequirements.budgetINR.max}) is below standard baseline (₹${estimatedStitchingRange.min}).`);
    }

    // 6. Customization Suggestions
    const customizationSuggestions: string[] = [];
    if (topDoc?.metadata?.alternate_names && Array.isArray(topDoc.metadata.alternate_names) && topDoc.metadata.alternate_names.length > 0) {
      customizationSuggestions.push(`Explore traditional drapes & styles: ${topDoc.metadata.alternate_names.join(", ")}`);
    }
    if (userRequirements?.customizationInstructions) {
      customizationSuggestions.push(`Client Requirement: ${userRequirements.customizationInstructions}`);
    }
    if (userRequirements?.occasion) {
      customizationSuggestions.push(`Occasion Tailoring: Tailored for ${userRequirements.occasion}`);
    }
    if (customizationSuggestions.length === 0) {
      customizationSuggestions.push("Not available from current fashion knowledge");
    }

    // 7. Measurement Guidance (incorporating customerContext at runtime only)
    const measurementGuidance: string[] = [];
    const m = customerContext?.measurements;

    if (garmentType.toLowerCase().includes("saree") || garmentType.toLowerCase().includes("half saree")) {
      measurementGuidance.push("Blouse Measurement: Chest/Bust, Shoulder Width, Blouse Length, Armhole.");
      if (m?.chest) measurementGuidance.push(`Recorded Bust/Chest: ${m.chest}" — verify ease for blouse canvas.`);
      if (m?.waist) measurementGuidance.push(`Recorded Waist: ${m.waist}" — critical for skirt/lehenga waistband fit.`);
    } else if (garmentType.toLowerCase().includes("suit") || garmentType.toLowerCase().includes("blazer")) {
      measurementGuidance.push("Jacket & Trouser: Chest, Waist, Shoulder Width, Sleeve Length, Inseam.");
      if (m?.chest) measurementGuidance.push(`Recorded Chest: ${m.chest}" — 2" ease allocated for structure.`);
      if (m?.inseam) measurementGuidance.push(`Recorded Inseam: ${m.inseam}" — standard trouser cuff height.`);
    } else if (garmentType.toLowerCase().includes("kurti")) {
      measurementGuidance.push("Upper Body: Chest/Bust, Waist, Hips, Shoulder, Kurti Length.");
      if (m?.chest) measurementGuidance.push(`Recorded Chest: ${m.chest}" — flared A-line ease applied.`);
      if (m?.hips) measurementGuidance.push(`Recorded Hips: ${m.hips}" — side slit placement benchmark.`);
    } else {
      measurementGuidance.push("Bespoke Fit: Chest, Waist, Hips, Full Length.");
      if (m?.chest && m?.waist) measurementGuidance.push(`Recorded Profile: Chest ${m.chest}", Waist ${m.waist}".`);
    }

    if (!m) {
      measurementGuidance.push("No stored customer measurements found. Baseline fitting session recommended.");
    }

    // 8. Grounded Reasoning Construction (Internal system tracing only)
    const reasoning = [
      `1. VISION GROUNDING: Identified ${garmentType} (${visionResult.colour || "Standard"} ${visionResult.pattern || "Design"}).`,
      `2. RAG RETRIEVAL GROUNDING: Matched relevant fashion knowledge documents for ${garmentType}. Stitching costs (₹${estimatedStitchingRange.min}-₹${estimatedStitchingRange.max}) and turnaround (${estimatedTurnaroundDays.min}-${estimatedTurnaroundDays.max} days) calculated by pricing engine.`,
      `3. CUSTOMER CONTEXT: ${m ? "Customer measurements incorporated into runtime fit guidance (0 persistent data stored)." : "No customer measurements supplied."}`,
      `4. RECOMMENDATION DERIVATION: Selected ${recommendedFabric.join(", ")} fabric options and assigned specializations for ${tailorSpecialization.join(", ")}.`,
    ].join("\n");

    return {
      garmentType,
      category,
      recommendedFabric,
      recommendedConstruction,
      customizationSuggestions,
      estimatedStitchingRange,
      estimatedTurnaroundDays,
      measurementGuidance,
      tailorSpecialization,
      reasoning,
      provider: this.name,
      pricingDetails: {
        stitchingMin: pricingResult.stitchingCost.min,
        stitchingMax: pricingResult.stitchingCost.max,
        fabricMin: pricingResult.fabricCost?.min,
        fabricMax: pricingResult.fabricCost?.max,
        additionalWorkMin: pricingResult.additionalWorkCost?.min,
        additionalWorkMax: pricingResult.additionalWorkCost?.max,
        totalMin: pricingResult.totalEstimate.min,
        totalMax: pricingResult.totalEstimate.max,
        complexity: pricingResult.complexityGrade,
        explanation: pricingResult.explanation,
        disclaimer: pricingResult.disclaimer,
      },
    };
  }
}


