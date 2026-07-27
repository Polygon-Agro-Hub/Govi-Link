import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, BackHandler } from "react-native";
import i18n from "@/i18n/i18n";
import LottieView from "lottie-react-native";

import { useTranslation } from "react-i18next";

type RootStackParamList = {
  Verify: undefined;
  NextScreen: undefined;
};

const OtpverificationSuccess: React.FC = ({ navigation }: any) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate("Main");
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    return () => subscription.remove();
  }, [navigation]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <LottieView
          source={require("../../assets/json/verify.json")}
          autoPlay
          loop
          style={{ width: 300, height: 300 }}
        />

        <Text
          className="font-semibold text-[#404040]"
          style={[
            i18n.language === "si"
              ? { fontSize: 20 }
              : i18n.language === "ta"
                ? { fontSize: 20 }
                : { fontSize: 25 },
          ]}
        >
          {t("OtpverificationSuccess.WellDone")}!
        </Text>
        <Text
          className="text-[#AAAAAA] mt-5 text-center px-12"
          style={[
            i18n.language === "si"
              ? { fontSize: 16 }
              : i18n.language === "ta"
                ? { fontSize: 16 }
                : { fontSize: 18 },
          ]}
        >
          {t("OtpverificationSuccess.YouHaveSuccessfullyCompletedTheJob")}
        </Text>

        <TouchableOpacity
          className="bg-[#353535] h-[50px] w-2/3 flex items-center justify-center mx-auto rounded-3xl mt-24"
          onPress={() => navigation.navigate("Main")}
        >
          <Text
            style={[
              i18n.language === "si"
                ? { fontSize: 18 }
                : i18n.language === "ta"
                  ? { fontSize: 18 }
                  : { fontSize: 20 },
            ]}
            className="text-white font-semibold tracking-wide"
          >
            {t("OtpverificationSuccess.GoForward")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OtpverificationSuccess;
