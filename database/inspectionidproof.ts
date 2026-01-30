import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize ID proof table
export const initIDProofTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectionidproof (
        requestId INTEGER PRIMARY KEY,
        pType TEXT,
        pNumber TEXT,
        frontImg TEXT,
        backImg TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    console.log("✅ ID proof table created/verified");
  } catch (error) {
    console.error("❌ Error initializing ID proof table:", error);
    throw error;
  }
};

export interface IDProofInfo {
  pType: string;
  pNumber: string;
  frontImg: string | null;
  backImg: string | null;
}

// Save or update ID proof
export const saveIDProof = (
  requestId: number,
  data: Partial<IDProofInfo>,
): void => {
  try {
    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionidproof WHERE requestId = ?",
      [requestId],
    );

    if (existing) {
      // UPDATE
      const fields = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [
        ...Object.values(data),
        new Date().toISOString(),
        requestId,
      ];

      db.runSync(
        `UPDATE inspectionidproof SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values,
      );
      console.log("✅ ID proof updated in SQLite");
    } else {
      // INSERT
      const fields = [
        "requestId",
        ...Object.keys(data),
        "createdAt",
        "updatedAt",
      ].join(", ");
      const placeholders = new Array(Object.keys(data).length + 3)
        .fill("?")
        .join(", ");
      const values = [
        requestId,
        ...Object.values(data),
        new Date().toISOString(),
        new Date().toISOString(),
      ];

      db.runSync(
        `INSERT INTO inspectionidproof (${fields}) VALUES (${placeholders})`,
        values,
      );
      console.log("✅ ID proof inserted into SQLite");
    }
  } catch (error) {
    console.error("❌ Error saving ID proof:", error);
    throw error;
  }
};

// Get ID proof
export const getIDProof = (requestId: number): IDProofInfo | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionidproof WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("✅ ID proof loaded from SQLite");
      return {
        pType: row.pType || "",
        pNumber: row.pNumber || "",
        frontImg: row.frontImg || null,
        backImg: row.backImg || null,
      };
    }

    console.log("📭 No ID proof found in SQLite");
    return null;
  } catch (error) {
    console.error("❌ Error fetching ID proof:", error);
    return null;
  }
};

// Clear ID proof for a specific request
export const clearIDProof = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionidproof WHERE requestId = ?", [
      requestId,
    ]);
    console.log("🗑️ Cleared ID proof for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing ID proof:", error);
    throw error;
  }
};

// Get all ID proof records
export const getAllIDProofs = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionidproof ORDER BY updatedAt DESC",
    );
    return rows;
  } catch (error) {
    console.error("❌ Error fetching all ID proofs:", error);
    return [];
  }
};
