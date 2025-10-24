export type RootStackParamList = {
 
   // Main:{screen: keyof RootStackParamList};
   Main: { screen: keyof RootStackParamList; params?: any };
   Dashboard: undefined
   Lanuage:undefined
   Splash:undefined
   Login:undefined
   FieldOfficerDashboard: undefined
   FieldOfficerDrawer: { screen: "FieldOfficerDashboard"; params?: any }; 
}