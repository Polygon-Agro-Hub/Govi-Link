import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize cropping systems table
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
    console.log("✅ Cropping systems table created/verified");
  } catch (error) {
    console.error("❌ Error initializing cropping systems table:", error);
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

// Helper to parse JSON arrays
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

// Save or update cropping systems info
export const saveCroppingInfo = (
  requestId: number,
  data: Partial<CroppingSystemsData>,
): void => {
  try {
    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectioncropping WHERE requestId = ?",
      [requestId],
    );

    // Prepare data for storage - store Yes/No as TEXT
    const storageData: any = { ...data };
    
    // Convert Yes/No to TEXT for storage
    if (data.hasKnowlage !== undefined) {
      storageData.hasKnowlage = data.hasKnowlage; // Store as "Yes" or "No"
    }
    
    // Convert array to JSON string
    if (data.opportunity !== undefined) {
      storageData.opportunity = JSON.stringify(data.opportunity);
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
        `UPDATE inspectioncropping SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Cropping systems info updated in SQLite");
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
        `INSERT INTO inspectioncropping (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Cropping systems info inserted into SQLite");
    }
  } catch (error) {
    console.error("❌ Error saving cropping systems info:", error);
    throw error;
  }
};

// Get cropping systems info
export const getCroppingInfo = (
  requestId: number,
): CroppingSystemsData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectioncropping WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("✅ Raw SQLite data:", row);

      const result = {
        opportunity: safeJsonParse(row.opportunity),
        otherOpportunity: row.otherOpportunity || "",
        hasKnowlage: toYesNo(row.hasKnowlage),
        prevExperince: row.prevExperince || "",
        opinion: row.opinion || "",
      };
      
      console.log("✅ Parsed cropping systems info:", result);
      return result;
    }

    console.log("📭 No cropping systems info found in SQLite");
    return null;
  } catch (error) {
    console.error("❌ Error fetching cropping systems info:", error);
    return null;
  }
};

// Clear cropping systems info for a specific request
export const clearCroppingInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectioncropping WHERE requestId = ?", [
      requestId,
    ]);
    console.log("🗑️ Cleared cropping systems info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing cropping systems info:", error);
    throw error;
  }
};

// Get all cropping systems info records
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
    console.error("❌ Error fetching all cropping systems info:", error);
    return [];
  }
};