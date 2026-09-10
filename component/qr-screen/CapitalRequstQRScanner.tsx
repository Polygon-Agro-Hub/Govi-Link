import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  BackHandler,
  Pressable,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { CameraView, Camera } from "expo-camera";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp, useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { getLastScreen } from "@/database/inspectionprogress";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import CustomHeader from "../commons/CustomHeader";
import CameraAccess from "../permission/CameraAccess";

type CapitalRequstQRScannerNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CapitalRequstQRScanner"
>;
type CapitalRequstQRScannerRouteProp = RouteProp<
  RootStackParamList,
  "CapitalRequstQRScanner"
>;

interface CapitalRequstQRScannerProps {
  navigation: CapitalRequstQRScannerNavigationProp;
}

const { width } = Dimensions.get("window");
const scanningAreaSize = width * 0.8;

const FIRST_SCREEN = "PersonalInfo";

const CapitalRequstQRScanner: React.FC<CapitalRequstQRScannerProps> = ({
  navigation,
}) => {
  const route = useRoute<CapitalRequstQRScannerRouteProp>();
  const isFocused = useIsFocused();
  const { farmerId, requestId, requestNumber } = route.params || ({} as any);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] =
    useState<boolean>(false);
  const [showCameraAccess, setShowCameraAccess] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation();
  const [isUnsuccessfulModalVisible, setIsUnsuccessfulModalVisible] =
    useState<boolean>(false);
  const [unsuccessfulLoadingBarWidth] = useState(new Animated.Value(100));

  useEffect(() => {
    checkCameraPermissions();

    const unsubscribe = navigation.addListener("focus", () => {
      setScanned(false);
      setErrorMessage(null);
      setIsUnsuccessfulModalVisible(false);
      setIsCameraReady(false);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!isFocused) {
      setIsCameraReady(false);
    }
  }, [isFocused]);

  const checkCameraPermissions = async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    if (status === "granted") {
      setHasPermission(true);
      setShowCameraAccess(false);
    } else {
      setHasPermission(false);
      setShowCameraAccess(true);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setHasPermission(true);
      setShowCameraAccess(false);
    } else {
      setHasPermission(false);
      Alert.alert(
        t("Permission.PermissionDenied") || "Permission Denied",
        t("Permission.CameraAccessIsRequiredPleaseEnableItInSettings"),
        [
          { text: t("Main.Cancel") || "Cancel", style: "cancel" },
          {
            text: t("Permission.OpenSettings") || "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
  };

  const handleCameraPermissionGranted = () => {
    setIsTransitioning(true);
    setShowCameraAccess(false);
    setHasPermission(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const resolveTargetScreen = (reqId: number): string => {
    const lastScreen = getLastScreen(reqId);
    return lastScreen ?? FIRST_SCREEN;
  };

  const handleBarCodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    try {
      const qrData = JSON.parse(data);
      const userId = qrData.userInfo?.id;

      if (!userId) {
        throw new Error(t("QRScanner.UserIDNotFoundInQRCode"));
      }
      if (userId !== farmerId) {
        throw new Error(t("QRScanner.WrongQRCode"));
      }

      const updateOfficerStatus = async (officerId: number) => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;

          await axios.put(
            `${environment.API_BASE_URL}api/capital-request/fieldofficer/status/${officerId}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );
        } catch (error) {
          console.error("Failed to update officer status:", error);
          throw new Error(t("QRScanner.Failed to update officer status"));
        }
      };

      if (farmerId !== undefined) {
        await updateOfficerStatus(farmerId);
      }

      const targetScreen = resolveTargetScreen(requestId);

      navigation.navigate(targetScreen as any, {
        requestNumber,
        requestId,
      });
    } catch (error) {
      console.error("QR Parsing Error:", error);
      setErrorMessage(
        t(
          "QRScanner.TheScannedQRCodeDoesNotContainAValidUserIDOrIsDamaged",
        ),
      );
      setIsUnsuccessfulModalVisible(true);

      unsuccessfulLoadingBarWidth.setValue(100);
      Animated.timing(unsuccessfulLoadingBarWidth, {
        toValue: 0,
        duration: 5000,
        useNativeDriver: false,
      }).start();

      setTimeout(() => {
        setIsUnsuccessfulModalVisible(false);
        setErrorMessage(null);
        setScanned(false);
      }, 5000);
    }
  };

  useFocusEffect(
    useCallback(() => {
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

  if (showCameraAccess) {
    return (
      <CameraAccess
        navigation={navigation as any}
        onPermissionGranted={handleCameraPermissionGranted}
        returnScreen="CapitalRequstQRScanner"
      />
    );
  }

  if (hasPermission === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#333" }}>
          {t("QRScanner.RequestingForCameraPermission")}
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#333" }}>
          {t("QRScanner.NoAccessToCamera")}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#2C2C2C",
            padding: 10,
            borderRadius: 5,
            marginTop: 20,
          }}
          onPress={checkCameraPermissions}
        >
          <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
            {t("QRScanner.Try Again")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <CustomHeader
        title={t("QRScanner.ScanTheQR")}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      {isFocused && !isTransitioning ? (
        <CameraView
          style={{ flex: 1 }}
          onCameraReady={() => setIsCameraReady(true)}
          onBarcodeScanned={
            isCameraReady && !scanned ? handleBarCodeScanned : undefined
          }
          barcodeScannerSettings={
            isCameraReady && !scanned
              ? { barcodeTypes: ["qr", "pdf417"] }
              : undefined
          }
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#EE8D5F" />
        </View>
      )}

      {/* Scanning overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: scanningAreaSize,
            height: scanningAreaSize,
            borderColor: "#FAE432",
            borderWidth: 2,
            borderRadius: 10,
          }}
        />
      </View>

      {scanned && (
        <View
          style={{ position: "absolute", bottom: 100, alignSelf: "center" }}
        >
          <TouchableOpacity onPress={() => setScanned(false)}>
            <LinearGradient
              colors={["#F2561D", "#FF1D85"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                marginTop: 16,
                padding: 16,
                paddingHorizontal: 48,
                overflow: "hidden",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16 }}>
                {t("QRScanner.ScanAgain")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Error modal */}
      <Modal
        transparent={true}
        visible={isUnsuccessfulModalVisible}
        animationType="slide"
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-70">
          <View className="bg-white rounded-lg w-72 h-64 items-center relative overflow-hidden">
            <Pressable
              onPress={() => setIsUnsuccessfulModalVisible(false)}
              className="absolute top-3 right-3 z-10"
            >
              <Ionicons name="close" size={24} color="#000" />
            </Pressable>
            <View className="p-6 items-center">
              <Text className="text-xl font-bold mb-4">
                {t("QRScanner.Failed")}
              </Text>
              <View className="mb-4">
                <Image
                  source={require("../../assets/images/public/error.webp")}
                  className="w-32 h-32"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-gray-700">
                {t("QRScanner.WrongQRCode")}
              </Text>
            </View>
            <View className="absolute bottom-0 left-0 w-full h-2 bg-gray-300">
              <Animated.View
                className="h-full bg-red-500"
                style={{ width: unsuccessfulLoadingBarWidth }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CapitalRequstQRScanner;
