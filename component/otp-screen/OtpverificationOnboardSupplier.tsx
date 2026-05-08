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
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native-gesture-handler";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import CustomHeader from "../commons/CustomHeader";

const OtpverificationOnboardSupplier: React.FC = ({
  navigation,
  route,
}: any) => {
  const { supplierName, contact, email, nic } = route.params;
  const [otpCode, setOtpCode] = useState<string>("");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(300);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [disabledResend, setDisabledResend] = useState<boolean>(true);
  const { t, i18n } = useTranslation();
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
          const elapsed = Math.floor((Date.now() - backgroundTime.current) / 1000);
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

  const sendOTP = async (): Promise<boolean> => {
    await AsyncStorage.removeItem("referenceId");

    const apiUrl = "https://api.getshoutout.com/otpservice/send";
    const headers = {
      Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
      "Content-Type": "application/json",
    };

    const otpMessages: Record<string, string> = {
      en: `Greetings from GoViShop! Your OTP is {{code}}`,
      si: `GoViShop වෙතින් සුභ පැතුම්! ඔබගේ OTP කේතය {{code}} වේ.`,
      ta: `GoViShop இலிருந்து வாழ்த்துகள்! உங்கள் OTP குறியீடு {{code}}.`,
    };
    const otpMessage = otpMessages[i18n.language] ?? otpMessages["en"];

    const formattedContact = contact.startsWith("0")
      ? "+94" + contact.substring(1)
      : contact;

    const body = {
      source: "PolygonAgro",
      transport: "sms",
      content: { sms: otpMessage },
      destination: formattedContact,
    };

    try {
      const response = await axios.post(apiUrl, body, { headers });
      console.log("OTP send response:", response.data);

      if (response.data.referenceId) {
        await AsyncStorage.setItem("referenceId", response.data.referenceId);
        setReferenceId(response.data.referenceId);
        setIsOtpExpired(false);
        setTimer(300);
        setDisabledResend(true);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("OTP send error:", error?.response?.data ?? error.message);
      return false;
    }
  };

  useEffect(() => {
    sendOTP();
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

  const handleOtpChange = (text: string, index: number) => {
    const numeric = text.replace(/[^0-9]/g, "");
    const updatedOtpCode = otpCode.split("");
    updatedOtpCode[index] = numeric;
    const newOtp = updatedOtpCode.join("");
    setOtpCode(newOtp);

    const allFilled =
      updatedOtpCode.length === 5 &&
      updatedOtpCode.every((char) => char !== "" && char !== undefined);
    setIsOtpValid(allFilled);

    if (text && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
    if (allFilled) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      const updatedOtpCode = otpCode.split("");

      if (updatedOtpCode[index]) {
        updatedOtpCode[index] = "";
        setOtpCode(updatedOtpCode.join(""));
        setIsOtpValid(false);
      } else if (index > 0) {
        updatedOtpCode[index - 1] = "";
        setOtpCode(updatedOtpCode.join(""));
        setIsOtpValid(false);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleResendOTP = async () => {
    const success = await sendOTP();

    if (success) {
      Alert.alert(
        t("Otpverification.Success"),
        t("Otpverification.A new OTP has been sent to your mobile number."),
        [{ text: t("Main.ok") }],
      );
    } else {
      Alert.alert(
        t("Error.Sorry"),
        t("Otpverification.We couldn't send the OTP. Please try again later."),
        [{ text: t("Main.ok") }],
      );
    }
  };

  const handleComplete = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Error.Your login session has expired. Please log in again to continue.",
          ),
          [{ text: t("Main.ok") }],
        );
        return false;
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/onboard-supplier/add-supplier`,
        { supplierName, contact, email, nic },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("handleComplete response:", response.data);

      if (response.status === 201 && response.data?.success) {
        return true;
      } else {
        console.warn("Supplier save failed:", response.data);
        return false;
      }
    } catch (err: any) {
      console.error(
        "Error saving supplier:",
        err?.response?.data ?? err.message,
      );
      return false;
    }
  };

  const handleVerify = async () => {
    const code = otpCode;
    Keyboard.dismiss();

    if (code.length !== 5) {
      Alert.alert(
        t("Error.Sorry"),
        t("Otpverification.Please enter the 5-digit OTP sent to your phone."),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    if (isOtpExpired) {
      Alert.alert(
        t("Error.Sorry"),
        t("Otpverification.Your OTP is invalid or expired."),
        [
          { text: t("Otpverification.Resend OTP"), onPress: handleResendOTP },
          { text: t("Otpverification.Cancel"), style: "cancel" },
        ],
      );
      return;
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert(
        t("Main.No Internet Connection"),
        t("Main.Please turn on Mobile Data or Wi-Fi to continue."),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    try {
      const url = "https://api.getshoutout.com/otpservice/verify";
      const headers = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };

      const body = {
        code: code,
        referenceId: referenceId,
      };

      const response = await axios.post(url, body, { headers });
      const { statusCode } = response.data;
      console.log("OTP verify response:", response.data);

      switch (statusCode) {
        case "1000":
          setIsVerified(true);
          const completeSuccess = await handleComplete();

          if (completeSuccess) {
            Alert.alert(
              t("Otpverification.Success"),
              t("OnboardSupplier.Account created successfully"),
              [
                {
                  text: t("Main.ok"),
                  onPress: () => navigation.navigate("Main"),
                },
              ],
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
                    setOtpCode("");
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
              [{ text: t("Main.ok") }],
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
          Alert.alert(t("Error.Sorry"), t("Main.somethingWentWrong"), [
            { text: t("Main.ok") },
          ]);
      }
    } catch (error: any) {
      console.error(
        "OTP Verification Error:",
        error?.response?.data ?? error.message,
      );

      const errCode = error.response?.data?.statusCode;

      if (errCode === "1002") {
        setIsOtpExpired(true);
        Alert.alert(
          t("Error.Sorry"),
          t("Otpverification.Your OTP is invalid or expired."),
          [{ text: t("Otpverification.Resend OTP"), onPress: handleResendOTP }],
        );
      } else if (errCode === "1001") {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Otpverification.The OTP you entered is incorrect. Please try again.",
          ),
          [{ text: t("Main.ok") }],
        );
      } else {
        Alert.alert(t("Error.Sorry"), t("Main.somethingWentWrong"), [
          { text: t("Main.ok") },
        ]);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <CustomHeader
        title={t("OnboardSupplier.OTP Verification")}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        titleColor="black"
      />

      <View className="flex justify-center items-center mt-3">
        <Image
          source={require("../../assets/images/otp/otp-verify.webp")}
          style={{ width: 500, height: 150 }}
          resizeMode="contain"
        />

        <View>
          <Text className="mt-8 text-lg text-black text-center font-semibold">
            {t("Otpverification.Enter Verification Code")}
          </Text>
          <Text className="text-base text-[#808080] text-center p-4">
            {t(
              "OnboardSupplier.We have sent a Verification Code to the given mobile number",
            )}
          </Text>
        </View>

        {/* OTP Input Boxes */}
        <View className="flex-row justify-center gap-3 mt-4 px-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <TextInput
              key={index}
              ref={(el: TextInput | null) => {
                inputRefs.current[index] = el;
              }}
              className={`w-12 h-12 text-lg text-center rounded-lg ${otpCode[index]
                  ? "bg-[#FF1D85] text-white pb-2"
                  : "bg-[#FFE8F3] text-black"
                }`}
              keyboardType="numeric"
              maxLength={1}
              value={otpCode[index] || ""}
              onChangeText={(text) => handleOtpChange(text, index)}
              placeholderTextColor="lightgray"
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        {/* Timer */}
        <View className="mt-6">
          <Text className="text-base">{formatTime(timer)}</Text>
        </View>

        {/* Resend OTP */}
        <View className="mt-4 mb-10 flex-row justify-center items-center">
          <Text className="text-md text-[#707070]">
            {t("OnboardSupplier.Didn't receive the OTP")}
          </Text>
          <View className="ml-2">
            <Text
              className="text-md font-semibold text-center underline"
              onPress={disabledResend ? undefined : handleResendOTP}
              style={{ color: disabledResend ? "gray" : "black" }}
            >
              {t("Otpverification.RESEND OTP")}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View className="w-2/3">
          {/* Back Button */}
          <TouchableOpacity
            className="bg-[#D9D9D9] h-[50px]  justify-center rounded-3xl mb-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-[#686868] text-lg text-center">
              {t("OnboardSupplier.Back")}
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isOtpValid || isVerified}
            activeOpacity={0.8}
            className="justify-center rounded-full mb-4"
          >
            <LinearGradient
              colors={
                !isOtpValid || isVerified
                  ? ["#C4C4C4", "#C4C4C4"]
                  : ["#F35125", "#FF1D85"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-1 items-center justify-center rounded-3xl h-[50px]"
              style={{ overflow: "hidden" }}
            >
              <Text className="text-white text-lg font-semibold">
                {t("OnboardSupplier.Submit")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default OtpverificationOnboardSupplier;
