import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

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
  } catch (error) {
    console.error(" Error initializing economical table:", error);
    throw error;
  }
};

export interface EconomicalData {
  isSuitaleSize: "Yes" | "No" | undefined;
  isFinanceResource: "Yes" | "No" | undefined;
  isAltRoutes: "Yes" | "No" | undefined;
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

export const saveEconomicalInfo = (
  requestId: number,
  data: Partial<EconomicalData>,
): void => {
  try {
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectioneconomical WHERE requestId = ?",
      [requestId],
    );

    const storageData: any = { ...data };

    if (data.isSuitaleSize !== undefined) {
      storageData.isSuitaleSize = data.isSuitaleSize;
    }
    if (data.isFinanceResource !== undefined) {
      storageData.isFinanceResource = data.isFinanceResource;
    }
    if (data.isAltRoutes !== undefined) {
      storageData.isAltRoutes = data.isAltRoutes;
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
        `UPDATE inspectioneconomical SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("Economical info updated in SQLite");
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
        `INSERT INTO inspectioneconomical (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("Economical info inserted into SQLite");
    }
  } catch (error) {
    console.error(" Error saving economical info:", error);
    throw error;
  }
};

export const getEconomicalInfo = (requestId: number): EconomicalData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectioneconomical WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      const result = {
        isSuitaleSize: toYesNo(row.isSuitaleSize),
        isFinanceResource: toYesNo(row.isFinanceResource),
        isAltRoutes: toYesNo(row.isAltRoutes),
      };

      return result;
    }

    return null;
  } catch (error) {
    console.error(" Error fetching economical info:", error);
    return null;
  }
};

export const clearEconomicalInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectioneconomical WHERE requestId = ?", [
      requestId,
    ]);
  } catch (error) {
    console.error(" Error clearing economical info:", error);
    throw error;
  }
};

export const getAllEconomicalInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectioneconomical ORDER BY updatedAt DESC",
    );
    return rows.map((row) => ({
      ...row,
      isSuitaleSize: toYesNo(row.isSuitaleSize),
      isFinanceResource: toYesNo(row.isFinanceResource),
      isAltRoutes: toYesNo(row.isAltRoutes),
    }));
  } catch (error) {
    console.error(" Error fetching all economical info:", error);
    return [];
  }
};
