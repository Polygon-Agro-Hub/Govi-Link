import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize investment info table
export const initInvestmentTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectioninvestment (
        requestId INTEGER PRIMARY KEY,
        expected REAL,
        purpose TEXT,
        repaymentMonth INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    console.log("✅ Investment info table created/verified");
  } catch (error) {
    console.error("❌ Error initializing investment info table:", error);
    throw error;
  }
};

export interface InvestmentInfoData {
  expected: number;
  purpose: string;
  repaymentMonth: number;
}

// Save or update investment info
export const saveInvestmentInfo = (
  requestId: number,
  data: Partial<InvestmentInfoData>,
): void => {
  try {
    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectioninvestment WHERE requestId = ?",
      [requestId],
    );

    if (existing) {
      // UPDATE existing record
      const fields = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [
        ...Object.values(data),
        new Date().toISOString(),
        requestId,
      ];

      db.runSync(
        `UPDATE inspectioninvestment SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values,
      );
      console.log("✅ Investment info updated in SQLite");
    } else {
      // INSERT new record
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
        `INSERT INTO inspectioninvestment (${fields}) VALUES (${placeholders})`,
        values,
      );
      console.log("✅ Investment info inserted into SQLite");
    }
  } catch (error) {
    console.error("❌ Error saving investment info:", error);
    throw error;
  }
};

// Get investment info
export const getInvestmentInfo = (requestId: number): InvestmentInfoData | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectioninvestment WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("✅ Investment info loaded from SQLite");
      return {
        expected: row.expected ? parseFloat(row.expected) : 0,
        purpose: row.purpose || "",
        repaymentMonth: row.repaymentMonth ? parseInt(row.repaymentMonth) : 0,
      };
    }

    console.log("📭 No investment info found in SQLite");
    return null;
  } catch (error) {
    console.error("❌ Error fetching investment info:", error);
    return null;
  }
};

// Clear investment info for a specific request
export const clearInvestmentInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectioninvestment WHERE requestId = ?", [
      requestId,
    ]);
    console.log("🗑️ Cleared investment info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing investment info:", error);
    throw error;
  }
};

// Get all investment info records (for debugging/admin purposes)
export const getAllInvestmentInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectioninvestment ORDER BY updatedAt DESC",
    );
    return rows.map(row => ({
      ...row,
      expected: row.expected ? parseFloat(row.expected) : 0,
      repaymentMonth: row.repaymentMonth ? parseInt(row.repaymentMonth) : 0,
    }));
  } catch (error) {
    console.error("❌ Error fetching all investment info:", error);
    return [];
  }
};