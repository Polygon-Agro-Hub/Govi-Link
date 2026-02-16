import React, { useState, useEffect, useCallback } from "react";
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
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { CameraScreen } from "@/Items/CameraScreen";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveLandInfo,
  getLandInfo,
  LandInfo as LandInfoData,
  LandImage,
  GeoLocation,
} from "@/database/inspectionland";

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
  const [landownModal, setlandownNoModal] = useState(false);
  const [legalStatusModal, setLegalStatusModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);

  const LEGAL_STATUS_OPTIONS = [
    "Own land – Single owner",
    "Own land – Multiple owners (undivided)",
    "Leased land from private owner",
    "Leased land from the government",
    "Permit land – short term from the government",
    "Permit land – long term from the government",
  ];

  const SAMPLE_LOCATIONS = [
    {
      name: "Colombo, Sri Lanka",
      latitude: 6.9271,
      longitude: 79.8612,
      locationName: "Colombo City Center",
    },
    {
      name: "Kandy, Sri Lanka",
      latitude: 7.2906,
      longitude: 80.6337,
      locationName: "Kandy Temple",
    },
    {
      name: "Galle, Sri Lanka",
      latitude: 6.0535,
      longitude: 80.221,
      locationName: "Galle Fort",
    },
    {
      name: "Jaffna, Sri Lanka",
      latitude: 9.6615,
      longitude: 80.0255,
      locationName: "Jaffna Town",
    },
    {
      name: "Anuradhapura, Sri Lanka",
      latitude: 8.3114,
      longitude: 80.4037,
      locationName: "Sacred City",
    },
  ];

  useEffect(() => {
    if (formData.geoLocation) {
      console.log(" GeoLocation details:", {
        latitude: formData.geoLocation.latitude,
        longitude: formData.geoLocation.longitude,
        locationName: formData.geoLocation.locationName,
      });
    }

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

  const updateFormData = (updates: Partial<LandInfoData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
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
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
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

    if (!requestId) {
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    const reqId = Number(requestId);

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
        setIsExistingData(true);

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
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
          t("InspectionForm.Could not save to server. Data saved locally."),
          [
            {
              text: t("Main.Continue"),
              onPress: () => {
                navigation.navigate("InvestmentInfo", {
                  requestNumber,
                  requestId,
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
                requestNumber,
                requestId,
              });
            },
          },
        ],
      );
    }
  };

  // Handle tab navigation
  const handleTabPress = (tabKey: string) => {
    // Map tab keys to navigation routes
    const routeMap: Record<string, string> = {
      "Personal Info": "PersonalInfo",
      "ID Proof": "IDProof",
      "Finance Info": "FinanceInfo",
      "Land Info": "LandInfo",
      "Investment Info": "InvestmentInfo",
      "Cultivation Info": "CultivationInfo",
      "Cropping Systems": "CroppingSystems",
      "Profit & Risk": "ProfitRisk",
      "Economical": "Economical",
      "Labour": "Labour",
      "Harvest Storage": "HarvestStorage",
    };

    const route = routeMap[tabKey];
    if (route) {
      navigation.navigate(route, {
        requestId,
        requestNumber,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <StatusBar barStyle="dark-content" />
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
                value={formData.landDiscription}
                onChangeText={(text) => {
                  let formattedText = text.replace(/^\s+/, "");
                  if (formattedText.length > 0 && !text.startsWith("\n")) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }
                  updateFormData({ landDiscription: formattedText });
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

          <View className="mt-6">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Tag the geo coordinates of the land")} *
            </Text>

            <View className="flex-row space-x-2 mb-2">
              <TouchableOpacity
                className="flex-1 bg-[#FA345A] rounded-full px-4 py-4 flex-row items-center justify-center gap-x-2"
                onPress={() => {
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

                      if (requestId) {
                        const updatedData = { ...formData, geoLocation };
                        saveLandInfo(Number(requestId), updatedData);
                      }
                    },
                  });
                }}
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
              <View className="  ">
                <View className="flex-row space-x-2 mt-3">
                  <TouchableOpacity
                    className="flex-1 bg-white  rounded-full px-4 py-2 flex-row items-center justify-center"
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
                    <Text className="ml-1 text-[#FF0000] font- underline">
                      {t("InspectionForm.View Here")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {errors.geoLocation && !formData.geoLocation && (
              <Text className="text-red-500 text-sm mt-2 ml-2">
                {errors.geoLocation}
              </Text>
            )}
          </View>

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
                      className="absolute top-1 right-1 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Text className="text-white text-xs font-bold">×</Text>
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
          onExit={() => navigation.goBack()}
          onNext={handleNext}
        />
      </View>

      {/* Land ownership modal */}
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
                    updateFormData({ isOwnByFarmer: item as "Yes" | "No" });
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
          onPress={() => setLegalStatusModal(false)}
        >
          <View className="bg-white w-80 rounded-2xl overflow-hidden">
            {LEGAL_STATUS_OPTIONS.map((item, index) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4 px-4"
                  onPress={() => {
                    updateFormData({ ownershipStatus: item });
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