import React from "react";
import { View, Text } from "react-native";
import LottieView from "lottie-react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useTranslation } from "react-i18next";

interface NoDataComponentProps {
  message?: string;
  animationSource?: any;
}

const NoDataComponent: React.FC<NoDataComponentProps> = ({
  message,
  animationSource = require("@/assets/json/NoData.json"),
}) => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center -mt-[70%]">
      <LottieView
        source={animationSource}
        style={{ width: wp(50), height: hp(50) }}
        autoPlay
        loop
      />
      <Text className="text-center text-gray-600 -mt-[30%]">
        {message || t("ComplainHistory.No Data")}
      </Text>
    </View>
  );
};

export default NoDataComponent;