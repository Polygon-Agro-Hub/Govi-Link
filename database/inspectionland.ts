import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize land table
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
    console.log("✅ Land table created/verified");
  } catch (error) {
    console.error("❌ Error initializing land table:", error);
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

// Save or update land info
export const saveLandInfo = (
  requestId: number,
  data: Partial<LandInfo>,
): void => {
  try {
    console.log("💾 ======= START SAVE LAND INFO =======");
    console.log("💾 Request ID:", requestId);
    console.log("💾 Full data to save:", JSON.stringify(data, null, 2));
    console.log("💾 GeoLocation in data:", data.geoLocation);
    console.log("💾 GeoLocation type:", typeof data.geoLocation);

    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectionland WHERE requestId = ?",
      [requestId],
    );

    console.log("💾 Existing record found?", !!existing);

    // Transform data for database
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

    // Handle geoLocation - FIXED VERSION
    if (data.geoLocation) {
      console.log("📍 Saving geoLocation:", data.geoLocation);
      dbData.latitude = data.geoLocation.latitude;
      dbData.longitude = data.geoLocation.longitude;
      dbData.locationName = data.geoLocation.locationName || "";
    }

    if (data.images && Array.isArray(data.images)) {
      dbData.images = JSON.stringify(data.images);
      console.log("📸 Saving images count:", data.images.length);
    }

    console.log("💾 Database values to save:", dbData);

    // **FIX: Check if there's actually data to save**
    if (Object.keys(dbData).length === 0) {
      console.log("⚠️ No data to save, skipping database operation");
      console.log("💾 ======= END SAVE LAND INFO =======");
      return;
    }

    if (existing) {
      // UPDATE
      const fields = Object.keys(dbData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [
        ...Object.values(dbData),
        new Date().toISOString(),
        requestId,
      ];

      console.log("🔄 UPDATE query:", `UPDATE inspectionland SET ${fields}, updatedAt = ? WHERE requestId = ?`);
      console.log("🔄 UPDATE query values:", values);

      const result = db.runSync(
        `UPDATE inspectionland SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );

      console.log("🔄 Update rows affected:", result?.changes || 0);
      console.log("✅ Land info updated in SQLite");
    } else {
      // INSERT
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

      console.log("📝 INSERT query:", `INSERT INTO inspectionland (${fields}) VALUES (${placeholders})`);
      console.log("📝 INSERT query values:", values);

      const result = db.runSync(
        `INSERT INTO inspectionland (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );

      console.log("📝 Insert result:", result);
      console.log("✅ Land info inserted into SQLite");
    }

    console.log("💾 ======= END SAVE LAND INFO =======");
  } catch (error) {
    console.error("❌ Error saving land info:", error);
    throw error;
  }
};

// Get land info
export const getLandInfo = (requestId: number): LandInfo | null => {
  try {
    console.log("🔍 ======= START FETCH LAND INFO =======");
    console.log("🔍 Fetching land info for requestId:", requestId);

    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectionland WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("🔍 Raw row from SQLite:", {
        latitude: row.latitude,
        longitude: row.longitude,
        locationName: row.locationName,
        hasLatitude: row.latitude !== null,
        hasLongitude: row.longitude !== null,
        rowKeys: Object.keys(row),
      });

      // Parse images JSON
      let images: LandImage[] = [];
      if (row.images) {
        try {
          images = JSON.parse(row.images);
          console.log("📸 Parsed images:", images.length);
        } catch (e) {
          console.error("❌ Failed to parse images:", e);
          images = [];
        }
      }

      // Build geoLocation if coordinates exist
      let geoLocation: GeoLocation | undefined;

      // Check if latitude and longitude are not null and are valid numbers
      if (
        row.latitude !== null &&
        row.longitude !== null &&
        !isNaN(parseFloat(row.latitude)) &&
        !isNaN(parseFloat(row.longitude))
      ) {
        console.log("📍 Valid geo coordinates found:");
        console.log("📍 Latitude:", row.latitude);
        console.log("📍 Longitude:", row.longitude);
        console.log("📍 LocationName:", row.locationName);

        geoLocation = {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          locationName: row.locationName || "Selected Location",
        };
        console.log("📍 Parsed geoLocation:", geoLocation);
      } else {
        console.log("📍 No valid geo coordinates in database");
        console.log(
          "📍 Latitude value:",
          row.latitude,
          "Type:",
          typeof row.latitude,
        );
        console.log(
          "📍 Longitude value:",
          row.longitude,
          "Type:",
          typeof row.longitude,
        );
      }

      const result = {
        isOwnByFarmer: row.isOwnByFarmer as "Yes" | "No" | undefined,
        ownershipStatus: row.ownershipStatus,
        landDiscription: row.landDiscription || "",
        geoLocation,
        images,
      };

      console.log("✅ Returning land info:", JSON.stringify(result, null, 2));
      console.log("🔍 ======= END FETCH LAND INFO =======");
      return result;
    }

    console.log("📭 No land info found in SQLite for requestId:", requestId);
    console.log("🔍 ======= END FETCH LAND INFO =======");
    return null;
  } catch (error) {
    console.error("❌ Error fetching land info:", error);
    console.log("🔍 ======= END FETCH LAND INFO =======");
    return null;
  }
};

// Clear land info for a specific request
export const clearLandInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectionland WHERE requestId = ?", [requestId]);
    console.log("🗑️ Cleared land info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing land info:", error);
    throw error;
  }
};

// Get all land records
export const getAllLandInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectionland ORDER BY updatedAt DESC",
    );
    return rows;
  } catch (error) {
    console.error("❌ Error fetching all land info:", error);
    return [];
  }
};