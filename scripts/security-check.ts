import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function securityCheck() {
  console.log("\n==========================================================================");
  console.log("THREADIFY — STEP 6 SECURITY CHECK");
  console.log("==========================================================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("fashion_knowledge_vectors")
    .select("document_id, garment_type, category, content, metadata");

  if (error) {
    console.error("Error querying fashion_knowledge_vectors:", error);
    process.exit(1);
  }

  const suspiciousTerms = [
    "email",
    "@",
    "uuid",
    "chest",
    "waist",
    "hips",
    "bicep",
    "shoulder",
    "customer",
    "user_id",
    "order",
    "payment",
    "razorpay",
    "credit",
    "card",
    "address",
    "phone",
  ];

  const violations: { docId: string; term: string }[] = [];

  for (const doc of data || []) {
    const serialized = JSON.stringify(doc).toLowerCase();
    for (const term of suspiciousTerms) {
      if (serialized.includes(term)) {
        violations.push({ docId: doc.document_id, term });
      }
    }
  }

  if (violations.length === 0) {
    console.log("PRIVATE DATA = NOT FOUND");
    console.log("✅ Zero customer identifiers, emails, measurements, orders, or payments present.");
  } else {
    console.warn(`⚠️ SECURITY VIOLATION: Found ${violations.length} suspicious pattern matches!`);
    console.warn(JSON.stringify(violations, null, 2));
  }

  console.log("\n==========================================================================");
}

securityCheck().catch(console.error);
