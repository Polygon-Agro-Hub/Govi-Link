import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from "react-native";
import {
  AntDesign,
  Feather,
  FontAwesome6,
  MaterialIcons,
} from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../types";
import { CameraScreen } from "@/Items/CameraScreen";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/services/store";
import {
  initializeLandInfo,
  updateLandInfo,
  setLandInfo,
  addImage,
  removeImage,
  setImages,
  setGeoLocation,
  markAsExisting,
  loadLandInfoFromStorage,
  saveLandInfoToStorage,
  LandInfoData,
  LandImage,
  GeoLocation,
} from "@/store/LandInfoSlice";
import FormFooterButton from "./FormFooterButton";

type LandInfoProps = {
  navigation: any;
};

const LandInfo: React.FC<LandInfoProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "LandInfo">>();
  const { requestNumber, requestId } = route.params;
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [landownModal, setlandownNoModal] = useState(false);
  const [legalStatusModal, setLegalStatusModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  const dispatch = useDispatch();

  // Get data from Redux store
  const formData = useSelector(
    (state: RootState) =>
      state.inspectionland.data[requestId] || {
        landDiscription: "",
        isOwnByFarmer: undefined,
        ownershipStatus: undefined,
        images: [],
        geoLocation: undefined,
      },
  );

  const isExistingData = useSelector(
    (state: RootState) => state.inspectionland.isExisting[requestId] || false,
  );

  // Validate form completion
  useEffect(() => {
    const requiredFields: (keyof LandInfoData)[] = [
      "landDiscription",
      "isOwnByFarmer",
      "ownershipStatus",
      "geoLocation",
    ];

    const allFilled = requiredFields.every(
      (key) =>
        formData[key] !== undefined &&
        formData[key] !== null &&
        formData[key].toString().trim() !== "",
    );

    const hasImages = !!(formData.images && formData.images.length > 0);

    setIsNextEnabled(allFilled && hasImages);
  }, [formData]);

  // Fetch land info from backend
  const fetchInspectionData = async (
    reqId: number,
  ): Promise<LandInfoData | null> => {
    try {
      console.log(`🔍 Fetching land inspection data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectionland",
          },
        },
      );

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing land data:`, response.data.data);
        const data = response.data.data;

        const safeJsonParse = (field: any): string[] => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === "string") {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.warn(`Failed to parse images:`, field);
              return [];
            }
          }
          return [];
        };

        return {
          isOwnByFarmer:
            data.isOwnByFarmer === 1 || data.isOwnByFarmer === "1"
              ? "Yes"
              : "No",
          ownershipStatus: data.ownershipStatus || "",
          landDiscription: data.landDiscription || "",
          geoLocation:
            data.latitude && data.longitude
              ? {
                  latitude: parseFloat(data.latitude),
                  longitude: parseFloat(data.longitude),
                  locationName: data.locationName || "",
                }
              : undefined,
          images: safeJsonParse(data.images).map((url: string) => ({
            uri: url,
            name: url.split("/").pop() || "image.jpg",
            type: "image/jpeg",
          })),
        };
      }

      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching land inspection data:`, error);
      if (error.response?.status === 404) {
        console.log(`📝 No existing record - will create new`);
      }
      return null;
    }
  };

  // Save to backend
  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: LandInfoData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName,
      );

      const apiFormData = new FormData();
      apiFormData.append("reqId", reqId.toString());
      apiFormData.append("tableName", tableName);
      apiFormData.append(
        "isOwnByFarmer",
        data.isOwnByFarmer === "Yes" ? "1" : "0",
      );
      apiFormData.append("ownershipStatus", data.ownershipStatus || "");
      apiFormData.append("landDiscription", data.landDiscription || "");

      // Add geo location
      if (data.geoLocation) {
        apiFormData.append("latitude", data.geoLocation.latitude.toString());
        apiFormData.append("longitude", data.geoLocation.longitude.toString());
      }

      // Handle images - differentiate between S3 URLs and local files
      if (data.images && data.images.length > 0) {
        let existingUrlIndex = 0;

        data.images.forEach((img: LandImage, index: number) => {
          // Check if it's an S3 URL (already uploaded)
          if (img.uri.startsWith("http://") || img.uri.startsWith("https://")) {
            apiFormData.append(`imageUrl_${existingUrlIndex}`, img.uri);
            existingUrlIndex++;
            console.log(`🔗 Keeping existing image URL: ${img.uri}`);
          }
          // Local file - need to upload
          else if (
            img.uri.startsWith("file://") ||
            img.uri.startsWith("content://")
          ) {
            apiFormData.append("images", {
              uri: img.uri,
              name: img.name || `land_${Date.now()}_${index}.jpg`,
              type: img.type || "image/jpeg",
            } as any);
            console.log(`📤 Uploading new image: ${img.name}`);
          }
        });
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        apiFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        console.log(`✅ Land info saved successfully`);

        // Update Redux with S3 URLs from backend
        if (response.data.data.images) {
          let imageUrls = response.data.data.images;
          if (typeof imageUrls === "string") {
            try {
              imageUrls = JSON.parse(imageUrls);
            } catch (e) {
              console.error("Failed to parse images:", imageUrls);
              imageUrls = [];
            }
          }

          if (!Array.isArray(imageUrls)) {
            imageUrls = [];
          }

          const imageObjects = imageUrls.map((url: string) => ({
            uri: url,
            name: url.split("/").pop() || "image.jpg",
            type: "image/jpeg",
          }));

          dispatch(setImages({ requestId, images: imageObjects }));

          // Save to AsyncStorage
          const updatedData = { ...formData, images: imageObjects };
          await saveLandInfoToStorage(requestId, updatedData);
        }

        return true;
      }

      return false;
    } catch (error: any) {
      console.error(`❌ Error saving land info:`, error);
      return false;
    }
  };

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          dispatch(initializeLandInfo({ requestId }));

          // Try to fetch from backend first
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded land data from backend`);
                dispatch(
                  setLandInfo({
                    requestId,
                    data: backendData,
                    isExisting: true,
                  }),
                );

                await saveLandInfoToStorage(requestId, backendData);
                return;
              }
            }
          }

          // Fallback to AsyncStorage
          const stored = await AsyncStorage.getItem(`landinfo_${requestId}`);
          if (stored) {
            const parsedData = JSON.parse(stored);
            dispatch(loadLandInfoFromStorage({ requestId, data: parsedData }));
            console.log(`✅ Loaded land data from AsyncStorage`);
          } else {
            console.log("📝 No existing land data - new entry");
          }
        } catch (error) {
          console.error("Failed to load land data", error);
        }
      };

      loadData();
    }, [requestId, dispatch]),
  );

  // Handle camera close
  const handleCameraClose = (uri: string | null) => {
    setShowCamera(false);

    if (!uri) return;

    const fileObj: LandImage = {
      uri,
      name: `land_${Date.now()}.jpg`,
      type: "image/jpeg",
    };

    dispatch(addImage({ requestId, image: fileObj }));
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    dispatch(removeImage({ requestId, index }));
  };

  // Handle field changes
  const handleFieldChange = (key: keyof LandInfoData, value: any) => {
    dispatch(
      updateLandInfo({
        requestId,
        updates: { [key]: value },
      }),
    );
  };

  // Handle next button
  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    if (!formData.landDiscription || formData.landDiscription.trim() === "") {
      validationErrors.landDiscription = t("Error.landDiscription is required");
    }
    if (!formData.isOwnByFarmer) {
      validationErrors.isOwnByFarmer = t("Error.Land ownership is required");
    }
    if (!formData.ownershipStatus) {
      validationErrors.ownershipStatus = t(
        "Error.Ownership status is required",
      );
    }
    if (!formData.geoLocation) {
      validationErrors.geoLocation = t("Error.Geo location is required");
    }
    if (!formData.images || formData.images.length === 0) {
      validationErrors.images = t("Error.At least one image is required");
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("Main.ok") },
      ]);
      return;
    }

    if (!route.params?.requestId) {
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    const reqId = Number(route.params.requestId);

    if (isNaN(reqId) || reqId <= 0) {
      Alert.alert(
        t("Error.Error"),
        "Invalid request ID. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
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
        console.log("✅ Land info saved successfully to backend");
        dispatch(markAsExisting({ requestId }));

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("InvestmentInfo", {
                  formData,
                  requestNumber,
                  requestId: route.params.requestId,
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          t("Main.Warning"),
          t("InspectionForm.Could not save to server. Data saved locally."),
          [
            {
              text: t("Main.Continue"),
              onPress: () => {
                navigation.navigate("InvestmentInfo", {
                  formData,
                  requestNumber,
                  requestId: route.params.requestId,
                });
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error during final save:", error);
      Alert.alert(
        t("Main.Warning"),
        t("InspectionForm.Could not save to server. Data saved locally."),
        [
          {
            text: t("Main.Continue"),
            onPress: () => {
              navigation.navigate("InvestmentInfo", {
                formData,
                requestNumber,
                requestId: route.params.requestId,
              });
            },
          },
        ],
      );
    }
  };

  const LEGAL_STATUS_OPTIONS = [
    "Own land – Single owner",
    "Own land – Multiple owners (undivided)",
    "Leased land from private owner",
    "Leased land from the government",
    "Permit land – short term from the government",
    "Permit land – long term from the government",
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <StatusBar barStyle="dark-content" />

        <FormTabs activeKey="Land Info" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          {/* Is the land own by farmer */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Is the land own by farmer")} *
            </Text>
            <TouchableOpacity
              className="bg-[#F6F6F6] rounded-full px-4 py-4 flex-row items-center justify-between"
              onPress={() => setlandownNoModal(true)}
              activeOpacity={0.7}
            >
              {formData.isOwnByFarmer ? (
                <Text className="text-black">
                  {t(`InspectionForm.${formData.isOwnByFarmer}`)}
                </Text>
              ) : (
                <Text className="text-[#838B8C]">
                  {t("InspectionForm.--Select From Here--")}
                </Text>
              )}
              {!formData.isOwnByFarmer && (
                <AntDesign name="down" size={20} color="#838B8C" />
              )}
            </TouchableOpacity>
          </View>

          {/* Legal status */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Legal status of the ownership of the land")} *
            </Text>
            <TouchableOpacity
              className="bg-[#F6F6F6] rounded-full px-4 py-4 flex-row items-center justify-between"
              onPress={() => setLegalStatusModal(true)}
              activeOpacity={0.7}
            >
              {formData.ownershipStatus ? (
                <Text className="text-black">
                  {t(`InspectionForm.${formData.ownershipStatus}`)}
                </Text>
              ) : (
                <Text className="text-[#838B8C]">
                  {t("InspectionForm.--Select From Here--")}
                </Text>
              )}
              {!formData.ownershipStatus && (
                <AntDesign name="down" size={20} color="#838B8C" />
              )}
            </TouchableOpacity>
          </View>

          {/* Land description */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.Provide brief description to reach the cultivation land",
              )}{" "}
              *
            </Text>
            <View
              className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                errors.landDiscription ? "border border-red-500" : ""
              }`}
            >
              <TextInput
                placeholder={t("InspectionForm.Type here...")}
                value={formData.landDiscription || ""}
                onChangeText={(text) => {
                  let formattedText = text.replace(/^\s+/, "");
                  if (formattedText.length > 0) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }
                  handleFieldChange("landDiscription", formattedText);
                }}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            {errors.landDiscription && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.landDiscription}
              </Text>
            )}
          </View>

          {/* Geo coordinates */}
          <View className="mt-6">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Tag the geo coordinates of the land")} *
            </Text>
            <TouchableOpacity
              className="bg-[#FA345A] rounded-full px-4 py-4 flex-row items-center justify-center gap-x-2"
              onPress={() =>
                navigation.navigate("AttachGeoLocationScreen", {
                  currentLatitude: formData.geoLocation?.latitude,
                  currentLongitude: formData.geoLocation?.longitude,
                  onLocationSelect: async (
                    latitude: number,
                    longitude: number,
                    locationName: string,
                  ) => {
                    const geoLocation: GeoLocation = {
                      latitude,
                      longitude,
                      locationName,
                    };
                    dispatch(setGeoLocation({ requestId, geoLocation }));

                    const updatedData = { ...formData, geoLocation };
                    await saveLandInfoToStorage(requestId, updatedData);
                  },
                })
              }
            >
              {formData.geoLocation ? (
                <Feather name="rotate-ccw" size={22} color="#fff" />
              ) : (
                <MaterialIcons name="gps-fixed" size={22} color="#fff" />
              )}
              <Text className="text-white font-semibold">
                {t("InspectionForm.Tag Geo Coordinate")}
              </Text>
            </TouchableOpacity>
          </View>

          {formData.geoLocation && (
            <TouchableOpacity
              className="mt-2 rounded-full px-4 py-3 flex-row items-center justify-center gap-x-2"
              onPress={() =>
                navigation.navigate("ViewLocationScreen", {
                  latitude: formData.geoLocation!.latitude,
                  longitude: formData.geoLocation!.longitude,
                  locationName: formData.geoLocation!.locationName,
                })
              }
            >
              <MaterialIcons name="location-pin" size={24} color="#FF0000" />
              <Text className="text-[#FF0000] font-semibold border-b-2 border-[#FF0000]">
                {t("InspectionForm.View Here")}
              </Text>
            </TouchableOpacity>
          )}

          {/* Images */}
          <View className="mt-6">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.Images of the deed / lease / permit / any other formal document to prove the ownership of the land by the farmer",
              )}{" "}
              *
            </Text>
            <TouchableOpacity
              className="bg-[#1A1A1A] rounded-full px-4 py-4 flex-row items-center justify-center gap-x-2"
              onPress={() => setShowCamera(true)}
            >
              <FontAwesome6 name="camera" size={22} color="#fff" />
              <Text className="text-white font-semibold">
                {t("InspectionForm.Capture Photos")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Image gallery */}
          {formData.images && formData.images.length > 0 && (
            <View className="mt-4 flex-row flex-wrap">
              {formData.images.map((img: LandImage, index: number) => (
                <View
                  key={index}
                  className="w-40 h-40 m-1 rounded-xl overflow-hidden relative"
                >
                  <Image
                    source={{ uri: img.uri }}
                    className="w-full h-full rounded-xl"
                  />
                  <TouchableOpacity
                    className="absolute top-1 right-1 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text className="text-white text-xs font-bold">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <FormFooterButton
          exitText={t("InspectionForm.Back")}
          nextText={t("InspectionForm.Next")}
          isNextEnabled={isNextEnabled}
          onExit={() => navigation.goBack()}
          onNext={handleNext}
        />
      </View>

      {/* Modals */}
      <Modal transparent visible={landownModal} animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => setlandownNoModal(false)}
        >
          <View className="bg-white w-80 rounded-2xl overflow-hidden">
            {["Yes", "No"].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4"
                  onPress={async () => {
                    await handleFieldChange(
                      "isOwnByFarmer",
                      item as "Yes" | "No",
                    );
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

      <Modal transparent visible={legalStatusModal} animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => setLegalStatusModal(false)}
        >
          <View className="bg-white w-80 rounded-2xl overflow-hidden">
            {LEGAL_STATUS_OPTIONS.map((item, index) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4 px-4"
                  onPress={async () => {
                    await handleFieldChange("ownershipStatus", item);
                    setLegalStatusModal(false);
                  }}
                >
                  <Text className="text-center text-base text-black">
                    {t(`InspectionForm.${item}`)}
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
