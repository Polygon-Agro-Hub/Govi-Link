import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

export const initProgressTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectionprogress (
        requestId   INTEGER PRIMARY KEY,
        lastScreen  TEXT    NOT NULL,
        updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
  } catch (error) {
    console.error("Error initializing progress table:", error);
    throw error;
  }
};


export const updateLastScreen = (requestId: number, screenName: string): void => {
  try {
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionprogress WHERE requestId = ?",
      [requestId],
    );

    if (existing) {
      db.runSync(
        "UPDATE inspectionprogress SET lastScreen = ?, updatedAt = ? WHERE requestId = ?",
        [screenName, new Date().toISOString(), requestId],
      );
    } else {
      db.runSync(
        "INSERT INTO inspectionprogress (requestId, lastScreen, updatedAt) VALUES (?, ?, ?)",
        [requestId, screenName, new Date().toISOString()],
      );
    }
  } catch (error) {
    console.error("Error updating last screen:", error);
    throw error;
  }
};

export const getLastScreen = (requestId: number): string | null => {
  try {
    const row = db.getFirstSync<{ lastScreen: string }>(
      "SELECT lastScreen FROM inspectionprogress WHERE requestId = ?",
      [requestId],
    );
    
    // Fallback: Check actual data tables to find furthest reached screen
    const tableToScreenMap: Record<string, string> = {
      inspectionpersonal: "PersonalInfo",
      inspectionidproof: "IDProof",
      inspectionfinance: "FinanceInfo",
      inspectionland: "LandInfo",
      inspectioninvestment: "InvestmentInfo",
      inspectioncultivation: "CultivationInfo",
      inspectioncropping: "CroppingSystems",
      inspectionprofit: "ProfitRisk",
      inspectioneconomical: "Economical",
      inspectionlabour: "Labour",
      inspectionharveststorage: "HarvestStorage",
    };

    const tableNames = Object.keys(tableToScreenMap);
    let furthestScreen = row ? row.lastScreen : null;
    let lastFoundTableScreen = null;

    for (const tableName of tableNames) {
      try {
        const result = db.getFirstSync<{ requestId: number }>(
          `SELECT requestId FROM ${tableName} WHERE requestId = ?`,
          [requestId],
        );
        if (result) {
          lastFoundTableScreen = tableToScreenMap[tableName];
        } else {
          break;
        }
      } catch (e) {
        // Table might not exist yet
      }
    }

    // If lastFoundTableScreen is further than lastScreen, use it
    if (lastFoundTableScreen) {

      const screenList = Object.values(tableToScreenMap);
      const lastIdx = screenList.indexOf(furthestScreen || "");
      const foundIdx = screenList.indexOf(lastFoundTableScreen);
      
      if (foundIdx > lastIdx) {
        return lastFoundTableScreen;
      }
    }

    return furthestScreen;
  } catch (error) {
    console.error("Error fetching last screen:", error);
    return null;
  }
};


export const clearProgress = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionprogress WHERE requestId = ?", [requestId]);
  } catch (error) {
    console.error("Error clearing progress:", error);
    throw error;
  }
};