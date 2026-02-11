import { initPersonalTable } from "./inspectionpersonal";
import { initIDProofTable } from "./inspectionidproof";
import { initFinanceTable } from "./inspectionfinance";
import { initLandTable } from "./inspectionland";
import { initCultivationTable } from "./inspectioncultivation";
import { initInvestmentTable } from "./inspectioninvestment";
import { initCroppingTable } from "./inspectioncropping";
import { initProfitTable } from "./inspectionprofit";
import { initEconomicalTable } from "./inspectioneconomical";
import { initLabourTable } from "./inspectionlabour";
import { initHarvestStorageTable } from "./inspectionharvest";

export const initDatabase = () => {
  try {
    initPersonalTable();
    initIDProofTable();
    initFinanceTable();
    initLandTable();
    initCultivationTable();
    initInvestmentTable();
    initCroppingTable();
    initProfitTable();
    initEconomicalTable();
    initLabourTable();
    initHarvestStorageTable();

    console.log(" All database tables initialized successfully");
  } catch (error) {
    console.error(" Error initializing database:", error);
    throw error;
  }
};

export * from "./inspectionpersonal";
export * from "./inspectionidproof";
export * from "./inspectionfinance";
export * from "./inspectionland";
export * from "./inspectioncultivation";
export * from "./inspectioninvestment";
export * from "./inspectioncropping";
export * from "./inspectionprofit";
export * from "./inspectioneconomical";
export * from "./inspectionlabour";
export * from "./inspectionharvest";
