import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export interface FormFooterButtonProps {
  exitText: string;
  nextText: string;
  isNextEnabled: boolean;
  onExit: () => void;
  onNext: () => void;
  exitButtonStyle?: ViewStyle;
  exitTextStyle?: TextStyle;
  nextButtonStyle?: ViewStyle;
  nextTextStyle?: TextStyle;
  disabledButtonStyle?: ViewStyle;
  disabledTextStyle?: TextStyle;
  gradientColors?: readonly [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  containerStyle?: ViewStyle;
  showBackButton?: boolean;
  showNextIcon?: boolean;
}

const FormFooterButton: React.FC<FormFooterButtonProps> = ({
  exitText,
  nextText,
  isNextEnabled,
  onExit,
  onNext,
  exitButtonStyle,
  exitTextStyle,
  nextButtonStyle,
  nextTextStyle,
  disabledButtonStyle,
  disabledTextStyle,
  gradientColors = ["#F35125", "#FF1D85"] as const,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 },
  containerStyle,
}) => {
  return (
    <View
      className="flex-row px-6 py-3 gap-4 bg-white border-t border-gray-200"
      style={containerStyle}
    >
      {/* Exit/Back Button */}
      <TouchableOpacity
        className="flex-1 bg-[#444444] rounded-full py-4 flex-row items-center justify-center"
        onPress={onExit}
        activeOpacity={0.8}
        style={exitButtonStyle}
      >
        <Ionicons name="arrow-back" size={25} color="#fff" />
        <Text
          className="text-white text-base font-semibold ml-2"
          style={exitTextStyle}
        >
          {exitText}
        </Text>
      </TouchableOpacity>

      {/* Next Button */}
      {isNextEnabled ? (
        <View className="flex-1">
          <TouchableOpacity
            className="flex-1"
            onPress={onNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradientColors}
              start={gradientStart}
              end={gradientEnd}
              className="rounded-full py-4 flex-row items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 6,
                ...nextButtonStyle,
              }}
            >
              <Text
                className="text-white text-base font-semibold mr-2"
                style={nextTextStyle}
              >
                {nextText}
              </Text>
              <Ionicons name="arrow-forward" size={25} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          className="flex-1 bg-gray-300 rounded-full py-4 flex-row items-center justify-center"
          style={disabledButtonStyle}
        >
          <Text
            className="text-white text-base font-semibold mr-2"
            style={disabledTextStyle}
          >
            {nextText}
          </Text>
          <Ionicons name="arrow-forward" size={25} color="#fff" />
        </View>
      )}
    </View>
  );
};

export default FormFooterButton;
