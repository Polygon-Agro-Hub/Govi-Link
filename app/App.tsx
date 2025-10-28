// import React, { useEffect, useState } from "react";
// import { Alert, BackHandler, Text, View ,  Dimensions, TextInput} from "react-native";
// import { NavigationContainer, useNavigation } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
// import NavigationBar from "@/Items/NavigationBar";
// import { LanguageProvider } from "@/context/LanguageContext";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { Provider, useSelector } from "react-redux";
// import  store, { RootState } from "@/services/reducxStore";
// import NetInfo from '@react-native-community/netinfo';
// import { useTranslation } from "react-i18next";
// import { navigationRef } from "../navigationRef"; 

// import { NativeWindStyleSheet } from "nativewind";
// import { LogBox } from 'react-native';
// import Dashboard from "@/component/ChiefFieldOfficer/Dashboard";
// import Lanuage from "@/component/Lanuage";
// import Splash from "@/component/Splash";
// import Login from "@/component/Login";
// import DrawerNavigation from "@/Items/DrawerNavigation";



// LogBox.ignoreAllLogs(true);
// NativeWindStyleSheet.setOutput({
//   default: "native",
// });

// (Text as any).defaultProps = {
//   ...(Text as any).defaultProps,
//   allowFontScaling: false,
// };

// (TextInput as any).defaultProps = {
//   ...(TextInput as any).defaultProps,
//   allowFontScaling: false,
// };

// const Stack = createStackNavigator(); 
// const Tab = createBottomTabNavigator();
// const windowDimensions = Dimensions.get("window");

// // Example Screens
// function HomeScreen() {
//   return (
//     <View className="flex-1 items-center justify-center bg-blue-100">
//       <Text className="text-2xl font-bold text-blue-800">Home Screen</Text>
//     </View>
//   );
// }

// function MainTabNavigator() {
//       const [initialTab, setInitialTab] = useState('Dashboard');
//   const jobRole = useSelector((state: RootState) => state.auth.jobRole);
//   useEffect(() => {
//     if (jobRole === 'Chief Field Officer') {
//       setInitialTab('Dashboard'); 
//     } else if (jobRole === 'Field Officer') {
//       setInitialTab('FieldOfficerDashboard');
//     } 
//   }, [jobRole]);
//   return (
//     <Tab.Navigator
//        initialRouteName={initialTab}
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarHideOnKeyboard: false,
//         tabBarStyle: { position: "absolute", backgroundColor: "#fff" },
//       })}
      
//       tabBar={(props) => <NavigationBar {...props} />}
//     >
//    <Tab.Screen name="Dashboard" component={DrawerNavigation} />
//     </Tab.Navigator>
//   );
// }

// function AppContent() {
//   const insets = useSafeAreaInsets();
//  const { t } = useTranslation();

//   const [isOfflineAlertShown, setIsOfflineAlertShown] = useState(false);

//   useEffect(() => {
//     const unsubscribeNetInfo = NetInfo.addEventListener(state => {
//       if (!state.isConnected && !isOfflineAlertShown) {
//         setIsOfflineAlertShown(true); // mark that alert is shown
//         Alert.alert(
//           t("Main.No Internet Connection"),
//           t("Main.Please turn on mobile data or Wi-Fi to continue."),
//           [
//             {
//               text: "OK",
//               onPress: () => {
//                 // Reset flag after user presses OK
//                 setIsOfflineAlertShown(false);
//               },
//             },
//           ]
//         );
//       }
//     });

//     return () => {
//       unsubscribeNetInfo();
//     };
//   }, [isOfflineAlertShown]);

// useEffect(() => {
//   const backAction = () => {
//     if (!navigationRef.isReady()) {
//       // Navigation not ready yet, let default system back handle it
//       return false;
//     }

//     const currentRouteName = navigationRef.getCurrentRoute()?.name ?? "";

//     if (currentRouteName === "Dashboard") {
//       BackHandler.exitApp();
//       return true;
//     } else if (navigationRef.canGoBack()) {
//       navigationRef.goBack();
//       return true;
//     }
//     return false;
//   };

//   const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
//   return () => backHandler.remove();
// }, []);

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaView
//         style={{ flex: 1, paddingBottom: insets.bottom, backgroundColor: "#fff" }}
//         edges={["top", "right", "left"]}
//       >
//         <NavigationContainer   ref={navigationRef}>
//           <Stack.Navigator screenOptions={{ headerShown: false }}>
//             <Stack.Screen name="Splash" component={Splash} />
//                      <Stack.Screen name="Language" component={Lanuage} />
//                      <Stack.Screen name="Login" component={Login} />
//                     <Stack.Screen name='Main' component={MainTabNavigator} options={{ headerShown: false }} />
//                     {/* <Stack.Screen name="FieldOfficerDashboard" component={FieldOfficerDashboard} /> */}
//   <Stack.Screen name="FieldOfficerDrawer" component={DrawerNavigation} />


//           </Stack.Navigator>
//         </NavigationContainer>
//       </SafeAreaView>
//     </GestureHandlerRootView>
//   );
// }
// export default function App() {
//   return (
//     <SafeAreaProvider>
//       <Provider store={store}>
//       <LanguageProvider>
//         <AppContent />
//       </LanguageProvider>
//       </Provider>
//     </SafeAreaProvider>
//   );
// }

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
  const [initialTab, setInitialTab] = useState("Dashboard");
  const jobRole = useSelector((state: RootState) => state.auth.jobRole);

  useEffect(() => {
    if (jobRole === "Chief Field Officer") {
      setInitialTab("Dashboard");
    } else if (jobRole === "Field Officer") {
      setInitialTab("FieldOfficerDashboard");
    }
  }, [jobRole]);

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
      <Tab.Screen name="Dashboard" component={Dashboard} />
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
