import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type FinanceInfoData = {
  accHolder?: string;
  accountNumber?: number;
  confirmAccountNumber?: number;
  bank?: string;
  branch?: string;
  debtsOfFarmer?: string;
  noOfDependents?: string;
  assets?: {
    [parentKey: string]: string[];
  };
  assetsLand?: string[];
  assetsBuilding?: string[];
  assetsVehicle?: string[];
  assetsMachinery?: string[];
  assetsFarmTool?: string;
};

type FormData = {
  inspectionfinance?: FinanceInfoData;
  requestId?: number;
  requestNumber?: string;
};

type FinanceInfoState = {
  [jobId: string]: FormData;
};

const initialState: FinanceInfoState = {};

const financeInfoSlice = createSlice({
  name: 'financeInfo',
  initialState,
  reducers: {
    setFinanceInfo: (
      state,
      action: PayloadAction<{ jobId: string; data: FormData }>
    ) => {
      const { jobId, data } = action.payload;
      // Create a new object to avoid mutation issues
      return {
        ...state,
        [jobId]: { ...data }
      };
    },
    updateFinanceInfo: (
      state,
      action: PayloadAction<{
        jobId: string;
        updates: Partial<FinanceInfoData>;
      }>
    ) => {
      const { jobId, updates } = action.payload;
      
      return {
        ...state,
        [jobId]: {
          ...state[jobId],
          inspectionfinance: {
            ...(state[jobId]?.inspectionfinance || {}),
            ...updates,
          },
        },
      };
    },
    clearFinanceInfo: (state, action: PayloadAction<number>) => {
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    },
  },
});

export const { setFinanceInfo, updateFinanceInfo, clearFinanceInfo } =
  financeInfoSlice.actions;
export default financeInfoSlice.reducer;