import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * POST /api/ai/matching
 *
 * Returns ranked designer recommendations based on the customer's design brief/tags.
 * Uses a transparent weighted scoring algorithm — NOT fake ML accuracy claims.
 *
 * Body: {
 *   garment_type?: string,
 *   specialty?: string,
 *   budget_max?: number,
 *   tags?: string[],
 *   location?: string,
 * }
 *
 * Returns: {
 *   matches: {
 *     tailor_id: string,
 *     name: string,
 *     specialty: string,
 *     avg_rating: number,
 *     location: string,
 *     starting_price: number,
 *     experience_years: number,
 *     availability_status: string,
 *     match_score: number,           -- 0–100
 *     match_reasons: string[],
 *   }[]
 * }
 */

// Specialty keyword mapping
const SPECIALTY_MAP: Record<string, string[]> = {
  "Bridal Couture":    ["bridal", "wedding", "bride", "lehenga", "trousseau"],
  "Luxury Sarees":     ["saree", "sari", "silk", "banarasi", "kanjivaram", "drape"],
  "Designer Blouses":  ["blouse", "choli", "crop top"],
  "Anarkalis":         ["anarkali", "salwar", "ethnic", "churidar"],
  "Western Dresses":   ["dress", "gown", "western", "indo-western", "fusion"],
  "Party Wear":        ["party", "celebration", "cocktail", "evening"],
  "Formal Wear":       ["formal", "office", "corporate", "professional"],
  "Menswear":          ["suit", "men", "shirt", "trouser"],
  "Blazers":           ["blazer", "jacket", "coat"],
  "Sherwanis":         ["sherwani", "groom", "bandhgala", "achkan"],
  "Kids Wear":         ["kids", "children", "toddler", "baby"],
  "Ethnic Wear":       ["ethnic", "kurta", "kurti", "traditional"],
  "Half Sarees":       ["half saree", "langa voni", "pattu"],
  "Custom Embroidery": ["embroidery", "zardozi", "zari", "work"],
  "Boutique Tailoring": ["bespoke", "custom", "tailored"],
}

function computeMatchScore(
  tailor: {
    specialty: string[] | null
    avg_rating: number | null
    starting_price: number | null
    experience_years: number | null
    availability_status: string | null
    location: string | null
  },
  request: {
    garment_type?: string
    specialty?: string
    budget_max?: number
    tags?: string[]
    location?: string
  }
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  const tagText = [
    request.garment_type ?? "",
    request.specialty    ?? "",
    ...(request.tags     ?? []),
  ].join(" ").toLowerCase()

  const tailorSpecialties = tailor.specialty ?? []

  // ── 1. Specialty match (up to 40 pts) ─────────────────────────────
  let specialtyScore = 0
  for (const spec of tailorSpecialties) {
    const keywords = SPECIALTY_MAP[spec] ?? []
    const matchCount = keywords.filter((kw) => tagText.includes(kw)).length
    if (matchCount > 0) {
      const pts = Math.min(40, matchCount * 12)
      if (pts > specialtyScore) specialtyScore = pts
    }
  }
  if (specialtyScore > 0) {
    score += specialtyScore
    reasons.push(`Specializes in ${tailorSpecialties[0] ?? "your requested style"}`)
  }

  // ── 2. Rating (up to 20 pts) ────────────────────────────────────────
  const rating = tailor.avg_rating ?? 4.5
  if (rating >= 4.8) {
    score += 20
    reasons.push(`Top-rated designer (${rating.toFixed(1)}★)`)
  } else if (rating >= 4.5) {
    score += 14
    reasons.push(`Highly rated (${rating.toFixed(1)}★)`)
  } else if (rating >= 4.0) {
    score += 8
  }

  // ── 3. Budget match (up to 20 pts) ──────────────────────────────────
  if (request.budget_max && tailor.starting_price !== null) {
    if (tailor.starting_price <= request.budget_max) {
      score += 20
      reasons.push(`Starting price within your budget (₹${tailor.starting_price.toLocaleString("en-IN")})`)
    } else if (tailor.starting_price <= request.budget_max * 1.3) {
      score += 10
      reasons.push("Slightly above budget but may accommodate")
    }
  } else {
    score += 10 // neutral if no budget specified
  }

  // ── 4. Experience (up to 10 pts) ────────────────────────────────────
  const exp = tailor.experience_years ?? 5
  if (exp >= 10) {
    score += 10
    reasons.push(`${exp}+ years of experience`)
  } else if (exp >= 5) {
    score += 6
  } else {
    score += 3
  }

  // ── 5. Availability (up to 10 pts) ──────────────────────────────────
  const avail = tailor.availability_status ?? "accepting_orders"
  if (avail === "accepting_orders") {
    score += 10
    reasons.push("Currently accepting new orders")
  } else if (avail === "limited_availability") {
    score += 5
    reasons.push("Limited availability — book soon")
  }

  // Clamp to 100
  score = Math.min(100, Math.round(score))

  return { score, reasons: reasons.slice(0, 3) }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const body = await request.json().catch(() => ({}))
    const { garment_type, specialty, budget_max, tags, location } = body

    // Fetch verified tailors with availability
    let query = supabase
      .from("tailor_profiles")
      .select(`
        user_id,
        avg_rating,
        starting_price,
        experience_years,
        availability_status,
        specialty,
        location,
        users!tailor_profiles_user_id_fkey (id, name)
      `)
      .eq("verification_status", "approved")
      .neq("availability_status", "on_leave")
      .order("avg_rating", { ascending: false })
      .limit(50)

    const { data: tailors, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Score and rank each tailor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matches = (tailors || []).map((tailor: any) => {
      const { score, reasons } = computeMatchScore(tailor, {
        garment_type,
        specialty,
        budget_max: budget_max ? Number(budget_max) : undefined,
        tags:       tags ?? [],
        location,
      })

      return {
        tailor_id:           tailor.user_id,
        name:                tailor.users?.name ?? "Verified Designer",
        specialty:           (tailor.specialty ?? [])[0] ?? "Custom Tailoring",
        avg_rating:          tailor.avg_rating ?? 4.5,
        location:            tailor.location ?? "India",
        starting_price:      tailor.starting_price ?? 0,
        experience_years:    tailor.experience_years ?? 0,
        availability_status: tailor.availability_status ?? "accepting_orders",
        match_score:         score,
        match_reasons:       reasons,
      }
    })
    .filter((m) => m.match_score >= 10)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 8)

    return NextResponse.json({
      success: true,
      matches,
      scoring_note: "Match scores are based on specialty alignment, rating, budget compatibility, and experience. This is a rule-based ranking, not an ML model.",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
