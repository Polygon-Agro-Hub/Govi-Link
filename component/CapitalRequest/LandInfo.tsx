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
  Image
} from "react-native";
import { AntDesign, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { CameraScreen } from "@/Items/CameraScreen";

type FormData = {
  landinfo?: LandInfoData;
};
type LandImage = {
  uri: string;
  name: string;
  type: string;
};

type LandInfoData = {
  cultivationLandsDescription: string;
  landownby?: "Yes" | "No";
  legalstatus?: string;
  landImages?: LandImage[];
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
  const { requestNumber } = route.params;
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [landownModal, setlandownNoModal] = useState(false);
  const [legalStatusModal, setLegalStatusModal] = useState(false);
const [showCamera, setShowCamera] = useState(false);

  const [isNextEnabled, setIsNextEnabled] = useState(false);

  console.log("finance", formData);

useEffect(() => {
  if (!formData.landinfo) {
    setIsNextEnabled(false);
    return;
  }

  const requiredFields: (keyof LandInfoData)[] = [
    "cultivationLandsDescription",
    "landownby",
    "legalstatus",
  ];

  // Check if all required fields have a value
  const allFilled = requiredFields.every(
    (key) =>
      formData.landinfo?.[key] !== undefined &&
      formData.landinfo?.[key] !== null &&
      formData.landinfo?.[key].toString().trim() !== ""
  );

  // Check if at least one image exists
  const hasImages =
    formData.landinfo.landImages && formData.landinfo.landImages.length > 0;

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

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          const savedData = await AsyncStorage.getItem(`${jobId}`);
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setFormData(parsedData);
          }
        } catch (e) {
          console.log("Failed to load form data", e);
        }
      };

      loadFormData();
    }, [])
  );

  
  const handleLandInfoFieldChange = (key: keyof LandInfoData, value: any) => {
    const updatedLandInfo = {
      ...(formData?.landinfo || {}),
      [key]: value,
    };

    setFormData((prev: any) => ({
      ...prev,
      landinfo: updatedLandInfo,
    }));

    updateFormData({ landinfo: updatedLandInfo });
  };

  const handleNext = () => {
    const requiredFields: (keyof FormData)[] = [];
    const validationErrors: Record<string, string> = {};

    requiredFields.forEach((key) => {
      const value = formData[key];
      let error = "";

      // if (!value || value.trim() === "") {
      //   error = t(`Error.${key} is required`);
      // }

      if (error) validationErrors[key] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));

      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("MAIN.OK") },
      ]);
      return;
    }

    navigation.navigate("IDProof", { formData, requestNumber });
  };


  const LEGAL_STATUS_OPTIONS = [
  "Own land – Single owner",
  "Own land – Multiple owners (undivided)",
  "Leased land from private owner",
  "Leased land from the government",
  "Permit land – short term from the government",
  "Permit land – long term from the government",
] ;

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
    ...(formData?.landinfo?.landImages || []),
    fileObj,
  ];

  const updatedLandInfo = {
    ...(formData?.landinfo || {}),
    landImages: updatedImages,
  };

  setFormData((prev: any) => ({
    ...prev,
    landinfo: updatedLandInfo,
  }));

  updateFormData({ landinfo: updatedLandInfo });
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="flex-row items-center justify-center py-4">
          <TouchableOpacity
            className="absolute left-4 bg-[#F3F3F3] rounded-full p-2"
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color="#000" />
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
              {formData.landinfo?.landownby ? (
                <Text className="text-black">
                 {t(`InspectionForm.${formData.landinfo.landownby}`)}
                </Text>
              ) : (
                <Text className="text-[#838B8C]">
                  {t("InspectionForm.--Select From Here--")}
                </Text>
              )}

              {!formData.landinfo?.landownby && (
                <AntDesign name="down" size={20}
               
                  color="#838B8C"
                />
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
              {formData.landinfo?.legalstatus ? (
                <Text className="text-black">
                  {t(`InspectionForm.${formData.landinfo.legalstatus}`)}
                </Text>
              ) : (
                <Text className="text-[#838B8C]">
                  {t("InspectionForm.--Select From Here--")}
                </Text>
              )}

              {!formData.landinfo?.legalstatus && (
                <AntDesign name="down" size={20}
                  color="#838B8C"
                />
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
                value={formData.landinfo?.cultivationLandsDescription || ""}
                onChangeText={(text) => {
                  let formattedText = text.replace(/^\s+/, "");

                  if (formattedText.length > 0) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }

                  setFormData((prev: FormData) => ({
                    ...prev,
                    landinfo: {
                      ...prev.landinfo,
                      cultivationLandsDescription: formattedText,
                    },
                  }));

                  let error = "";
                  if (!formattedText || formattedText.trim() === "") {
                    error = t("Error.cultivationLandsDescription is required");
                  }
                  setErrors((prev) => ({
                    ...prev,
                    cultivationLandsDescription: error,
                  }));

                  if (!error) {
                    updateFormData({
                      landinfo: {
                        ...(formData.landinfo || {}),
                        cultivationLandsDescription: formattedText,
                      },
                    });
                  }
                }}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            {errors.cultivationLandsDescription && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.cultivationLandsDescription}
              </Text>
            )}
          </View>

                    <View className="mt-6 ">
                                  <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Tag the geo coordinates of the land")} *
            </Text>
  <TouchableOpacity
    className="bg-[#FA345A] rounded-full px-4 py-4 flex-row items-center justify-center gap-x-2"
    onPress={() => navigation.navigate("AttachGeoLocationScreen")}
  >
    <MaterialIcons name="gps-fixed" size={22} color="#fff" />
    <Text className="text-white font-semibold">
      {t("InspectionForm.Tag Geo Coordinate")}
    </Text>
  </TouchableOpacity>


</View>

          <View className="mt-6 ">
                                              <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Images of the deed / lease / permit / any other formal document to prove the ownership of the land by the farmer")} *
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
  
{formData?.landinfo?.landImages?.length > 0 && (
  <View className="mt-4  flex-row flex-wrap">
    {formData.landinfo.landImages.map((img: LandImage, index: number) => (
      <View key={index} className="w-40 h-40 m-1  rounded-xl overflow-hidden relative">
        <Image
          source={{ uri: img.uri }}
          className="w-full h-full rounded-xl"
        />
        <TouchableOpacity
          className="absolute top-1 right-1 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
          onPress={async () => {
            const updatedImages = formData.landinfo!.landImages.filter(
              (_: LandImage, i: number) => i !== index
            );

            const updatedLandInfo = {
              ...(formData.landinfo || {}),
              landImages: updatedImages,
            };

            setFormData((prev:any) => ({
              ...prev,
              landinfo: updatedLandInfo,
            }));

            try {
              await AsyncStorage.setItem(
                `${jobId}`,
                JSON.stringify({ ...formData, landinfo: updatedLandInfo })
              );
              console.log("Image cleared!");
            } catch (e) {
              console.error("Failed to clear image in storage", e);
            }
          }}
        >
          <Text className="text-white text-xs font-bold">×</Text>
        </TouchableOpacity>
      </View>
    ))}
  </View>
)}

</View>

        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity
            className="flex-1 bg-[#444444] rounded-full py-4 items-center"
            onPress={() =>
              navigation.navigate("Main", {
                screen: "MainTabs",
                params: {
                  screen: "CapitalRequests",
                },
              })
            }
          >
            <Text className="text-white text-base font-semibold">
              {t("InspectionForm.Exit")}
            </Text>
          </TouchableOpacity>
          {isNextEnabled == true ? (
            <View className="flex-1">
              <TouchableOpacity className="flex-1 " onPress={handleNext}>
                <LinearGradient
                  colors={["#F35125", "#FF1D85"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className=" rounded-full py-4 items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 5,
                    elevation: 6,
                  }}
                >
                  <Text className="text-white text-base font-semibold">
                    {t("InspectionForm.Next")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1 bg-gray-300 rounded-full py-4 items-center">
              <Text className="text-white text-base font-semibold">
                {t("InspectionForm.Next")}
              </Text>
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
                      "landownby",
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
              handleLandInfoFieldChange("legalstatus", item);
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
