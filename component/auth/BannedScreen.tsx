import React, { useCallback } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

type BannedScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BannedScreen"
>;

interface BannedScreenProps {
  navigation: BannedScreenNavigationProp;
  route: RouteProp<RootStackParamList, "BannedScreen">;
}

const BannedScreen: React.FC<BannedScreenProps> = ({ route, navigation }) => {
  const { statusType, message } = route.params || {};
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  const handleBackToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "jobRole",
        "empid",
        "tokenStoredTime",
        "tokenExpirationTime",
      ]);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (e) {
      console.error("Error logging out from banned screen:", e);
      navigation.navigate("Login");
    }
  };

  const handleBypass = () => {
    // Temporary bypass button for dev/testing
    navigation.navigate("Main", { screen: "Dashboard" });
  };

  let title = t("Banned.AccessDenied", "Access Denied");
  let description = t("Banned.YourAccountHasBeenRejectedOrIsNotApproved");

  if (statusType === "rejected") {
    title = t("Banned.AccountRejected");
    description = t(
      "Banned.YourAccountApprovalHasBeenRevokedByTheAdministrator",
    );
  } else if (statusType === "not_approved") {
    title = t("Banned.AccountNotApproved");
    description = t(
      "Banned.YourAccountApprovalHasBeenRevokedByTheAdministrator",
    );
  } else if (statusType === "pending") {
    title = t("Banned.PendingVerification");
    description = t("Banned.YourAccountStatusIsPendingVerification");
  }

  if (message) {
    description = message;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white items-center">
        <View
          style={{ paddingHorizontal: 20, paddingVertical: 20 }}
          className="flex-1 justify-center w-full max-w-[500px]"
        >
          {/* Lottie Animation - Centered */}
          <View className="items-center justify-center mb-6">
            <LottieView
              source={require("../../assets/json/banned.json")}
              style={{
                width: 180,
                height: 180,
              }}
              autoPlay
              loop
            />
          </View>

          {/* Text Section - Centered */}
          <View className="items-center px-4">
            <Text className="text-black text-center font-bold text-3xl">
              {title}
            </Text>
            <Text className="text-[#747474] text-center mt-4 text-base leading-6">
              {description}
            </Text>
            <Text className="text-[#747474] text-center mt-2 text-base font-semibold">
              {t("Banned.PleaseContactPolygonCustomerSupportForFurtherDetails")}
            </Text>
          </View>

          {/* Button Group - Centered */}
          <View className="items-center mt-16 w-full gap-4">
            <TouchableOpacity
              onPress={handleBackToLogin}
              activeOpacity={0.7}
              style={{
                width: "70%",
                borderRadius: 999,
                backgroundColor: "transparent",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <LinearGradient
                colors={["#F2561D", "#FF1D85"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 999,
                  overflow: "hidden", 
                  paddingVertical: 16,
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="text-center text-white font-bold text-lg">
                  {t("Banned.BackToLogin")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default BannedScreen;
