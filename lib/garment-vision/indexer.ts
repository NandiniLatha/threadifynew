import fs from "fs";
import path from "path";
import { GarmentRecord, GarmentIndexCache } from "./types";
import { importGarmentDataset } from "./importer";

class GarmentVisionIndex {
  private records: GarmentRecord[] = [];
  private categoryMap = new Map<string, GarmentRecord[]>();
  private subCategoryMap = new Map<string, GarmentRecord[]>();
  private articleTypeMap = new Map<string, GarmentRecord[]>();
  private colourMap = new Map<string, GarmentRecord[]>();
  private genderMap = new Map<string, GarmentRecord[]>();
  private tagInvertedMap = new Map<string, GarmentRecord[]>();
  private isInitialized = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    let cache: GarmentIndexCache | null = null;
    const projectRoot = process.cwd();
    const cachePath = path.join(projectRoot, "lib", "garment-vision", "garment-index.json");

    if (fs.existsSync(cachePath)) {
      try {
        const raw = fs.readFileSync(cachePath, "utf-8");
        cache = JSON.parse(raw) as GarmentIndexCache;
      } catch {
        cache = null;
      }
    }

    if (!cache || !cache.records || cache.records.length === 0) {
      cache = await importGarmentDataset();
    }

    this.buildIndexes(cache.records);
    this.isInitialized = true;
  }

  private buildIndexes(records: GarmentRecord[]): void {
    this.records = records;
    this.categoryMap.clear();
    this.subCategoryMap.clear();
    this.articleTypeMap.clear();
    this.colourMap.clear();
    this.genderMap.clear();
    this.tagInvertedMap.clear();

    for (const rec of records) {
      this.addToMap(this.categoryMap, rec.masterCategory.toLowerCase(), rec);
      this.addToMap(this.subCategoryMap, rec.subCategory.toLowerCase(), rec);
      this.addToMap(this.articleTypeMap, rec.articleType.toLowerCase(), rec);
      this.addToMap(this.colourMap, rec.baseColour.toLowerCase(), rec);
      this.addToMap(this.genderMap, rec.gender.toLowerCase(), rec);

      for (const tag of rec.tags) {
        const words = tag.toLowerCase().split(/\s+/);
        for (const w of words) {
          if (w.length > 2) {
            this.addToMap(this.tagInvertedMap, w, rec);
          }
        }
      }
    }
  }

  private addToMap(map: Map<string, GarmentRecord[]>, key: string, record: GarmentRecord): void {
    if (!key) return;
    const existing = map.get(key) || [];
    existing.push(record);
    map.set(key, existing);
  }

  public getAllRecords(): GarmentRecord[] {
    return this.records;
  }

  public getByArticleType(articleType: string): GarmentRecord[] {
    return this.articleTypeMap.get(articleType.toLowerCase()) || [];
  }

  public getBySubCategory(subCategory: string): GarmentRecord[] {
    return this.subCategoryMap.get(subCategory.toLowerCase()) || [];
  }

  public getByColour(colour: string): GarmentRecord[] {
    return this.colourMap.get(colour.toLowerCase()) || [];
  }

  public searchByKeywords(keywords: string[]): GarmentRecord[] {
    const scoreMap = new Map<string, { record: GarmentRecord; score: number }>();

    for (const kw of keywords) {
      const term = kw.toLowerCase().trim();
      if (!term || term.length < 2) continue;

      const matches = this.tagInvertedMap.get(term) || [];
      for (const rec of matches) {
        const existing = scoreMap.get(rec.id) || { record: rec, score: 0 };
        existing.score += 1;
        scoreMap.set(rec.id, existing);
      }
    }

    return Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .map((item) => item.record);
  }
}

export const garmentIndex = new GarmentVisionIndex();
