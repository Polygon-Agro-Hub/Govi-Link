import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize labour table
export const initLabourTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectionlabour (
        requestId INTEGER PRIMARY KEY,
        isManageFamilyLabour TEXT,
        isFamilyHiredLabourEquipped TEXT,
        hasAdequateAlternativeLabour TEXT,
        areThereMechanizationOptions TEXT,
        isMachineryAvailable TEXT,
        isMachineryAffordable TEXT,
        isMachineryCostEffective TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    console.log("✅ Labour table created/verified");
  } catch (error) {
    console.error("❌ Error initializing labour table:", error);
    throw error;
  }
};

export interface LabourData {
  isManageFamilyLabour: "Yes" | "No" | undefined;
  isFamilyHiredLabourEquipped: "Yes" | "No" | undefined;
  hasAdequateAlternativeLabour: "Yes" | "No" | undefined;
  areThereMechanizationOptions: "Yes" | "No" | undefined;
  isMachineryAvailable: "Yes" | "No" | undefined;
  isMachineryAffordable: "Yes" | "No" | undefined;
  isMachineryCostEffective: "Yes" | "No" | undefined;
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

// Save or update labour info
export const saveLabourInfo = (
  requestId: number,
  data: Partial<LabourData>,
): void => {
  try {
    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionlabour WHERE requestId = ?",
      [requestId],
    );

    // Prepare data for storage - store Yes/No as TEXT
    const storageData: any = { ...data };
    
    // Convert Yes/No to TEXT for storage
    if (data.isManageFamilyLabour !== undefined) {
      storageData.isManageFamilyLabour = data.isManageFamilyLabour;
    }
    if (data.isFamilyHiredLabourEquipped !== undefined) {
      storageData.isFamilyHiredLabourEquipped = data.isFamilyHiredLabourEquipped;
    }
    if (data.hasAdequateAlternativeLabour !== undefined) {
      storageData.hasAdequateAlternativeLabour = data.hasAdequateAlternativeLabour;
    }
    if (data.areThereMechanizationOptions !== undefined) {
      storageData.areThereMechanizationOptions = data.areThereMechanizationOptions;
    }
    if (data.isMachineryAvailable !== undefined) {
      storageData.isMachineryAvailable = data.isMachineryAvailable;
    }
    if (data.isMachineryAffordable !== undefined) {
      storageData.isMachineryAffordable = data.isMachineryAffordable;
    }
    if (data.isMachineryCostEffective !== undefined) {
      storageData.isMachineryCostEffective = data.isMachineryCostEffective;
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
        `UPDATE inspectionlabour SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Labour info updated in SQLite");
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
        `INSERT INTO inspectionlabour (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );
      console.log("✅ Labour info inserted into SQLite");
    }
  } catch (error) {
    console.error("❌ Error saving labour info:", error);
    throw error;
  }
};

// Get labour info
export const getLabourInfo = (requestId: number): LabourData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionlabour WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("✅ Raw SQLite data:", row);
      
      const result = {
        isManageFamilyLabour: toYesNo(row.isManageFamilyLabour),
        isFamilyHiredLabourEquipped: toYesNo(row.isFamilyHiredLabourEquipped),
        hasAdequateAlternativeLabour: toYesNo(row.hasAdequateAlternativeLabour),
        areThereMechanizationOptions: toYesNo(row.areThereMechanizationOptions),
        isMachineryAvailable: toYesNo(row.isMachineryAvailable),
        isMachineryAffordable: toYesNo(row.isMachineryAffordable),
        isMachineryCostEffective: toYesNo(row.isMachineryCostEffective),
      };
      
      console.log("✅ Parsed labour info:", result);
      return result;
    }

    console.log("📭 No labour info found in SQLite");
    return null;
  } catch (error) {
    console.error("❌ Error fetching labour info:", error);
    return null;
  }
};

// Clear labour info for a specific request
export const clearLabourInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionlabour WHERE requestId = ?", [
      requestId,
    ]);
    console.log("🗑️ Cleared labour info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing labour info:", error);
    throw error;
  }
};

// Get all labour info records
export const getAllLabourInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionlabour ORDER BY updatedAt DESC",
    );
    return rows.map(row => ({
      ...row,
      isManageFamilyLabour: toYesNo(row.isManageFamilyLabour),
      isFamilyHiredLabourEquipped: toYesNo(row.isFamilyHiredLabourEquipped),
      hasAdequateAlternativeLabour: toYesNo(row.hasAdequateAlternativeLabour),
      areThereMechanizationOptions: toYesNo(row.areThereMechanizationOptions),
      isMachineryAvailable: toYesNo(row.isMachineryAvailable),
      isMachineryAffordable: toYesNo(row.isMachineryAffordable),
      isMachineryCostEffective: toYesNo(row.isMachineryCostEffective),
    }));
  } catch (error) {
    console.error("❌ Error fetching all labour info:", error);
    return [];
  }
};