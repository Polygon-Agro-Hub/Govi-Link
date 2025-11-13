import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import i18n from "@/i18n/i18n";
import LottieView from "lottie-react-native";


import { useTranslation } from "react-i18next";

// Define the types for navigation
type RootStackParamList = {
  Verify: undefined;
  NextScreen: undefined; // Define other screens as needed
};

const OtpverificationSuccess: React.FC = ({ navigation }: any) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleBackPress = () => {
      // Navigate to Main screen when back button pressed
      navigation.navigate("Main");
      return true; // prevent default back behavior
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => subscription.remove();
  }, [navigation]);

  
  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

                  <View className="flex-1 justify-center items-center">
                      <LottieView
                        source={require('../assets/json/verify.json')}
                        autoPlay
                        loop
                        style={{ width: 300, height: 300 }}
                      />
   
        <Text  className="font-semibold text-[#404040]"
         style={[

    i18n.language === "si"
      ? { fontSize: 20}
      : i18n.language === "ta"
      ? { fontSize: 20 }
      : { fontSize: 25 }
  ]}
        >
          {t("OtpverificationSuccess.Well Done")}!
        </Text>
        <Text className="text-[#AAAAAA] mt-5 text-center px-12"
        // style={{ fontSize: 20 }}
           style={[

    i18n.language === "si"
      ? { fontSize: 16}
      : i18n.language === "ta"
      ? { fontSize: 16 }
      : { fontSize: 18 }
  ]}
         >
          {t("OtpverificationSuccess.You have successfully completed the job")}
        </Text>

        <TouchableOpacity
          style={{ height: hp(8), width: wp(80) }}
          className="bg-[#353535] flex items-center justify-center mx-auto rounded-full mt-24"
          onPress={() => navigation.navigate("Main")}
        >
          <Text
         //   style={{ fontSize: 20 }}
           style={[

    i18n.language === "si"
      ? { fontSize: 18}
      : i18n.language === "ta"
      ? { fontSize: 18 }
      : { fontSize: 20 }
  ]}
            className="text-white font-semibold tracking-wide"
          >
            {t("OtpverificationSuccess.Go Forward")}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default OtpverificationSuccess;
