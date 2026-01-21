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
      state[action.payload.jobId] = action.payload.data;
    },
    updateFinanceInfo: (
      state,
      action: PayloadAction<{
        jobId: string;
        updates: Partial<FinanceInfoData>;
      }>
    ) => {
      const { jobId, updates } = action.payload;
      if (state[jobId]) {
        state[jobId].inspectionfinance = {
          ...state[jobId].inspectionfinance,
          ...updates,
        };
      } else {
        state[jobId] = {
          inspectionfinance: updates,
        };
      }
    },
    clearFinanceInfo: (state, action: PayloadAction<string>) => {
      delete state[action.payload];
    },
  },
});

export const { setFinanceInfo, updateFinanceInfo, clearFinanceInfo } =
  financeInfoSlice.actions;
export default financeInfoSlice.reducer;