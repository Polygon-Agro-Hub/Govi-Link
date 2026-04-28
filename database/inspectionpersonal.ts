import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

export const initPersonalTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectionpersonal (
        requestId INTEGER PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        otherName TEXT,
        callName TEXT,
        phone1 TEXT,
        phone2 TEXT,
        familyPhone TEXT,
        landHome TEXT,
        landWork TEXT,
        email1 TEXT,
        email2 TEXT,
        house TEXT,
        street TEXT,
        cityName TEXT,
        district TEXT,
        province TEXT,
        country TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    
  } catch (error) {
    console.error("Error initializing personal info table:", error);
    throw error;
  }
};

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  otherName: string;
  callName: string;
  phone1: string;
  phone2: string;
  familyPhone: string;
  landHome: string;
  landWork: string;
  email1: string;
  email2: string;
  house: string;
  street: string;
  cityName: string;
  district: string | null;
  province: string | null;
  country: string;
}

export const savePersonalInfo = (
  requestId: number,
  data: Partial<PersonalInfo>,
): void => {
  try {
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionpersonal WHERE requestId = ?",
      [requestId],
    );

    if (existing) {
      const fields = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [
        ...Object.values(data),
        new Date().toISOString(),
        requestId,
      ];

      db.runSync(
        `UPDATE inspectionpersonal SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values,
      );
      console.log("Personal info updated in SQLite");
    } else {
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
        `INSERT INTO inspectionpersonal (${fields}) VALUES (${placeholders})`,
        values,
      );
      console.log("Personal info inserted into SQLite");
    }
  } catch (error) {
    console.error("Error saving personal info:", error);
    throw error;
  }
};

export const getPersonalInfo = (requestId: number): PersonalInfo | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionpersonal WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      return {
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        otherName: row.otherName || "",
        callName: row.callName || "",
        phone1: row.phone1 || "",
        phone2: row.phone2 || "",
        familyPhone: row.familyPhone || "",
        landHome: row.landHome || "",
        landWork: row.landWork || "",
        email1: row.email1 || "",
        email2: row.email2 || "",
        house: row.house || "",
        street: row.street || "",
        cityName: row.cityName || "",
        district: row.district || null,
        province: row.province || null,
        country: row.country || "Sri Lanka",
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching personal info:", error);
    return null;
  }
};

export const clearPersonalInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionpersonal WHERE requestId = ?", [
      requestId,
    ]);
  } catch (error) {
    console.error("Error clearing personal info:", error);
    throw error;
  }
};

export const hasDraft = (requestId: number): boolean => {
  try {
    const row = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionpersonal WHERE requestId = ?",
      [requestId],
    );

    const exists = row !== null;

    return exists;
  } catch (error) {
    console.error(` Error checking draft for request ${requestId}:`, error);
    return false;
  }
};

export const getAllPersonalInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionpersonal ORDER BY updatedAt DESC",
    );
    return rows;
  } catch (error) {
    console.error(" Error fetching all personal info:", error);
    return [];
  }
};
