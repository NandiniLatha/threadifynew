import { RagGenerationInput } from "./types";

export interface FormattedRagContext {
  fullContextString: string;
  visionSection: string;
  retrievedKnowledgeSection: string;
  customerContextSection: string;
  userRequirementsSection: string;
}

/**
 * Combines Vision analysis, retrieved pgvector documents, runtime customer context,
 * and user requirements into a structured context string with clear boundary demarcation.
 * 
 * IMPORTANT: Customer context (e.g. measurements) exists ONLY in this runtime context block
 * and is NEVER stored in or passed to vector databases / knowledge tables.
 */
export function buildRagGenerationContext(input: RagGenerationInput): FormattedRagContext {
  const { visionResult, retrievedKnowledge, customerContext, userRequirements } = input;

  // 1. Vision Section
  const visionLines = [
    `Garment Type: ${visionResult.garmentType}`,
    visionResult.category ? `Category: ${visionResult.category}` : null,
    visionResult.colour ? `Colour: ${visionResult.colour}` : null,
    visionResult.pattern ? `Pattern: ${visionResult.pattern}` : null,
    visionResult.style ? `Style: ${visionResult.style}` : null,
    visionResult.complexity ? `Complexity: ${visionResult.complexity}` : null,
    visionResult.gender ? `Target Profile: ${visionResult.gender}` : null,
  ].filter(Boolean);
  const visionSection = `[VISION ANALYSIS]\n${visionLines.join("\n")}`;

  // 2. Retrieved Knowledge Section
  let knowledgeSection = "[RETRIEVED FASHION KNOWLEDGE]\n";
  if (retrievedKnowledge && retrievedKnowledge.length > 0) {
    knowledgeSection += retrievedKnowledge
      .map((doc, idx) => {
        const sim = (doc.similarity * 100).toFixed(1);
        return `Document ${idx + 1} (Doc ID: ${doc.document_id}, Garment: ${doc.garment_type}, Match: ${sim}%):\n${doc.content}`;
      })
      .join("\n\n");
  } else {
    knowledgeSection += "No matching canonical knowledge documents retrieved.";
  }

  // 3. Customer Context Section (Runtime Only - Confidential)
  let customerSection = "[CUSTOMER CONTEXT (RUNTIME ONLY - DO NOT PERSIST)]\n";
  if (customerContext) {
    const lines = [];
    if (customerContext.genderProfile) lines.push(`Gender Profile: ${customerContext.genderProfile}`);
    if (customerContext.measurements) {
      const m = customerContext.measurements;
      lines.push("Measurements (Inches):");
      if (m.chest !== undefined) lines.push(`  - Chest/Bust: ${m.chest}"`);
      if (m.waist !== undefined) lines.push(`  - Waist: ${m.waist}"`);
      if (m.hips !== undefined) lines.push(`  - Hips: ${m.hips}"`);
      if (m.shoulderWidth !== undefined) lines.push(`  - Shoulder Width: ${m.shoulderWidth}"`);
      if (m.sleeveLength !== undefined) lines.push(`  - Sleeve Length: ${m.sleeveLength}"`);
      if (m.inseam !== undefined) lines.push(`  - Inseam: ${m.inseam}"`);
      if (m.height !== undefined) lines.push(`  - Height: ${m.height}"`);
      if (m.preferredFit) lines.push(`  - Preferred Fit: ${m.preferredFit}`);
      if (m.notes) lines.push(`  - Notes: ${m.notes}`);
    }
    customerSection += lines.length > 0 ? lines.join("\n") : "No specific body measurements provided.";
  } else {
    customerSection += "No customer context provided.";
  }

  // 4. User Requirements Section
  let reqSection = "[USER REQUIREMENTS]\n";
  if (userRequirements) {
    const lines = [];
    if (userRequirements.budgetINR) {
      const { min, max } = userRequirements.budgetINR;
      if (min !== undefined && max !== undefined) lines.push(`Budget: ₹${min.toLocaleString()} - ₹${max.toLocaleString()} INR`);
      else if (max !== undefined) lines.push(`Max Budget: ₹${max.toLocaleString()} INR`);
    }
    if (userRequirements.deadlineDays) lines.push(`Desired Delivery Deadline: ${userRequirements.deadlineDays} Business Days`);
    if (userRequirements.preferredGarmentType) lines.push(`Preferred Garment Type: ${userRequirements.preferredGarmentType}`);
    if (userRequirements.occasion) lines.push(`Occasion: ${userRequirements.occasion}`);
    if (userRequirements.customizationInstructions) lines.push(`Customization Notes: ${userRequirements.customizationInstructions}`);
    reqSection += lines.length > 0 ? lines.join("\n") : "Standard bespoke tailoring requirements.";
  } else {
    reqSection += "Standard bespoke tailoring requirements.";
  }

  const fullContextString = [visionSection, knowledgeSection, customerSection, reqSection].join("\n\n--------------------------------------------------\n\n");

  return {
    fullContextString,
    visionSection,
    retrievedKnowledgeSection: knowledgeSection,
    customerContextSection: customerSection,
    userRequirementsSection: reqSection,
  };
}
