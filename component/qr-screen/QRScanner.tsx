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
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { CameraView, Camera } from "expo-camera";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import CustomHeader from "../commons/CustomHeader";
import CameraAccess from "../permission/CameraAccess";

type QRScannerNavigationProp = StackNavigationProp<
  RootStackParamList,
  "QRScanner"
>;
type QRScannerRouteProp = RouteProp<RootStackParamList, "QRScanner">;

interface QRScannerProps {
  navigation: QRScannerNavigationProp;
}

const { width } = Dimensions.get("window");
const scanningAreaSize = width * 0.8;
const QRScanner: React.FC<QRScannerProps> = ({ navigation }) => {
  const route = useRoute<QRScannerRouteProp>();
  const {
    farmerId,
    jobId,
    certificationpaymentId,
    farmerMobile,
    clusterId,
    farmId,
    isClusterAudit,
    auditId,
    screenName,
  } = route.params;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCameraAccess, setShowCameraAccess] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);
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
    });

    return unsubscribe;
  }, [navigation]);

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

  const handleCameraPermissionGranted = () => {
    setShowCameraAccess(false);
    setHasPermission(true);
  };

  const updateStatus = async (feildauditId: number, jobId: any) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await axios.post(
          `${environment.API_BASE_URL}api/cluster-audit/status/on-going/${feildauditId}`,
          { jobId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
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

      if (auditId && jobId) {
        await updateStatus(auditId, jobId);
      }

      navigation.navigate("CertificateQuesanory", {
        jobId,
        certificationpaymentId,
        farmerMobile,
        clusterId,
        farmId,
        isClusterAudit,
        auditId,
        screenName: screenName,
      });
    } catch (error) {
      console.error("QR Parsing Error:", error);
      setErrorMessage(
        t("QRScanner.TheScannedQRCodeDoesNotContainAValidUserIDOrIsDamaged"),
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

  const handleBackPress = () => {
    if (screenName === "AssignJobs") {
      navigation.goBack();
    } else {
      navigation.navigate("Main", {
        screen: "MainTabs",
        params: { screen: screenName },
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [screenName]),
  );

  if (showCameraAccess) {
    return (
      <CameraAccess
        navigation={navigation as any}
        onPermissionGranted={handleCameraPermissionGranted}
        returnScreen="QRScanner"
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

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <CustomHeader
        title={t("QRScanner.ScanTheQR")}
        navigation={navigation}
        showBackButton={true}
        onBackPress={handleBackPress}
      />

      <CameraView
        className="flex-1"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr", "pdf417"] }}
        style={{ flex: 1 }}
      />

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

export default QRScanner;
