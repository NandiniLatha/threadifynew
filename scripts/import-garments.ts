import { importGarmentDataset } from "../lib/garment-vision/importer";

async function runImport() {
  console.log("===============================================");
  console.log("GARMENT VISION LIBRARY - DATASET IMPORTER");
  console.log("===============================================");
  console.log("Starting background dataset ingestion & indexing...\n");

  const startTime = Date.now();
  const cache = await importGarmentDataset();
  const duration = Date.now() - startTime;

  console.log("-----------------------------------------------");
  console.log("IMPORT COMPLETE");
  console.log("-----------------------------------------------");
  console.log(`• Total Dataset Entries Processed: ${cache.totalProcessed}`);
  console.log(`• Clothing Garments Imported     : ${cache.importedClothingCount}`);
  console.log(`• Non-Clothing Items Filtered Out: ${cache.ignoredNonClothingCount}`);
  console.log(`• Garment Categories Detected    : ${cache.categoriesDetected.length} (${cache.categoriesDetected.join(", ")})`);
  console.log(`• Sub-Categories Detected        : ${cache.subCategoriesDetected.length}`);
  console.log(`• Article Types Indexed          : ${cache.articleTypesDetected.length}`);
  console.log(`• Import Duration                : ${duration} ms`);
  console.log("-----------------------------------------------");
  console.log("Index cache saved to: lib/garment-vision/garment-index.json\n");
}

runImport().catch((err) => {
  console.error("Import failed with error:", err);
  process.exit(1);
});
