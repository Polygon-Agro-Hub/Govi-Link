import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  BackHandler,
  Dimensions,
  Linking,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Camera } from "expo-camera";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import CustomHeader from "../commons/CustomHeader";

type CameraAccessNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CameraAccess"
>;

interface CameraAccessProps {
  navigation: CameraAccessNavigationProp;
  onPermissionGranted?: () => void;
  onClose?: () => void;
  returnScreen?: keyof RootStackParamList;
  onBackPress?: () => void;
}

const cameraImage = require("../../assets/images/permission/camera.png");

const CameraAccess: React.FC<CameraAccessProps> = ({
  navigation,
  onPermissionGranted,
  onClose,
  returnScreen = "Main",
  onBackPress,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleDenyOrClose = () => {
    if (onClose) {
      onClose();
    } else if (onBackPress) {
      onBackPress();
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(returnScreen as any);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const handleHardwareBackPress = () => {
        handleDenyOrClose();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );
      return () => subscription.remove();
    }, [navigation, onClose, onBackPress, returnScreen]),
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
          t("CameraAccess.PermissionDenied") ||
          t("Permission.PermissionDenied") ||
          "Permission Denied",
          t("CameraAccess.CameraAccessIsRequiredPleaseEnableItInSettings") ||
          t("Permission.CameraAccessIsRequiredPleaseEnableItInSettings") ||
          "Camera access is required. Please enable it in settings.",
          [
            {
              text:
                t("CameraAccess.NotNow") ||
                t("Main.Cancel") ||
                "Not Now",
              style: "cancel",
              onPress: handleDenyOrClose,
            },
            {
              text:
                t("CameraAccess.OpenSettings") ||
                t("Permission.OpenSettings") ||
                "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      Alert.alert(
        t("Main.Error") || "Error",
        t("CameraAccess.UnableToRequestCameraPermissionPleaseTryAgain") ||
        t("Permission.UnableToRequestLocationPermissionPleaseTryAgain") ||
        "Unable to request camera permission. Please try again.",
        [{ text: t("Main.OK") || "OK" }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <CustomHeader
        title=""
        navigation={navigation}
        onBackPress={handleDenyOrClose}
        backgroundColor="#121212"
        backButtonColor="white"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center justify-center mt-4 mb-4">
          <Image
            source={cameraImage}
            className="w-32 h-32"
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text className="text-white text-2xl font-bold text-center mb-2">
          {t("CameraAccess.ProminentDisclosureTitle") ||
            "Why GoViLink Uses Camera"}
        </Text>

        {/* Intro */}
        <Text className="text-gray-300 text-sm text-center mb-5 leading-5">
          {t("CameraAccess.ProminentDisclosureIntro") ||
            "GoViLink requires camera access to enable the following operational features:"}
        </Text>

        {/* Feature 1: QR Scanning */}
        <View className="bg-[#1E1E1E] p-4 rounded-xl mb-3 border border-gray-800 flex-row items-start">
          <View
            className="p-2.5 rounded-lg mr-3 mt-0.5"
            style={{
              backgroundColor: "rgba(238, 141, 95, 0.15)",
              borderWidth: 1,
              borderColor: "rgba(238, 141, 95, 0.3)",
            }}
          >
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={24}
              color="#EE8D5F"
            />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base mb-1">
              {t("CameraAccess.FeatureQRTitle") ||
                "Instant QR Code Scanning"}
            </Text>
            <Text className="text-gray-400 text-xs leading-4">
              {t("CameraAccess.FeatureQRDesc") ||
                "Scan farmer QR codes and request audit job codes for instant verification in the field."}
            </Text>
          </View>
        </View>

        {/* Feature 2: Inspection Photos */}
        <View className="bg-[#1E1E1E] p-4 rounded-xl mb-4 border border-gray-800 flex-row items-start">
          <View
            className="p-2.5 rounded-lg mr-3 mt-0.5"
            style={{
              backgroundColor: "rgba(179, 26, 81, 0.15)",
              borderWidth: 1,
              borderColor: "rgba(179, 26, 81, 0.3)",
            }}
          >
            <MaterialCommunityIcons
              name="camera-outline"
              size={24}
              color="#EE8D5F"
            />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base mb-1">
              {t("CameraAccess.FeatureInspectionTitle") ||
                "Live Inspection & Land Photos"}
            </Text>
            <Text className="text-gray-400 text-xs leading-4">
              {t("CameraAccess.FeatureInspectionDesc") ||
                "Capture real-time photos of crops, land plots, water sources, and NIC documents during audits."}
            </Text>
          </View>
        </View>

        {/* Privacy Note */}
        <View
          className="p-3 rounded-lg mb-6 flex-row items-start"
          style={{
            backgroundColor: "rgba(179, 26, 81, 0.1)",
            borderWidth: 1,
            borderColor: "rgba(238, 141, 95, 0.25)",
          }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color="#EE8D5F"
            style={{ marginTop: 2, marginRight: 8 }}
          />
          <Text className="text-gray-300 text-xs flex-1 leading-4">
            {t("CameraAccess.DisclosureFooter") ||
              "Camera access is only active while using QR scanning or live photo capture. No photos or videos are captured without your explicit tap."}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="items-center w-full mt-auto">
          <TouchableOpacity
            onPress={requestCameraPermission}
            activeOpacity={0.8}
            disabled={isLoading}
            className="w-full mb-3"
            style={{ borderRadius: 999, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#EE8D5F", "#B31A51"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 52,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-extrabold text-base tracking-wide">
                  {isLoading
                    ? t("CameraAccess.Requesting...") ||
                    t("Permission.Requesting...") ||
                    "Requesting..."
                    : t("CameraAccess.AgreeAndContinue") ||
                    "Agree & Continue"}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDenyOrClose}
            activeOpacity={0.7}
            className="py-2.5 px-6 items-center justify-center"
          >
            <Text className="text-gray-400 font-semibold text-sm">
              {t("CameraAccess.NotNow") || "Not Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CameraAccess;