import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  BackHandler,
} from "react-native";
import {
  Feather,
  FontAwesome,
  FontAwesome6,
  MaterialIcons,
  AntDesign,
} from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { CameraScreen } from "@/Items/CameraScreen";
import axios from "axios";
import environment from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveLandInfo,
  getLandInfo,
  LandInfo as LandInfoData,
  LandImage,
  GeoLocation,
} from "@/database/inspectionland";
import { updateLastScreen } from "@/database/inspectionprogress";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import CameraAccess from "../permission/CameraAccess";
import LocationAccess from "../permission/LocationAccess";

type LandInfoProps = {
  navigation: any;
};

const LandInfo: React.FC<LandInfoProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "LandInfo">>();
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();

  const [formData, setFormData] = useState<LandInfoData>({
    landDiscription: "",
    isOwnByFarmer: undefined,
    ownershipStatus: undefined,
    images: [],
    geoLocation: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [landownModal, setlandownNoModal] = useState(false);
  const [legalStatusModal, setLegalStatusModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);

  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [showCameraAccess, setShowCameraAccess] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<
    boolean | null
  >(null);
  const [showLocationAccess, setShowLocationAccess] = useState(false);
  const [pendingGeoLocationAction, setPendingGeoLocationAction] =
    useState(false);

  const LEGAL_STATUS_OPTIONS = [
    {
      key: "OwnLandSingleOwner",
      label: t("InspectionForm.OwnLandSingleOwner"),
    },
    {
      key: "OwnLandMultipleOwners",
      label: t("InspectionForm.OwnLandMultipleOwners"),
    },
    {
      key: "LeasedLandFromPrivateOwner",
      label: t("InspectionForm.LeasedLandFromPrivateOwner"),
    },
    {
      key: "LeasedLandFromTheGovernment",
      label: t("InspectionForm.LeasedLandFromTheGovernment"),
    },
    {
      key: "PermitLandShortTerm",
      label: t("InspectionForm.PermitLandShortTerm"),
    },
    {
      key: "PermitLandLongTerm",
      label: t("InspectionForm.PermitLandLongTerm"),
    },
  ];

  useFocusEffect(
    useCallback(() => {
      updateLastScreen(requestId, "LandInfo");
    }, [requestId]),
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          await saveLandInfo(Number(requestId), formData);
        } catch (err) {
          console.error("Error auto-saving land info:", err);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, requestId]);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.getCameraPermissionsAsync();
    if (cameraStatus === "granted") {
      setHasCameraPermission(true);
    } else {
      setHasCameraPermission(false);
    }

    const { status: locationStatus } =
      await Location.getForegroundPermissionsAsync();
    if (locationStatus === "granted") {
      setHasLocationPermission(true);
    } else {
      setHasLocationPermission(false);
    }
  };

  const handleCameraPermissionGranted = () => {
    setShowCameraAccess(false);
    setHasCameraPermission(true);
    setShowCamera(true);
  };

  const handleLocationPermissionGranted = async () => {
    setShowLocationAccess(false);
    setHasLocationPermission(true);
    setPendingGeoLocationAction(false);
    navigateToGeoLocation();
  };

  const navigateToGeoLocation = () => {
    navigation.navigate("AttachGeoLocationScreen", {
      currentLatitude: formData.geoLocation?.latitude,
      currentLongitude: formData.geoLocation?.longitude,
      onLocationSelect: (
        latitude: number,
        longitude: number,
        locationName: string,
      ) => {
        const geoLocation: GeoLocation = {
          latitude,
          longitude,
          locationName: locationName || "Selected Location",
        };
        updateFormData({ geoLocation });
        setTouched((prev) => ({ ...prev, geoLocation: true }));
        setErrors((prev) => ({ ...prev, geoLocation: "" }));
        if (requestId) {
          const updatedData = { ...formData, geoLocation };
          saveLandInfo(Number(requestId), updatedData);
        }
      },
    });
  };

  const handleOpenCamera = async () => {
    if (hasCameraPermission === null) {
      await checkPermissions();
    }

    if (hasCameraPermission === false) {
      setShowCameraAccess(true);
    } else {
      setShowCamera(true);
    }
  };

  const handleOpenGeoLocation = async () => {
    if (hasLocationPermission === null) {
      await checkPermissions();
    }

    if (hasLocationPermission === false) {
      setPendingGeoLocationAction(true);
      setShowLocationAccess(true);
    } else {
      navigateToGeoLocation();
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;
        try {
          const reqId = Number(requestId);
          const localData = await getLandInfo(reqId);
          if (localData) {
            setFormData(localData);
            setIsExistingData(true);

            const validationErrors: Record<string, string> = {};
            if (!localData.landDiscription?.trim())
              validationErrors.landDiscription = t(
                "Error.CultivationLandsDescriptionIsRequired",
              );
            if (!localData.isOwnByFarmer)
              validationErrors.isOwnByFarmer = t(
                "Error.LandOwnershipIsRequired",
              );
            if (!localData.ownershipStatus)
              validationErrors.ownershipStatus = t(
                "Error.LandOwnershipIsRequired",
              );
            if (!localData.geoLocation)
              validationErrors.geoLocation = t(
                "Error.Geo location is required",
              );
            if (!localData.images?.length)
              validationErrors.images = t(
                "Error.AtLeastOneCategoryOptionMustBeSelected",
              );

            setErrors(validationErrors);
          } else {
            setIsExistingData(false);
          }
        } catch (error) {
          console.error("Failed to load land info from SQLite:", error);
        }
      };
      loadData();
    }, [requestId]),
  );

  useEffect(() => {
    const allFilled =
      formData.landDiscription.trim() !== "" &&
      formData.isOwnByFarmer !== undefined &&
      formData.ownershipStatus !== undefined &&
      formData.geoLocation !== undefined &&
      formData.images.length > 0;

    setIsNextEnabled(allFilled);
  }, [formData]);

  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => {
        navigation.navigate("Main", {
          screen: "MainTabs",
          params: { screen: "CapitalRequests" },
        });
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress,
      );
      return () => subscription.remove();
    }, [navigation]),
  );

  const updateFormData = (updates: Partial<LandInfoData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validationErrors: Record<string, string> = { ...errors };
    if (field === "landDiscription") {
      if (!formData.landDiscription || formData.landDiscription.trim() === "") {
        validationErrors.landDiscription = t(
          "Error.CultivationLandsDescriptionIsRequired",
        );
      } else {
        validationErrors.landDiscription = "";
      }
    }
    setErrors(validationErrors);
  };

  const handleCameraClose = (uri: string | null) => {
    setShowCamera(false);
    if (!uri) return;
    const fileObj: LandImage = {
      uri,
      name: `land_${Date.now()}.jpg`,
      type: "image/jpeg",
    };
    updateFormData({ images: [...formData.images, fileObj] });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData({ images: newImages });
  };

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: LandInfoData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      const apiFormData = new FormData();
      apiFormData.append("reqId", reqId.toString());
      apiFormData.append("tableName", tableName);
      apiFormData.append(
        "isOwnByFarmer",
        data.isOwnByFarmer === "Yes" ? "1" : "0",
      );
      apiFormData.append("ownershipStatus", data.ownershipStatus || "");
      apiFormData.append("landDiscription", data.landDiscription || "");

      if (data.geoLocation) {
        apiFormData.append("latitude", data.geoLocation.latitude.toString());
        apiFormData.append("longitude", data.geoLocation.longitude.toString());
      }

      if (data.images && data.images.length > 0) {
        let existingUrlIndex = 0;
        data.images.forEach((img: LandImage, index: number) => {
          if (img.uri.startsWith("http://") || img.uri.startsWith("https://")) {
            apiFormData.append(`imagesUrl_${existingUrlIndex}`, img.uri);
            existingUrlIndex++;
          } else if (
            img.uri.startsWith("file://") ||
            img.uri.startsWith("content://")
          ) {
            apiFormData.append("images", {
              uri: img.uri,
              name: img.name || `land_${Date.now()}_${index}.jpg`,
              type: img.type || "image/jpeg",
            } as any);
          }
        });
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        apiFormData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data.success) {
        if (response.data.data.images) {
          let imageUrls = response.data.data.images;
          if (typeof imageUrls === "string") {
            try {
              imageUrls = JSON.parse(imageUrls);
            } catch (e) {
              imageUrls = [];
            }
          }
          if (!Array.isArray(imageUrls)) imageUrls = [];
          const imageObjects = imageUrls.map((url: string) => ({
            uri: url,
            name: url.split("/").pop() || "image.jpg",
            type: "image/jpeg",
          }));
          updateFormData({ images: imageObjects });
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(`Error saving land info:`, error);
      return false;
    }
  };

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    if (!formData.landDiscription || formData.landDiscription.trim() === "") {
      validationErrors.landDiscription = t(
        "Error.CultivationLandsDescriptionIsRequired",
      );
    }
    if (!formData.isOwnByFarmer) {
      validationErrors.isOwnByFarmer = t("Error.LandOwnershipIsRequired");
    }
    if (!formData.ownershipStatus) {
      validationErrors.ownershipStatus = t("Error.OwnershipStatusIsRequired");
    }
    if (!formData.geoLocation) {
      validationErrors.geoLocation = t("Error.Geo location is required");
    }
    if (!formData.images || formData.images.length === 0) {
      validationErrors.images = t(
        "Error.AtLeastOneCategoryOptionMustBeSelected",
      );
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({
        isOwnByFarmer: true,
        ownershipStatus: true,
        landDiscription: true,
        geoLocation: true,
        images: true,
      });
      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.ValidationError"), errorMessage, [
        { text: t("Main.OK") },
      ]);
      return;
    }

    if (!requestId) {
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.OK") }],
      );
      return;
    }

    const reqId = Number(requestId);
    if (isNaN(reqId) || reqId <= 0) {
      Alert.alert(
        t("Error.Error"),
        "Invalid request ID. Please go back and try again.",
        [{ text: t("Main.OK") }],
      );
      return;
    }

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.PleaseWait..."),
      [],
      { cancelable: false },
    );

    try {
      const saved = await saveToBackend(
        reqId,
        "inspectionland",
        formData,
        isExistingData,
      );

      if (saved) {
        setIsExistingData(true);
        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.DataSavedSuccessfully"),
          [
            {
              text: t("Main.OK"),
              onPress: () => {
                navigation.navigate("InvestmentInfo", {
                  requestNumber,
                  requestId,
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          t("Main.Warning"),
          t("InspectionForm.CouldNotSaveToServerDataSavedLocally"),
          [{ text: t("Main.OK") }],
        );
      }
    } catch (error) {
      console.error("Error during final save:", error);
      Alert.alert(
        t("Main.Warning"),
        t("InspectionForm.CouldNotSaveToServerDataSavedLocally"),
        [{ text: t("Main.OK") }],
      );
    }
  };

  const handleTabPress = (tabKey: string) => {
    const routeMap: Record<string, string> = {
      "Personal Info": "PersonalInfo",
      "ID Proof": "IDProof",
      "Finance Info": "FinanceInfo",
      "Land Info": "LandInfo",
      "Investment Info": "InvestmentInfo",
      "Cultivation Info": "CultivationInfo",
      "Cropping Systems": "CroppingSystems",
      "Profit & Risk": "ProfitRisk",
      Economical: "Economical",
      Labour: "Labour",
      "Harvest Storage": "HarvestStorage",
    };
    const route = routeMap[tabKey];
    if (route) {
      navigation.navigate(route, { requestId, requestNumber });
    }
  };

  if (showLocationAccess) {
    return (
      <LocationAccess
        navigation={navigation}
        onPermissionGranted={handleLocationPermissionGranted}
        returnScreen="LandInfo"
        onBackPress={() => setShowLocationAccess(false)}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
      keyboardVerticalOffset={Platform.OS === "android" ? -200 : 0}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <FormTabs
          activeKey="Land Info"
          navigation={navigation}
          requestId={requestId}
          onTabPress={handleTabPress}
        />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          {/* Is land owned by farmer */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.IsTheLandOwnByFarmer")} *
            </Text>
            <TouchableOpacity
              className="bg-[#F6F6F6] rounded-full px-4 h-[50px] flex-row items-center justify-between"
              onPress={() => setlandownNoModal(true)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                {formData.isOwnByFarmer ? (
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="text-black"
                  >
                    {t(`InspectionForm.${formData.isOwnByFarmer}`)}
                  </Text>
                ) : (
                  <Text numberOfLines={1} className="text-[#838B8C]">
                    {t("InspectionForm.SelectFromHere")}
                  </Text>
                )}
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {touched.isOwnByFarmer &&
              errors.isOwnByFarmer &&
              !formData.isOwnByFarmer && (
                <View className="flex-row items-center mt-1 ml-2">
                  <FontAwesome
                    name="exclamation-triangle"
                    size={14}
                    color="#EF4444"
                  />
                  <Text className="text-red-500 text-sm ml-1 flex-1">
                    {errors.isOwnByFarmer}
                  </Text>
                </View>
              )}
          </View>

          {/* Legal status */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.LegalStatusOfTheOwnershipOfTheLand")} *
            </Text>
            <TouchableOpacity
              className="bg-[#F6F6F6] rounded-full px-4 h-[50px] flex-row items-center justify-between"
              onPress={() => setLegalStatusModal(true)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                {formData.ownershipStatus ? (
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="text-black"
                  >
                    {t(`InspectionForm.${formData.ownershipStatus}`)}
                  </Text>
                ) : (
                  <Text numberOfLines={1} className="text-[#838B8C]">
                    {t("InspectionForm.SelectFromHere")}
                  </Text>
                )}
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {touched.ownershipStatus &&
              errors.ownershipStatus &&
              !formData.ownershipStatus && (
                <View className="flex-row items-center mt-1 ml-2">
                  <FontAwesome
                    name="exclamation-triangle"
                    size={14}
                    color="#EF4444"
                  />
                  <Text className="text-red-500 text-sm ml-1 flex-1">
                    {errors.ownershipStatus}
                  </Text>
                </View>
              )}
          </View>

          {/* Land description */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.ProvideBriefDescriptionToReachTheCultivationLand",
              )}{" "}
              *
            </Text>
            <View
              className="bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2"
              style={
                touched.landDiscription && errors.landDiscription
                  ? { borderWidth: 1, borderColor: "#EF4444" }
                  : {}
              }
            >
              <TextInput
                placeholder={t("InspectionForm.TypeHere...")}
                value={formData.landDiscription}
                onChangeText={(text) => {
                  let formattedText = text.replace(/^\s+/, "");
                  if (formattedText.length > 0 && !text.startsWith("\n")) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }
                  updateFormData({ landDiscription: formattedText });
                  if (errors.landDiscription)
                    setErrors((prev) => ({ ...prev, landDiscription: "" }));
                }}
                onBlur={() => handleBlur("landDiscription")}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            {touched.landDiscription && errors.landDiscription && (
              <View className="flex-row items-center mt-1 ml-2">
                <FontAwesome
                  name="exclamation-triangle"
                  size={14}
                  color="#EF4444"
                />
                <Text className="text-red-500 text-sm ml-1 flex-1">
                  {errors.landDiscription}
                </Text>
              </View>
            )}
          </View>

          {/* Geo location */}
          <View className="mt-6">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.TagTheGeoCoordinatesOfTheLand")} *
            </Text>
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                className="flex-1 bg-[#FA345A] rounded-3xl px-4 h-[50px] flex-row items-center justify-center gap-x-2"
                onPress={handleOpenGeoLocation}
              >
                {formData.geoLocation ? (
                  <Feather name="rotate-ccw" size={24} color="#fff" />
                ) : (
                  <MaterialIcons name="gps-fixed" size={24} color="#fff" />
                )}
                <Text className="text-white font-semibold text-lg">
                  {t("InspectionForm.TagGeoCoordinate")}
                </Text>
              </TouchableOpacity>
            </View>

            {formData.geoLocation && (
              <View>
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity
                    className="flex-1 bg-white rounded-full px-4 py-2 flex-row items-center justify-center"
                    onPress={() =>
                      navigation.navigate("ViewLocationScreen", {
                        latitude: formData.geoLocation!.latitude,
                        longitude: formData.geoLocation!.longitude,
                        locationName: formData.geoLocation!.locationName,
                      })
                    }
                  >
                    <MaterialIcons
                      name="location-pin"
                      size={18}
                      color="#FF0000"
                    />
                    <Text className="ml-1 text-[#FF0000] underline">
                      {t("InspectionForm.ViewHere")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {touched.geoLocation &&
              errors.geoLocation &&
              !formData.geoLocation && (
                <View className="flex-row items-center mt-2 ml-2">
                  <FontAwesome
                    name="exclamation-triangle"
                    size={14}
                    color="#EF4444"
                  />
                  <Text className="text-red-500 text-sm ml-1 flex-1">
                    {errors.geoLocation}
                  </Text>
                </View>
              )}
          </View>

          {/* Images */}
          <View className="mt-6">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.ImagesOfTheDeedLeasePermitAnyOtherFormalDocumentToProveTheOwnershipOfTheLandByTheFarmer",
              )}{" "}
              *
            </Text>
            <TouchableOpacity
              className="bg-[#1A1A1A] rounded-3xl px-4 h-[54px] flex-row items-center justify-center gap-x-2"
              onPress={handleOpenCamera}
            >
              <FontAwesome6 name="camera" size={24} color="#fff" />
              <Text className="text-white font-semibold text-lg">
                {t("InspectionForm.CapturePhotos")}
              </Text>
            </TouchableOpacity>
            {touched.images &&
              errors.images &&
              formData.images.length === 0 && (
                <View className="flex-row items-center mt-2 ml-2">
                  <FontAwesome
                    name="exclamation-triangle"
                    size={14}
                    color="#EF4444"
                  />
                  <Text className="text-red-500 text-sm ml-1 flex-1">
                    {errors.images}
                  </Text>
                </View>
              )}
          </View>

          {formData.images && formData.images.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm text-gray-600 mb-2">
                {formData.images.length} image(s) captured
              </Text>
              <View className="mt-4 flex-row flex-wrap">
                {formData.images.map((img: LandImage, index: number) => (
                  <View key={index} className="w-1/2 p-1 relative">
                    <Image
                      source={{ uri: img.uri }}
                      className="w-full h-40 rounded-2xl"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      className="absolute top-[-8] right-[-7] bg-[#f21d1d] p-1 rounded-full"
                    >
                      <AntDesign name="close" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <FormFooterButton
          exitText={t("InspectionForm.Back")}
          nextText={t("InspectionForm.Next")}
          isNextEnabled={isNextEnabled}
          onExit={() =>
            navigation.navigate("FinanceInfo", { requestNumber, requestId })
          }
          onNext={handleNext}
        />
      </View>

      {/* Land ownership modal */}
      <Modal transparent visible={landownModal} animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => {
            setlandownNoModal(false);
            if (!formData.isOwnByFarmer) {
              setTouched((prev) => ({ ...prev, isOwnByFarmer: true }));
              setErrors((prev) => ({
                ...prev,
                isOwnByFarmer: t("Error.LandOwnershipIsRequired"),
              }));
            }
          }}
        >
          <View className="bg-white w-64 rounded-2xl overflow-hidden">
            {["Yes", "No"].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="h-[50px] justify-center items-center"
                  onPress={() => {
                    updateFormData({ isOwnByFarmer: item as "Yes" | "No" });
                    setTouched((prev) => ({ ...prev, isOwnByFarmer: true }));
                    setErrors((prev) => ({ ...prev, isOwnByFarmer: "" }));
                    setlandownNoModal(false);
                  }}
                >
                  <Text className="text-center text-base text-black">
                    {t(`InspectionForm.${item}`)}
                  </Text>
                </TouchableOpacity>
                {index !== arr.length - 1 && (
                  <View className="h-px bg-gray-300 mx-4" />
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Legal status modal */}
      <Modal transparent visible={legalStatusModal} animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => {
            setLegalStatusModal(false);
            if (!formData.ownershipStatus) {
              setTouched((prev) => ({ ...prev, ownershipStatus: true }));
              setErrors((prev) => ({
                ...prev,
                ownershipStatus: t("Error.OwnershipStatusIsRequired"),
              }));
            }
          }}
        >
          <View className="bg-white w-10/12 rounded-2xl overflow-hidden">
            {LEGAL_STATUS_OPTIONS.map((item, index) => (
              <View key={item.key}>
                <TouchableOpacity
                  className="px-4 h-[50px] justify-center items-center"
                  onPress={() => {
                    updateFormData({ ownershipStatus: item.key });
                    setTouched((prev) => ({ ...prev, ownershipStatus: true }));
                    setErrors((prev) => ({ ...prev, ownershipStatus: "" }));
                    setLegalStatusModal(false);
                  }}
                >
                  <Text className="text-center text-base text-black">
                    {item.label}
                  </Text>
                </TouchableOpacity>
                {index !== LEGAL_STATUS_OPTIONS.length - 1 && (
                  <View className="h-px bg-gray-300 mx-4" />
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCamera} animationType="slide">
        <CameraScreen onClose={handleCameraClose} />
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default LandInfo;
