import { combineReducers } from 'redux';
import authReducer from '@/store/authSlice';
import personalInfoReducer from '@/store/personalInfoSlice';
import idProofReducer from '@/store/IDproofSlice';
import landInfoReducer from '@/store/LandInfoSlice';
import financeInfoReducer from '@/store/financeInfoSlice';
import investmentInfoReducer from '@/store/investmentInfoSlice';

const appReducer = combineReducers({
  auth: authReducer,
  inspectionpersonal: personalInfoReducer,
  inspectionidproof: idProofReducer,
  inspectionland: landInfoReducer,
  financeInfo: financeInfoReducer,
  investmentInfo: investmentInfoReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logoutUser') {
    state = undefined; // clears all slices
  }
  return appReducer(state, action);
};

export default rootReducer;
