/**
 * Controlled Threadify Color Vocabulary (28 curated fashion colors)
 * Extracts dominant primary & secondary colors from raw garment pixels.
 */

export interface ColorDefinition {
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

export const CONTROLLED_COLOR_PALETTE: ColorDefinition[] = [
  { name: "Red", hex: "#D32F2F", r: 211, g: 47, b: 47 },
  { name: "Maroon", hex: "#800000", r: 128, g: 0, b: 0 },
  { name: "Pink", hex: "#FFC0CB", r: 255, g: 192, b: 203 },
  { name: "Rose", hex: "#E91E63", r: 233, g: 30, b: 99 },
  { name: "Magenta", hex: "#FF00FF", r: 255, g: 0, b: 255 },
  { name: "Orange", hex: "#FF9800", r: 255, g: 152, b: 0 },
  { name: "Peach", hex: "#FFDAB9", r: 255, g: 218, b: 185 },
  { name: "Yellow", hex: "#FFEB3B", r: 255, g: 235, b: 59 },
  { name: "Mustard", hex: "#FFC107", r: 255, g: 193, b: 7 },
  { name: "Gold", hex: "#D4AF37", r: 212, g: 175, b: 55 },
  { name: "Cream", hex: "#FFFDD0", r: 255, g: 253, b: 208 },
  { name: "Beige", hex: "#F5F5DC", r: 245, g: 245, b: 220 },
  { name: "White", hex: "#FFFFFF", r: 255, g: 255, b: 255 },
  { name: "Black", hex: "#1A1A1A", r: 26, g: 26, b: 26 },
  { name: "Grey", hex: "#9E9E9E", r: 158, g: 158, b: 158 },
  { name: "Silver", hex: "#C0C0C0", r: 192, g: 192, b: 192 },
  { name: "Brown", hex: "#795548", r: 121, g: 85, b: 72 },
  { name: "Tan", hex: "#D2B48C", r: 210, g: 180, b: 140 },
  { name: "Green", hex: "#4CAF50", r: 76, g: 175, b: 80 },
  { name: "Olive", hex: "#808000", r: 128, g: 128, b: 0 },
  { name: "Mint", hex: "#98FF98", r: 152, g: 255, b: 152 },
  { name: "Teal", hex: "#008080", r: 0, g: 128, b: 128 },
  { name: "Cyan", hex: "#00BCD4", r: 0, g: 188, b: 212 },
  { name: "Sky Blue", hex: "#87CEEB", r: 135, g: 206, b: 235 },
  { name: "Royal Blue", hex: "#4169E1", r: 65, g: 105, b: 225 },
  { name: "Navy Blue", hex: "#000080", r: 0, g: 0, b: 128 },
  { name: "Purple", hex: "#9C27B0", r: 156, g: 39, b: 176 },
  { name: "Lavender", hex: "#E6E6FA", r: 230, g: 230, b: 250 },
];

/**
 * Matches an RGB triple to the closest color name in the controlled Threadify vocabulary
 */
export function matchColorRGB(r: number, g: number, b: number): { name: string; hex: string; confidence: number } {
  let closestName = "White";
  let minDistance = Infinity;
  let matchedHex = "#FFFFFF";

  for (const c of CONTROLLED_COLOR_PALETTE) {
    // Weighted Euclidean distance for human perception (redmean formula)
    const rmean = (r + c.r) / 2;
    const dr = r - c.r;
    const dg = g - c.g;
    const db = b - c.b;
    const dist = Math.sqrt(
      (((512 + rmean) * dr * dr) >> 8) +
      4 * dg * dg +
      (((767 - rmean) * db * db) >> 8)
    );

    if (dist < minDistance) {
      minDistance = dist;
      closestName = c.name;
      matchedHex = c.hex;
    }
  }

  const confidence = Math.max(0.6, Math.min(0.98, 1 - minDistance / 400));
  return { name: closestName, hex: matchedHex, confidence: Math.round(confidence * 100) / 100 };
}

/**
 * Extracts the dominant primary and optional secondary accent color from raw pixel buffers
 */
export function extractDominantColorsFromPixels(
  pixelData: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: number = 4
): string[] {
  if (!pixelData || pixelData.length === 0 || width <= 0 || height <= 0) {
    return [];
  }

  const colorCounts: Record<string, number> = {};
  let totalValidSamples = 0;

  // Sample the inner 80% box to focus on the garment rather than extreme borders
  const startX = Math.floor(width * 0.1);
  const endX = Math.floor(width * 0.9);
  const startY = Math.floor(height * 0.1);
  const endY = Math.floor(height * 0.9);
  const step = Math.max(1, Math.floor((endX - startX) * (endY - startY) / 1500)); // Sample ~1500 pixels

  for (let y = startY; y < endY; y += Math.max(1, Math.floor(Math.sqrt(step)))) {
    for (let x = startX; x < endX; x += Math.max(1, Math.floor(Math.sqrt(step)))) {
      const idx = (y * width + x) * channels;
      const r = pixelData[idx];
      const g = pixelData[idx + 1];
      const b = pixelData[idx + 2];
      const a = channels >= 4 ? pixelData[idx + 3] : 255;

      // Skip fully transparent pixels
      if (a < 50) continue;

      // Skip solid pure white studio backgrounds (e.g. r,g,b > 248) unless the whole garment is white
      const isExtremeWhite = r > 248 && g > 248 && b > 248;
      
      const matched = matchColorRGB(r, g, b);
      // Deprioritize background white slightly if other vibrant colors exist
      const weight = isExtremeWhite ? 0.4 : 1.0;
      colorCounts[matched.name] = (colorCounts[matched.name] || 0) + weight;
      totalValidSamples += weight;
    }
  }

  if (totalValidSamples === 0) return [];

  // Sort colors by frequency
  const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return [];

  const dominant1 = sorted[0];
  const results: string[] = [dominant1[0]];

  // If a secondary color has at least 22% presence and is distinct from the primary color
  if (sorted.length > 1) {
    const dominant2 = sorted[1];
    const ratio2 = dominant2[1] / totalValidSamples;
    if (ratio2 >= 0.22 && dominant2[0] !== dominant1[0]) {
      results.push(dominant2[0]);
    }
  }

  return results;
}
