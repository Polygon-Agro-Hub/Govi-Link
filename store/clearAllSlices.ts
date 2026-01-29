// Create a new file: @/store/clearAllSlices.ts

import { AppDispatch } from '@/services/store';
import { clearAllIDProof } from '@/store/IDproofSlice';
import { clearAllPersonalInfo } from '@/store/personalInfoSlice';
import { clearAllLandInfo } from '@/store/LandInfoSlice';
import { clearLabourInfo } from '@/store/labourSlice';
import { clearHarvestStorageInfo } from '@/store/HarvestStorageSlice';
import { clearAllInvestmentInfo } from '@/store/investmentInfoSlice';
import { clearFinanceInfo } from '@/store/financeInfoSlice';
import { clearAllCroppingSystems } from '@/store/croppingSystemsSlice';
import { clearEconomical } from '@/store/economicalSlice';
import { clearAllCultivationInfo } from '@/store/cultivationInfoSlice';
import { clearAllProfitRisk } from '@/store/profitRiskSlice';

/**
 * Clears all Redux slices for a specific request
 * This should be called after successful form submission and navigation
 * 
 * @param dispatch - Redux dispatch function
 * @param requestId - The request ID to clear data for
 */


export const clearAllInspectionSlices = (
  dispatch: AppDispatch,
  requestId: number
) => {
  try {
    console.log(`🗑️ Clearing all Redux slices for requestId: ${requestId}...`);

    dispatch(clearAllIDProof());
    dispatch(clearAllPersonalInfo());
    dispatch(clearAllLandInfo());
    dispatch(clearLabourInfo({ requestId }));
    dispatch(clearHarvestStorageInfo({ requestId }));
    dispatch(clearAllInvestmentInfo());
    dispatch(clearFinanceInfo(requestId));
    dispatch(clearAllCroppingSystems());
    dispatch(clearEconomical({ requestId }));
    dispatch(clearAllCultivationInfo());
    dispatch(clearAllProfitRisk());

    console.log('✅ All Redux slices cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing Redux slices:', error);
    throw error;
  }
};