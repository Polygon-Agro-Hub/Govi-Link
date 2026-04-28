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
import { Camera } from "expo-camera";
import CustomHeader from "../commons/CustomHeader";

type CameraAccessNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CameraAccess"
>;

interface CameraAccessProps {
  navigation: CameraAccessNavigationProp;
  onPermissionGranted?: () => void;
  returnScreen?: keyof RootStackParamList;
}

const cameraImage = require("../../assets/images/permission/camera.png");

const CameraAccess: React.FC<CameraAccessProps> = ({
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

  const requestCameraPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status === "granted") {
        if (onPermissionGranted) {
          onPermissionGranted();
        } else {
          navigation.navigate(returnScreen as any);
        }
      } else if (status === "denied") {
        Alert.alert(
          t("Permission.permissionDenied") || "Permission Denied",
          t("Permission.enableCameraManually") ||
            "Camera access is required. Please enable it in settings.",
          [
            { text: t("PublicForum.Cancel") || "Cancel", style: "cancel" },
            {
              text: t("Permission.openSettings") || "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
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
            source={cameraImage}
            resizeMode="contain"
            style={{ height: dynamicStyles.imageHeight, width: "80%" }}
          />

          {/* Title */}
          <Text className="text-white font-bold text-center mt-8 text-2xl">
            {t("Permission.CameraAccess") || "Camera Access"}
          </Text>

          {/* Description */}
          <Text className="text-gray-400 text-center mt-4 px-8 text-base">
            {t("Permission.enableCameraMessage") ||
              "Enable access to the camera to take photos."}
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
                onPress={requestCameraPermission}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#EE8D5F", "#B31A51"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full rounded-full h-14 justify-center items-center"
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

export default CameraAccess;
