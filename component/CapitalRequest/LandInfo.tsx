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
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { CameraScreen } from "@/Items/CameraScreen";
import axios from "axios";
import { environment } from "@/environment/environment";

type FormData = {
  inspectionland?: LandInfoData;
};
type LandImage = {
  uri: string;
  name: string;
  type: string;
};
type GeoLocation = {
  latitude: number;
  longitude: number;
  locationName?: string;
};

type LandInfoData = {
  landDiscription: string;
  isOwnByFarmer?: "Yes" | "No";
  ownershipStatus?: string;
  images?: LandImage[];
  geoLocation?: GeoLocation; // ✅ Remove the array brackets []
};

type ValidationRule = {
  required?: boolean;
  type?: "accountholderName" | "accountNumber";
  minLength?: number;
  uniqueWith?: (keyof FormData)[];
};

const validateAndFormat = (
  text: string,
  rules: ValidationRule,
  t: any,
  formData: any,
  currentKey: keyof typeof formData
) => {
  let value = text;
  let error = "";

  console.log("Validating:", value, rules);

  if (rules.type === "accountholderName") {
    value = value.replace(/^\s+/, "");
    value = value.replace(/[^a-zA-Z\s]/g, "");

    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  if (rules.minLength && value.length < rules.minLength) {
    error = t("Error.Min length", { count: rules.minLength });
  }

  if (rules.type === "accountNumber") {
    value = value.replace(/[^0-9]/g, "");

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  return { value, error };
};

type LandInfoProps = {
  navigation: any;
};

const LandInfo: React.FC<LandInfoProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "LandInfo">>();
  const { requestNumber, requestId } = route.params;
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [landownModal, setlandownNoModal] = useState(false);
  const [legalStatusModal, setLegalStatusModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);

  const [isNextEnabled, setIsNextEnabled] = useState(false);

  console.log("finance", formData);

  useEffect(() => {
    if (!formData.inspectionland) {
      setIsNextEnabled(false);
      return;
    }

    const requiredFields: (keyof LandInfoData)[] = [
      "landDiscription",
      "isOwnByFarmer",
      "ownershipStatus",
      "geoLocation",
    ];

    // Check if all required fields have a value
    const allFilled = requiredFields.every(
      (key) =>
        formData.inspectionland?.[key] !== undefined &&
        formData.inspectionland?.[key] !== null &&
        formData.inspectionland?.[key].toString().trim() !== ""
    );

    // Check if at least one image exists
    const hasImages =
      formData.inspectionland.images &&
      formData.inspectionland.images.length > 0;

    // Enable Next button only if all fields filled and at least one image
    setIsNextEnabled(allFilled && hasImages);
  }, [formData]);

  let jobId = requestNumber;
  console.log("jobid", jobId);

  const updateFormData = async (updates: Partial<FormData>) => {
    console.log("hit update");
    try {
      const updatedFormData = {
        ...formData,
        ...updates,
      };

      setFormData(updatedFormData);

      await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));

      console.log("FormData saved:", updatedFormData);
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };
  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: LandInfoData,
    isUpdate: boolean
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName
      );
      console.log(`📝 reqId being sent:`, reqId);

      const apiFormData = new FormData();
      apiFormData.append("reqId", reqId.toString());
      apiFormData.append("tableName", tableName);

      // Add non-file fields
      apiFormData.append(
        "isOwnByFarmer",
        data.isOwnByFarmer === "Yes" ? "1" : "0"
      );
      apiFormData.append("ownershipStatus", data.ownershipStatus || "");
      apiFormData.append("landDiscription", data.landDiscription || "");

      // Add geo location
      if (data.geoLocation) {
        apiFormData.append("latitude", data.geoLocation.latitude.toString());
        apiFormData.append("longitude", data.geoLocation.longitude.toString());
        if (data.geoLocation.locationName) {
          apiFormData.append("locationName", data.geoLocation.locationName);
        }
      }

      // Add images
      if (data.images && data.images.length > 0) {
        let existingUrlIndex = 0;

        data.images.forEach((img: LandImage, index: number) => {
          // Check if it's an S3 URL (already uploaded)
          if (
            typeof img === "string" ||
            (img.uri &&
              (img.uri.startsWith("http://") || img.uri.startsWith("https://")))
          ) {
            const url = typeof img === "string" ? img : img.uri;
            apiFormData.append(`imageUrl_${existingUrlIndex}`, url);
            existingUrlIndex++;
            console.log(`🔗 Keeping existing image URL: ${url}`);
          }
          // Local file - need to upload
          else if (img.uri && img.uri.startsWith("file://")) {
            apiFormData.append("images", {
              uri: img.uri,
              name: img.name || `land_${Date.now()}_${index}.jpg`,
              type: img.type || "image/jpeg",
            } as any);
            console.log(`📤 Uploading new image: ${img.name}`);
          }
        });
      }

      console.log(`📦 Sending FormData to backend`);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        apiFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        console.log(`✅ ${tableName} ${response.data.operation}d successfully`);

        // Update local state with S3 URLs from backend
        if (response.data.data.images) {
          // ✅ Parse images if it's a string
          let imageUrls = response.data.data.images;
          if (typeof imageUrls === "string") {
            try {
              imageUrls = JSON.parse(imageUrls);
            } catch (e) {
              console.error("Failed to parse images:", imageUrls);
              imageUrls = [];
            }
          }

          // ✅ Ensure it's an array
          if (!Array.isArray(imageUrls)) {
            imageUrls = [];
          }

          const imageObjects = imageUrls.map((url: string) => ({
            uri: url,
            name: url.split("/").pop() || "image.jpg",
            type: "image/jpeg",
          }));

          setFormData((prev: FormData) => ({
            ...prev,
            inspectionland: {
              ...(prev.inspectionland || {}),
              images: imageObjects,
            },
          }));

          // Save updated formData with S3 URLs to AsyncStorage
          const updatedFormData: FormData = {
            ...formData,
            inspectionland: {
              ...formData.inspectionland!,
              images: imageObjects,
            },
          };

          await AsyncStorage.setItem(
            `${jobId}`,
            JSON.stringify(updatedFormData)
          );
          console.log("💾 Updated AsyncStorage with S3 URLs");
        }

        return true;
      } else {
        console.error(`❌ ${tableName} save failed:`, response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Error saving ${tableName}:`, error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return false;
    }
  };

  const fetchInspectionData = async (
    reqId: number
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
        }
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing land data:`, response.data.data);

        const data = response.data.data;

        // Helper function to safely parse images JSON
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
          if (typeof field === "object") {
            return Array.isArray(field) ? field : [];
          }
          return [];
        };

        // Transform backend data to frontend format
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

      console.log(`📭 No existing land data found for reqId: ${reqId}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching land inspection data:`, error);
      console.error("Error details:", error.response?.data);

      if (error.response?.status === 404) {
        console.log(`📝 No existing record - will create new`);
        return null;
      }

      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          // First, try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Attempting to fetch land data from backend for reqId: ${reqId}`
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded land data from backend`);

                // Update form with backend data
                const updatedFormData = {
                  ...formData,
                  inspectionland: backendData,
                };

                setFormData(updatedFormData);
                setIsExistingData(true);

                // Save to AsyncStorage as backup
                await AsyncStorage.setItem(
                  `${jobId}`,
                  JSON.stringify(updatedFormData)
                );

                return; // Exit after loading from backend
              }
            }
          }

          // If no backend data, try AsyncStorage
          console.log(`📂 Checking AsyncStorage for jobId: ${jobId}`);
          const savedData = await AsyncStorage.getItem(`${jobId}`);

          if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log(`✅ Loaded land data from AsyncStorage`);
            setFormData(parsedData);
            setIsExistingData(true);
          } else {
            // No data found anywhere - new entry
            setIsExistingData(false);
            console.log("📝 No existing land data - new entry");
          }
        } catch (e) {
          console.error("Failed to load land form data", e);
          setIsExistingData(false);
        }
      };

      loadFormData();
    }, [requestId, jobId])
  );

  const handleLandInfoFieldChange = (key: keyof LandInfoData, value: any) => {
    const updatedLandInfo = {
      ...(formData?.inspectionland || {}),
      [key]: value,
    };

    setFormData((prev: any) => ({
      ...prev,
      inspectionland: updatedLandInfo,
    }));

    updateFormData({ inspectionland: updatedLandInfo });
  };

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};
    const landInfo = formData.inspectionland;

    // Validate required fields
    if (!landInfo?.landDiscription || landInfo.landDiscription.trim() === "") {
      validationErrors.landDiscription = t("Error.landDiscription is required");
    }
    if (!landInfo?.isOwnByFarmer) {
      validationErrors.isOwnByFarmer = t("Error.Land ownership is required");
    }
    if (!landInfo?.ownershipStatus) {
      validationErrors.ownershipStatus = t(
        "Error.Ownership status is required"
      );
    }
    if (!landInfo?.geoLocation) {
      validationErrors.geoLocation = t("Error.Geo location is required");
    }
    if (!landInfo?.images || landInfo.images.length === 0) {
      validationErrors.images = t("Error.At least one image is required");
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("MAIN.OK") },
      ]);
      return;
    }

    // ✅ Validate requestId exists
    if (!route.params?.requestId) {
      console.error("❌ requestId is missing!");
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("MAIN.OK") }]
      );
      return;
    }

    const reqId = Number(route.params.requestId);

    // ✅ Validate it's a valid number
    if (isNaN(reqId) || reqId <= 0) {
      console.error("❌ Invalid requestId:", route.params.requestId);
      Alert.alert(
        t("Error.Error"),
        "Invalid request ID. Please go back and try again.",
        [{ text: t("MAIN.OK") }]
      );
      return;
    }

    console.log("✅ Using requestId:", reqId);

    // Show loading indicator
    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false }
    );

    // Save to backend
    try {
      console.log(
        `🚀 Saving to backend (${isExistingData ? "UPDATE" : "INSERT"})`
      );

      const saved = await saveToBackend(
        reqId,
        "inspectionland",
        formData.inspectionland!,
        isExistingData
      );

      if (saved) {
        console.log("✅ Land info saved successfully to backend");
        setIsExistingData(true);

        Alert.alert(
          t("MAIN.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("MAIN.OK"),
              onPress: () => {
                navigation.navigate("InvestmentInfo", {
                  formData,
                  requestNumber,
                  requestId: route.params.requestId,
                });
              },
            },
          ]
        );
      } else {
        console.log("⚠️ Backend save failed, but continuing with local data");
        Alert.alert(
          t("MAIN.Warning"),
          t("InspectionForm.Could not save to server. Data saved locally."),
          [
            {
              text: t("MAIN.Continue"),
              onPress: () => {
                navigation.navigate("InvestmentInfo", {
                  formData,
                  requestNumber,
                  requestId: route.params.requestId,
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error during final save:", error);
      Alert.alert(
        t("MAIN.Warning"),
        t("InspectionForm.Could not save to server. Data saved locally."),
        [
          {
            text: t("MAIN.Continue"),
            onPress: () => {
              navigation.navigate("InvestmentInfo", {
                formData,
                requestNumber,
                requestId: route.params.requestId,
              });
            },
          },
        ]
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

  const convertImageToFormData = async (imageUri: string) => {
    try {
      const extension = imageUri.split(".").pop() || "jpg";

      return {
        uri: imageUri,
        name: `land_${Date.now()}.${extension}`,
        type: `image/${extension === "jpg" ? "jpeg" : extension}`,
      };
    } catch (error) {
      console.error("Image convert error:", error);
      return null;
    }
  };

  const handleCameraClose = async (uri: string | null) => {
    setShowCamera(false);

    if (!uri) return;

    const fileObj = await convertImageToFormData(uri);
    if (!fileObj) return;

    const updatedImages = [
      ...(formData?.inspectionland?.images || []),
      fileObj,
    ];

    const updatedLandInfo = {
      ...(formData?.inspectionland || {}),
      images: updatedImages,
    };

    setFormData((prev: any) => ({
      ...prev,
      inspectionland: updatedLandInfo,
    }));

    updateFormData({ inspectionland: updatedLandInfo });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        <View className="flex-row items-center justify-center py-4 mt-2">
          <TouchableOpacity
            className="absolute left-4 bg-[#E0E0E080] rounded-full p-4"
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="Land Info" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Is the land own by farmer")} *
            </Text>

            <TouchableOpacity
              className="bg-[#F6F6F6] rounded-full px-4 py-4 flex-row items-center justify-between"
              onPress={() => setlandownNoModal(true)}
              activeOpacity={0.7}
            >
              {formData.inspectionland?.isOwnByFarmer ? (
                <Text className="text-black">
                  {t(`InspectionForm.${formData.inspectionland.isOwnByFarmer}`)}
                </Text>
              ) : (
                <Text className="text-[#838B8C]">
                  {t("InspectionForm.--Select From Here--")}
                </Text>
              )}

              {!formData.inspectionland?.isOwnByFarmer && (
                <AntDesign name="down" size={20} color="#838B8C" />
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Legal status of the ownership of the land")} *
            </Text>

            <TouchableOpacity
              className="bg-[#F6F6F6] rounded-full px-4 py-4 flex-row items-center justify-between"
              onPress={() => setLegalStatusModal(true)}
              activeOpacity={0.7}
            >
              {formData.inspectionland?.ownershipStatus ? (
                <Text className="text-black">
                  {t(
                    `InspectionForm.${formData.inspectionland.ownershipStatus}`
                  )}
                </Text>
              ) : (
                <Text className="text-[#838B8C]">
                  {t("InspectionForm.--Select From Here--")}
                </Text>
              )}

              {!formData.inspectionland?.ownershipStatus && (
                <AntDesign name="down" size={20} color="#838B8C" />
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.Provide brief description to reach the cultivation land"
              )}{" "}
              *
            </Text>
            <View
              className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                errors.debts ? "border border-red-500" : ""
              }`}
            >
              <TextInput
                placeholder={t("InspectionForm.Type here...")}
                value={formData.inspectionland?.landDiscription || ""}
                onChangeText={(text) => {
                  let formattedText = text.replace(/^\s+/, "");

                  if (formattedText.length > 0) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }

                  setFormData((prev: FormData) => ({
                    ...prev,
                    inspectionland: {
                      ...prev.inspectionland,
                      landDiscription: formattedText,
                    },
                  }));

                  let error = "";
                  if (!formattedText || formattedText.trim() === "") {
                    error = t("Error.landDiscription is required");
                  }
                  setErrors((prev) => ({
                    ...prev,
                    landDiscription: error,
                  }));

                  if (!error) {
                    updateFormData({
                      inspectionland: {
                        ...(formData.inspectionland || {}),
                        landDiscription: formattedText,
                      },
                    });
                  }
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

          <View className="mt-6 ">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Tag the geo coordinates of the land")} *
            </Text>
            <TouchableOpacity
              className="bg-[#FA345A] rounded-full px-4 py-4 flex-row items-center justify-center gap-x-2"
              onPress={() =>
                navigation.navigate("AttachGeoLocationScreen", {
                  currentLatitude:
                    formData?.inspectionland?.geoLocation?.latitude,
                  currentLongitude:
                    formData?.inspectionland?.geoLocation?.longitude,

                  onLocationSelect: (
                    latitude: number,
                    longitude: number,
                    locationName: string
                  ) => {
                    const updatedLandInfo = {
                      ...(formData?.inspectionland || {}),
                      geoLocation: {
                        latitude,
                        longitude,
                        locationName,
                      },
                    };

                    setFormData((prev: any) => ({
                      ...prev,
                      inspectionland: updatedLandInfo,
                    }));

                    updateFormData({ inspectionland: updatedLandInfo });
                  },
                })
              }
            >
              {formData?.inspectionland?.geoLocation ? (
                <Feather name="rotate-ccw" size={22} color="#fff" />
              ) : (
                <MaterialIcons name="gps-fixed" size={22} color="#fff" />
              )}
              <Text className="text-white font-semibold">
                {t("InspectionForm.Tag Geo Coordinate")}
              </Text>
            </TouchableOpacity>
          </View>
          {formData?.inspectionland?.geoLocation && (
            <TouchableOpacity
              className="mt-2 rounded-full px-4 py-3 flex-row items-center justify-center gap-x-2"
              onPress={() =>
                navigation.navigate("ViewLocationScreen", {
                  latitude: formData.inspectionland.geoLocation.latitude,
                  longitude: formData.inspectionland.geoLocation.longitude,
                  locationName:
                    formData.inspectionland.geoLocation.locationName,
                })
              }
            >
              <MaterialIcons name="location-pin" size={24} color="#FF0000" />
              <Text className="text-[#FF0000] font-semibold  border-b-2 border-[#FF0000]">
                {t("InspectionForm.View Here")}
              </Text>
            </TouchableOpacity>
          )}

          <View className="mt-6 ">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.Images of the deed / lease / permit / any other formal document to prove the ownership of the land by the farmer"
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
          <View>
            {formData?.inspectionland?.images &&
              Array.isArray(formData.inspectionland.images) &&
              formData.inspectionland.images.length > 0 && (
                <View className="mt-4 flex-row flex-wrap">
                  {formData.inspectionland.images.map(
                    (img: LandImage, index: number) => (
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
                          onPress={async () => {
                            const updatedImages =
                              formData.inspectionland!.images!.filter(
                                (_: LandImage, i: number) => i !== index
                              );

                            const updatedLandInfo = {
                              ...(formData.inspectionland || {}),
                              images: updatedImages,
                            };

                            setFormData((prev: any) => ({
                              ...prev,
                              inspectionland: updatedLandInfo,
                            }));

                            try {
                              await AsyncStorage.setItem(
                                `${jobId}`,
                                JSON.stringify({
                                  ...formData,
                                  inspectionland: updatedLandInfo,
                                })
                              );
                              console.log("Image cleared!");
                            } catch (e) {
                              console.error(
                                "Failed to clear image in storage",
                                e
                              );
                            }
                          }}
                        >
                          <Text className="text-white text-xs font-bold">
                            ×
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )
                  )}
                </View>
              )}
          </View>
        </ScrollView>

        <View className="flex-row px-6 pb-4 gap-4 bg-white border-t border-gray-200">
          {/* Back Button */}
          <TouchableOpacity
            className="flex-1 bg-[#444444] rounded-full py-4 flex-row items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text className="text-white text-base font-semibold ml-2">
              {t("InspectionForm.Back")}
            </Text>
          </TouchableOpacity>

          {/* Next Button */}
          {isNextEnabled ? (
            <TouchableOpacity
              className="flex-1"
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#F35125", "#FF1D85"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-full py-4 flex-row items-center justify-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 5,
                  elevation: 6,
                }}
              >
                <Text className="text-white text-base font-semibold mr-2">
                  {t("InspectionForm.Next")}
                </Text>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View className="flex-1 bg-gray-300 rounded-full py-4 flex-row items-center justify-center">
              <Text className="text-white text-base font-semibold mr-2">
                {t("InspectionForm.Next")}
              </Text>
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            </View>
          )}
        </View>
      </View>
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
                  onPress={() => {
                    handleLandInfoFieldChange(
                      "isOwnByFarmer",
                      item as "Yes" | "No"
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
                  onPress={() => {
                    handleLandInfoFieldChange("ownershipStatus", item);
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
