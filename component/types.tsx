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
     QRScanner: { farmerId?: number, jobId? : string, certificationpaymentId:number, farmerMobile:number, clusterId:number, farmId:number, isClusterAudit:boolean,  auditId:number}; 
     QRScaneerRequstAudit: { farmerId?: number, govilinkjobid?: number, jobId? : string, farmerMobile?:number};
     CertificateQuesanory:{ jobId?: string, certificationpaymentId:number, farmerMobile:number, clusterId:number, farmId:number, isClusterAudit:boolean,  auditId:number}; 
     CertificateSuggestions: { jobId?: string, certificationpaymentId:number,slavequestionnaireId:number, farmerMobile:number, isClusterAudit:boolean, farmId:number, auditId:number}; 
     Otpverification:{farmerMobile:number, jobId?:string, isClusterAudit:boolean, farmId:number, auditId:number}
     ViewFarmsCluster:{ jobId?: string, farmName:string,feildauditId:number}; 
     RequestSuggestions: { farmerId?: number, govilinkjobid?: number, jobId? : string, farmerMobile?:number};
     RequestProblem: { farmerId?: number, govilinkjobid?: number, jobId? : string, farmerMobile?:number};
      OtpverificationRequestAudit:{farmerId?: number, govilinkjobid?: number, jobId? : string, farmerMobile?:number};
      ManageOfficers: undefined;
      AddOfficerStep1: undefined;
      AddOfficerStep2: { formData: any };
      AddOfficerStep3: { formData: any }; 
      ChangePassword: {passwordUpdate: number};
      ComplainHistory:undefined;
      AssignJobs: undefined;
}
