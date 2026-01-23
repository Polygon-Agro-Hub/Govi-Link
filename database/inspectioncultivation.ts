import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

// Initialize cultivation table
export const initCultivationTable = () => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS inspectioncultivation (
        requestId INTEGER PRIMARY KEY,
        temperature INTEGER,
        rainfall INTEGER,
        sunShine INTEGER,
        humidity INTEGER,
        windVelocity INTEGER,
        windDirection INTEGER,
        zone INTEGER,
        isCropSuitale TEXT,
        ph REAL,
        soilType TEXT,
        soilfertility TEXT,
        waterSources TEXT,
        otherWaterSource TEXT,
        waterImage TEXT,
        isRecevieRainFall TEXT,
        isRainFallSuitableCrop TEXT,
        isRainFallSuitableCultivation TEXT,
        isElectrocityAvailable TEXT,
        ispumpOrirrigation TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    console.log("✅ Cultivation table created/verified");
  } catch (error) {
    console.error("❌ Error initializing cultivation table:", error);
    throw error;
  }
};

export interface WaterImage {
  uri: string;
  name: string;
  type: string;
}

export interface CultivationInfo {
  temperature: "yes" | "no" | null;
  rainfall: "yes" | "no" | null;
  sunShine: "yes" | "no" | null;
  humidity: "yes" | "no" | null;
  windVelocity: "yes" | "no" | null;
  windDirection: "yes" | "no" | null;
  zone: "yes" | "no" | null;
  isCropSuitale: "Yes" | "No" | undefined;
  ph: number;
  soilType: string;
  soilfertility: string;
  waterSources: string[];
  otherWaterSource: string;
  waterImage: WaterImage | null;
  isRecevieRainFall: "Yes" | "No" | undefined;
  isRainFallSuitableCrop: "Yes" | "No" | undefined;
  isRainFallSuitableCultivation: "Yes" | "No" | undefined;
  isElectrocityAvailable: "Yes" | "No" | undefined;
  ispumpOrirrigation: "Yes" | "No" | undefined;
}

// Save or update cultivation info
export const saveCultivationInfo = (
  requestId: number,
  data: Partial<CultivationInfo>,
): void => {
  try {
    console.log("💾 ======= START SAVE CULTIVATION INFO =======");
    console.log("💾 Request ID:", requestId);
    console.log("💾 Full data to save:", JSON.stringify(data, null, 2));

    // Check if record exists
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectioncultivation WHERE requestId = ?",
      [requestId],
    );

    console.log("💾 Existing record found?", !!existing);

    // Transform data for database
    const dbData: any = {};

    // Convert "yes"/"no" to 1/0 for climate parameters
    const yesNoToBool = (val: any): number | null => {
      if (val === "yes") return 1;
      if (val === "no") return 0;
      return null;
    };

    // Climate parameters
    if (data.temperature !== undefined) {
      dbData.temperature = yesNoToBool(data.temperature);
    }
    if (data.rainfall !== undefined) {
      dbData.rainfall = yesNoToBool(data.rainfall);
    }
    if (data.sunShine !== undefined) {
      dbData.sunShine = yesNoToBool(data.sunShine);
    }
    if (data.humidity !== undefined) {
      dbData.humidity = yesNoToBool(data.humidity);
    }
    if (data.windVelocity !== undefined) {
      dbData.windVelocity = yesNoToBool(data.windVelocity);
    }
    if (data.windDirection !== undefined) {
      dbData.windDirection = yesNoToBool(data.windDirection);
    }
    if (data.zone !== undefined) {
      dbData.zone = yesNoToBool(data.zone);
    }

    // Yes/No fields
    if (data.isCropSuitale !== undefined) {
      dbData.isCropSuitale = data.isCropSuitale;
    }
    if (data.isRecevieRainFall !== undefined) {
      dbData.isRecevieRainFall = data.isRecevieRainFall;
    }
    if (data.isRainFallSuitableCrop !== undefined) {
      dbData.isRainFallSuitableCrop = data.isRainFallSuitableCrop;
    }
    if (data.isRainFallSuitableCultivation !== undefined) {
      dbData.isRainFallSuitableCultivation = data.isRainFallSuitableCultivation;
    }
    if (data.isElectrocityAvailable !== undefined) {
      dbData.isElectrocityAvailable = data.isElectrocityAvailable;
    }
    if (data.ispumpOrirrigation !== undefined) {
      dbData.ispumpOrirrigation = data.ispumpOrirrigation;
    }

    // Other fields
    if (data.ph !== undefined) {
      dbData.ph = data.ph;
    }
    if (data.soilType !== undefined) {
      dbData.soilType = data.soilType;
    }
    if (data.soilfertility !== undefined) {
      dbData.soilfertility = data.soilfertility;
    }
    if (data.otherWaterSource !== undefined) {
      dbData.otherWaterSource = data.otherWaterSource;
    }

    // Water sources (JSON array)
    if (data.waterSources && Array.isArray(data.waterSources)) {
      dbData.waterSources = JSON.stringify(data.waterSources);
      console.log("💧 Saving water sources count:", data.waterSources.length);
    }

    // Water image
    if (data.waterImage) {
      dbData.waterImage = JSON.stringify([data.waterImage]);
      console.log("📸 Saving water image");
    }

    console.log("💾 Database values to save:", dbData);

    // Check if there's actually data to save
    if (Object.keys(dbData).length === 0) {
      console.log("⚠️ No data to save, skipping database operation");
      console.log("💾 ======= END SAVE CULTIVATION INFO =======");
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

      console.log("🔄 UPDATE query values:", values);

      const result = db.runSync(
        `UPDATE inspectioncultivation SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );

      console.log("🔄 Update rows affected:", result?.changes || 0);
      console.log("✅ Cultivation info updated in SQLite");
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

      console.log("📝 INSERT query values:", values);

      const result = db.runSync(
        `INSERT INTO inspectioncultivation (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );

      console.log("📝 Insert result:", result);
      console.log("✅ Cultivation info inserted into SQLite");
    }

    console.log("💾 ======= END SAVE CULTIVATION INFO =======");
  } catch (error) {
    console.error("❌ Error saving cultivation info:", error);
    throw error;
  }
};

