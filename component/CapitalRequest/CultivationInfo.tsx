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
  FlatList,
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
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { CameraScreen } from "@/Items/CameraScreen";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/services/store';
import {
  initializeCultivationInfo,
  updateCultivationInfo,
  setCultivationInfo,
  markCultivationAsExisting,
  CultivationInfoData,
} from '@/store/cultivationInfoSlice';

const climateParameters = [
  { key: "temperature", label: "Temperature" },
  { key: "rainfall", label: "Rainfall" },
  { key: "sunShine", label: "Sun shine hours" },
  { key: "humidity", label: "Relative humidity" },
  { key: "windVelocity", label: "Wind velocity" },
  { key: "windDirection", label: "Wind direction" },
  {
    key: "zone",
    label: "Seasons and agro-ecological zone",
  },
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
      {/* Modal */}
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

      {/* Field */}
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
      className={`bg-[#F6F6F6] rounded-full flex-row items-center ${error ? "border border-red-500" : ""
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
  minLength?: number;
  uniqueWith?: (keyof FormData)[];
};

const validateAndFormat = (
  text: string,
  rules: ValidationRule,
  t: any,
  formData: any,
  currentKey: keyof typeof formData,
) => {
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

  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [overallSoilFertilityVisible, setOverallSoilFertilityVisible] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string>("");

  // Get data from Redux
  const formData = useSelector((state: RootState) =>
    state.cultivationInfo.data[requestId] || {
      soilType: '',
      ph: 0,
      temperature: null,
      rainfall: null,
      sunShine: null,
      humidity: null,
      windVelocity: null,
      windDirection: null,
      zone: null,
      waterSources: [],
      otherWaterSource: '',
      waterImage: null,
    }
  );

  const isExistingData = useSelector((state: RootState) =>
    state.cultivationInfo.isExisting[requestId] || false
  );
  console.log("cultivation data", formData);

  const [selections, setSelections] = useState<Record<string, Selection>>(() =>
    climateParameters.reduce(
      (acc, item) => {
        acc[item.key] = null;
        return acc;
      },
      {} as Record<string, Selection>,
    ),
  );

  const image = formData?.waterImage?.uri;

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
      (!waterSources.includes("Other") ||
        !!formData.otherWaterSource?.trim());

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
      (key) => (formData[key] === "Yes" || formData[key] === "No") ?? false,
    );

    const hasErrors = Object.values(errors).some(Boolean);
    const isImageValid = !!formData.waterImage;

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

  // 5. REPLACE updateFormData - Remove AsyncStorage
  const updateFormData = (updates: Partial<CultivationInfoData>) => {
    dispatch(updateCultivationInfo({
      requestId,
      updates,
    }));
  };

  const fetchInspectionData = async (
    reqId: number,
  ): Promise<CultivationInfoData | null> => {
    try {
      console.log(
        `🔍 Fetching cultivation inspection data for reqId: ${reqId}`,
      );

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectioncultivation",
          },
        },
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(
          `✅ Fetched existing cultivation data:`,
          response.data.data,
        );

        const data = response.data.data;

        // Helper to parse JSON fields
        const safeJsonParse = (field: any) => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === "string") {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              return [];
            }
          }
          return [];
        };

        // Helper to convert boolean (0/1) to "Yes"/"No"
        const boolToYesNo = (val: any): "Yes" | "No" | undefined => {
          if (val === 1 || val === "1" || val === true) return "Yes";
          if (val === 0 || val === "0" || val === false) return "No";
          return undefined;
        };

        // Parse waterImage
        let waterImage = null;
        if (data.waterImage) {
          const imageUrls = safeJsonParse(data.waterImage);
          if (imageUrls.length > 0) {
            waterImage = {
              uri: imageUrls[0],
              name: imageUrls[0].split("/").pop() || "water.jpg",
              type: "image/jpeg",
            };
          }
        }

        return {
          // Climate parameters
          temperature:
            data.temperature === 1
              ? "yes"
              : data.temperature === 0
                ? "no"
                : null,
          rainfall:
            data.rainfall === 1 ? "yes" : data.rainfall === 0 ? "no" : null,
          sunShine:
            data.sunShine === 1 ? "yes" : data.sunShine === 0 ? "no" : null,
          humidity:
            data.humidity === 1 ? "yes" : data.humidity === 0 ? "no" : null,
          windVelocity:
            data.windVelocity === 1
              ? "yes"
              : data.windVelocity === 0
                ? "no"
                : null,
          windDirection:
            data.windDirection === 1
              ? "yes"
              : data.windDirection === 0
                ? "no"
                : null,
          zone: data.zone === 1 ? "yes" : data.zone === 0 ? "no" : null,

          // Other fields
          isCropSuitale: boolToYesNo(data.isCropSuitale),
          ph: data.ph ? parseFloat(data.ph) : 0,
          soilType: data.soilType || "",
          soilfertility: data.soilfertility || "",
          waterSources: safeJsonParse(data.waterSources),
          otherWaterSource: data.otherWaterSource || "",
          waterImage: waterImage,
          isRecevieRainFall: boolToYesNo(data.isRecevieRainFall),
          isRainFallSuitableCrop: boolToYesNo(data.isRainFallSuitableCrop),
          isRainFallSuitableCultivation: boolToYesNo(
            data.isRainFallSuitableCultivation,
          ),
          isElectrocityAvailable: boolToYesNo(data.isElectrocityAvailable),
          ispumpOrirrigation: boolToYesNo(data.ispumpOrirrigation),
        };
      }

      console.log(`📭 No existing cultivation data found for reqId: ${reqId}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching cultivation inspection data:`, error);
      console.error("Error details:", error.response?.data);

      if (error.response?.status === 404) {
        console.log(`📝 No existing record - will create new`);
        return null;
      }

      return null;
    }
  };

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
      console.log(`📝 reqId being sent:`, reqId);

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

      // Water sources (JSON array)
      if (data.waterSources && data.waterSources.length > 0) {
        apiFormData.append("waterSources", JSON.stringify(data.waterSources));
      }

      if (data.otherWaterSource) {
        apiFormData.append("otherWaterSource", data.otherWaterSource);
      }

      // Water image
      if (data.waterImage) {
        if (
          typeof data.waterImage === "string" ||
          (data.waterImage.uri &&
            (data.waterImage.uri.startsWith("http://") ||
              data.waterImage.uri.startsWith("https://")))
        ) {
          const url =
            typeof data.waterImage === "string"
              ? data.waterImage
              : data.waterImage.uri;
          // ✅ Send as array in imageUrl_0 format (like inspectionland)
          apiFormData.append("waterImageUrl_0", url);
          console.log(`🔗 Keeping existing water image URL: ${url}`);
        } else if (
          data.waterImage.uri &&
          data.waterImage.uri.startsWith("file://")
        ) {
          apiFormData.append("waterImage", {
            uri: data.waterImage.uri,
            name: data.waterImage.name || `water_${Date.now()}.jpg`,
            type: data.waterImage.type || "image/jpeg",
          } as any);
          console.log(`📤 Uploading new water image`);
        }
      }

      console.log(`📦 Sending FormData to backend`);

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
        console.log(`✅ ${tableName} ${response.data.operation}d successfully`);

        // Update waterImage with S3 URL if returned
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
            const imageObject = {
              uri: imageUrls[0],
              name: imageUrls[0].split("/").pop() || "water.jpg",
              type: "image/jpeg",
            };

            // Update Redux with S3 URL
            dispatch(updateCultivationInfo({
              requestId,
              updates: { waterImage: imageObject },
            }));

            console.log("💾 Updated Redux with S3 water image URL");
          }
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

  // useFocusEffect(
  //   useCallback(() => {
  //     const loadFormData = async () => {
  //       try {
  //         const savedData = await AsyncStorage.getItem(`${jobId}`);
  //         if (savedData) {
  //           const parsedData = JSON.parse(savedData);
  //           setFormData(parsedData);

  //           const savedSelections: Record<string, Selection> = {};
  //           climateParameters.forEach((param) => {
  //             savedSelections[param] =
  //               parsedData.inspectioncultivation
  //                 .suitableForOverallLocalClimaticParameters?.[param] || null;
  //           });
  //           setSelections(savedSelections);
  //         }
  //       } catch (e) {
  //         console.log("Failed to load form data", e);
  //       }
  //     };

  //     loadFormData();
  //   }, [])
  // );
  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          // Initialize Redux state
          dispatch(initializeCultivationInfo({ requestId }));

          // Try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Attempting to fetch cultivation data from backend for reqId: ${reqId}`,
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded cultivation data from backend`);

                // Update selections for climate parameters
                const savedSelections: Record<string, Selection> = {};
                climateParameters.forEach(({ key }) => {
                  savedSelections[key] = backendData[key] ?? null;
                });
                setSelections(savedSelections);

                // Save to Redux
                dispatch(setCultivationInfo({
                  requestId,
                  data: backendData,
                  isExisting: true,
                }));

                return; // Exit after loading from backend
              }
            }
          }

          // If no backend data, Redux already has initialized empty state
          console.log("📝 No existing cultivation data - new entry");
        } catch (e) {
          console.error("Failed to load cultivation form data", e);
        }
      };

      loadFormData();
    }, [requestId, dispatch]),
  );

  const handleFieldChange = (
    key: keyof CultivationInfoData,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(
      text,
      rules,
      t,
      formData,
      key,
    );

    // Update Redux
    dispatch(updateCultivationInfo({
      requestId,
      updates: { [key]: value },
    }));

    setErrors((prev) => ({ ...prev, [key]: error || "" }));
  };

  // 8. UPDATE handleSelect - Remove AsyncStorage
  const handleSelect = (key: string, value: Selection) => {
    const currentValue = selections[key];
    const newValue = currentValue === value ? null : value;

    const updatedSelections = {
      ...selections,
      [key]: newValue,
    };
    setSelections(updatedSelections);

    // Update Redux
    const updates: Partial<CultivationInfoData> = {
      [key]: newValue,
    };

    if (newValue === null) {
      delete updates[key];
    }

    dispatch(updateCultivationInfo({
      requestId,
      updates,
    }));

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

  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    dispatch(updateCultivationInfo({
      requestId,
      updates: { [key]: value },
    }));
  };

  const handleCameraClose = async (uri: string | null) => {
    setShowCamera(false);

    if (!uri) return;

    const fileName = "waterImage";
    const fileObj = await convertImageToFormData(uri, fileName);

    if (!fileObj) return;

    dispatch(updateCultivationInfo({
      requestId,
      updates: { waterImage: fileObj },
    }));

    setErrors((prev) => ({
      ...prev,
      waterImage: "",
    }));
  };

  const onClearImage = () => {
    dispatch(updateCultivationInfo({
      requestId,
      updates: { waterImage: null },
    }));

    setErrors((prev) => ({
      ...prev,
      waterImage: t("Error.Image of the water source is required"),
    }));
  };

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

    dispatch(updateCultivationInfo({
      requestId,
      updates,
    }));

    // VALIDATION
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

    setErrors((prev) => ({
      ...prev,
      waterSources: errorMsg,
    }));
  };

  const handleOtherWaterSourceChange = (text: string) => {
    dispatch(updateCultivationInfo({
      requestId,
      updates: { otherWaterSource: text },
    }));

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

  const handleSoilFertilitySelect = (item: string) => {
    dispatch(updateCultivationInfo({
      requestId,
      updates: { soilfertility: item },
    }));
    setOverallSoilFertilityVisible(false);
  };


  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};
    const cultivationInfo = formData;

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
    if (!cultivationInfo?.ph) {
      validationErrors.ph = t("Error.pH is required");
    }
    if (!cultivationInfo?.soilType || cultivationInfo.soilType.trim() === "") {
      validationErrors.soilType = t("Error.soilType is required");
    }
    if (!cultivationInfo?.soilfertility) {
      validationErrors.soilfertility = t(
        "Error.Overall soil fertility is required",
      );
    }
    if (!cultivationInfo?.waterImage) {
      validationErrors.waterImage = t(
        "Error.Image of the water source is required",
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
      if (!cultivationInfo?.[field]) {
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

    // ✅ Validate requestId exists
    if (!route.params?.requestId) {
      console.error("❌ requestId is missing!");
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    const reqId = Number(route.params.requestId);

    if (isNaN(reqId) || reqId <= 0) {
      console.error("❌ Invalid requestId:", route.params.requestId);
      Alert.alert(
        t("Error.Error"),
        "Invalid request ID. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    console.log("✅ Using requestId:", reqId);

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false },
    );

    try {
      console.log(
        `🚀 Saving to backend (${isExistingData ? "UPDATE" : "INSERT"})`,
      );

      const saved = await saveToBackend(
        reqId,
        "inspectioncultivation",
        formData, // Now from Redux
        isExistingData,
      );

      if (saved) {
        console.log("✅ Cultivation info saved successfully to backend");

        // Mark as existing in Redux
        dispatch(markCultivationAsExisting({ requestId }));

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("CroppingSystems", {
                  formData: { inspectioncultivation: formData },
                  requestNumber,
                  requestId,
                });
              },
            },
          ],
        );
      } else {
        console.log("⚠️ Backend save failed, but continuing with local data");
        Alert.alert(
          t("Main.Warning"),
          t("InspectionForm.Could not save to server. Data saved locally."),
          [
            {
              text: t("Main.Continue"),
              onPress: () => {
                navigation.navigate("CroppingSystems", {
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
              navigation.navigate("CroppingSystems", {
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

  console.log(selections);


  // const handleSelect = async (param: string, value: Selection) => {
  //   const currentValue = selections[param];
  //   const newValue = currentValue === value ? null : value;

  //   const updatedSelections = {
  //     ...selections,
  //     [param]: newValue,
  //   };
  //   setSelections(updatedSelections);

  //   const updatedSuitableParams = {
  //     ...(formData?.suitableForOverallLocalClimaticParameters ||
  //       {}),
  //     [param]: newValue,
  //   };

  //   if (newValue === null) {
  //     delete updatedSuitableParams[param];
  //   }

  //   const updatedCultivationInfo = {
  //     ...formData,
  //     suitableForOverallLocalClimaticParameters: updatedSuitableParams,
  //   };

  //   const updatedFormData = {
  //     ...formData,
  //     inspectioncultivation: updatedCultivationInfo,
  //   };

  //   setFormData(updatedFormData);

  //   try {
  //     await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
  //   } catch (e) {
  //     console.log("AsyncStorage save failed", e);
  //   }

  //   const nextMissing = climateParameters.find((p) => !updatedSelections[p]);

  //   if (nextMissing) {
  //     setError(
  //       t("Error.Please select Yes or No for", {
  //         Missing: t(`InspectionForm.${nextMissing}`),
  //       })
  //     );
  //   } else {
  //     setError("");
  //   }
  // };



  const convertImageToFormData = async (
    imageUri: string,
    fieldName: string,
  ) => {
    try {
      const extension = imageUri.split(".").pop() || "jpg";
      const fileName = `${fieldName}.${extension}`;

      return {
        uri: imageUri,
        name: fileName,
        type: `image/${extension === "jpg" ? "jpeg" : extension}`,
      };
    } catch (error) {
      console.error(`Error converting ${fieldName} image:`, error);
      return null;
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Tabs */}
        <FormTabs activeKey="Cultivation Info" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
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

            {/* Table Rows */}
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
                    onValueChange={() => handleWaterSourceToggle(option, selected)}
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
              {image ? (
                <Feather name="rotate-ccw" size={22} color="#fff" />
              ) : (
                <FontAwesome6 name="camera" size={22} color="#fff" />
              )}{" "}
              <Text className="text-base text-white ml-3">
                {t("InspectionForm.Capture Photos")}
              </Text>
            </TouchableOpacity>

            {image && (
              <View className="mt-8 relative">
                <Image
                  source={{ uri: image }}
                  className="w-full h-48 rounded-2xl"
                  resizeMode="cover"
                />

                <TouchableOpacity
                  onPress={onClearImage}
                  className="absolute top-2 right-2 bg-[#f21d1d] p-2 rounded-full"
                >
                  <AntDesign name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}
            {errors.waterImage ? (
              <Text className="text-red-500 text-sm mt-2">
                {errors.waterImage}
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
                  formData?.soilfertility
                    ? "text-black"
                    : "text-[#A3A3A3]"
                }
              >
                {formData?.soilfertility
                  ? t(
                    `InspectionForm.${formData.soilfertility}`,
                  )
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
            value={
              formData?.isRainFallSuitableCrop || null
            }
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
            value={
              formData?.isRainFallSuitableCultivation ||
              null
            }
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
            value={
              formData?.isElectrocityAvailable || null
            }
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
            {["Excellent", "Good", "Could be improved with additional effort", "Not Suitable"].map((item, index, arr) => (
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

      <Modal visible={showCamera} animationType="slide">
        <CameraScreen onClose={handleCameraClose} />
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CultivationInfo;
