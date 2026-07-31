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
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { CameraView, Camera } from "expo-camera";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { getLastScreen } from "@/database/inspectionprogress";
import { environment } from "@/environment/environment";
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
  const { farmerId, requestId, requestNumber } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] =
    useState<boolean>(false);
  const [showCameraAccess, setShowCameraAccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation();
  const [isUnsuccessfulModalVisible, setIsUnsuccessfulModalVisible] =
    useState<boolean>(false);
  const [unsuccessfulLoadingBarWidth] = useState(new Animated.Value(100));

  useEffect(() => {
    checkCameraPermissions();
  }, []);

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
    setShowCameraAccess(false);
    setHasPermission(true);
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

      const token = await AsyncStorage.getItem("token");

      const response = await axios.put(
        `${environment.API_BASE_URL}api/capital-request/update-officer-status/${requestId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(t("QRScanner.Failed to update officer status"));
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
    }, []),
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
          {t("QRScanner.Camera permission denied")}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#34D399",
            padding: 10,
            borderRadius: 8,
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

      <CameraView
        className="flex-1"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr", "pdf417"] }}
        style={{ flex: 1 }}
      />

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
              className="items-center justify-center rounded-full mt-4 p-4 px-12"
              style={{ overflow: "hidden" }}
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
          <View className="bg-white rounded-lg w-72 h-80 items-center relative overflow-hidden">
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
