import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  BackHandler,
  Dimensions,
  StatusBar,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { useTranslation } from "react-i18next";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import CustomHeader from "../commons/CustomHeader";

type LocationAccessNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LocationAccess"
>;

interface LocationAccessProps {
  navigation: LocationAccessNavigationProp;
  onPermissionGranted?: () => void;
  returnScreen?: keyof RootStackParamList;
}

const locationImage = require("../../assets/images/permission/location.png");

const LocationAccess: React.FC<LocationAccessProps> = ({
  navigation,
  onPermissionGranted,
  returnScreen = "Main",
}) => {
  const { t } = useTranslation();
  const screenWidth = Dimensions.get("window").width;
  const [isLoading, setIsLoading] = useState(false);

  const dynamicStyles = {
    imageHeight: screenWidth < 400 ? wp(55) : wp(50),
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [navigation]),
  );

  const requestLocationPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        if (onPermissionGranted) {
          onPermissionGranted();
        } else {
          navigation.navigate(returnScreen as any);
        }
      } else if (status === "denied") {
        Alert.alert(
          t("Permission.permissionDenied") || "Permission Denied",
          t("Permission.enableLocationManually") ||
            "Location access is required. Please enable it in settings.",
          [
            { text: t("Main.Cancel") || "Cancel", style: "cancel" },
            {
              text: t("Permission.openSettings") || "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert(
        t("Main.Sorry"),
        t("Permission.permissionError"),
        [{ text: t("PublicForum.OK") || "OK" }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <CustomHeader
        title=""
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
        transparent
      />

      <View className="flex-1 justify-center">
        <View className="items-center justify-center px-4">
          {/* Location Image */}
          <Image
            source={locationImage}
            resizeMode="contain"
            style={{ height: dynamicStyles.imageHeight, width: "100%" }}
          />

          {/* Title */}
          <Text className="text-white font-bold text-center mt-8 text-2xl">
            {t("Permission.locationAccess") || "Location Access"}
          </Text>

          {/* Description */}
          <Text className="text-gray-400 text-center mt-4 px-8 text-base">
            {t("Permission.enableLocationMessage") ||
              "Enable location access to access location information for better service delivery and personalized experience."}
          </Text>

          {/* Allow Button */}
          <View className="mt-20 w-full items-center">
            <View
              className="w-2/3 rounded-full"
              style={{
                shadowColor: "#009570",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                backgroundColor: "transparent",
              }}
            >
              <TouchableOpacity
                onPress={requestLocationPermission}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#EE8D5F", "#B31A51"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full rounded-full h-[50px] justify-center items-center"
                  style={{ overflow: "hidden" }}
                >
                  <Text className="text-white font-semibold text-center text-lg">
                    {isLoading
                      ? t("Permission.requesting") || "Requesting..."
                      : t("Permission.allow") || "Allow"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default LocationAccess;
