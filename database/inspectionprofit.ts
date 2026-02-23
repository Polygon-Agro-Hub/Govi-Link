import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

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
    
  } catch (error) {
    console.error(" Error initializing profit/risk table:", error);
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

const toYesNo = (val: any): "Yes" | "No" | undefined => {
  if (val === null || val === undefined || val === "") return undefined;

  if (typeof val === "string") {
    if (val === "Yes" || val === "yes" || val === "1") return "Yes";
    if (val === "No" || val === "no" || val === "0") return "No";
  }

  if (val === 1 || val === true) return "Yes";
  if (val === 0 || val === false) return "No";

  return undefined;
};

export const saveProfitInfo = (
  requestId: number,
  data: Partial<ProfitRiskData>,
): void => {
  try {
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionprofit WHERE requestId = ?",
      [requestId],
    );

    const storageData: any = { ...data };

    if (data.isProfitable !== undefined) {
      storageData.isProfitable = data.isProfitable;
    }
    if (data.isRisk !== undefined) {
      storageData.isRisk = data.isRisk;
    }
    if (data.manageRisk !== undefined) {
      storageData.manageRisk = data.manageRisk;
    }

    if (existing) {
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
      console.log("Profit/risk info updated in SQLite");
    } else {
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
    }
  } catch (error) {
    console.error("Error saving profit/risk info:", error);
    throw error;
  }
};

export const getProfitInfo = (requestId: number): ProfitRiskData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionprofit WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      const result = {
        profit: row.profit ? row.profit.toString() : "",
        isProfitable: toYesNo(row.isProfitable),
        isRisk: toYesNo(row.isRisk),
        risk: row.risk || "",
        solution: row.solution || "",
        manageRisk: toYesNo(row.manageRisk),
        worthToTakeRisk: row.worthToTakeRisk || "",
      };

      console.log("Parsed profit/risk info:", result);
      return result;
    }

    return null;
  } catch (error) {
    console.error("Error fetching profit/risk info:", error);
    return null;
  }
};

export const clearProfitInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionprofit WHERE requestId = ?", [requestId]);
  } catch (error) {
    console.error("Error clearing profit/risk info:", error);
    throw error;
  }
};

export const getAllProfitInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionprofit ORDER BY updatedAt DESC",
    );
    return rows.map((row) => ({
      ...row,
      isProfitable: toYesNo(row.isProfitable),
      isRisk: toYesNo(row.isRisk),
      manageRisk: toYesNo(row.manageRisk),
    }));
  } catch (error) {
    console.error("Error fetching all profit/risk info:", error);
    return [];
  }
};
