// CultivationInfo.tsx - Complete Version with Multiple Images Support
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
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { CameraScreen } from "@/Items/CameraScreen";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveCultivationInfo,
  getCultivationInfo,
  CultivationInfo as CultivationInfoData,
  WaterImage,
} from "@/database/inspectioncultivation";

// Add index signature to allow string-based property access
interface CultivationInfoExtended extends CultivationInfoData {
  [key: string]: any;
}

const climateParameters = [
  { key: "temperature", label: "Temperature" },
  { key: "rainfall", label: "Rainfall" },
  { key: "sunShine", label: "Sun shine hours" },
  { key: "humidity", label: "Relative humidity" },
  { key: "windVelocity", label: "Wind velocity" },
  { key: "windDirection", label: "Wind direction" },
  { key: "zone", label: "Seasons and agro-ecological zone" },
];

type Selection = "yes" | "no" | null;

const YesNoSelect = ({
  label,
  value,
  visible,
  onOpen,
  onClose,
  onSelect,
  required = false,
}: {
  label: string;
  value: "Yes" | "No" | null;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (value: "Yes" | "No") => void;
  required?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Modal transparent visible={visible} animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={onClose}
        >
          <View className="bg-white w-80 rounded-2xl overflow-hidden">
            {["Yes", "No"].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4"
                  onPress={() => {
                    onSelect(item as "Yes" | "No");
                    onClose();
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

      <View className="mt-4">
        <Text className="text-sm text-[#070707] mb-2">
          {label} {required && <Text className="text-black">*</Text>}
        </Text>

        <TouchableOpacity
          className="bg-[#F6F6F6] rounded-full px-4 py-4 flex-row items-center justify-between"
          onPress={onOpen}
          activeOpacity={0.7}
        >
          {value ? (
            <Text className="text-black">{t(`InspectionForm.${value}`)}</Text>
          ) : (
            <Text className="text-[#838B8C]">
              {t("InspectionForm.--Select From Here--")}
            </Text>
          )}
          {!value && <AntDesign name="down" size={20} color="#838B8C" />}
        </TouchableOpacity>
      </View>
    </>
  );
};

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  required = false,
  error,
  extra,
  keyboardType = "default",
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  keyboardType?: any;
  extra?: any;
}) => (
  <View className="mb-4">
    <Text className="text-sm text-[#070707] mb-2">
      {label} {extra && <Text className="text-black font-bold">{extra} </Text>}
      {required && <Text className="text-black">*</Text>}
    </Text>
    <View
      className={`bg-[#F6F6F6] rounded-full flex-row items-center ${
        error ? "border border-red-500" : ""
      }`}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#838B8C"
        className="px-5 py-4 text-base text-black flex-1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
    {error && <Text className="text-red-500 text-sm mt-1 ml-4">{error}</Text>}
  </View>
);

type ValidationRule = {
  required?: boolean;
  type?: "soilType" | "ph";
};

const validateAndFormat = (text: string, rules: ValidationRule, t: any) => {
  let value = text;
  let error = "";

  if (rules.type === "soilType") {
    value = value.replace(/^\s+/, "");
    value = value.replace(/[^a-zA-Z\s]/g, "");
    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  if (rules.type === "ph") {
    value = value.replace(/[^0-9.]/g, "");
    if (value.startsWith(".")) {
      value = value.slice(1);
    }
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }
    value = value.replace(/\.{2,}/g, ".");
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  return { value, error };
};

type CultivationInfoProps = {
  navigation: any;
};

const CultivationInfo: React.FC<CultivationInfoProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "CultivationInfo">>();
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();

  // Local state for form data
  const [formData, setFormData] = useState<CultivationInfoExtended>({
    temperature: null,
    rainfall: null,
    sunShine: null,
    humidity: null,
    windVelocity: null,
    windDirection: null,
    zone: null,
    isCropSuitale: undefined,
    ph: 0,
    soilType: "",
    soilfertility: "",
    waterSources: [],
    otherWaterSource: "",
    waterImages: [], // Changed from waterImage: null
    isRecevieRainFall: undefined,
    isRainFallSuitableCrop: undefined,
    isRainFallSuitableCultivation: undefined,
    isElectrocityAvailable: undefined,
    ispumpOrirrigation: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [overallSoilFertilityVisible, setOverallSoilFertilityVisible] =
    useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string>("");
  const [isExistingData, setIsExistingData] = useState(false);

  const [selections, setSelections] = useState<Record<string, Selection>>(() =>
    climateParameters.reduce(
      (acc, item) => {
        acc[item.key] = null;
        return acc;
      },
      {} as Record<string, Selection>,
    ),
  );

  // Auto-save to SQLite whenever formData changes (debounced)
  useEffect(() => {
    console.log("🔄 FormData changed, checking for auto-save...");

    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          console.log("💾 Auto-saving cultivation info to SQLite...");
          await saveCultivationInfo(Number(requestId), formData);
          console.log("💾 Auto-saved cultivation info to SQLite");
        } catch (err) {
          console.error("Error auto-saving cultivation info:", err);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, requestId]);

  // Load data from SQLite when component mounts
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;

        try {
          const reqId = Number(requestId);
          console.log("🔄 Loading cultivation info for requestId:", reqId);

          const localData = await getCultivationInfo(reqId);

          if (localData) {
            console.log("✅ Loaded cultivation info from SQLite:", localData);
            setFormData(localData);
            setIsExistingData(true);

            // Update selections for climate parameters
            const savedSelections: Record<string, Selection> = {};
            const extendedLocalData = localData as CultivationInfoExtended;
            climateParameters.forEach(({ key }) => {
              savedSelections[key] = extendedLocalData[key] ?? null;
            });
            setSelections(savedSelections);
          } else {
            console.log("📝 No local cultivation info - new entry");
            setIsExistingData(false);
          }
        } catch (error) {
          console.error("Failed to load cultivation info from SQLite:", error);
        }
      };

      loadData();
    }, [requestId]),
  );

  // Validate form completion
  useEffect(() => {
    const allClimateSelected = climateParameters.every(
      (param) =>
        selections[param.key] === "yes" || selections[param.key] === "no",
    );

    const isPHValid = !!formData.ph && !errors.ph;
    const isSoilTypeValid = !!formData.soilType && !errors.soilType;

    const waterSources = formData.waterSources || [];
    const isWaterSourceValid =
      waterSources.length > 0 &&
      (!waterSources.includes("Other") || !!formData.otherWaterSource?.trim());

    const isOverallSoilFertilityValid = !!formData.soilfertility;

    const yesNoFields = [
      "isCropSuitale",
      "isRecevieRainFall",
      "isRainFallSuitableCrop",
      "isRainFallSuitableCultivation",
      "isElectrocityAvailable",
      "ispumpOrirrigation",
    ];

    const allYesNoSelected = yesNoFields.every(
      (key) => formData[key] === "Yes" || formData[key] === "No",
    );

    const hasErrors = Object.values(errors).some(Boolean);
    const isImageValid =
      formData.waterImages && formData.waterImages.length > 0; // Updated validation

    setIsNextEnabled(
      allClimateSelected &&
        isPHValid &&
        isSoilTypeValid &&
        isWaterSourceValid &&
        isOverallSoilFertilityValid &&
        allYesNoSelected &&
        isImageValid &&
        !hasErrors,
    );
  }, [formData, selections, errors]);

  // Update form data
  const updateFormData = (updates: Partial<CultivationInfoData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Handle field changes
  const handleFieldChange = (
    key: keyof CultivationInfoData,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(text, rules, t);
    updateFormData({ [key]: value as any });
    setErrors((prev) => ({ ...prev, [key]: error || "" }));
  };

  // Handle climate parameter selection
  const handleSelect = (key: string, value: Selection) => {
    const currentValue = selections[key];
    const newValue = currentValue === value ? null : value;

    const updatedSelections = {
      ...selections,
      [key]: newValue,
    };
    setSelections(updatedSelections);

    // Update form data
    const updates: Partial<CultivationInfoData> = {
      [key]: newValue,
    };

    if (newValue === null) {
      delete updates[key as keyof CultivationInfoData];
    }

    updateFormData(updates);

    const nextMissing = climateParameters.find(
      (p) => !updatedSelections[p.key],
    );

    if (nextMissing) {
      setError(
        t("Error.Please select Yes or No for", {
          Missing: t(`InspectionForm.${nextMissing.label}`),
        }),
      );
    } else {
      setError("");
    }
  };

  // Handle Yes/No field changes
  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    updateFormData({ [key]: value } as any);
  };

  // Handle camera close - UPDATED FOR MULTIPLE IMAGES
  const handleCameraClose = async (uri: string | null) => {
    setShowCamera(false);

    if (!uri) return;

    const fileObj: WaterImage = {
      uri,
      name: `water_${Date.now()}.jpg`,
      type: "image/jpeg",
    };

    // Add new image to existing array
    const updatedImages = [...(formData?.waterImages || []), fileObj];
    updateFormData({ waterImages: updatedImages });
    setErrors((prev) => ({ ...prev, waterImages: "" }));
  };

  // Clear image - UPDATED TO REMOVE SPECIFIC IMAGE
  const onClearImage = (index: number) => {
    const updatedImages = formData.waterImages.filter((_, i) => i !== index);
    updateFormData({ waterImages: updatedImages });

    if (updatedImages.length === 0) {
      setErrors((prev) => ({
        ...prev,
        waterImages: t(
          "Error.At least one image of the water source is required",
        ),
      }));
    }
  };

  // Handle water source toggle
  const handleWaterSourceToggle = (option: string, selected: boolean) => {
    let updatedOptions = formData.waterSources || [];

    if (selected) {
      updatedOptions = updatedOptions.filter((o: any) => o !== option);
    } else {
      updatedOptions = [...updatedOptions, option];
    }

    const updates: Partial<CultivationInfoData> = {
      waterSources: updatedOptions,
    };

    // Clear otherWaterSource if "Other" is deselected
    if (option === "Other" && !updatedOptions.includes("Other")) {
      updates.otherWaterSource = "";
    }

    updateFormData(updates);

    // Validation
    let errorMsg = "";
    const validWaterSources = updatedOptions.filter(
      (source: string) => source !== "Other",
    );

    if (validWaterSources.length === 0) {
      errorMsg = t("Error.Please select at least one water source");
    } else if (
      updatedOptions.includes("Other") &&
      !formData.otherWaterSource?.trim()
    ) {
      errorMsg = t("Error.Please specify the other water source");
    }

    setErrors((prev) => ({ ...prev, waterSources: errorMsg }));
  };

  // Handle other water source change
  const handleOtherWaterSourceChange = (text: string) => {
    updateFormData({ otherWaterSource: text });

    let errorMsg = "";
    const waterSources = formData.waterSources || [];
    const validWaterSources = waterSources.filter(
      (source: string) => source !== "Other",
    );

    if (validWaterSources.length === 0) {
      errorMsg = t("Error.Please select at least one water source");
    } else if (waterSources.includes("Other") && !text.trim()) {
      errorMsg = t("Error.Please specify the other water source");
    }

    setErrors((prev) => ({ ...prev, waterSources: errorMsg }));
  };

  // Handle soil fertility select
  const handleSoilFertilitySelect = (item: string) => {
    updateFormData({ soilfertility: item });
    setOverallSoilFertilityVisible(false);
  };

  // Save to backend - UPDATED FOR MULTIPLE IMAGES
  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: CultivationInfoData,
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

      // Climate parameters (convert "yes"/"no" to 1/0)
      const yesNoToBool = (val: any) =>
        val === "yes" ? "1" : val === "no" ? "0" : null;

      const appendIfNotNull = (key: string, value: any) => {
        if (value !== null && value !== undefined) {
          apiFormData.append(key, value);
        }
      };

      appendIfNotNull("temperature", yesNoToBool(data.temperature));
      appendIfNotNull("rainfall", yesNoToBool(data.rainfall));
      appendIfNotNull("sunShine", yesNoToBool(data.sunShine));
      appendIfNotNull("humidity", yesNoToBool(data.humidity));
      appendIfNotNull("windVelocity", yesNoToBool(data.windVelocity));
      appendIfNotNull("windDirection", yesNoToBool(data.windDirection));
      appendIfNotNull("zone", yesNoToBool(data.zone));

      // Yes/No fields
      const yesNoToInt = (val: any) =>
        val === "Yes" ? "1" : val === "No" ? "0" : null;

      appendIfNotNull("isCropSuitale", yesNoToInt(data.isCropSuitale));
      appendIfNotNull("isRecevieRainFall", yesNoToInt(data.isRecevieRainFall));
      appendIfNotNull(
        "isRainFallSuitableCrop",
        yesNoToInt(data.isRainFallSuitableCrop),
      );
      appendIfNotNull(
        "isRainFallSuitableCultivation",
        yesNoToInt(data.isRainFallSuitableCultivation),
      );
      appendIfNotNull(
        "isElectrocityAvailable",
        yesNoToInt(data.isElectrocityAvailable),
      );
      appendIfNotNull(
        "ispumpOrirrigation",
        yesNoToInt(data.ispumpOrirrigation),
      );

      // Other fields
      apiFormData.append("ph", data.ph?.toString() || "0");
      apiFormData.append("soilType", data.soilType || "");
      apiFormData.append("soilfertility", data.soilfertility || "");

      // Water sources
      if (data.waterSources && data.waterSources.length > 0) {
        apiFormData.append("waterSources", JSON.stringify(data.waterSources));
      }

      if (data.otherWaterSource) {
        apiFormData.append("otherWaterSource", data.otherWaterSource);
      }

      // Water images - UPDATED TO HANDLE MULTIPLE IMAGES
      if (data.waterImages && data.waterImages.length > 0) {
        data.waterImages.forEach((image, index) => {
          if (
            image.uri.startsWith("http://") ||
            image.uri.startsWith("https://")
          ) {
            // Existing S3 URL
            apiFormData.append(`waterImageUrl_${index}`, image.uri);
            console.log(
              `🔗 Keeping existing water image URL ${index}: ${image.uri}`,
            );
          } else if (
            image.uri.startsWith("file://") ||
            image.uri.startsWith("content://")
          ) {
            // New local file to upload
            apiFormData.append(`waterImage_${index}`, {
              uri: image.uri,
              name: image.name || `water_${Date.now()}_${index}.jpg`,
              type: image.type || "image/jpeg",
            } as any);
            console.log(`📤 Uploading new water image ${index}`);
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
        console.log(`✅ Cultivation info saved successfully`);

        // Update waterImages with S3 URLs if returned
        if (response.data.data.waterImage) {
          let imageUrls = response.data.data.waterImage;
          if (typeof imageUrls === "string") {
            try {
              imageUrls = JSON.parse(imageUrls);
            } catch (e) {
              imageUrls = [];
            }
          }

          if (Array.isArray(imageUrls) && imageUrls.length > 0) {
            const imageObjects: WaterImage[] = imageUrls.map(
              (url: string, index: number) => ({
                uri: url,
                name: url.split("/").pop() || `water_${index}.jpg`,
                type: "image/jpeg",
              }),
            );

            updateFormData({ waterImages: imageObjects });
            console.log("💾 Updated with S3 water image URLs");
          }
        }

        return true;
      }

      return false;
    } catch (error: any) {
      console.error(`❌ Error saving cultivation info:`, error);
      return false;
    }
  };

  // Handle next button - UPDATED VALIDATION
  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    // Validate climate parameters
    const allClimateSelected = climateParameters.every(
      (param) =>
        selections[param.key] === "yes" || selections[param.key] === "no",
    );

    if (!allClimateSelected) {
      validationErrors.climate = t(
        "Error.Please select Yes or No for all climate parameters",
      );
    }

    // Validate other required fields
    if (!formData?.ph) {
      validationErrors.ph = t("Error.pH is required");
    }
    if (!formData?.soilType || formData.soilType.trim() === "") {
      validationErrors.soilType = t("Error.soilType is required");
    }
    if (!formData?.soilfertility) {
      validationErrors.soilfertility = t(
        "Error.Overall soil fertility is required",
      );
    }
    if (!formData?.waterImages || formData.waterImages.length === 0) {
      validationErrors.waterImages = t(
        "Error.At least one image of the water source is required",
      );
    }

    // Validate Yes/No fields
    const yesNoFields = [
      "isCropSuitale",
      "isRecevieRainFall",
      "isRainFallSuitableCrop",
      "isRainFallSuitableCultivation",
      "isElectrocityAvailable",
      "ispumpOrirrigation",
    ];

    yesNoFields.forEach((field) => {
      if (!formData?.[field]) {
        validationErrors[field] = t(`Error.${field} is required`);
      }
    });

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
        "inspectioncultivation",
        formData,
        isExistingData,
      );

      if (saved) {
        console.log("✅ Cultivation info saved successfully to backend");
        setIsExistingData(true);

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("CroppingSystems", {
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
                navigation.navigate("CroppingSystems", {
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
              navigation.navigate("CroppingSystems", {
                requestNumber,
                requestId,
              });
            },
          },
        ],
      );
    }
  };

  const images = formData?.waterImages || [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <StatusBar barStyle="dark-content" />
        <FormTabs activeKey="Cultivation Info" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          {/* Climate Parameters Table */}
          <View>
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.Is the crop / cropping system suitable for overall local climatic parameters",
              )}{" "}
              *
            </Text>
            <View className="flex-row border-b border-[#CACACA]">
              <Text className="flex-1 text-left font-semibold text-[#A3A3A3] border-r border-[#CACACA] py-2 px-1">
                {t("InspectionForm.Parameter")}
              </Text>

              <View className="w-16 flex-row justify-center items-center border-r border-[#CACACA] py-2">
                <Text className="text-[#A3A3A3] font-semibold">
                  {t("InspectionForm.Yes")}{" "}
                </Text>
                <MaterialIcons name="done" size={20} color="#4CAF50" />
              </View>

              <View className="w-16 flex-row justify-center items-center py-2">
                <Text className="text-[#A3A3A3] font-semibold">
                  {t("InspectionForm.No")}{" "}
                </Text>
                <MaterialIcons name="close" size={20} color="#F44336" />
              </View>
            </View>

            {climateParameters.map(({ key, label }) => (
              <View
                key={key}
                className="flex-row border-b border-gray-300 justify-center items-center py-1"
              >
                <Text className="flex-1 text-left border-r border-[#CACACA] py-2 p-1">
                  {t(`InspectionForm.${label}`)}
                </Text>

                <View className="w-16 items-center border-r border-[#CACACA] py-3">
                  <Checkbox
                    value={selections[key] === "yes"}
                    onValueChange={() => handleSelect(key, "yes")}
                    color={selections[key] === "yes" ? "#000" : undefined}
                  />
                </View>

                <View className="w-16 items-center py-2">
                  <Checkbox
                    value={selections[key] === "no"}
                    onValueChange={() => handleSelect(key, "no")}
                    color={selections[key] === "no" ? "#F44336" : undefined}
                  />
                </View>
              </View>
            ))}

            {error ? (
              <View className="mt-2">
                <Text className="text-red-500 text-sm whitespace-pre-line">
                  {error}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Fixed after this line */}

          <YesNoSelect
            label={t(
              "InspectionForm.Is the crop / cropping system suitable for local soil type",
            )}
            required
            value={formData?.isCropSuitale || null}
            visible={yesNoModalVisible && activeYesNoField === "isCropSuitale"}
            onOpen={() => {
              setActiveYesNoField("isCropSuitale");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) => handleyesNOFieldChange("isCropSuitale", value)}
          />

          <View className="mt-4" />

          <Input
            label={t("InspectionForm.pH")}
            placeholder="----"
            value={formData?.ph?.toString()}
            onChangeText={(text) =>
              handleFieldChange("ph", text, {
                required: true,
                type: "ph",
              })
            }
            required
            keyboardType={"phone-pad"}
            error={errors.ph}
          />

          <Input
            label={t("InspectionForm.Soil Type")}
            placeholder="----"
            value={formData?.soilType}
            onChangeText={(text) =>
              handleFieldChange("soilType", text, {
                required: true,
                type: "soilType",
              })
            }
            required
            error={errors.soilType}
          />

          {/* Water Sources */}
          <View className="mt-2">
            <Text className="text-sm text-[#070707] mb-4">
              {t("InspectionForm.Water sources")}{" "}
              <Text className="text-red-500">*</Text>
            </Text>

            {["Tanks", "Wells", "River", "Dams", "Other"].map((option) => {
              const selected = formData.waterSources?.includes(option) || false;

              return (
                <View key={option} className="flex-row items-center mb-4">
                  <Checkbox
                    value={selected}
                    onValueChange={() =>
                      handleWaterSourceToggle(option, selected)
                    }
                    color={selected ? "#000" : undefined}
                  />
                  <Text className="ml-2">{t(`InspectionForm.${option}`)}</Text>
                </View>
              );
            })}

            {formData.waterSources?.includes("Other") && (
              <TextInput
                placeholder={t("InspectionForm.--Mention Other--")}
                placeholderTextColor="#838B8C"
                className="bg-[#F6F6F6] px-4 py-4 rounded-full text-black mb-2"
                value={formData.otherWaterSource || ""}
                onChangeText={handleOtherWaterSourceChange}
              />
            )}

            {errors.waterSources ? (
              <Text className="text-red-500 text-sm mt-1">
                {errors.waterSources}
              </Text>
            ) : null}
          </View>

          <View className="mb-2 mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Images of the water source")}{" "}
              <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="bg-[#1A1A1A] rounded-3xl px-6 py-4 flex-row justify-center items-center"
              onPress={() => {
                setShowCamera(true);
              }}
            >
              <FontAwesome6 name="camera" size={22} color="#fff" />
              <Text className="text-base text-white ml-3">
                {t("InspectionForm.Capture Photos")}
              </Text>
            </TouchableOpacity>

            {/* Display all images */}
            {images.length > 0 && (
              <View className="mt-4 flex-row flex-wrap">
                {images.map((image, index) => (
                  <View key={index} className="w-1/2 p-1 relative">
                    <Image
                      source={{ uri: image.uri }}
                      className="w-full h-40 rounded-2xl"
                      resizeMode="cover"
                    />

                    {/* Remove button */}
                    <TouchableOpacity
                      onPress={() => onClearImage(index)}
                      className="absolute top-[-8] right-[-8] bg-[#f21d1d] p-2 rounded-full"
                    >
                      <AntDesign name="close" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {errors.waterImages ? (
              <Text className="text-red-500 text-sm mt-2">
                {errors.waterImages}
              </Text>
            ) : null}
          </View>

          <View className="mt-2">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Overall soil fertility")}{" "}
              <Text className="text-red-500">*</Text>
            </Text>

            <TouchableOpacity
              className="bg-[#F6F6F6] px-4 py-4 flex-row items-center justify-between rounded-full"
              onPress={() => {
                setOverallSoilFertilityVisible(true);
              }}
            >
              <Text
                className={
                  formData?.soilfertility ? "text-black" : "text-[#A3A3A3]"
                }
              >
                {formData?.soilfertility
                  ? t(`InspectionForm.${formData.soilfertility}`)
                  : t("InspectionForm.--Select From Here--")}
              </Text>

              {!formData?.soilfertility && (
                <AntDesign name="down" size={20} color="#838B8C" />
              )}
            </TouchableOpacity>
          </View>

          <YesNoSelect
            label={t("InspectionForm.Does this land receive adequate rainfall")}
            required
            value={formData?.isRecevieRainFall || null}
            visible={
              yesNoModalVisible && activeYesNoField === "isRecevieRainFall"
            }
            onOpen={() => {
              setActiveYesNoField("isRecevieRainFall");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isRecevieRainFall", value)
            }
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is the distribution of rainfall suitable to grow identified crops",
            )}
            required
            value={formData?.isRainFallSuitableCrop || null}
            visible={
              yesNoModalVisible && activeYesNoField === "isRainFallSuitableCrop"
            }
            onOpen={() => {
              setActiveYesNoField("isRainFallSuitableCrop");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isRainFallSuitableCrop", value)
            }
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is the water quality suitable for cultivation",
            )}
            required
            value={formData?.isRainFallSuitableCultivation || null}
            visible={
              yesNoModalVisible &&
              activeYesNoField === "isRainFallSuitableCultivation"
            }
            onOpen={() => {
              setActiveYesNoField("isRainFallSuitableCultivation");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isRainFallSuitableCultivation", value)
            }
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is electricity available for lifting the water",
            )}
            required
            value={formData?.isElectrocityAvailable || null}
            visible={
              yesNoModalVisible && activeYesNoField === "isElectrocityAvailable"
            }
            onOpen={() => {
              setActiveYesNoField("isElectrocityAvailable");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isElectrocityAvailable", value)
            }
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is there pump sets, micro irrigation systems",
            )}
            required
            value={formData?.ispumpOrirrigation || null}
            visible={
              yesNoModalVisible && activeYesNoField === "ispumpOrirrigation"
            }
            onOpen={() => {
              setActiveYesNoField("ispumpOrirrigation");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("ispumpOrirrigation", value)
            }
          />
        </ScrollView>

        <FormFooterButton
          exitText={t("InspectionForm.Back")}
          nextText={t("InspectionForm.Next")}
          isNextEnabled={isNextEnabled}
          onExit={() => navigation.goBack()}
          onNext={handleNext}
        />
      </View>

      {/* Soil Fertility Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={overallSoilFertilityVisible}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => {
            setOverallSoilFertilityVisible(false);
          }}
        >
          <View className="bg-white w-80 rounded-2xl overflow-hidden">
            {[
              "Excellent",
              "Good",
              "Could be improved with additional effort",
              "Not Suitable",
            ].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4"
                  onPress={() => handleSoilFertilitySelect(item)}
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

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <CameraScreen onClose={handleCameraClose} />
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CultivationInfo;
