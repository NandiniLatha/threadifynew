import fs from "fs";
import path from "path";
import {
  GarmentRecord,
  RawDatasetStyle,
  GarmentIndexCache,
} from "./types";

// Blacklisted non-clothing categories as specified in requirements
const EXCLUDED_MASTER_CATEGORIES = new Set([
  "footwear",
  "accessories",
  "personal care",
  "free items",
]);

const EXCLUDED_SUB_CATEGORIES = new Set([
  "shoes",
  "watches",
  "sunglasses",
  "bags",
  "wallets",
  "belts",
  "jewellery",
  "jewelry",
  "cosmetics",
  "perfumes",
  "eyewear",
  "headwear",
  "socks",
  "shoe accessories",
  "bath and body",
  "beauty",
  "fragrance",
]);

const EXCLUDED_ARTICLE_TYPES = new Set([
  "shoes",
  "casual shoes",
  "formal shoes",
  "sports shoes",
  "sandals",
  "flip flops",
  "flats",
  "heels",
  "boots",
  "watches",
  "sunglasses",
  "backpacks",
  "handbags",
  "clutch",
  "duffel bag",
  "wallet",
  "belts",
  "earrings",
  "ring",
  "necklace",
  "bracelet",
  "bangles",
  "pendant",
  "lip balm",
  "lipstick",
  "perfume",
  "deodorant",
  "nail polish",
  "makeup",
  "socks",
]);

export function isClothingItem(
  masterCategory: string,
  subCategory: string,
  articleType: string
): boolean {
  const masterLower = (masterCategory || "").trim().toLowerCase();
  const subLower = (subCategory || "").trim().toLowerCase();
  const articleLower = (articleType || "").trim().toLowerCase();

  if (EXCLUDED_MASTER_CATEGORIES.has(masterLower)) {
    return false;
  }
  if (EXCLUDED_SUB_CATEGORIES.has(subLower)) {
    return false;
  }
  if (EXCLUDED_ARTICLE_TYPES.has(articleLower)) {
    return false;
  }

  for (const word of [
    "shoe",
    "watch",
    "sunglass",
    "bag",
    "wallet",
    "belt",
    "jewel",
    "earring",
    "ring",
    "cosmetic",
    "perfume",
    "deodorant",
    "sock",
  ]) {
    if (articleLower.includes(word)) {
      return false;
    }
  }

  return true;
}

function inferFabrics(articleType: string, season: string): string[] {
  const art = articleType.toLowerCase();
  const sea = season.toLowerCase();

  if (art.includes("saree") || art.includes("lehenga")) {
    return ["Silk", "Chiffon", "Georgette", "Organza", "Raw Silk"];
  }
  if (art.includes("kurta") || art.includes("kurti") || art.includes("suit")) {
    return ["Chanderi Silk", "Cotton Blend", "Mulmul", "Rayon", "Linen"];
  }
  if (art.includes("blazer") || art.includes("jacket") || art.includes("coat")) {
    return ["Wool Blend", "Tweed", "Linen Blend", "Velvet", "Structured Cotton"];
  }
  if (sea.includes("summer") || art.includes("tshirt") || art.includes("top")) {
    return ["100% Organic Cotton", "Linen", "Modal", "Viscose"];
  }
  if (sea.includes("winter")) {
    return ["Cashmere Wool", "Merino Wool", "Heavy Denim", "Fleece"];
  }
  return ["Premium Cotton", "Silk Blend", "Linen", "Crepe"];
}

function inferTailorRecommendation(articleType: string): string {
  const art = articleType.toLowerCase();
  if (art.includes("saree") || art.includes("lehenga") || art.includes("bridal")) {
    return "Master Ethnic Specialist & Zardozi Artisan";
  }
  if (art.includes("blazer") || art.includes("suit") || art.includes("tuxedo")) {
    return "Master Bespoke Suit Cutter";
  }
  if (art.includes("dress") || art.includes("gown") || art.includes("indo-western")) {
    return "Couture Fashion Designer Specialist";
  }
  if (art.includes("kurta") || art.includes("kurti") || art.includes("sherwani")) {
    return "Traditional Ethnic Atelier";
  }
  return "Bespoke Garment Craftsman";
}

