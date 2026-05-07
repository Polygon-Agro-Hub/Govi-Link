import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

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
      );`,
    );
  } catch (error) {
    console.error("Error initializing harvest storage table:", error);
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

export const saveHarvestStorageInfo = async (
  requestId: number,
  data: Partial<HarvestStorageData>,
): Promise<void> => {
  try {
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionharveststorage WHERE requestId = ?",
      [requestId],
    );

    const storageData: any = {};

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

    if (Object.keys(storageData).length === 0) {
      return;
    }

    const keys = Object.keys(storageData);

    if (existing) {
      const fields = keys.map((key) => `${key} = ?`).join(", ");
      const values = [
        ...keys.map((key) => storageData[key]),
        new Date().toISOString(),
        requestId,
      ];

      db.runSync(
        `UPDATE inspectionharveststorage SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );
    } else {
      const fields = ["requestId", ...keys, "createdAt", "updatedAt"].join(", ");
      const placeholders = new Array(keys.length + 3).fill("?").join(", ");
      const values = [
        requestId,
        ...keys.map((key) => storageData[key]),
        new Date().toISOString(),
        new Date().toISOString(),
      ];

      db.runSync(
        `INSERT INTO inspectionharveststorage (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );
    }
  } catch (error) {
    console.error("Error saving harvest storage info:", error);
    throw error;
  }
};

export const getHarvestStorageInfo = async (
  requestId: number,
): Promise<HarvestStorageData | null> => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionharveststorage WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      return {
        hasOwnStorage: toYesNo(row.hasOwnStorage),
        ifNotHasFacilityAccess: toYesNo(row.ifNotHasFacilityAccess),
        hasPrimaryProcessingAccess: toYesNo(row.hasPrimaryProcessingAccess),
        knowsValueAdditionTech: toYesNo(row.knowsValueAdditionTech),
        hasValueAddedMarketLinkage: toYesNo(row.hasValueAddedMarketLinkage),
        awareOfQualityStandards: toYesNo(row.awareOfQualityStandards),
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching harvest storage info:", error);
    return null;
  }
};

export const clearHarvestStorageInfo = async (
  requestId: number,
): Promise<void> => {
  try {
    db.runSync("DELETE FROM inspectionharveststorage WHERE requestId = ?", [
      requestId,
    ]);
  } catch (error) {
    console.error("Error clearing harvest storage info:", error);
    throw error;
  }
};

export const getAllHarvestStorageInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionharveststorage ORDER BY updatedAt DESC",
    );
    return rows.map((row) => ({
      ...row,
      hasOwnStorage: toYesNo(row.hasOwnStorage),
      ifNotHasFacilityAccess: toYesNo(row.ifNotHasFacilityAccess),
      hasPrimaryProcessingAccess: toYesNo(row.hasPrimaryProcessingAccess),
      knowsValueAdditionTech: toYesNo(row.knowsValueAdditionTech),
      hasValueAddedMarketLinkage: toYesNo(row.hasValueAddedMarketLinkage),
      awareOfQualityStandards: toYesNo(row.awareOfQualityStandards),
    }));
  } catch (error) {
    console.error("Error fetching all harvest storage info:", error);
    return [];
  }
};
