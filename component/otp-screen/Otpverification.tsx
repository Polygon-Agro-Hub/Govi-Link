import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  AppState,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native-gesture-handler";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import CustomHeader from "../commons/CustomHeader";

const Otpverification: React.FC = ({ navigation, route }: any) => {
  const { farmerMobile, jobId, isClusterAudit, farmId, auditId } = route.params;
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", "", ""]);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(240);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [disabledResend, setDisabledResend] = useState<boolean>(true);
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState("en");
  const [isOtpValid, setIsOtpValid] = useState<boolean>(false);
  const [verificationAttempts, setVerificationAttempts] = useState<number>(0);
  const [isOtpExpired, setIsOtpExpired] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        if (backgroundTime.current) {
          const elapsed = Math.floor(
            (Date.now() - backgroundTime.current) / 1000,
          );
          setTimer((prev) => Math.max(0, prev - elapsed));
          backgroundTime.current = null;
        }
        setIsActive(true);
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        setIsActive(false);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const selectedLanguage = t("Otpverification.LNG");
    setLanguage(selectedLanguage);
    const fetchReferenceId = async () => {
      try {
        const refId = await AsyncStorage.getItem("referenceId");
        if (refId) {
          setReferenceId(refId);
        }
      } catch (error) {
        console.error("Failed to load referenceId:", error);
      }
    };

    fetchReferenceId();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (timer > 0 && !isVerified && isActive) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      setDisabledResend(true);
    } else if (timer <= 0 && !isVerified) {
      setTimer(0);
      setDisabledResend(false);
      setIsOtpExpired(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer, isVerified, isActive]);

  // Check if OTP is valid whenever otpCode changes
  useEffect(() => {
    const isValid = otpCode.every((digit) => digit !== "");
    setIsOtpValid(isValid);
  }, [otpCode]);

  const handleVerify = async () => {
    const code = otpCode.join("");
    Keyboard.dismiss();

    if (code.length !== 5) {
      Alert.alert(
        t("Error.Sorry"),
        t("Otpverification.Please enter the 5-digit OTP sent to your phone."),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    if (isOtpExpired) {
      Alert.alert(
        t("Error.Sorry"),
        t("Otpverification.Your OTP is invalid or expired."),
        [
          { text: t("Otpverification.Resend OTP"), onPress: handleResendOTP },
          { text: t("Otpverification.Cancel", "Cancel"), style: "cancel" },
        ],
      );
      return;
    }

    try {
      const refId = referenceId;

      const url = "https://api.getshoutout.com/otpservice/verify";
      const headers = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };

      const body = {
        code: code,
        referenceId: refId,
      };

      const response = await axios.post(url, body, { headers });
      const { statusCode, message } = response.data;

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        Alert.alert(
          t("Main.NoInternetConnection"),
          t("Main.PleaseTurnOnMobileDataOrWiFiToContinue"),
          [{ text: t("Main.OK") }],
        );
        return;
      }

      switch (statusCode) {
        case "1000":
          setIsVerified(true);
          const completeSuccess = await handleComplete();

          if (completeSuccess) {
            navigation.navigate("OtpverificationSuccess");
          } else {
            Alert.alert(
              t("Error.Sorry"),
              t("Otpverification.Audit completion failed. Please try again."),
              [{ text: t("Main.OK") }],
            );
          }
          break;

        case "1001":
          setVerificationAttempts((prev) => prev + 1);

          if (verificationAttempts >= 2) {
            Alert.alert(
              t("Otpverification.Invalid OTP"),
              t("Otpverification.Your OTP is invalid or expired."),
              [
                {
                  text: t("Otpverification.Resend OTP"),
                  onPress: handleResendOTP,
                },
                {
                  text: t("Otpverification.Try Again"),
                  onPress: () => {
                    setOtpCode(["", "", "", "", ""]);
                    setIsOtpValid(false);
                    inputRefs.current[0]?.focus();
                  },
                },
              ],
            );
          } else {
            Alert.alert(
              t("Otpverification.Invalid OTP"),
              t(
                "Otpverification.The OTP you entered is incorrect. Please try again.",
              ),
              [{ text: t("Main.OK") }],
            );
          }
          break;
        case "1002":
          setIsOtpExpired(true);
          Alert.alert(
            t("Otpverification.OTP Expired"),
            t("Otpverification.Your OTP is invalid or expired."),
            [
              {
                text: t("Otpverification.Resend OTP"),
                onPress: handleResendOTP,
              },
            ],
          );
          break;

        default:
          Alert.alert(t("Error.Sorry"), t("Main.SomethingWentWrongPleaseTryAgainLater"), [
            { text: t("Main.OK") },
          ]);
      }
    } catch (error: any) {
      console.error("OTP Verification Error:", error);

      if (error.response?.data?.statusCode === "1002") {
        setIsOtpExpired(true);
        Alert.alert(
          t("Error.Sorry"),
          t("Otpverification.Your OTP is invalid or expired."),
          [{ text: t("Otpverification.Resend OTP"), onPress: handleResendOTP }],
        );
      } else if (error.response?.data?.statusCode === "1001") {
        Alert.alert(
          t("Error.Sorry"),
          t("Otpverification.Your OTP is invalid or expired."),
          [{ text: t("Main.OK") }],
        );
      } else {
        Alert.alert(t("Error.Sorry"), t("Main.SomethingWentWrongPleaseTryAgainLater"), [
          { text: t("Main.OK") },
        ]);
      }
    }
  };

  const handleResendOTP = async () => {
    await AsyncStorage.removeItem("referenceId");

    try {
      const apiUrl = "https://api.getshoutout.com/otpservice/send";
      const headers = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };

      let otpMessage = "";
      if (i18n.language === "en") {
        otpMessage = `Your GoviLink OTP is {{code}}`;
      } else if (i18n.language === "si") {
        otpMessage = `ඔබේ GoviLink OTP මුරපදය {{code}} වේ.`;
      } else if (i18n.language === "ta") {
        otpMessage = `உங்கள் GoviLink OTP {{code}} ஆகும்.`;
      }
      const body = {
        source: "PolygonAgro",
        transport: "sms",
        content: {
          sms: otpMessage,
        },
        destination: farmerMobile,
      };

      const response = await axios.post(apiUrl, body, { headers });

      if (response.data.referenceId) {
        await AsyncStorage.setItem("referenceId", response.data.referenceId);
        setReferenceId(response.data.referenceId);
        setIsOtpExpired(false);
        Alert.alert(
          t("Otpverification.Success"),
          t("Otpverification.A new OTP has been sent to your mobile number."),
          [{ text: t("Main.OK") }],
        );
        setTimer(240);
        setDisabledResend(true);
        setOtpCode(["", "", "", "", ""]);
        setIsOtpValid(false);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Otpverification.We couldn’t send the OTP. Please try again later.",
          ),
          [{ text: t("Main.OK") }],
        );
      }
    } catch (error) {
      Alert.alert(t("Error.Sorry"), t("Main.SomethingWentWrongPleaseTryAgainLater"), [
        { text: t("Main.OK") },
      ]);
    }
  };

  const handleComplete = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Error.YourLoginSessionHasExpiredPleaseLogInAgainToContinue",
          ),
          [{ text: t("Main.OK") }],
        );
        return false;
      }

      const payload = { isClusterAudit, farmId };

      const response = await axios.put(
        `${environment.API_BASE_URL}api/officer/complete/${auditId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.status === 200 && response.data?.success) {
        return true;
      } else {
        console.warn(" Audit completion failed:", response.data);
        return false;
      }
    } catch (err) {
      console.error("Error updating audit completion:", err);
      return false;
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    // Create a copy of the current OTP array
    const newOtpCode = [...otpCode];

    // Update the current index with the new text (only take the last character if multiple)
    newOtpCode[index] = text.slice(-1);

    setOtpCode(newOtpCode);

    // Auto-focus next field if we have a value and not at the last index
    if (text && text.length > 0 && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otpCode[index] !== "") {
        // Clear current field
        const newOtpCode = [...otpCode];
        newOtpCode[index] = "";
        setOtpCode(newOtpCode);
      } else if (index > 0) {
        // Move to previous field and clear it
        const newOtpCode = [...otpCode];
        newOtpCode[index - 1] = "";
        setOtpCode(newOtpCode);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CustomHeader
          title={`#${jobId}`}
          navigation={navigation}
          showBackButton={true}
          titleColor="black"
          onBackPress={() => navigation.goBack()}
        />
        <View className="border-b border-[#E5E5E5]" />

        <View className="flex-1 justify-center items-center px-6 pt-10 pb-10">
          <Image
            source={require("../../assets/images/otp/otp-verify.webp")}
            style={{
              width: 300,
              height: 150,
            }}
            resizeMode="contain"
          />

          <Text className="mt-8 text-lg text-black text-center font-semibold">
            {t("Otpverification.Enter Verification Code")}
          </Text>

          <Text className="text-base text-[#808080] text-center mt-2 px-4">
            {t(
              "Otpverification.We have sent a Verification Code to Farmer's mobile number",
            )}
          </Text>

          {/* OTP Input Fields */}
          <View className="flex-row justify-center gap-3 mt-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <TextInput
                key={index}
                ref={(el: TextInput | null) => {
                  inputRefs.current[index] = el;
                }}
                className={`w-14 h-14 text-center text-xl rounded-lg ${otpCode[index]
                  ? "bg-[#FF1D85] text-white"
                  : "bg-[#FFE8F3] text-black"
                  }`}
                keyboardType="number-pad"
                maxLength={1}
                value={otpCode[index]}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectionColor="#FF1D85"
                textAlign="center"
              />
            ))}
          </View>

          {/* Timer */}
          <View className="mt-6">
            <Text className="text-base text-[#808080]">
              {formatTime(timer)}
            </Text>
          </View>

          {/* Resend OTP */}
          <View className="mt-4 mb-8 flex-row justify-center items-center">
            <Text className="text-md text-[#707070]">
              {t("Otpverification.Didn’t receive the OTP ?")}
            </Text>
            <TouchableOpacity
              onPress={disabledResend ? undefined : handleResendOTP}
              disabled={disabledResend}
              activeOpacity={disabledResend ? 1 : 0.7}
            >
              <Text
                className="text-md font-semibold text-black text-center underline ml-2"
                style={{ color: disabledResend ? "#999999" : "#000000" }}
              >
                {t("Otpverification.RESEND OTP")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View className="w-full items-center gap-4 mt-4">
            <TouchableOpacity
              className="w-2/3 h-[50px] bg-[#444444] justify-center items-center rounded-full"
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text className="text-white text-lg text-center font-semibold">
                {t("Otpverification.Go Back")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-2/3 h-[50px] rounded-full overflow-hidden"
              onPress={handleVerify}
              disabled={!isOtpValid || isVerified}
              activeOpacity={!isOtpValid || isVerified ? 1 : 0.7}
            >
              <LinearGradient
                colors={!isOtpValid || isVerified ? ["#CCCCCC", "#CCCCCC"] : ["#F35125", "#FF1D85"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-1 items-center justify-center"
                style={{ overflow: "hidden" }}
              >
                <Text className="text-white text-lg font-semibold">
                  {t("Otpverification.Verify")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Otpverification;