function inferComplexityAndCost(articleType: string): {
  complexity: "Basic" | "Moderate" | "High" | "Bespoke Luxury";
  cost: { min: number; max: number; currency: string };
  delivery: { min: number; max: number };
} {
  const art = articleType.toLowerCase();
  if (art.includes("lehenga") || art.includes("sherwani") || art.includes("gown") || art.includes("bridal")) {
    return {
      complexity: "Bespoke Luxury",
      cost: { min: 12000, max: 45000, currency: "INR" },
      delivery: { min: 14, max: 28 },
    };
  }
  if (art.includes("blazer") || art.includes("suit") || art.includes("jacket") || art.includes("saree")) {
    return {
      complexity: "High",
      cost: { min: 4500, max: 14000, currency: "INR" },
      delivery: { min: 7, max: 14 },
    };
  }
  if (art.includes("kurta") || art.includes("kurti") || art.includes("dress") || art.includes("trousers")) {
    return {
      complexity: "Moderate",
      cost: { min: 1800, max: 4500, currency: "INR" },
      delivery: { min: 4, max: 7 },
    };
  }
  return {
    complexity: "Basic",
    cost: { min: 800, max: 2200, currency: "INR" },
    delivery: { min: 3, max: 5 },
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Main Dataset Importer
 */
export async function importGarmentDataset(
  customDatasetDir?: string
): Promise<GarmentIndexCache> {
  const projectRoot = process.cwd();
  const searchDirs = [
    customDatasetDir,
    path.join(projectRoot, "dataset"),
    path.join(projectRoot, "public", "dataset"),
    path.join(projectRoot, "public", "images"),
  ].filter(Boolean) as string[];

  let csvPath = "";
  let imagesDir = "";

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    // Check for styles.csv inside dir
    const candidates = [
      path.join(dir, "styles.csv"),
      path.join(dir, "styles.csv.csv"),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        csvPath = cand;
        break;
      }
    }

    const imgCand = path.join(dir, "images");
    if (fs.existsSync(imgCand)) {
      imagesDir = imgCand;
    }

    if (csvPath) break;
  }

  const records: GarmentRecord[] = [];
  const categoriesSet = new Set<string>();
  const subCategoriesSet = new Set<string>();
  const articleTypesSet = new Set<string>();
  let totalProcessed = 0;
  let ignoredNonClothingCount = 0;

  if (csvPath && fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/['"]/g, ""));
      const idIdx = headers.indexOf("id");
      const genderIdx = headers.indexOf("gender");
      const masterIdx = headers.indexOf("mastercategory");
      const subIdx = headers.indexOf("subcategory");
      const articleIdx = headers.indexOf("articletype");
      const colourIdx = headers.indexOf("basecolour");
      const seasonIdx = headers.indexOf("season");
      const usageIdx = headers.indexOf("usage");
      const nameIdx = headers.indexOf("productdisplayname");

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < 5) continue;

        totalProcessed++;

        const id = row[idIdx] || `item_${i}`;
        const gender = row[genderIdx] || "Unisex";
        const masterCategory = row[masterIdx] || "Apparel";
        const subCategory = row[subIdx] || "Topwear";
        const articleType = row[articleIdx] || "Garment";
        const baseColour = row[colourIdx] || "Multi";
        const season = row[seasonIdx] || "All Season";
        const usage = row[usageIdx] || "Casual";
        const productName = row[nameIdx] || `${gender} ${baseColour} ${articleType}`;

        if (!isClothingItem(masterCategory, subCategory, articleType)) {
          ignoredNonClothingCount++;
          continue;
        }

        categoriesSet.add(masterCategory);
        subCategoriesSet.add(subCategory);
        articleTypesSet.add(articleType);

        // Resolve image path
        let imagePath = `/images/${id}.jpg`;
        if (imagesDir) {
          const possibleFiles = [
            `${id}.jpg`,
            `${id}.jpeg`,
            `${id}.png`,
            `${id}.webp`,
          ];
          for (const f of possibleFiles) {
            if (fs.existsSync(path.join(imagesDir, f))) {
              imagePath = path.relative(path.join(projectRoot, "public"), path.join(imagesDir, f)).replace(/\\/g, "/");
              if (!imagePath.startsWith("/")) imagePath = "/" + imagePath;
              break;
            }
          }
        }

        const tags = Array.from(
          new Set([
            productName.toLowerCase(),
            articleType.toLowerCase(),
            subCategory.toLowerCase(),
            masterCategory.toLowerCase(),
            baseColour.toLowerCase(),
            gender.toLowerCase(),
            season.toLowerCase(),
            usage.toLowerCase(),
          ])
        );

        const { complexity, cost, delivery } = inferComplexityAndCost(articleType);

        records.push({
          id,
          imagePath,
          productName,
          gender,
          masterCategory,
          subCategory,
          articleType,
          baseColour,
          season,
          usage,
          tags,
          complexity,
          fabricRecommendations: inferFabrics(articleType, season),
          tailorRecommendations: [inferTailorRecommendation(articleType)],
          estimatedStitchingCost: cost,
          deliveryTimeDays: delivery,
        });
      }
    }
  }

  // Also auto-scan existing public/images/fashion and public/images/inspiration to include built-in Threadify luxury garments!
  const builtinDirs = [
    { dir: path.join(projectRoot, "public", "images", "inspiration"), category: "Inspiration Garment" },
    { dir: path.join(projectRoot, "public", "images", "fashion"), category: "Fashion Collection" },
  ];

  for (const { dir, category } of builtinDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (!/\.(png|jpg|jpeg|webp)$/i.test(f)) continue;
      totalProcessed++;
      const nameWithoutExt = f.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      const id = `builtin_${f.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const relPath = `/images/${path.basename(dir)}/${f}`;

      let gender = "Women";
      if (nameWithoutExt.includes("mens")) gender = "Men";
      if (nameWithoutExt.includes("kids")) gender = "Kids";

      let articleType = "Custom Garment";
      if (nameWithoutExt.includes("saree")) articleType = "Saree";
      else if (nameWithoutExt.includes("lehenga")) articleType = "Lehenga";
      else if (nameWithoutExt.includes("blazer")) articleType = "Blazer";
      else if (nameWithoutExt.includes("suit")) articleType = "Suit";
      else if (nameWithoutExt.includes("kurti")) articleType = "Kurti";
      else if (nameWithoutExt.includes("dress")) articleType = "Dress";
      else if (nameWithoutExt.includes("gown")) articleType = "Gown";
      else if (nameWithoutExt.includes("jacket")) articleType = "Jacket";
      else if (nameWithoutExt.includes("sherwani")) articleType = "Sherwani";

      const subCategory = category;
      const masterCategory = "Apparel";
      categoriesSet.add(masterCategory);
      subCategoriesSet.add(subCategory);
      articleTypesSet.add(articleType);

      const { complexity, cost, delivery } = inferComplexityAndCost(articleType);

      records.push({
        id,
        imagePath: relPath,
        productName: nameWithoutExt.toUpperCase(),
        gender,
        masterCategory,
        subCategory,
        articleType,
        baseColour: "Custom Palette",
        season: "All Season",
        usage: "Bespoke Couture",
        tags: [nameWithoutExt.toLowerCase(), articleType.toLowerCase(), gender.toLowerCase(), "bespoke", "custom"],
        complexity,
        fabricRecommendations: inferFabrics(articleType, "All Season"),
        tailorRecommendations: [inferTailorRecommendation(articleType)],
        estimatedStitchingCost: cost,
        deliveryTimeDays: delivery,
      });
    }
  }

  const cache: GarmentIndexCache = {
    totalProcessed,
    importedClothingCount: records.length,
    ignoredNonClothingCount,
    categoriesDetected: Array.from(categoriesSet),
    subCategoriesDetected: Array.from(subCategoriesSet),
    articleTypesDetected: Array.from(articleTypesSet),
    lastUpdated: new Date().toISOString(),
    records,
  };

  // Write index cache to file
  const cachePath = path.join(projectRoot, "lib", "garment-vision", "garment-index.json");
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");

  return cache;
}
