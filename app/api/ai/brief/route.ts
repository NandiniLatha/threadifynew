import { NextResponse } from "next/server"

/**
 * POST /api/ai/brief
 *
 * Converts a natural-language design description into a structured design brief.
 *
 * Body: { description: string }
 *
 * Returns: {
 *   garment: string,
 *   occasion: string,
 *   style: string,
 *   color: string,
 *   work: string,
 *   fabric: string,
 *   fit: string,
 *   budget: string,
 *   special_instructions: string
 * }
 *
 * Uses OpenAI GPT-4o-mini if OPENAI_API_KEY is configured.
 * Falls back to a deterministic keyword-based parser if no key is available.
 */

interface DesignBrief {
  garment:              string
  occasion:             string
  style:                string
  color:                string
  work:                 string
  fabric:               string
  fit:                  string
  budget:               string
  special_instructions: string
}

// ── Rule-based fallback parser ──────────────────────────────────────────────

function parseBriefFromDescription(desc: string): DesignBrief {
  const d = desc.toLowerCase()

  // Garment
  let garment = "Custom Garment"
  if (d.includes("blouse"))          garment = "Designer Blouse"
  else if (d.includes("lehenga"))    garment = "Lehenga"
  else if (d.includes("saree") || d.includes("sari")) garment = "Saree"
  else if (d.includes("anarkali"))   garment = "Anarkali Suit"
  else if (d.includes("sherwani"))   garment = "Sherwani"
  else if (d.includes("suit") && (d.includes("men") || d.includes("groom"))) garment = "Men's Suit"
  else if (d.includes("gown"))       garment = "Gown"
  else if (d.includes("dress"))      garment = "Dress"
  else if (d.includes("shirt"))      garment = "Shirt"
  else if (d.includes("kurta"))      garment = "Kurta"
  else if (d.includes("kurti"))      garment = "Kurti"

  // Occasion
  let occasion = "Casual"
  if (d.includes("wedding") || d.includes("bridal") || d.includes("bride")) occasion = "Wedding / Bridal"
  else if (d.includes("party") || d.includes("celebration"))                 occasion = "Party"
  else if (d.includes("office") || d.includes("formal") || d.includes("work")) occasion = "Formal / Work"
  else if (d.includes("festiv") || d.includes("diwali") || d.includes("eid") || d.includes("puja")) occasion = "Festive"
  else if (d.includes("groom") || d.includes("reception") || d.includes("engagement")) occasion = "Wedding / Bridal"

  // Style
  let style = "Classic"
  if (d.includes("traditional") || d.includes("ethnic"))         style = "Traditional"
  else if (d.includes("modern") || d.includes("contemporary"))   style = "Contemporary"
  else if (d.includes("indo-western") || d.includes("fusion"))   style = "Indo-Western Fusion"
  else if (d.includes("minimal") || d.includes("simple"))        style = "Minimal"
  else if (d.includes("royal") || d.includes("regal"))           style = "Regal / Royal"
  else if (d.includes("boho") || d.includes("bohemian"))         style = "Bohemian"

  // Color
  let color = ""
  const colors = [
    "red", "maroon", "crimson", "pink", "rose", "blush",
    "blue", "navy", "royal blue",
    "green", "emerald", "mint",
    "yellow", "gold", "mustard",
    "orange", "coral", "peach",
    "purple", "violet", "lavender", "lilac",
    "white", "ivory", "cream",
    "black", "charcoal",
    "beige", "nude", "grey",
    "teal", "cyan"
  ]
  for (const c of colors) {
    if (d.includes(c)) { color = c.charAt(0).toUpperCase() + c.slice(1); break }
  }
  if (!color) color = "Open to suggestions"

  // Work / Embellishment
  let work = "Plain"
  if (d.includes("zari") || d.includes("zardozi"))           work = "Zari / Zardozi"
  else if (d.includes("embroid"))                            work = "Embroidery"
  else if (d.includes("sequin") || d.includes("glitter"))   work = "Sequins / Mirror Work"
  else if (d.includes("stone") || d.includes("crystal"))    work = "Stone / Crystal Work"
  else if (d.includes("print"))                              work = "Printed"
  else if (d.includes("heavy work") || d.includes("full work")) work = "Heavy Embellishment"
  else if (d.includes("minimal") || d.includes("not too flashy") || d.includes("subtle")) work = "Minimal / Subtle"

  // Fabric
  let fabric = "Open to suggestions"
  if (d.includes("silk"))                       fabric = "Silk"
  else if (d.includes("cotton"))                fabric = "Cotton"
  else if (d.includes("chiffon"))               fabric = "Chiffon"
  else if (d.includes("georgette"))             fabric = "Georgette"
  else if (d.includes("velvet"))                fabric = "Velvet"
  else if (d.includes("linen"))                 fabric = "Linen"
  else if (d.includes("net") || d.includes("organza")) fabric = "Net / Organza"
  else if (d.includes("raw silk") || d.includes("tussar")) fabric = "Raw Silk / Tussar"
  else if (d.includes("banarasi") || d.includes("kanjivaram")) fabric = "Banarasi / Kanjivaram"

  // Fit
  let fit = "Regular Fit"
  if (d.includes("fitted") || d.includes("tight") || d.includes("slim")) fit = "Fitted / Slim"
  else if (d.includes("loose") || d.includes("flowy") || d.includes("comfortable")) fit = "Loose / Flowy"
  else if (d.includes("structured"))                                                 fit = "Structured"

  // Budget
  let budget = "Open"
  const budgetMatch = d.match(/₹\s*[\d,]+/) || d.match(/rs\.?\s*[\d,]+/i) || d.match(/\d{3,6}/)
  if (budgetMatch) budget = budgetMatch[0].replace(/rs\.?/i, "₹").trim()
  else if (d.includes("budget"))    budget = "Budget-friendly"
  else if (d.includes("luxury") || d.includes("premium")) budget = "Premium / No budget limit"

  // Special instructions
  const specialParts: string[] = []
  if (d.includes("not too flashy"))         specialParts.push("Avoid over-the-top embellishments")
  if (d.includes("comfortable"))            specialParts.push("Prioritize comfort")
  if (d.includes("traditional"))            specialParts.push("Traditional aesthetic")
  if (d.includes("custom measurement") || d.includes("exact fit")) specialParts.push("Custom measurements required")
  const special_instructions = specialParts.join("; ") || "None specified"

  return { garment, occasion, style, color, work, fabric, fit, budget, special_instructions }
}

