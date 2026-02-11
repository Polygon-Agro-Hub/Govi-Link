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
          console.log(`Deleted from ${table}  ${id}`);
        } catch (error: any) {
          if (error.message?.includes("no such table")) {
            console.log(`Table ${table} doesn't exist, skipping`);
          } else {
            console.error(`Error deleting from ${table}:`, error);
            throw error;
          }
        }
      }
    });

    await db.closeAsync();
    console.log(`✅ SQLite cleanup completed for requestId ${id}`);
  } catch (error) {
    console.error("❌ SQLite deletion error:", error);
    console.log("⚠️ Local SQLite cleanup failed, but backend data was deleted");
  }
};