import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  BackHandler,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ScrollView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import { AntDesign, MaterialIcons, Ionicons, Octicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native"; // Import LottieView
import { useFocusEffect } from "@react-navigation/native";
import { setUser } from '../store/authSlice';
import { useDispatch } from "react-redux";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from 'expo-linear-gradient';

type LoginNavigationProp = StackNavigationProp<RootStackParamList, "Login">;

interface LoginProps {
  navigation: LoginNavigationProp;
}

const loginImage = require("@/assets/login.webp");
const user = require("@/assets/user.webp")
const passwordicon = require("@/assets/lock.webp")

const Login: React.FC<LoginProps> = ({ navigation }) => {
  const [empid, setEmpid] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [empIdError, setEmpIdError] = useState(""); // New state for error message
  const { t } = useTranslation();
  const dispatch = useDispatch();

 
  const validateEmpIdFormat = (empId: string) => {
    const trimmedEmpId = empId.trim();
    

    if (trimmedEmpId !== trimmedEmpId.toUpperCase()) {
      setEmpIdError(t("Login.Please enter Employee ID in uppercase letters"));
      return false;
    }
    

    setEmpIdError("");
    return true;
  };


  const checkDCMAccess = async (empId: string, pass: string) => {
    if (!empId.trim() || !pass.trim()) return;

    const trimmedEmpId = empId.trim();
    
    // First validate format
    if (trimmedEmpId !== trimmedEmpId.toUpperCase()) {
      setEmpIdError(t("Login.Please enter Employee ID in uppercase letters"));
      return;
    }

    try {
      const response = await fetch(
        `${environment}api/collection-officer/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            empId: trimmedEmpId,
            password: pass,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.jobRole) {

        if (data.jobRole.toLowerCase() === "Chief Field Officer") {
          setEmpIdError(t("Error.Distribution Centre Head are not allowed to access this application"));
          return;
        } else {
        
          setEmpIdError("");
        }
      }
    } catch (error) {
     
      console.log("Validation check error:", error);
    }
  };

  const handleEmpIdChange = (text: string) => {
    setEmpid(text);
  
    if (empIdError) {
      setEmpIdError("");
    }

    if (password.trim()) {
      checkDCMAccess(text, password);
    }
  };


  const handlePasswordChange = (text: string) => {
    setPassword(text);

    if (empid.trim() && text.trim()) {
      checkDCMAccess(empid, text);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    // Clear any existing errors
    setEmpIdError("");
    
    if (!empid && !password) {
      Alert.alert(
        t("Error.error"),
        t("Login.Password & Employee ID are not allowed to be empty")
      );
      return false;
    }

    if (empid && !password) {
      Alert.alert(
        t("Error.error"),
        t("Login.Password is not allowed to be empty")
      );
      return false;
    }

    if (!empid && password) {
      Alert.alert(
        t("Error.error"),
        t("Login.Employee ID is not allowed to be empty")
      );
      return false;
    }


    if (!validateEmpIdFormat(empid)) {
      return false;
    }
    
    setLoading(true);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("jobRole");
    await AsyncStorage.removeItem("companyNameEnglish");
    await AsyncStorage.removeItem("companyNameSinhala");
    await AsyncStorage.removeItem("companyNameTamil");
    await AsyncStorage.removeItem("empid");

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setLoading(false);
      Alert.alert(t("Error.error"), "No internet connection");
      return; 
    }
    
    try {
      const trimmedEmpId = empid.trim();
     // console.log("Employee ID:", trimmedEmpId);

      const response = await fetch(
        `${environment.API_BASE_URL}api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            empId: trimmedEmpId,
            password,
          }),
        }
      );

      const data = await response.json();
     console.log("Login response:", data);

      if (!response.ok) {
        setLoading(false);
        if (response.status === 404) {
          Alert.alert(t("Error.error"), t("Error.Invalid EMP ID & Password"));
        } else if (response.status === 401) {
          Alert.alert(
            t("Error.error"),
            t("Error.Invalid Password. Please try again.")
          );
        } else if (data.status === "error") {
          console.log("Login error:", data);
          Alert.alert(t("Error.error"), t("Error.Invalid EMP ID"));
        } else {
          Alert.alert(t("Error.error"), t("Error.somethingWentWrong"));
        }
        return;
      }

   const { token, passwordUpdate, role, empId } = data.data;


      // Continue with normal login flow
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("jobRole", role);
    //   await AsyncStorage.setItem("companyNameEnglish", companyNameEnglish);
    //   await AsyncStorage.setItem("companyNameSinhala", companyNameSinhala);
    //   await AsyncStorage.setItem("companyNameTamil", companyNameTamil);
      await AsyncStorage.setItem("empid", empId.toString());
      dispatch(setUser({ token, role, empId: empId.toString() }));
      
      if (token) {
        const timestamp = new Date();
        const expirationTime = new Date(
          timestamp.getTime() + 8 * 60 * 60 * 1000
        );
        await AsyncStorage.multiSet([
          ["tokenStoredTime", timestamp.toISOString()],
          ["tokenExpirationTime", expirationTime.toISOString()],
        ]);
      }

     console.log("Password update required:",   passwordUpdate);
      
      setTimeout(() => {
        setLoading(false);
        
      if (  passwordUpdate === 0) {
//   navigation.navigate("ChangePassword");
} else {
  // Fixed: Check for both Distribution roles individually
  if (role === "Chief Field Officer") {
    navigation.navigate("Main", { screen: "Dashboard" });
  } else if (role === "Field Officer"){
    navigation.navigate("FieldOfficerDrawer", {
  screen: "FieldOfficerDashboard"
});
  }
}
      }, 4000);
      
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);
      Alert.alert(t("Error.error"), t("Error.somethingWentWrong"));
    }
  };

 
  const handleNavBack = async () => {
    navigation.navigate("Language" as any);
    await AsyncStorage.removeItem("@user_language");
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
   const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

return(
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  style={{ flex: 1, backgroundColor: "white" }}
>
  <ScrollView
    contentContainerStyle={{
      flexGrow: 1,
      justifyContent: "center", 
      alignItems: "center",   
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
    }}
    keyboardShouldPersistTaps="handled"
  >
    
    <TouchableOpacity onPress={() => handleNavBack()} style={{ position: 'absolute', top: hp(2), left: wp(4) }}>
      <AntDesign name="left" size={22} color="black" style={{ backgroundColor: "#F6F6F680", borderRadius: 50, padding: wp(3) }} />
    </TouchableOpacity>

    <Image
      source={loginImage}
      style={{ width: 270, height: 270 }}
      resizeMode="contain"
    />

    {/* Welcome Text */}
    <Text className="font-semibold text-2xl pt-[7%]">
      {t("Login.Welcome")}
    </Text>
    <Text className="text-center mt-2">
      {t("Login.Please Sign in to login")}
    </Text>

    {loading ? (
      <View className="justify-center items-center mt-6">
        <ActivityIndicator size="large" color="#FF1D85" />
      </View>
    ) : (
      <View style={{ width: "95%", marginTop: hp(4) }}>
        <Text className="text-base pb-[2%] font-light">
          {t("Login.Employee ID")}
        </Text>
        <View
          className={`flex-row items-center bg-[#F4F4F4] border rounded-3xl h-[53px] mb-2 px-3 ${
            empIdError ? "border-red-500" : "border-[#F4F4F4]"
          }`}
        >
          <Image source={user} style={{ width: 24, height: 24 }} resizeMode="contain" />
          <TextInput
            className="flex-1 h-[40px] text-base pl-2"
            autoCapitalize="characters"
            value={empid}
            onChangeText={handleEmpIdChange}
          />
        </View>
        {empIdError && (
          <Text className="text-red-500 text-sm pl-3 mb-4">{empIdError}</Text>
        )}

        <Text className="text-base pb-[2%] font-light">
          {t("Login.Password")}
        </Text>
        <View className="flex-row items-center bg-[#F4F4F4] border border-[#F4F4F4] rounded-3xl h-[53px] mb-8 px-3">
          <Image source={passwordicon} style={{ width: 40, height: 40 }} resizeMode="contain" />
          <TextInput
            className="flex-1 h-[40px] text-base pl-2"
            secureTextEntry={secureTextEntry}
            value={password}
            onChangeText={handlePasswordChange}
          />
          <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
            <Ionicons
              name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="rounded-3xl mb-5 overflow-hidden"
          style={{ width: "100%" }}
          disabled={loading}
          onPress={handleLogin}
        >
          <LinearGradient
            colors={["#F2561D", "#FF1D85"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white text-lg font-semibold tracking-wide">
                {t("Login.Sign in")}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )}
  </ScrollView>
</KeyboardAvoidingView>
)
};

export default Login;