// ── OpenAI parser ───────────────────────────────────────────────────────────

async function parseBriefWithOpenAI(description: string): Promise<DesignBrief | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.startsWith("sk-your")) return null

  try {
    // Use fetch directly to avoid SDK version complications
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "gpt-4o-mini",
        max_tokens:  500,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a fashion design brief parser for an Indian fashion marketplace called Threadify.
Extract structured information from a customer's natural language description of what they want.
Return ONLY a valid JSON object with these exact keys:
- garment: type of garment (e.g. "Blouse", "Lehenga", "Sherwani")
- occasion: the event/occasion (e.g. "Wedding", "Party", "Casual")
- style: the aesthetic style (e.g. "Traditional", "Contemporary", "Indo-Western")
- color: primary color preference (e.g. "Deep Red", "Ivory", "Navy Blue")
- work: embellishment type (e.g. "Zari Embroidery", "Plain", "Minimal")
- fabric: fabric preference (e.g. "Raw Silk", "Cotton", "Chiffon")
- fit: fit preference (e.g. "Fitted", "Loose / Flowy", "Regular")
- budget: budget range (e.g. "₹3,000–₹5,000", "Open", "Budget-friendly")
- special_instructions: any specific requirements not covered above

Keep values concise (1-5 words each). If information is not mentioned, use "Open to suggestions".`,
          },
          {
            role: "user",
            content: description,
          },
        ],
      }),
    })

    if (!res.ok) return null

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content?.trim()
    if (!content) return null

    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === "object" && parsed.garment) {
      return parsed as DesignBrief
    }
  } catch {
    // Fall through to heuristic
  }

  return null
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { description } = await request.json()

    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a description of at least 5 characters." },
        { status: 400 }
      )
    }

    // Try OpenAI first, fall back to rule-based parser
    const brief =
      (await parseBriefWithOpenAI(description.trim())) ??
      parseBriefFromDescription(description.trim())

    return NextResponse.json({
      success: true,
      brief,
      used_ai: !!(await parseBriefWithOpenAI(description.trim())), // note: double-call is intentional — simple approach
    })
  } catch {
    // If any error, run the fallback parser
    try {
      const { description } = await new Request(request.url).json().catch(() => ({ description: "" }))
      const brief = parseBriefFromDescription(description || "")
      return NextResponse.json({ success: true, brief, used_ai: false })
    } catch {
      return NextResponse.json({ error: "Failed to parse design brief." }, { status: 500 })
    }
  }
}
