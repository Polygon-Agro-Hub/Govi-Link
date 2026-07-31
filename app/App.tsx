import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  StatusBar,
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
import Lanuage from "@/component/officers-common-screen/Lanuage";
import Login from "@/component/auth/Login";
import Dashboard from "@/component/chief-field-officer/Dashboard";
import CustomDrawerContent from "@/Items/CustomDrawerContent";
import FieldOfficerDashboard from "@/component/feild-officers/FieldOfficerDashboard";
import ProfileScreen from "@/component/auth/Profile";
import AddComplaintScreen from "@/component/complaint/AddComplaint";
import ViewAllVisits from "@/component/officers-common-screen/ViewAllVisits";
import QRScanner from "@/component/qr-screen/QRScanner";
import CertificateQuesanory from "@/component/officers-common-screen/CertificateQuesanory";
import CertificateSuggestions from "@/component/officers-common-screen/CertificateSuggestions";
import Otpverification from "@/component/otp-screen/Otpverification";
import OtpverificationSuccess from "@/component/otp-screen/OtpverificationSuccess";
import ViewFarmsCluster from "@/component/officers-common-screen/ViewFarmsCluster";
import QRScaneerRequstAudit from "@/component/qr-screen/QRScaneerRequstAudit";
import RequestSuggestions from "@/component/officers-common-screen/RequestSuggestions";
import RequestProblem from "@/component/officers-common-screen/RequestProblem";
import ManageOfficers from "@/component/add-feild-officers/ManageOfficers";
import AddOfficerStep1 from "@/component/add-feild-officers/AddOfficerStep1";
import AddOfficerStep2 from "@/component/add-feild-officers/AddOfficerStep2";
import AddOfficerStep3 from "@/component/add-feild-officers/AddOfficerStep3";
import OtpverificationRequestAudit from "@/component/otp-screen/OtpverificationRequestAudit";
import ChangePassword from "@/component/auth/ChangePassword";
import ComplainHistory from "@/component/complaint/ComplainHistory";
import AssignJobs from "@/component/chief-field-officer/AssignJobs";
import CapitalRequests from "@/component/capital-request/CapitalRequestsList";
import RequestDetails from "@/component/capital-request/RequestLetter";
import AssignJobOfficerList from "@/component/chief-field-officer/AssignJobOfficerList";
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
import CapitalRequstQRScanner from "@/component/qr-screen/CapitalRequstQRScanner";
import AddOnboardSupplier from "@/component/onboard-supplier/AddOnboardSupplier";
import OtpverificationOnboardSupplier from "@/component/otp-screen/OtpverificationOnboardSupplier";
import AddOnboardSupplierOfficer from "@/component/onboard-supplier/AddOnboardSupplierOfficer";
import LocationAccess from "@/component/permission/LocationAccess";
import CameraAccess from "@/component/permission/CameraAccess";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BannedScreen from "@/component/auth/BannedScreen";
import { AlertModal, setGlobalAlertListener } from "@/component/commons/AlertModal";
import { initDatabase } from "@/database/index";

