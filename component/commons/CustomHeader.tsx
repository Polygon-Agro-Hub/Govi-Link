import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  navigation?: StackNavigationProp<any>;
  onBackPress?: () => void;
  transparent?: boolean;
  linearGradient?: boolean;
  titleColor?: string;
  rightComponent?: React.ReactNode;
  showBottomBorder?: boolean;
  backgroundColor?: string;
  bgColor?: string;
  backButtonColor?: string;
  backButtonBgColor?: string;
  headerStyle?: object;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  showBackButton = true,
  navigation,
  onBackPress,
  transparent = false,
  linearGradient = false,
  titleColor = "black",
  rightComponent,
  showBottomBorder = false,
  backgroundColor,
  bgColor,
  backButtonColor,
  backButtonBgColor,
  headerStyle,
}) => {
  const resolvedBg =
    backgroundColor || bgColor || (transparent ? "transparent" : "white");
  const isAbsolute = transparent && !backgroundColor && !bgColor;
  const containerClass = `top-0 left-0 right-0 z-10 h-[70px] ${
    isAbsolute ? "absolute" : "relative"
  }`;

  const isDarkBackground =
    resolvedBg === "#121212" ||
    resolvedBg === "#000" ||
    resolvedBg === "#000000" ||
    resolvedBg === "#1E1E1E" ||
    titleColor === "white";

  const resolvedBackButtonColor =
    backButtonColor ?? (isDarkBackground ? "white" : "black");
  const resolvedTitleColor =
    titleColor !== "black" ? titleColor : isDarkBackground ? "white" : "black";

  const HeaderContent = () => (
    <View className="flex-row items-center px-4 h-full">
      {/* Left Side (Back Button) */}
      <View className="w-16 items-start">
        {showBackButton && navigation && (
          <TouchableOpacity
            onPress={onBackPress ?? (() => navigation.goBack())}
          >
            <Entypo
              name="chevron-left"
              size={25}
              color={resolvedBackButtonColor}
              style={
                backButtonBgColor
                  ? { backgroundColor: backButtonBgColor }
                  : isDarkBackground
                  ? { backgroundColor: "rgba(255, 255, 255, 0.12)" }
                  : undefined
              }
              className={`rounded-full p-3 ${
                backButtonBgColor || isDarkBackground
                  ? ""
                  : "bg-[#F6F6F6]/50"
              }`}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View className="flex-1 items-center">
        <Text
          style={{ color: resolvedTitleColor, fontSize: 18 }}
          className="font-semibold text-center"
        >
          {title}
        </Text>
      </View>

      {/* Right Spacer */}
      <View className="w-16 items-end">{rightComponent}</View>
    </View>
  );

  if (linearGradient) {
    return (
      <LinearGradient
        colors={["#6839CF", "#854EDC"]}
        className={containerClass}
        style={headerStyle}
      >
        <HeaderContent />
      </LinearGradient>
    );
  }

  return (
    <View
      className={`${containerClass} ${
        showBottomBorder ? "border-b border-[#E5E5E5]" : ""
      }`}
      style={[{ backgroundColor: resolvedBg }, headerStyle]}
    >
      <HeaderContent />
    </View>
  );
};

export default CustomHeader;
