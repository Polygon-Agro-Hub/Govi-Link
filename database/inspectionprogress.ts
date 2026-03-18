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
    return row ? row.lastScreen : null;
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