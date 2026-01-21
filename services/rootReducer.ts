import { combineReducers } from 'redux';
import authReducer from '@/store/authSlice';
import personalInfoReducer from '@/store/personalInfoSlice';
import idProofReducer from '@/store/IDproofSlice';
import landInfoReducer from '@/store/LandInfoSlice';
import financeInfoReducer from '@/store/financeInfoSlice';
import investmentInfoReducer from '@/store/investmentInfoSlice';
import cultivationInfoReducer from '@/store/cultivationInfoSlice';
import croppingSystemsReducer from '@/store/croppingSystemsSlice';
import profitRiskReducer from '@/store/profitRiskSlice';
import economicalReducer from '@/store/economicalSlice';
import labourReducer from '@/store/labourSlice';
import harvestStorageReducer from '@/store/HarvestStorageSlice';



const appReducer = combineReducers({
  auth: authReducer,
  inspectionpersonal: personalInfoReducer,
  inspectionidproof: idProofReducer,
  inspectionland: landInfoReducer,
  financeInfo: financeInfoReducer,
  investmentInfo: investmentInfoReducer,
  cultivationInfo: cultivationInfoReducer,
  croppingSystems: croppingSystemsReducer,
  profitRisk: profitRiskReducer,
  economical: economicalReducer,
  labourInfo: labourReducer,
  harvestStorage: harvestStorageReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logoutUser') {
    state = undefined; // clears all slices
  }
  return appReducer(state, action);
};

export default rootReducer;
