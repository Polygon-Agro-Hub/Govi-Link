import * as SQLite from "expo-sqlite";

export const deleteAllInspectionData = async (
  requestId: string | number,
): Promise<void> => {
  try {
    const db = SQLite.openDatabaseSync("inspection.db");
    const id = Number(requestId);

    await db.withTransactionAsync(async () => {
      const tables = [
        "inspectionpersonal",
        "inspectionidproof",
        "inspectionfinance",
        "inspectionland",
        "inspectioncultivation",
        "inspectioninvestment",
        "inspectioncropping",
        "inspectionprofit",
        "inspectioneconomical",
        "inspectionlabour",
        "inspectionharvest",
      ];

      for (const table of tables) {
        try {
          await db.runAsync(`DELETE FROM ${table} WHERE requestId = ?`, [id]);
        } catch (error: any) {
          if (error.message?.includes("no such table")) {
          } else {
            console.error(`Error deleting from ${table}:`, error);
            throw error;
          }
        }
      }
    });

    await db.closeAsync();
  } catch (error) {
    console.error("SQLite deletion error:", error);
  }
};
