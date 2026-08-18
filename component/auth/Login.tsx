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
  Dimensions,
} from "react-native";
import React, { useCallback, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import { Ionicons, FontAwesome, SimpleLineIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { setUser } from "../../store/authSlice";
import { useDispatch } from "react-redux";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import CustomHeader from "../commons/CustomHeader";

type LoginNavigationProp = StackNavigationProp<RootStackParamList, "Login">;

interface LoginProps {
  navigation: LoginNavigationProp;
}

const loginImage = require("@/assets/images/auth/login.webp");

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const Login: React.FC<LoginProps> = ({ navigation }) => {
  const [empid, setEmpid] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [empIdError, setEmpIdError] = useState("");
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const validateEmpIdFormat = (empId: string) => {
    const trimmedEmpId = empId.trim();

    if (trimmedEmpId !== trimmedEmpId.toUpperCase()) {
      setEmpIdError(t("Login.PleaseEnterEmployeeIdInUppercaseLetters"));
      return false;
    }
    if (!trimmedEmpId.startsWith("CFO") && !trimmedEmpId.startsWith("FIO")) {
      Alert.alert(
        t("Error.UnauthorizedAccess"),
        t(
          "Error.YouAreNotAuthorizedToAccessThisSystemPleaseUseAValidEmployeeId",
        ),
        [{ text: t("Main.OK") }],
      );
      return false;
    }

    setEmpIdError("");
    return true;
  };

  const handleEmpIdChange = (text: string) => {
    setEmpid(text);

    if (empIdError) {
      setEmpIdError("");
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    setEmpIdError("");

    if (!empid && !password) {
      Alert.alert(
        t("Error.Sorry"),
        t("Login.PasswordAndEmployeeIdAreRequired"),
      );
      return false;
    }

    if (empid && !password) {
      Alert.alert(
        t("Error.Sorry"),
        t("Login.Password is not allowed to be empty"),
      );
      return false;
    }

    if (!empid && password) {
      Alert.alert(t("Error.Sorry"), t("Login.EmployeeIdIsNotAllowedToBeEmpty"));
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
      Alert.alert(t("Error.Sorry"), t("Main.NoInternetConnection"));
      return;
    }

    try {
      const trimmedEmpId = empid.trim();

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
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setLoading(false);

        const errorMessage = data.message;
        const lowerMessage = data.message?.toLowerCase() || "";
        const statusType = data.statusType;

        if (
          statusType === "rejected" ||
          statusType === "not_approved" ||
          statusType === "pending" ||
          lowerMessage.includes("user not approved") ||
          lowerMessage.includes("rejected") ||
          lowerMessage.includes("pending")
        ) {
          let mappedStatus = statusType;
          if (!mappedStatus) {
            if (lowerMessage.includes("rejected")) mappedStatus = "rejected";
            else if (lowerMessage.includes("pending")) mappedStatus = "pending";
            else mappedStatus = "not_approved";
          }
          navigation.navigate("BannedScreen", {
            statusType: mappedStatus,
            message: errorMessage,
          });
          return;
        }

        if (lowerMessage.includes("invalid password")) {
          Alert.alert(
            t("Error.Sorry"),
            t("Login.InvalidPasswordPleaseTryAgain"),
          );
        } else if (lowerMessage.includes("user not found")) {
          Alert.alert(t("Error.Sorry"), t("Login.InvalidEmpIdPassword"));
        } else {
          Alert.alert(
            t("Error.Sorry"),
            t("Main.SomethingWentWrongPleaseTryAgainLater"),
          );
        }

        return;
      }

      const { token, passwordUpdate, role, empId } = data.data;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("jobRole", role);
      await AsyncStorage.setItem("empid", empId.toString());
      await AsyncStorage.removeItem("intentional_logout");
      dispatch(setUser({ token, role, empId: empId.toString() }));

      if (token) {
        const timestamp = new Date();
        const expirationTime = new Date(
          timestamp.getTime() + 8 * 60 * 60 * 1000,
        );
        await AsyncStorage.multiSet([
          ["tokenStoredTime", timestamp.toISOString()],
          ["tokenExpirationTime", expirationTime.toISOString()],
        ]);
      }

      setTimeout(() => {
        setLoading(false);

        if (passwordUpdate === 0) {
          navigation.navigate("ChangePassword", {
            passwordUpdate: passwordUpdate,
          });
        } else {
          if (role === "Chief Field Officer") {
            navigation.reset({
              index: 0,
              routes: [{ name: "Main", params: { screen: "Dashboard" } }],
            });
          } else if (role === "Field Officer") {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Main",
                  params: { screen: "FieldOfficerDashboard" },
                },
              ],
            });
          }
        }
      }, 4000);
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);
      Alert.alert(
        t("Error.Sorry"),
        t("Main.SomethingWentWrongPleaseTryAgainLater"),
      );
    }
  };

  const handleNavBack = async () => {
    navigation.navigate("Language" as any);
    await AsyncStorage.removeItem("@user_language");
  };

  useFocusEffect(
    useCallback(() => {
      const checkLogoutStatus = async () => {
        const intentionalLogout =
          await AsyncStorage.getItem("intentional_logout");
        if (intentionalLogout === "true") {
          Alert.alert(t("Main.Success"), t("Login.LogoutSuccessful"), [
            { text: t("Main.OK") },
          ]);
          await AsyncStorage.removeItem("intentional_logout");
        }
      };

      checkLogoutStatus();

      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <CustomHeader
        title={""}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => handleNavBack()}
      />
      <ScrollView
        style={{ backgroundColor: "white" }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: wp(6),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={loginImage}
          style={{ width: 270, height: 270 }}
          resizeMode="contain"
        />

        <Text className="font-semibold text-2xl pt-[7%]">
          {t("Login.Welcome")}
        </Text>
        <Text className="text-center mt-2">
          {t("Login.PleaseSignInToLogin")}
        </Text>

        <View style={{ width: `100%`, marginTop: hp(4) }}>
          <Text className="text-base pb-[2%] font-light">
            {t("Login.EmployeeID")}
          </Text>
          <View
            className={`flex-row items-center bg-[#F4F4F4] border rounded-3xl h-[50px] mb-2 px-3 ${
              empIdError ? "border-red-500" : "border-[#F4F4F4]"
            }`}
          >
            <FontAwesome name="user-o" size={20} color="#353535" />
            <TextInput
              className="flex-1 text-base pl-2"
              autoCapitalize="characters"
              value={empid}
              onChangeText={handleEmpIdChange}
              editable={!loading}
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                opacity: loading ? 0.6 : 1,
                height: 50,
                paddingVertical: 0,
                includeFontPadding: false,
              }}
            />
          </View>
          {empIdError && (
            <Text className="text-red-500 text-sm pl-3 mb-4">{empIdError}</Text>
          )}

          <Text className="text-base pb-[2%] font-light">
            {t("Login.Password")}
          </Text>
          <View className="flex-row items-center bg-[#F4F4F4] border border-[#F4F4F4] rounded-3xl h-[50px] mb-8 px-3">
            <SimpleLineIcons name="lock" size={22} color="#353535" />
            <TextInput
              className="flex-1 text-base pl-2"
              secureTextEntry={secureTextEntry}
              value={password}
              onChangeText={handlePasswordChange}
              editable={!loading}
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                opacity: loading ? 0.6 : 1,
                height: 50,
                paddingVertical: 0,
                includeFontPadding: false,
              }}
            />
            <TouchableOpacity
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              disabled={loading}
            >
              <Ionicons
                name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
                size={24}
                color={loading ? "#999" : "black"}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{ width: "100%", alignItems: "center", marginBottom: 20 }}
          >
            <View
              style={{
                width: "100%",
                borderRadius: 999,
                shadowColor: "#FF1D85",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 12,
                elevation: 12,
              }}
            >
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
                style={{ width: "100%", borderRadius: 999 }}
              >
                <LinearGradient
                  colors={["#F2561D", "#FF1D85"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 999,
                    paddingVertical: 16,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: "white",
                        fontSize: SCREEN_HEIGHT > 900 ? 20 : 18,
                        fontWeight: "700",
                      }}
                    >
                      {t("Login.SignIn")}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
