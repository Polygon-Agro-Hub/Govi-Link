import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
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
  const containerStyle = [
    styles.container,
    {
      position: transparent ? ("absolute" as const) : ("relative" as const),
    },
  ];

  const HeaderContent = () => (
    <View style={styles.innerContainer}>
      {/* Left Side (Back Button) */}
      <View style={{ width: wp(15) }}>
        {showBackButton && navigation && (
          <TouchableOpacity
            onPress={onBackPress ?? (() => navigation.goBack())}
            style={styles.backButtonWrapper}
          >
            <Entypo
              name="chevron-left"
              size={25}
              color={"black"}
              style={[
                styles.icon,
                {
                  backgroundColor: "#F6F6F680",
                },
              ]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      </View>

      {/* Right Spacer */}
      <View style={{ width: wp(15), alignItems: "flex-end" }}>
        {rightComponent}
      </View>
    </View>
  );

  if (linearGradient) {
    return (
      <LinearGradient colors={["#6839CF", "#854EDC"]} style={containerStyle}>
        <HeaderContent />
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: transparent ? "transparent" : "white",
          borderBottomWidth: showBottomBorder ? 1 : 0,
          borderBottomColor: "#E5E5E5",
        },
      ]}
    >
      <HeaderContent />
    </View>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 70,
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: "100%",
  },
  backButtonWrapper: {
    alignItems: "flex-start",
  },
  icon: {
    borderRadius: 50,
    padding: wp(2.5),
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
});
