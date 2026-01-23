import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize finance table
export const initFinanceTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectionfinance (
        requestId INTEGER PRIMARY KEY,
        accHolder TEXT,
        accNum TEXT,
        bank TEXT,
        branch TEXT,
        debtsOfFarmer TEXT,
        noOfDependents INTEGER,
        assetsLand TEXT,
        assetsBuilding TEXT,
        assetsVehicle TEXT,
        assetsMachinery TEXT,
        assetsFarmTool TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    console.log("✅ Finance table created/verified");
  } catch (error) {
    console.error("❌ Error initializing finance table:", error);
    throw error;
  }
};

export interface FinanceInfo {
  accHolder: string;
  accountNumber: string;
  confirmAccountNumber: string;
  bank: string;
  branch: string;
  debtsOfFarmer: string;
  noOfDependents: string;
  assetsLand: string[];
  assetsBuilding: string[];
  assetsVehicle: string[];
  assetsMachinery: string[];
  assetsFarmTool: string;
}

// Save or update finance info
export const saveFinanceInfo = (
  requestId: number,
  data: Partial<FinanceInfo>,
): void => {
  try {
    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionfinance WHERE requestId = ?",
      [requestId],
    );

    // Transform arrays to JSON strings
    const dbData: any = { ...data };
    if (data.assetsLand) dbData.assetsLand = JSON.stringify(data.assetsLand);
    if (data.assetsBuilding)
      dbData.assetsBuilding = JSON.stringify(data.assetsBuilding);
    if (data.assetsVehicle)
      dbData.assetsVehicle = JSON.stringify(data.assetsVehicle);
    if (data.assetsMachinery)
      dbData.assetsMachinery = JSON.stringify(data.assetsMachinery);
    if (data.accountNumber) dbData.accNum = data.accountNumber;
    delete dbData.accountNumber;
    delete dbData.confirmAccountNumber;

    if (existing) {
      // UPDATE
      const fields = Object.keys(dbData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [
        ...Object.values(dbData),
        new Date().toISOString(),
        requestId,
      ];

      db.runSync(
        `UPDATE inspectionfinance SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Finance info updated in SQLite");
    } else {
      // INSERT
      const fields = [
        "requestId",
        ...Object.keys(dbData),
        "createdAt",
        "updatedAt",
      ].join(", ");
      const placeholders = new Array(Object.keys(dbData).length + 3)
        .fill("?")
        .join(", ");
      const values = [
        requestId,
        ...Object.values(dbData),
        new Date().toISOString(),
        new Date().toISOString(),
      ];

      db.runSync(
        `INSERT INTO inspectionfinance (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Finance info inserted into SQLite");
    }
  } catch (error) {
    console.error("❌ Error saving finance info:", error);
    throw error;
  }
};

// Get finance info
export const getFinanceInfo = (requestId: number): FinanceInfo | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionfinance WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("✅ Finance info loaded from SQLite");

      // Parse JSON strings back to arrays
      const parseJson = (field: string | null): string[] => {
        if (!field) return [];
        try {
          return JSON.parse(field);
        } catch {
          return [];
        }
      };

      return {
        accHolder: row.accHolder || "",
        accountNumber: row.accNum || "",
        confirmAccountNumber: row.accNum || "",
        bank: row.bank || "",
        branch: row.branch || "",
        debtsOfFarmer: row.debtsOfFarmer || "",
        noOfDependents: row.noOfDependents?.toString() || "",
        assetsLand: parseJson(row.assetsLand),
        assetsBuilding: parseJson(row.assetsBuilding),
        assetsVehicle: parseJson(row.assetsVehicle),
        assetsMachinery: parseJson(row.assetsMachinery),
        assetsFarmTool: row.assetsFarmTool || "",
      };
    }

    console.log("📭 No finance info found in SQLite");
    return null;
  } catch (error) {
    console.error("❌ Error fetching finance info:", error);
    return null;
  }
};

// Clear finance info for a specific request
export const clearFinanceInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionfinance WHERE requestId = ?", [
      requestId,
    ] as SQLite.SQLiteBindParams);
    console.log("🗑️ Cleared finance info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing finance info:", error);
    throw error;
  }
};

// Get all finance records
export const getAllFinanceInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionfinance ORDER BY updatedAt DESC",
    );
    return rows;
  } catch (error) {
    console.error("❌ Error fetching all finance info:", error);
    return [];
  }
};