LogBox.ignoreAllLogs(true);

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
    return null;
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
          <Tab.Screen name="ViewAllVisits" component={ViewAllVisits as any} />

          <Tab.Screen name="ManageOfficers" component={ManageOfficers} />
          <Tab.Screen name="AddOfficerStep1" component={AddOfficerStep1} />
          <Tab.Screen name="AddOfficerStep2" component={AddOfficerStep2} />
          <Tab.Screen name="AddOfficerStep3" component={AddOfficerStep3} />
          <Tab.Screen name="AssignJobs" component={AssignJobs} />
          <Tab.Screen
            name="AddOnboardSupplier"
            component={AddOnboardSupplier}
          />
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
          <Tab.Screen name="ViewAllVisits" component={ViewAllVisits as any} />
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
        component={ViewAllVisits as any}
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer.Navigator>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isOfflineAlertShown, setIsOfflineAlertShown] = useState(false);

  const [alertState, setAlertState] = useState({
    visible: false,
    title: "",
    message: "" as string | React.ReactNode,
    type: "error" as "success" | "error",
    onClose: (() => {}) as () => void,
    autoClose: true,
    showOkButton: undefined as boolean | undefined,
  });

  useEffect(() => {
    setGlobalAlertListener((title, message, type, onClose, autoClose, showOkButton) => {
      setAlertState({
        visible: true,
        title,
        message,
        type,
        onClose: () => {
          setAlertState((prev) => ({ ...prev, visible: false }));
          if (onClose) {
            onClose();
          }
        },
        autoClose,
        showOkButton,
      });
    });
  }, []);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (!state.isConnected && !isOfflineAlertShown) {
        setIsOfflineAlertShown(true);
        Alert.alert(
          t("Main.NoInternetConnection"),
          t("Main.PleaseTurnOnMobileDataOrWiFiToContinue"),
          [
            {
              text: "OK",
              onPress: () => setIsOfflineAlertShown(false),
            },
          ],
        );
      }
    });
    return () => unsubscribeNetInfo();
  }, [isOfflineAlertShown]);

  useEffect(() => {
    const backAction = () => {
      if (!navigationRef.isReady()) return false;
      const currentRouteName = (navigationRef.getCurrentRoute() as any)?.name ?? "";
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
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const errorResponse = error.response;
        if (
          errorResponse &&
          errorResponse.status === 403 &&
          (errorResponse.data?.statusType === "not_approved" ||
            errorResponse.data?.statusType === "rejected" ||
            errorResponse.data?.statusType === "pending" ||
            errorResponse.data?.message === "This Employee ID is Rejected" ||
            errorResponse.data?.message === "User not approved" ||
            errorResponse.data?.message === "Account status is pending verification")
        ) {
          let currentRouteName = "";
          if (navigationRef.isReady()) {
            const route = navigationRef.getCurrentRoute() as any;
            currentRouteName = route?.name || "";
          }

          if (
            currentRouteName !== "Login" &&
            currentRouteName !== "Splash" &&
            currentRouteName !== "BannedScreen"
          ) {
            try {
              // Clear auth tokens
              await AsyncStorage.multiRemove([
                "token",
                "jobRole",
                "empid",
                "tokenStoredTime",
                "tokenExpirationTime",
              ]);

              if (navigationRef.isReady()) {
                navigationRef.reset({
                  index: 0,
                  routes: [
                    {
                      name: "BannedScreen",
                      params: {
                        statusType: errorResponse.data?.statusType,
                        message: errorResponse.data?.message,
                      },
                    },
                  ],
                });
              }
            } catch (e) {
              console.error("Failed to perform force logout:", e);
            }

            // Return a promise that never resolves or rejects to prevent component error logs
            return new Promise(() => {});
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
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
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Language" component={Lanuage} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen
              name="Main"
              component={MainDrawer}
              options={{ gestureEnabled: false }}
            />
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
            <Stack.Screen name="BannedScreen" component={BannedScreen as any} />
            <Stack.Screen name="LocationAccess" component={LocationAccess} />
            <Stack.Screen name="CameraAccess" component={CameraAccess} />
            <Stack.Screen
              name="CapitalRequstQRScanner"
              component={CapitalRequstQRScanner}
            />
            <Stack.Screen
              name="ConfirmationCapitalRequest"
              component={ConfirmationCapitalRequest}
            />

            <Stack.Screen
              name="AddOnboardSupplierOfficer"
              component={AddOnboardSupplierOfficer}
            />
            <Stack.Screen
              name="OtpverificationOnboardSupplier"
              component={OtpverificationOnboardSupplier}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <AlertModal
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onClose={alertState.onClose}
          autoClose={alertState.autoClose}
          showOkButton={alertState.showOkButton}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initializeDatabase = () => {
      try {
        initDatabase();
        console.log("✅ SQLite Database initialized successfully");
        setDbReady(true);
      } catch (error) {
        console.error("❌ SQLite Database initialization failed:", error);

        setDbReady(true);
      }
    };

    initializeDatabase();
  }, []);

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
