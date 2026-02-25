import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

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
    
  } catch (error) {
    console.error(" Error initializing cultivation table:", error);
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
  waterImages: WaterImage[];
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
    const existing = db.getFirstSync<{ requestId: number }>(
      "SELECT requestId FROM inspectioncultivation WHERE requestId = ?",
      [requestId],
    );

    const dbData: any = {};

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

    if (data.waterSources && Array.isArray(data.waterSources)) {
      dbData.waterSources = JSON.stringify(data.waterSources);
    }

    if (data.waterImages && Array.isArray(data.waterImages)) {
      dbData.waterImage = JSON.stringify(data.waterImages);
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
        `UPDATE inspectioncultivation SET ${fields}, updatedAt = ? WHERE requestId = ?`,
        values as SQLite.SQLiteBindParams,
      );

      console.log("Cultivation info updated in SQLite");
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
        `INSERT INTO inspectioncultivation (${fields}) VALUES (${placeholders})`,
        values as SQLite.SQLiteBindParams,
      );

      console.log(" Cultivation info inserted into SQLite");
    }
  } catch (error) {
    console.error(" Error saving cultivation info:", error);
    throw error;
  }
};

export const getCultivationInfo = (
  requestId: number,
): CultivationInfo | null => {
  try {
    const row = db.getFirstSync<any>(
      "SELECT * FROM inspectioncultivation WHERE requestId = ?",
      [requestId],
    );

    if (row) {
      let waterSources: string[] = [];
      if (row.waterSources) {
        try {
          waterSources = JSON.parse(row.waterSources);
        } catch (e) {
          waterSources = [];
        }
      }

      let waterImages: WaterImage[] = [];
      if (row.waterImage) {
        try {
          const images = JSON.parse(row.waterImage);
          if (Array.isArray(images)) {
            waterImages = images;
          }
        } catch (e) {
          console.error("Failed to parse water images:", e);
        }
      }

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
        waterImages,
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

      return result;
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching cultivation info:", error);

    return null;
  }
};

export const clearCultivationInfo = (requestId: number): void => {
  try {
    db.runSync("DELETE FROM inspectioncultivation WHERE requestId = ?", [
      requestId,
    ]);
  } catch (error) {
    console.error("Error clearing cultivation info:", error);
    throw error;
  }
};

export const getAllCultivationInfo = () => {
  try {
    const rows = db.getAllSync<any>(
      "SELECT * FROM inspectioncultivation ORDER BY updatedAt DESC",
    );
    return rows;
  } catch (error) {
    console.error("Error fetching all cultivation info:", error);
    return [];
  }
};
