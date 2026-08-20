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
}) => {
  const containerClass = `top-0 left-0 right-0 z-10 h-[70px] ${
    transparent ? "absolute" : "relative"
  }`;

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
              color="black"
              className="rounded-full p-3 bg-[#F6F6F6]/50"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View className="flex-1 items-center">
        <Text
          style={{ color: titleColor ,fontSize: 18 }}
          className="font-semibold text-center"
        >
          {title}
        </Text>
      </View>

      {/* Right Spacer */}
      <View className="w-16 items-end">
        {rightComponent}
      </View>
    </View>
  );

  if (linearGradient) {
    return (
      <LinearGradient
        colors={["#6839CF", "#854EDC"]}
        className={containerClass}
      >
        <HeaderContent />
      </LinearGradient>
    );
  }

  return (
    <View
      className={`${containerClass} ${
        transparent ? "bg-transparent" : "bg-white"
      } ${showBottomBorder ? "border-b border-[#E5E5E5]" : ""}`}
    >
      <HeaderContent />
    </View>
  );
};

export default CustomHeader;
