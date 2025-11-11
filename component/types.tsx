export type RootStackParamList = {
 
   Main: { screen: keyof RootStackParamList; params?: any };
   Dashboard: undefined
   Lanuage:undefined
   Splash:undefined
   Login:undefined
   FieldOfficerDashboard: undefined
   Profile:undefined;
   AddComplaint:undefined
     ViewAllVisits: undefined;
     QRScanner: { farmerId?: number, jobId? : string, certificationpaymentId:number, farmerMobile:number, clusterId:number, farmId:number}; 
     CertificateQuesanory:{ jobId?: string, certificationpaymentId:number, farmerMobile:number, clusterId:number, farmId:number}; 
     CertificateSuggestions: { jobId?: string, certificationpaymentId:number,slavequestionnaireId:number, farmerMobile:number}; 
     Otpverification:{farmerMobile:number, jobId?:string}
     ViewFarmsCluster:{ jobId?: string, farmName:string,feildauditId:number}; 
}
