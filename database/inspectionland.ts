import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

export const initLandTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectionland (
        requestId INTEGER PRIMARY KEY,
        isOwnByFarmer TEXT,
        ownershipStatus TEXT,
        landDiscription TEXT,
        latitude REAL,
        longitude REAL,
        locationName TEXT,
        images TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    
  } catch (error) {
    console.error("Error initializing land table:", error);
    throw error;
  }
};

export interface LandImage {
  uri: string;
  name: string;
  type: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  locationName: string;
}

export interface LandInfo {
  isOwnByFarmer: "Yes" | "No" | undefined;
  ownershipStatus: string | undefined;
  landDiscription: string;
  geoLocation: GeoLocation | undefined;
  images: LandImage[];
}

export const saveLandInfo = (
  requestId: number,
  data: Partial<LandInfo>,
): void => {
  try {
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionland WHERE requestId = ?",
      [requestId],
    );

    const dbData: any = {};

    if (data.isOwnByFarmer !== undefined) {
      dbData.isOwnByFarmer = data.isOwnByFarmer;
    }
    if (data.ownershipStatus !== undefined) {
      dbData.ownershipStatus = data.ownershipStatus;
    }
    if (data.landDiscription !== undefined) {
      dbData.landDiscription = data.landDiscription;
    }

    if (data.geoLocation) {
      dbData.latitude = data.geoLocation.latitude;
      dbData.longitude = data.geoLocation.longitude;
      dbData.locationName = data.geoLocation.locationName || "";
    }

    if (data.images && Array.isArray(data.images)) {
      dbData.images = JSON.stringify(data.images);
    }

    if (Object.keys(dbData).length === 0) {
      return;
    }

    if (existing) {
      const fields = Object.keys(dbData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [
        ...Object.values(dbData),
        new Date().toISOString(),
        requestId,
      ];

      const result = db.runSync(
        `UPDATE inspectionland SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );

      console.log(" Land info updated in SQLite");
    } else {
      const fields = [
        "requestId",
        ...Object.keys(dbData),
        "createdAt",
        "updatedAt",
      ].join(", ");
      const placeholders = new Array(Object.keys(dbData).length + 3)
        .fill("?")
        .join(", ");
      const values = [
        requestId,
        ...Object.values(dbData),
        new Date().toISOString(),
        new Date().toISOString(),
      ];

      const result = db.runSync(
        `INSERT INTO inspectionland (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );

      console.log("Land info inserted into SQLite");
    }
  } catch (error) {
    console.error(" Error saving land info:", error);
    throw error;
  }
};

export const getLandInfo = (requestId: number): LandInfo | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionland WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      // Parse images JSON
      let images: LandImage[] = [];
      if (row.images) {
        try {
          images = JSON.parse(row.images);
        } catch (e) {
          console.error(" Failed to parse images:", e);
          images = [];
        }
      }

      let geoLocation: GeoLocation | undefined;

      if (
        row.latitude !== null &&
        row.longitude !== null &&
        !isNaN(parseFloat(row.latitude)) &&
        !isNaN(parseFloat(row.longitude))
      ) {
        geoLocation = {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          locationName: row.locationName || "Selected Location",
        };
      } else {
      }

      const result = {
        isOwnByFarmer: row.isOwnByFarmer as "Yes" | "No" | undefined,
        ownershipStatus: row.ownershipStatus,
        landDiscription: row.landDiscription || "",
        geoLocation,
        images,
      };

      return result;
    }

    return null;
  } catch (error) {
    console.error(" Error fetching land info:", error);

    return null;
  }
};

export const clearLandInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionland WHERE requestId = ?", [requestId]);
  } catch (error) {
    console.error(" Error clearing land info:", error);
    throw error;
  }
};

export const getAllLandInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionland ORDER BY updatedAt DESC",
    );
    return rows;
  } catch (error) {
    console.error("Error fetching all land info:", error);
    return [];
  }
};