// Get cultivation info
export const getCultivationInfo = (
  requestId: number,
): CultivationInfo | null => {
  try {
    console.log("🔍 ======= START FETCH CULTIVATION INFO =======");
    console.log("🔍 Fetching cultivation info for requestId:", requestId);

    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectioncultivation WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      console.log("🔍 Raw row from SQLite:", row);

      // Parse water sources
      let waterSources: string[] = [];
      if (row.waterSources) {
        try {
          waterSources = JSON.parse(row.waterSources);
          console.log("💧 Parsed water sources:", waterSources.length);
        } catch (e) {
          console.error("❌ Failed to parse water sources:", e);
          waterSources = [];
        }
      }

      // Parse water image
      let waterImage: WaterImage | null = null;
      if (row.waterImage) {
        try {
          const images = JSON.parse(row.waterImage);
          if (Array.isArray(images) && images.length > 0) {
            waterImage = images[0];
            console.log("📸 Parsed water image");
          }
        } catch (e) {
          console.error("❌ Failed to parse water image:", e);
        }
      }

      // Convert 1/0 to "yes"/"no" for climate parameters
      const boolToYesNo = (val: any): "yes" | "no" | null => {
        if (val === 1) return "yes";
        if (val === 0) return "no";
        return null;
      };

      const result: CultivationInfo = {
        temperature: boolToYesNo(row.temperature),
        rainfall: boolToYesNo(row.rainfall),
        sunShine: boolToYesNo(row.sunShine),
        humidity: boolToYesNo(row.humidity),
        windVelocity: boolToYesNo(row.windVelocity),
        windDirection: boolToYesNo(row.windDirection),
        zone: boolToYesNo(row.zone),
        isCropSuitale: row.isCropSuitale as "Yes" | "No" | undefined,
        ph: row.ph ? parseFloat(row.ph) : 0,
        soilType: row.soilType || "",
        soilfertility: row.soilfertility || "",
        waterSources,
        otherWaterSource: row.otherWaterSource || "",
        waterImage,
        isRecevieRainFall: row.isRecevieRainFall as "Yes" | "No" | undefined,
        isRainFallSuitableCrop: row.isRainFallSuitableCrop as
          | "Yes"
          | "No"
          | undefined,
        isRainFallSuitableCultivation: row.isRainFallSuitableCultivation as
          | "Yes"
          | "No"
          | undefined,
        isElectrocityAvailable: row.isElectrocityAvailable as
          | "Yes"
          | "No"
          | undefined,
        ispumpOrirrigation: row.ispumpOrirrigation as "Yes" | "No" | undefined,
      };

      console.log(
        "✅ Returning cultivation info:",
        JSON.stringify(result, null, 2),
      );
      console.log("🔍 ======= END FETCH CULTIVATION INFO =======");
      return result;
    }

    console.log(
      "📭 No cultivation info found in SQLite for requestId:",
      requestId,
    );
    console.log("🔍 ======= END FETCH CULTIVATION INFO =======");
    return null;
  } catch (error) {
    console.error("❌ Error fetching cultivation info:", error);
    console.log("🔍 ======= END FETCH CULTIVATION INFO =======");
    return null;
  }
};

// Clear cultivation info for a specific request
export const clearCultivationInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectioncultivation WHERE requestId = ?", [
      requestId,
    ]);
    console.log("🗑️ Cleared cultivation info for request:", requestId);
  } catch (error) {
    console.error("❌ Error clearing cultivation info:", error);
    throw error;
  }
};

// Get all cultivation records
export const getAllCultivationInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectioncultivation ORDER BY updatedAt DESC",
    );
    return rows;
  } catch (error) {
    console.error("❌ Error fetching all cultivation info:", error);
    return [];
  }
};