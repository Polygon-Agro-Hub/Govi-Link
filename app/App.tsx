import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Text,
  View,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { LogBox } from "react-native";

import store, { RootState } from "@/services/store";
import { navigationRef } from "../navigationRef";
import { LanguageProvider } from "@/context/LanguageContext";
import NavigationBar from "@/Items/NavigationBar";
import Splash from "@/component/auth/Splash";
import Lanuage from "@/component/Lanuage";
import Login from "@/component/auth/Login";
import Dashboard from "@/component/ChiefFieldOfficer/Dashboard";
import { NativeWindStyleSheet } from "nativewind";
import CustomDrawerContent from "@/Items/CustomDrawerContent";
import FieldOfficerDashboard from "@/component/FeildOfficer/FieldOfficerDashboard";
import ProfileScreen from "@/component/auth/Profile";
import AddComplaintScreen from "@/component/complaint/AddComplaint";
import ViewAllVisits from "@/component/ViewAllVisits";
import QRScanner from "@/component/QRScanner";
import CertificateQuesanory from "@/component/CertificateQuesanory";
import CertificateSuggestions from "@/component/CertificateSuggestions";
import Otpverification from "@/component/Otpverification";
import OtpverificationSuccess from "@/component/OtpverificationSuccess";
import ViewFarmsCluster from "@/component/ViewFarmsCluster";
import QRScaneerRequstAudit from "@/component/QRScaneerRequstAudit";
import RequestSuggestions from "@/component/RequestSuggestions";
import RequestProblem from "@/component/RequestProblem";
import ManageOfficers from "@/component/feild-officers/ManageOfficers";
import AddOfficerStep1 from "@/component/feild-officers/AddOfficerStep1";
import AddOfficerStep2 from "@/component/feild-officers/AddOfficerStep2";
import AddOfficerStep3 from "@/component/feild-officers/AddOfficerStep3";
import OtpverificationRequestAudit from "@/component/OtpverificationRequestAudit";
import ChangePassword from "@/component/auth/ChangePassword";
import ComplainHistory from "@/component/complaint/ComplainHistory";
import AssignJobs from "@/component/AssignJobs";
import CapitalRequests from "@/component/capital-request/CapitalRequestsList";
import RequestDetails from "@/component/capital-request/RequestLetter";
import AssignJobOfficerList from "@/component/AssignJobOfficerList";
import PersonalInfo from "@/component/inspection-forms/PersonalInfo";
import IDProof from "@/component/inspection-forms/IDProof";
import FinanceInfo from "@/component/inspection-forms/FinanceInfo";
import LandInfo from "@/component/inspection-forms/LandInfo";
import AttachGeoLocationScreen from "@/component/inspection-forms/AttachGeoLocationScreen";
import ViewLocationScreen from "@/component/inspection-forms/ViewLocationScreen";
import InvestmentInfo from "@/component/inspection-forms/InvestmentInfo";
import CultivationInfo from "@/component/inspection-forms/CultivationInfo";
import CroppingSystems from "@/component/inspection-forms/CroppingSystems";
import ProfitRisk from "@/component/inspection-forms/ProfitRisk";
import Economical from "@/component/inspection-forms/Economical";
import Labour from "@/component/inspection-forms/Labour";
import HarvestStorage from "@/component/inspection-forms/HarvestStorage";
import ConfirmationCapitalRequest from "@/component/inspection-forms/ConfirmationCapitalRequest";

// Import from our new database index
import { initDatabase } from "@/database/index";

LogBox.ignoreAllLogs(true);
NativeWindStyleSheet.setOutput({ default: "native" });

(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  allowFontScaling: false,
};
(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  allowFontScaling: false,
};

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

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
          <Tab.Screen
            name="AssignJobOfficerList"
            component={AssignJobOfficerList}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="FieldOfficerDashboard"
            component={FieldOfficerDashboard}
          />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="ViewAllVisits" component={ViewAllVisits} />
          <Tab.Screen name="CapitalRequests" component={CapitalRequests} />
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
          width: "80%",
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="FieldOfficerDashboard"
        component={FieldOfficerDashboard}
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="ViewAllVisits"
        component={ViewAllVisits}
        options={{ drawerItemStyle: { display: "none" } }}
      />
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
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          paddingBottom: insets.bottom,
          backgroundColor: "#fff",
        }}
        edges={["top", "right", "left"]}
      >
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Language" component={Lanuage} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Main" component={MainDrawer} />
            <Stack.Screen
              name="CertificateQuesanory"
              component={CertificateQuesanory}
            />
            <Stack.Screen
              name="CertificateSuggestions"
              component={CertificateSuggestions}
            />
            <Stack.Screen name="Otpverification" component={Otpverification} />
            <Stack.Screen
              name="OtpverificationSuccess"
              component={OtpverificationSuccess}
            />
            <Stack.Screen
              name="ViewFarmsCluster"
              component={ViewFarmsCluster}
            />
            <Stack.Screen
              name="RequestSuggestions"
              component={RequestSuggestions}
            />
            <Stack.Screen name="RequestProblem" component={RequestProblem} />
            <Stack.Screen
              name="OtpverificationRequestAudit"
              component={OtpverificationRequestAudit}
            />
            <Stack.Screen name="ChangePassword" component={ChangePassword} />
            <Stack.Screen name="ComplainHistory" component={ComplainHistory} />
            <Stack.Screen name="AddComplaint" component={AddComplaintScreen} />

            <Stack.Screen name="QRScanner" component={QRScanner} />
            <Stack.Screen
              name="QRScaneerRequstAudit"
              component={QRScaneerRequstAudit}
            />
            <Stack.Screen name="RequestDetails" component={RequestDetails} />
            <Stack.Screen name="PersonalInfo" component={PersonalInfo} />
            <Stack.Screen name="IDProof" component={IDProof} />
            <Stack.Screen name="FinanceInfo" component={FinanceInfo} />
            <Stack.Screen name="LandInfo" component={LandInfo} />
            <Stack.Screen
              name="AttachGeoLocationScreen"
              component={AttachGeoLocationScreen as any}
            />
            <Stack.Screen
              name="ViewLocationScreen"
              component={ViewLocationScreen as any}
            />
            <Stack.Screen name="InvestmentInfo" component={InvestmentInfo} />
            <Stack.Screen name="CultivationInfo" component={CultivationInfo} />
            <Stack.Screen name="CroppingSystems" component={CroppingSystems} />
            <Stack.Screen name="ProfitRisk" component={ProfitRisk} />
            <Stack.Screen name="Economical" component={Economical} />
            <Stack.Screen name="Labour" component={Labour} />
            <Stack.Screen name="HarvestStorage" component={HarvestStorage} />
            <Stack.Screen
              name="ConfirmationCapitalRequest"
              component={ConfirmationCapitalRequest}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function App() {
  // ✅ SQLite Database Initialization State
  const [dbReady, setDbReady] = useState(false);

  // ✅ Initialize SQLite Database on App Start
  useEffect(() => {
    const initializeDatabase = () => {
      try {
        initDatabase(); // This now initializes ALL tables
        console.log("✅ SQLite Database initialized successfully");
        setDbReady(true);
      } catch (error) {
        console.error("❌ SQLite Database initialization failed:", error);
        // Still set dbReady to true to allow app to continue
        // You can show an alert here if needed
        setDbReady(true);
      }
    };

    initializeDatabase();
  }, []);

  // ✅ Show loading screen while database initializes
  if (!dbReady) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#666",
              fontWeight: "500",
            }}
          >
            Initializing database...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // ✅ Normal App Rendering after DB is ready
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