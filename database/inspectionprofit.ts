import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize profit/risk table
export const initProfitTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectionprofit (
        requestId INTEGER PRIMARY KEY,
        profit TEXT,
        isProfitable TEXT,
        isRisk TEXT,
        risk TEXT,
        solution TEXT,
        manageRisk TEXT,
        worthToTakeRisk TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    console.log("✅ Profit/risk table created/verified");
  } catch (error) {
    console.error("❌ Error initializing profit/risk table:", error);
    throw error;
  }
};

export interface ProfitRiskData {
  profit: string;
  isProfitable: "Yes" | "No" | undefined;
  isRisk: "Yes" | "No" | undefined;
  risk: string;
  solution: string;
  manageRisk: "Yes" | "No" | undefined;
  worthToTakeRisk: string;
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

// Save or update profit/risk info
export const saveProfitInfo = (
  requestId: number,
  data: Partial<ProfitRiskData>,
): void => {
  try {
    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionprofit WHERE requestId = ?",
      [requestId],
    );

    // Prepare data for storage - store Yes/No as TEXT
    const storageData: any = { ...data };
    
    // Convert Yes/No to TEXT for storage
    if (data.isProfitable !== undefined) {
      storageData.isProfitable = data.isProfitable; // Store as "Yes" or "No"
    }
    if (data.isRisk !== undefined) {
      storageData.isRisk = data.isRisk; // Store as "Yes" or "No"
    }
    if (data.manageRisk !== undefined) {
      storageData.manageRisk = data.manageRisk; // Store as "Yes" or "No"
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
        `UPDATE inspectionprofit SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Profit/risk info updated in SQLite");
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
        `INSERT INTO inspectionprofit (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Profit/risk info inserted into SQLite");
    }
  } catch (error) {
    console.error("❌ Error saving profit/risk info:", error);
    throw error;
  }
};

// Get profit/risk info
export const getProfitInfo = (requestId: number): ProfitRiskData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionprofit WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("✅ Raw SQLite data:", row);
      
      const result = {
        profit: row.profit ? row.profit.toString() : "",
        isProfitable: toYesNo(row.isProfitable),
        isRisk: toYesNo(row.isRisk),
        risk: row.risk || "",
        solution: row.solution || "",
        manageRisk: toYesNo(row.manageRisk),
        worthToTakeRisk: row.worthToTakeRisk || "",
      };
      
      console.log("✅ Parsed profit/risk info:", result);
      return result;
    }

    console.log("📭 No profit/risk info found in SQLite");
    return null;
  } catch (error) {
    console.error("❌ Error fetching profit/risk info:", error);
    return null;
  }
};

// Clear profit/risk info for a specific request
export const clearProfitInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionprofit WHERE requestId = ?", [
      requestId,
    ]);
    console.log("🗑️ Cleared profit/risk info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing profit/risk info:", error);
    throw error;
  }
};

// Get all profit/risk info records
export const getAllProfitInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionprofit ORDER BY updatedAt DESC",
    );
    return rows.map(row => ({
      ...row,
      isProfitable: toYesNo(row.isProfitable),
      isRisk: toYesNo(row.isRisk),
      manageRisk: toYesNo(row.manageRisk),
    }));
  } catch (error) {
    console.error("❌ Error fetching all profit/risk info:", error);
    return [];
  }
};