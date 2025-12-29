import React, { useEffect, useState } from "react";
import { Alert, BackHandler, Text, View, Dimensions, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { LogBox } from "react-native";

import store, { RootState } from "@/services/store";
import { navigationRef } from "../navigationRef";
import { LanguageProvider } from "@/context/LanguageContext";
import NavigationBar from "@/Items/NavigationBar";
import Splash from "@/component/Splash";
import Lanuage from "@/component/Lanuage";
import Login from "@/component/Login";
import Dashboard from "@/component/ChiefFieldOfficer/Dashboard";
import { NativeWindStyleSheet } from "nativewind";
import CustomDrawerContent from '@/Items/CustomDrawerContent';
import FieldOfficerDashboard from "@/component/FeildOfficer/FieldOfficerDashboard";
import ProfileScreen from "@/component/Profile";
import AddComplaintScreen from "@/component/AddComplaint";
import ViewAllVisits from "@/component/ViewAllVisits";
import QRScanner from "@/component/QRScanner";
import CertificateQuesanory from "@/component/CertificateQuesanory";
import CertificateSuggestions from "@/component/CertificateSuggestions"
import Otpverification from "@/component/Otpverification";
import OtpverificationSuccess from "@/component/OtpverificationSuccess";
import ViewFarmsCluster from "@/component/ViewFarmsCluster";
import QRScaneerRequstAudit from "@/component/QRScaneerRequstAudit";
import RequestSuggestions from "@/component/RequestSuggestions";
import RequestProblem from "@/component/RequestProblem";
import ManageOfficers from "@/component/ChiefFieldOfficer/ManageOfficers";
import AddOfficerStep1 from "@/component/ChiefFieldOfficer/AddOfficerStep1";
import AddOfficerStep2 from "@/component/ChiefFieldOfficer/AddOfficerStep2";
import AddOfficerStep3 from "@/component/ChiefFieldOfficer/AddOfficerStep3";
import OtpverificationRequestAudit from "@/component/OtpverificationRequestAudit";
import ChangePassword from "@/component/ChangePassword";
import ComplainHistory from "@/component/ComplainHistory";
import AssignJobs from "@/component/AssignJobs";
import CapitalRequests from "@/component/ChiefFieldOfficer/CapitalRequests";
import RequestDetails from "@/component/ChiefFieldOfficer/RequestDetails";
import AssignJobOfficerList from "@/component/AssignJobOfficerList";
import PersonalInfo from "@/component/CapitalRequest/PersonalInfo";
import IDProof from "@/component/CapitalRequest/IDProof";
import FinanceInfo from "@/component/CapitalRequest/FinanceInfo";

LogBox.ignoreAllLogs(true);
NativeWindStyleSheet.setOutput({ default: "native" });

(Text as any).defaultProps = { ...(Text as any).defaultProps, allowFontScaling: false };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, allowFontScaling: false };

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Example Screen
function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-blue-100">
      <Text className="text-2xl font-bold text-blue-800">Home Screen</Text>
    </View>
  );
}


function MainTabs() {
  const jobRole = useSelector((state: RootState) => state.auth.jobRole);
  const [initialTab, setInitialTab] = useState<string | null>(null);

  useEffect(() => {
    if (jobRole === "Chief Field Officer") {
      setInitialTab("Dashboard");
    } else if (jobRole === "Field Officer") {
      setInitialTab("FieldOfficerDashboard");
    }
  }, [jobRole]);

  if (!initialTab) {
    return null; // or <ActivityIndicator />
  }

  return (
    <Tab.Navigator
      initialRouteName={initialTab}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: false,
        tabBarStyle: { position: "absolute", backgroundColor: "#fff" },
      }}
      tabBar={(props) => <NavigationBar {...props} />}
    >
      {jobRole === "Chief Field Officer" ? (
        <>
          <Tab.Screen name="Dashboard" component={Dashboard} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="ViewAllVisits" component={ViewAllVisits} />

          <Tab.Screen name="ManageOfficers" component={ManageOfficers} />
          <Tab.Screen name="AddOfficerStep1" component={AddOfficerStep1} />
          <Tab.Screen name="AddOfficerStep2" component={AddOfficerStep2} />
          <Tab.Screen name="AddOfficerStep3" component={AddOfficerStep3} />
          <Tab.Screen name="AssignJobs" component={AssignJobs} />
          <Tab.Screen name="CapitalRequests" component={CapitalRequests} />
          <Tab.Screen name="AssignJobOfficerList" component={AssignJobOfficerList} />
        </>
      ) : (
        <>
          <Tab.Screen
            name="FieldOfficerDashboard"
            component={FieldOfficerDashboard}
          />
          <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="ViewAllVisits" component={ViewAllVisits} />
        </>
      )}
    </Tab.Navigator>
  );
}


function MainDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: "front", 
               drawerStyle: {
      width: "80%"
    },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} options={{ drawerItemStyle: { display: "none" } }}/>
      <Drawer.Screen  name="FieldOfficerDashboard" component={FieldOfficerDashboard} options={{ drawerItemStyle: { display: "none" } }} />
      {/* <Drawer.Screen name="AddComplaint" component={AddComplaintScreen} options={{ drawerItemStyle: { display: "none" } }}/> */}
      <Drawer.Screen name="ViewAllVisits" component={ViewAllVisits} options={{ drawerItemStyle: { display: "none" } }}/>

    </Drawer.Navigator>
  );
}


function AppContent() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isOfflineAlertShown, setIsOfflineAlertShown] = useState(false);

  // Internet Check
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (!state.isConnected && !isOfflineAlertShown) {
        setIsOfflineAlertShown(true);
        Alert.alert(
          t("Main.No Internet Connection"),
          t("Main.Please turn on mobile data or Wi-Fi to continue."),
          [
            {
              text: "OK",
              onPress: () => setIsOfflineAlertShown(false),
            },
          ]
        );
      }
    });
    return () => unsubscribeNetInfo();
  }, [isOfflineAlertShown]);

  // Back Button Handler
  useEffect(() => {
    const backAction = () => {
      if (!navigationRef.isReady()) return false;
      const currentRouteName = navigationRef.getCurrentRoute()?.name ?? "";
      if (currentRouteName === "Dashboard") {
        BackHandler.exitApp();
        return true;
      } else if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, paddingBottom: insets.bottom, backgroundColor: "#fff" }}
        edges={["top", "right", "left"]}
      >
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Language" component={Lanuage} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Main" component={MainDrawer} />
            <Stack.Screen name="CertificateQuesanory" component={CertificateQuesanory} />
            <Stack.Screen name="CertificateSuggestions" component={CertificateSuggestions}/>
            <Stack.Screen name="Otpverification" component={Otpverification} />
            <Stack.Screen name="OtpverificationSuccess" component={OtpverificationSuccess} />
            <Stack.Screen name="ViewFarmsCluster" component={ViewFarmsCluster} />
            <Stack.Screen name="RequestSuggestions" component={RequestSuggestions} />
            <Stack.Screen name="RequestProblem" component={RequestProblem} />
            <Stack.Screen name="OtpverificationRequestAudit" component={OtpverificationRequestAudit} />
            <Stack.Screen name="ChangePassword" component={ChangePassword} />
            <Stack.Screen name="ComplainHistory" component={ComplainHistory} />
                  <Stack.Screen name="AddComplaint" component={AddComplaintScreen}/>

                      <Stack.Screen name="QRScanner" component={QRScanner} />
          <Stack.Screen name="QRScaneerRequstAudit" component={QRScaneerRequstAudit} />
                    <Stack.Screen name="RequestDetails" component={RequestDetails} />
                    <Stack.Screen name="PersonalInfo" component={PersonalInfo} />
                    <Stack.Screen name="IDProof" component={IDProof} />
                    <Stack.Screen name="FinanceInfo" component={FinanceInfo} />

          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
