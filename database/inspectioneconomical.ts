import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize economical table
export const initEconomicalTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectioneconomical (
        requestId INTEGER PRIMARY KEY,
        isSuitaleSize TEXT,
        isFinanceResource TEXT,
        isAltRoutes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    console.log("✅ Economical table created/verified");
  } catch (error) {
    console.error("❌ Error initializing economical table:", error);
    throw error;
  }
};

export interface EconomicalData {
  isSuitaleSize: "Yes" | "No" | undefined;
  isFinanceResource: "Yes" | "No" | undefined;
  isAltRoutes: "Yes" | "No" | undefined;
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

// Save or update economical info
export const saveEconomicalInfo = (
  requestId: number,
  data: Partial<EconomicalData>,
): void => {
  try {
    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectioneconomical WHERE requestId = ?",
      [requestId],
    );

    // Prepare data for storage - store Yes/No as TEXT
    const storageData: any = { ...data };
    
    // Convert Yes/No to TEXT for storage
    if (data.isSuitaleSize !== undefined) {
      storageData.isSuitaleSize = data.isSuitaleSize; // Store as "Yes" or "No"
    }
    if (data.isFinanceResource !== undefined) {
      storageData.isFinanceResource = data.isFinanceResource; // Store as "Yes" or "No"
    }
    if (data.isAltRoutes !== undefined) {
      storageData.isAltRoutes = data.isAltRoutes; // Store as "Yes" or "No"
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
        `UPDATE inspectioneconomical SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Economical info updated in SQLite");
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
        `INSERT INTO inspectioneconomical (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Economical info inserted into SQLite");
    }
  } catch (error) {
    console.error("❌ Error saving economical info:", error);
    throw error;
  }
};

// Get economical info
export const getEconomicalInfo = (requestId: number): EconomicalData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectioneconomical WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("✅ Raw SQLite data:", row);
      
      const result = {
        isSuitaleSize: toYesNo(row.isSuitaleSize),
        isFinanceResource: toYesNo(row.isFinanceResource),
        isAltRoutes: toYesNo(row.isAltRoutes),
      };
      
      console.log("✅ Parsed economical info:", result);
      return result;
    }

    console.log("📭 No economical info found in SQLite");
    return null;
  } catch (error) {
    console.error("❌ Error fetching economical info:", error);
    return null;
  }
};

// Clear economical info for a specific request
export const clearEconomicalInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectioneconomical WHERE requestId = ?", [
      requestId,
    ]);
    console.log("🗑️ Cleared economical info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing economical info:", error);
    throw error;
  }
};

// Get all economical info records
export const getAllEconomicalInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectioneconomical ORDER BY updatedAt DESC",
    );
    return rows.map(row => ({
      ...row,
      isSuitaleSize: toYesNo(row.isSuitaleSize),
      isFinanceResource: toYesNo(row.isFinanceResource),
      isAltRoutes: toYesNo(row.isAltRoutes),
    }));
  } catch (error) {
    console.error("❌ Error fetching all economical info:", error);
    return [];
  }
};