import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

export const initCroppingTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectioncropping (
        requestId INTEGER PRIMARY KEY,
        opportunity TEXT, -- JSON string array
        otherOpportunity TEXT,
        hasKnowlage TEXT,
        prevExperince TEXT,
        opinion TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    console.log(" Cropping systems table created/verified");
  } catch (error) {
    console.error("Error initializing cropping systems table:", error);
    throw error;
  }
};

export interface CroppingSystemsData {
  opportunity: string[];
  otherOpportunity: string;
  hasKnowlage: "Yes" | "No" | undefined;
  prevExperince: string;
  opinion: string;
}

const safeJsonParse = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

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

export const saveCroppingInfo = (
  requestId: number,
  data: Partial<CroppingSystemsData>,
): void => {
  try {
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectioncropping WHERE requestId = ?",
      [requestId],
    );

    const storageData: any = { ...data };

    if (data.hasKnowlage !== undefined) {
      storageData.hasKnowlage = data.hasKnowlage;
    }

    if (data.opportunity !== undefined) {
      storageData.opportunity = JSON.stringify(data.opportunity);
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
        `UPDATE inspectioncropping SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("Cropping systems info updated in SQLite");
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
        `INSERT INTO inspectioncropping (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );
    }
  } catch (error) {
    console.error(" Error saving cropping systems info:", error);
    throw error;
  }
};

export const getCroppingInfo = (
  requestId: number,
): CroppingSystemsData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectioncropping WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      const result = {
        opportunity: safeJsonParse(row.opportunity),
        otherOpportunity: row.otherOpportunity || "",
        hasKnowlage: toYesNo(row.hasKnowlage),
        prevExperince: row.prevExperince || "",
        opinion: row.opinion || "",
      };

      return result;
    }

    return null;
  } catch (error) {
    console.error(" Error fetching cropping systems info:", error);
    return null;
  }
};

export const clearCroppingInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectioncropping WHERE requestId = ?", [
      requestId,
    ]);
  } catch (error) {
    console.error("❌ Error clearing cropping systems info:", error);
    throw error;
  }
};

export const getAllCroppingInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectioncropping ORDER BY updatedAt DESC",
    );
    return rows.map((row) => ({
      ...row,
      opportunity: safeJsonParse(row.opportunity),
      hasKnowlage: toYesNo(row.hasKnowlage),
    }));
  } catch (error) {
    console.error("Error fetching all cropping systems info:", error);
    return [];
  }
};
