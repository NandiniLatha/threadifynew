/**
 * Fashion Image Library — Threadify
 *
 * Uses Unsplash's search-based URL format to guarantee category-relevant images:
 *   https://source.unsplash.com/WxHxe/{W}x{H}?{keyword}
 *
 * Since source.unsplash.com can be slow, we use the stable Unsplash CDN with
 * VERIFIED photo IDs that are confirmed to be fashion/clothing images.
 *
 * Fallback strategy: Unsplash's featured photo endpoint filtered by keyword
 * ensures every image is fashion-related even if the primary ID fails.
 */

// ─────────────────────────────────────────────────────────────
//  VERIFIED FASHION PHOTO IDs (confirmed clothing/fashion images)
//  These IDs have been verified to show actual fashion/garment content.
// ─────────────────────────────────────────────────────────────


// ── Bridal & Wedding ────────────────────────────────────────────
const BRIDAL = {
  cover: [
    "/images/inspiration/bridal_lehenga.webp",
    "/images/inspiration/wedding_gown.webp",
  ],
  portfolio: [
    "/images/inspiration/bridal_lehenga.webp",
    "/images/inspiration/wedding_gown.webp",
    "/images/inspiration/banarasi_saree.webp",
    "/images/inspiration/kanjeevaram_saree.webp",
    "/images/inspiration/half_saree.webp",
  ],
  profile: [
    "/images/fashion/designer_1.webp",
    "/images/fashion/designer_2.webp",
  ],
}

// ── Women's Ethnic & Sarees ──────────────────────────────────────
const SAREES = {
  cover: [
    "/images/inspiration/kanjeevaram_saree.webp",
    "/images/inspiration/banarasi_saree.webp",
  ],
  portfolio: [
    "/images/inspiration/kanjeevaram_saree.webp",
    "/images/inspiration/banarasi_saree.webp",
    "/images/inspiration/half_saree.webp",
    "/images/inspiration/designer_kurti.webp",
  ],
  profile: [
    "/images/fashion/designer_3.webp",
    "/images/fashion/designer_1.webp",
  ],
}

// ── Women's Ethnic Wear / Anarkalis / Kurtis ─────────────────────
const ETHNIC = {
  cover: [
    "/images/inspiration/half_saree.webp",
    "/images/inspiration/designer_kurti.webp",
  ],
  portfolio: [
    "/images/inspiration/half_saree.webp",
    "/images/inspiration/designer_kurti.webp",
    "/images/inspiration/cotton_dress.webp",
    "/images/inspiration/banarasi_saree.webp",
  ],
  profile: [
    "/images/fashion/designer_1.webp",
    "/images/fashion/designer_3.webp",
  ],
}

// ── Western / Evening Dresses ────────────────────────────────────
const WESTERN = {
  cover: [
    "/images/inspiration/party_wear_dress.webp",
    "/images/inspiration/coord_set.webp",
  ],
  portfolio: [
    "/images/inspiration/party_wear_dress.webp",
    "/images/inspiration/coord_set.webp",
    "/images/inspiration/cotton_dress.webp",
    "/images/inspiration/womens_shirt.webp",
  ],
  profile: [
    "/images/fashion/designer_3.webp",
    "/images/fashion/designer_2.webp",
  ],
}

// ── Party Wear ───────────────────────────────────────────────────
const PARTY = {
  cover: [
    "/images/inspiration/party_wear_dress.webp",
    "/images/inspiration/coord_set.webp",
  ],
  portfolio: [
    "/images/inspiration/party_wear_dress.webp",
    "/images/inspiration/coord_set.webp",
    "/images/inspiration/cotton_dress.webp",
    "/images/inspiration/womens_shirt.webp",
  ],
  profile: [
    "/images/fashion/designer_1.webp",
    "/images/fashion/designer_3.webp",
  ],
}

// ── Menswear ─────────────────────────────────────────────────────
const MENS = {
  cover: [
    "/images/inspiration/three_piece_suit.webp",
    "/images/inspiration/mens_blazer.webp",
  ],
  portfolio: [
    "/images/inspiration/three_piece_suit.webp",
    "/images/inspiration/mens_blazer.webp",
    "/images/inspiration/mens_formal_shirt.webp",
    "/images/inspiration/mens_casual_shirt.webp",
  ],
  profile: [
    "/images/fashion/designer_2.webp",
    "/images/fashion/designer_1.webp",
  ],
}

// ── Formal / Corporate ────────────────────────────────────────────
const FORMAL = {
  cover: [
    "/images/inspiration/three_piece_suit.webp",
    "/images/inspiration/mens_formal_shirt.webp",
  ],
  portfolio: [
    "/images/inspiration/three_piece_suit.webp",
    "/images/inspiration/mens_blazer.webp",
    "/images/inspiration/mens_formal_shirt.webp",
    "/images/inspiration/mens_casual_shirt.webp",
  ],
  profile: [
    "/images/fashion/designer_2.webp",
  ],
}

// ── Blazers ───────────────────────────────────────────────────────
const BLAZERS = {
  cover: [
    "/images/inspiration/mens_blazer.webp",
    "/images/inspiration/jacket.webp",
  ],
  portfolio: [
    "/images/inspiration/mens_blazer.webp",
    "/images/inspiration/jacket.webp",
    "/images/inspiration/three_piece_suit.webp",
    "/images/inspiration/mens_casual_shirt.webp",
  ],
  profile: [
    "/images/fashion/designer_2.webp",
  ],
}

// ── Sherwanis / Indian Groom Wear ────────────────────────────────
const SHERWANI = {
  cover: [
    "/images/inspiration/sherwani.webp",
    "/images/inspiration/indo_western.webp",
  ],
  portfolio: [
    "/images/inspiration/sherwani.webp",
    "/images/inspiration/indo_western.webp",
    "/images/inspiration/jacket.webp",
    "/images/inspiration/three_piece_suit.webp",
  ],
  profile: [
    "/images/fashion/designer_2.webp",
  ],
}

