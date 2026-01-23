import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize harvest storage table
export const initHarvestStorageTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectionharveststorage (
        requestId INTEGER PRIMARY KEY,
        hasOwnStorage TEXT,
        ifNotHasFacilityAccess TEXT,
        hasPrimaryProcessingAccess TEXT,
        knowsValueAdditionTech TEXT,
        hasValueAddedMarketLinkage TEXT,
        awareOfQualityStandards TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    );
    console.log("✅ Harvest Storage table created/verified");
  } catch (error) {
    console.error("❌ Error initializing harvest storage table:", error);
    throw error;
  }
};

export interface HarvestStorageData {
  hasOwnStorage: "Yes" | "No" | undefined;
  ifNotHasFacilityAccess: "Yes" | "No" | undefined;
  hasPrimaryProcessingAccess: "Yes" | "No" | undefined;
  knowsValueAdditionTech: "Yes" | "No" | undefined;
  hasValueAddedMarketLinkage: "Yes" | "No" | undefined;
  awareOfQualityStandards: "Yes" | "No" | undefined;
}

// Helper to convert stored value to "Yes"/"No"
const toYesNo = (val: any): "Yes" | "No" | undefined => {
  if (val === null || val === undefined || val === "") return undefined;
  
  // Handle string values
  if (typeof val === "string") {
    if (val === "Yes" || val === "yes" || val === "1") return "Yes";
    if (val === "No" || val === "no" || val === "0") return "No";
  }
  
  // Handle numeric values
  if (val === 1 || val === true) return "Yes";
  if (val === 0 || val === false) return "No";
  
  return undefined;
};

// Save or update harvest storage info
export const saveHarvestStorageInfo = (
  requestId: number,
  data: Partial<HarvestStorageData>
): void => {
  try {
    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionharveststorage WHERE requestId = ?",
      [requestId]
    );

    // Prepare data for storage - store Yes/No as TEXT
    const storageData: any = { ...data };
    
    // Convert Yes/No to TEXT for storage
    if (data.hasOwnStorage !== undefined) {
      storageData.hasOwnStorage = data.hasOwnStorage;
    }
    if (data.ifNotHasFacilityAccess !== undefined) {
      storageData.ifNotHasFacilityAccess = data.ifNotHasFacilityAccess;
    }
    if (data.hasPrimaryProcessingAccess !== undefined) {
      storageData.hasPrimaryProcessingAccess = data.hasPrimaryProcessingAccess;
    }
    if (data.knowsValueAdditionTech !== undefined) {
      storageData.knowsValueAdditionTech = data.knowsValueAdditionTech;
    }
    if (data.hasValueAddedMarketLinkage !== undefined) {
      storageData.hasValueAddedMarketLinkage = data.hasValueAddedMarketLinkage;
    }
    if (data.awareOfQualityStandards !== undefined) {
      storageData.awareOfQualityStandards = data.awareOfQualityStandards;
    }

    if (existing) {
      // UPDATE existing record
      const fields = Object.keys(storageData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [
        ...Object.values(storageData),
        new Date().toISOString(),
        requestId,
      ];

      db.runSync(
        `UPDATE inspectionharveststorage SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams
      );
      console.log("✅ Harvest Storage info updated in SQLite");
    } else {
      // INSERT new record
      const fields = [
        "requestId",
        ...Object.keys(storageData),
        "createdAt",
        "updatedAt",
      ].join(", ");
      const placeholders = new Array(Object.keys(storageData).length + 3)
        .fill("?")
        .join(", ");
      const values = [
        requestId,
        ...Object.values(storageData),
        new Date().toISOString(),
        new Date().toISOString(),
      ];

      db.runSync(
        `INSERT INTO inspectionharveststorage (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams
      );
      console.log("✅ Harvest Storage info inserted into SQLite");
    }
  } catch (error) {
    console.error("❌ Error saving harvest storage info:", error);
    throw error;
  }
};

// Get harvest storage info
export const getHarvestStorageInfo = (
  requestId: number
): HarvestStorageData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionharveststorage WHERE requestId = ?",
      [requestId]
    );

    if (row) {
      console.log("✅ Raw SQLite data:", row);
      
      const result = {
        hasOwnStorage: toYesNo(row.hasOwnStorage),
        ifNotHasFacilityAccess: toYesNo(row.ifNotHasFacilityAccess),
        hasPrimaryProcessingAccess: toYesNo(row.hasPrimaryProcessingAccess),
        knowsValueAdditionTech: toYesNo(row.knowsValueAdditionTech),
        hasValueAddedMarketLinkage: toYesNo(row.hasValueAddedMarketLinkage),
        awareOfQualityStandards: toYesNo(row.awareOfQualityStandards),
      };
      
      console.log("✅ Parsed harvest storage info:", result);
      return result;
    }

    console.log("📭 No harvest storage info found in SQLite");
    return null;
  } catch (error) {
    console.error("❌ Error fetching harvest storage info:", error);
    return null;
  }
};

// Clear harvest storage info for a specific request
export const clearHarvestStorageInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionharveststorage WHERE requestId = ?", [
      requestId,
    ]);
    console.log("🗑️ Cleared harvest storage info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing harvest storage info:", error);
    throw error;
  }
};

// Get all harvest storage info records
export const getAllHarvestStorageInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionharveststorage ORDER BY updatedAt DESC"
    );
    return rows.map(row => ({
      ...row,
      hasOwnStorage: toYesNo(row.hasOwnStorage),
      ifNotHasFacilityAccess: toYesNo(row.ifNotHasFacilityAccess),
      hasPrimaryProcessingAccess: toYesNo(row.hasPrimaryProcessingAccess),
      knowsValueAdditionTech: toYesNo(row.knowsValueAdditionTech),
      hasValueAddedMarketLinkage: toYesNo(row.hasValueAddedMarketLinkage),
      awareOfQualityStandards: toYesNo(row.awareOfQualityStandards),
    }));
  } catch (error) {
    console.error("❌ Error fetching all harvest storage info:", error);
    return [];
  }
};