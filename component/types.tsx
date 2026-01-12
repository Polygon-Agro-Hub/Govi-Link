export type RootStackParamList = {
  Main: { screen: keyof RootStackParamList; params?: any };
  MainTabs: { screen: keyof RootStackParamList; params?: any };

  Dashboard: undefined;
  Lanuage: undefined;
  Splash: undefined;
  Login: undefined;
  FieldOfficerDashboard: undefined;
  Profile: undefined;
  AddComplaint: undefined;
  ViewAllVisits: undefined;
  QRScanner: {
    farmerId?: number;
    jobId?: string;
    certificationpaymentId: number;
    farmerMobile: number;
    clusterId: number;
    farmId: number;
    isClusterAudit: boolean;
    auditId: number;
    screenName: any;
  };
  QRScaneerRequstAudit: {
    farmerId?: number;
    govilinkjobid?: number;
    jobId?: string;
    farmerMobile?: number;
    screenName: any;
  };
  CertificateQuesanory: {
    jobId?: string;
    certificationpaymentId: number;
    farmerMobile: number;
    clusterId: number;
    farmId: number;
    isClusterAudit: boolean;
    auditId: number;
    screenName: any;
  };
  CertificateSuggestions: {
    jobId?: string;
    certificationpaymentId: number;
    slavequestionnaireId: number;
    farmerMobile: number;
    isClusterAudit: boolean;
    farmId: number;
    auditId: number;
  };
  Otpverification: {
    farmerMobile: number;
    jobId?: string;
    isClusterAudit: boolean;
    farmId: number;
    auditId: number;
  };
  ViewFarmsCluster: {
    jobId?: string;
    farmName: string;
    feildauditId: number;
    screenName: any;
  };
  RequestSuggestions: {
    farmerId?: number;
    govilinkjobid?: number;
    jobId?: string;
    farmerMobile?: number;
  };
  RequestProblem: {
    farmerId?: number;
    govilinkjobid?: number;
    jobId?: string;
    farmerMobile?: number;
    screenName: any;
  };
  OtpverificationRequestAudit: {
    farmerId?: number;
    govilinkjobid?: number;
    jobId?: string;
    farmerMobile?: number;
  };
  ManageOfficers: undefined;
  AddOfficerStep1: { isnew?: boolean };
  AddOfficerStep2: { formData: any; isnewsecondstep?: boolean };
  AddOfficerStep3: { formData: any; isnewthirdstep?: boolean };
  ChangePassword: { passwordUpdate: number };
  ComplainHistory: undefined;
  AssignJobs: undefined;
  CapitalRequests: undefined;
  RequestDetails: { requestId: number; requestNumber: string };
  AssignJobOfficerList: {
    selectedJobIds: string[];
    selectedDate: string;
    isOverdueSelected: boolean;
    propose: string;
    fieldAuditId?: number;
    fieldAuditIds?: number[];
    govilinkJobIds?: number[];
    auditType?: "feildaudits" | "govilinkjobs";
  };

  PersonalInfo: {
    requestNumber: string;
    requestId: number;
  };
  IDProof: { formData: any; requestNumber: string; requestId: number };
  FinanceInfo: { formData: any; requestNumber: string; requestId: number };
  LandInfo: { formData: any; requestNumber: string; requestId: number };
  AttachGeoLocationScreen: {
    currentLatitude?: number;
    currentLongitude?: number;
    onLocationSelect?: (
      latitude: number,
      longitude: number,
      locationName: string
    ) => void;
  };
  ViewLocationScreen: {
    latitude: number;
    longitude: number;
    locationName?: string;
  };
  InvestmentInfo: { formData: any; requestNumber: string; requestId: number };
  CultivationInfo: { formData: any; requestNumber: string; requestId: number };
  CroppingSystems: { formData: any; requestNumber: string; requestId: number };
  ProfitRisk: { formData: any; requestNumber: string; requestId: number };
  Economical: { formData: any; requestNumber: string; requestId: number };
  Labour: { formData: any; requestNumber: string; requestId: number };
  HarvestStorage: { formData: any; requestNumber: string; requestId: number };
  ConfirmationCapitalRequest: {
    formData: any;
    requestNumber: string;
    requestId: number;
  };
};