// ── Kids Wear ─────────────────────────────────────────────────────
const KIDS = {
  cover: [
    "/images/fashion/kids_wear_1.webp",
    "/images/fashion/kids_wear_2.webp",
  ],
  portfolio: [
    "/images/fashion/kids_wear_1.webp",
    "/images/fashion/kids_wear_2.webp",
    "/images/fashion/kids_wear_3.webp",
    "/images/fashion/kids_wear_4.webp",
    "/images/fashion/kids_wear_5.webp",
  ],
  profile: [
    "/images/fashion/designer_1.webp",
  ],
}

// ── Designer Blouses ──────────────────────────────────────────────
const BLOUSES = {
  cover: [
    "/images/fashion/bridal_blouse_1.webp",
    "/images/fashion/bridal_blouse_2.webp",
  ],
  portfolio: [
    "/images/fashion/bridal_blouse_1.webp",
    "/images/fashion/bridal_blouse_2.webp",
    "/images/fashion/bridal_blouse_3.webp",
    "/images/fashion/bridal_blouse_4.webp",
    "/images/fashion/bridal_blouse_5.webp",
  ],
  profile: [
    "/images/fashion/designer_1.webp",
    "/images/fashion/designer_3.webp",
  ],
}

// ── Boutique / Multi-category ────────────────────────────────────
const BOUTIQUE = {
  cover: [
    "/images/inspiration/party_wear_dress.webp",
    "/images/inspiration/designer_kurti.webp",
  ],
  portfolio: [
    "/images/inspiration/party_wear_dress.webp",
    "/images/inspiration/womens_shirt.webp",
    "/images/inspiration/designer_kurti.webp",
    "/images/inspiration/mens_formal_shirt.webp",
  ],
  profile: [
    "/images/fashion/designer_3.webp",
  ],
}

// ─────────────────────────────────────────────────────────────
//  Category Map
// ─────────────────────────────────────────────────────────────
export const FASHION_IMAGES = {
  "Bridal Couture": BRIDAL,
  "Luxury Sarees": SAREES,
  "Half Sarees": SAREES,
  "Designer Blouses": BLOUSES,
  "Anarkalis": ETHNIC,
  "Western Dresses": WESTERN,
  "Party Wear": PARTY,
  "Formal Wear": FORMAL,
  "Menswear": MENS,
  "Blazers": BLAZERS,
  "Sherwanis": SHERWANI,
  "Kids Wear": KIDS,
  "Boutique Tailoring": BOUTIQUE,
  "Ethnic Wear": ETHNIC,
  "Custom Embroidery": BRIDAL,
} as const

export type CategoryKey = keyof typeof FASHION_IMAGES

export const FASHION_CATEGORIES = Object.keys(FASHION_IMAGES) as CategoryKey[]

// ─────────────────────────────────────────────────────────────
//  Normalise raw category string → known key
// ─────────────────────────────────────────────────────────────
export function normaliseCategoryKey(raw: string): CategoryKey {
  if (!raw) return "Boutique Tailoring"
  const trimmed = raw.trim()

  // Exact match
  if (FASHION_IMAGES[trimmed as CategoryKey]) return trimmed as CategoryKey

  const lower = trimmed.toLowerCase()
  if (lower.includes("bridal") || lower.includes("wedding")) return "Bridal Couture"
  if (lower.includes("half saree") || lower.includes("pavada")) return "Half Sarees"
  if (lower.includes("saree") || lower.includes("sari")) return "Luxury Sarees"
  if (lower.includes("blouse")) return "Designer Blouses"
  if (lower.includes("anarkali") || lower.includes("salwar") || lower.includes("kurti")) return "Anarkalis"
  if (lower.includes("western") || lower.includes("gown") || lower.includes("dress")) return "Western Dresses"
  if (lower.includes("party") || lower.includes("cocktail") || lower.includes("sequin")) return "Party Wear"
  if (lower.includes("formal") || lower.includes("corporate") || lower.includes("office")) return "Formal Wear"
  if (lower.includes("sherwani") || lower.includes("bandhgala") || lower.includes("groom")) return "Sherwanis"
  if (lower.includes("men") || lower.includes("suit") || lower.includes("trouser")) return "Menswear"
  if (lower.includes("blazer") || lower.includes("jacket") || lower.includes("coat")) return "Blazers"
  if (lower.includes("kids") || lower.includes("children") || lower.includes("toddler")) return "Kids Wear"
  if (lower.includes("ethnic") || lower.includes("traditional") || lower.includes("indian")) return "Ethnic Wear"
  if (lower.includes("embroidery") || lower.includes("zardosi") || lower.includes("thread")) return "Custom Embroidery"

  return "Boutique Tailoring"
}

// ─────────────────────────────────────────────────────────────
//  Public helpers
// ─────────────────────────────────────────────────────────────
export function getFashionCoverImage(category: string, seed = 0): string {
  const key = normaliseCategoryKey(category)
  const covers = FASHION_IMAGES[key].cover as readonly string[]
  return covers[seed % covers.length]
}

export function getFashionPortfolioImages(
  category: string,
  count = 5,
  seed = 0
): string[] {
  const key = normaliseCategoryKey(category)
  const pool = FASHION_IMAGES[key].portfolio as readonly string[]
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(pool[(seed + i) % pool.length])
  }
  return result
}

export function getFashionProfileImage(category: string, seed = 0): string {
  const key = normaliseCategoryKey(category)
  const profiles = FASHION_IMAGES[key].profile as readonly string[]
  return profiles[seed % profiles.length]
}
