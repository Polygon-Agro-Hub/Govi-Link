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
     QRScanner: { farmerId?: number, jobId? : string, certificationpaymentId:number}; 
     CertificateQuesanory:{ jobId?: string, certificationpaymentId:number}; 
     CertificateSuggestions: { jobId?: string, certificationpaymentId:number}; 
}
