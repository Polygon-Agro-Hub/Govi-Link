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
  Image
} from "react-native";
import { AntDesign, Feather, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
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

type FormData = {
  inspectioncultivation?: CultivationInfoData;
};
type CultivationInfoData = {
  soilType: string;
  ph: number;
};

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
  const { requestNumber } = route.params;
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [overallSoilFertilityVisible, setOverallSoilFertilityVisible] =
    useState(false);
  console.log("finance", formData);

const [selections, setSelections] = useState<Record<string, Selection>>(() =>
  climateParameters.reduce((acc, item) => {
    acc[item.key] = null;
    return acc;
  }, {} as Record<string, Selection>)
);

  const [showCamera, setShowCamera] = useState(false);
const image = formData?.inspectioncultivation?.waterImage?.uri;

useEffect(() => {
  const cultivationInfo = formData?.inspectioncultivation || {};

  const allClimateSelected = climateParameters.every(
    (param) => selections[param.key] === "yes" || selections[param.key] === "no"
  );

  const isPHValid = !!cultivationInfo.ph && !errors.ph;
  const isSoilTypeValid = !!cultivationInfo.soilType && !errors.soilType;

  const waterSources = cultivationInfo.waterSources || [];
  const isWaterSourceValid =
    waterSources.length > 0 &&
    (!waterSources.includes("Other") ||
      cultivationInfo.otherWaterSource?.trim());

  const isOverallSoilFertilityValid =
    !!cultivationInfo.soilfertility;

  const yesNoFields = [
    "isCropSuitale",
    "isRecevieRainFall",
    "isRainFallSuitableCrop",
    "isRainFallSuitableCultivation",
    "isElectrocityAvailable",
    "ispumpOrirrigation",
  ];

  const allYesNoSelected = yesNoFields.every(
    (key) => cultivationInfo[key] === "Yes" || cultivationInfo[key] === "No"
  );

  const hasErrors = Object.values(errors).some(Boolean);
 const isImageValid = !!cultivationInfo.waterImage;
  setIsNextEnabled(
    allClimateSelected &&
      isPHValid &&
      isSoilTypeValid &&
      isWaterSourceValid &&
      isOverallSoilFertilityValid &&
      allYesNoSelected &&
      isImageValid &&
      !hasErrors
  );
}, [formData, selections, errors]);

  let jobId = requestNumber;
  console.log("jobid", jobId);

  const updateFormData = async (updates: Partial<CultivationInfoData>) => {
    try {
      const updatedFormData = {
        ...formData,
        inspectioncultivation: {
          ...formData.inspectioncultivation,
          ...updates,
        },
      };

      setFormData(updatedFormData);
      await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
    } catch (e) {
      console.log("AsyncStorage save failed", e);
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
        const savedData = await AsyncStorage.getItem(`${jobId}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setFormData(parsedData);

          const savedSelections: Record<string, Selection> = {};

          climateParameters.forEach(({ key }) => {
            savedSelections[key] =
              parsedData.inspectioncultivation?.[key] ?? null;
          });

          setSelections(savedSelections);
        }
      } catch (e) {
        console.log("Failed to load form data", e);
      }
    };

    loadFormData();
  }, [jobId])
);


  const handleFieldChange = (
    key: keyof CultivationInfoData,
    text: string,
    rules: ValidationRule
  ) => {
    const { value, error } = validateAndFormat(
      text,
      rules,
      t,
      formData.inspectioncultivation,
      key
    );

    setFormData((prev: any) => ({
      ...prev,
      inspectioncultivation: {
        ...prev.inspectioncultivation,
        [key]: value,
      },
    }));

    setErrors((prev) => ({ ...prev, [key]: error || "" }));
      updateFormData({ [key]: value });
  };

  const handleNext = () => {

    const validationErrors: Record<string, string> = {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));

      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("MAIN.OK") },
      ]);
      return;
    }

    navigation.navigate("CroppingSystems", { formData, requestNumber });
  };

  console.log(selections);

  const [error, setError] = useState<string>("");

  // const handleSelect = async (param: string, value: Selection) => {
  //   const currentValue = selections[param];
  //   const newValue = currentValue === value ? null : value;

  //   const updatedSelections = {
  //     ...selections,
  //     [param]: newValue,
  //   };
  //   setSelections(updatedSelections);

  //   const updatedSuitableParams = {
  //     ...(formData.inspectioncultivation?.suitableForOverallLocalClimaticParameters ||
  //       {}),
  //     [param]: newValue,
  //   };

  //   if (newValue === null) {
  //     delete updatedSuitableParams[param];
  //   }

  //   const updatedCultivationInfo = {
  //     ...formData.inspectioncultivation,
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

 const handleSelect = async (key: string, value: Selection) => {
  const currentValue = selections[key];
  const newValue = currentValue === value ? null : value;

  const updatedSelections = {
    ...selections,
    [key]: newValue,
  };
  setSelections(updatedSelections);

  const updatedCultivationInfo = {
    ...formData.inspectioncultivation,
    [key]: newValue,
  };

  if (newValue === null) {
    delete updatedCultivationInfo[key];
  }

  const updatedFormData = {
    ...formData,
    inspectioncultivation: updatedCultivationInfo,
  };

  setFormData(updatedFormData);

  try {
    await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
  } catch (e) {
    console.log("AsyncStorage save failed", e);
  }

  const nextMissing = climateParameters.find(
    (p) => !updatedSelections[p.key]
  );

  if (nextMissing) {
    setError(
      t("Error.Please select Yes or No for", {
        Missing: t(`InspectionForm.${nextMissing.label}`),
      })
    );
  } else {
    setError("");
  }
};


  const handleyesNOFieldChange = async (key: string, value: "Yes" | "No") => {
    const updatedFormData = {
      ...formData,
      inspectioncultivation: {
        ...formData.inspectioncultivation,
        [key]: value,
      },
    };

    setFormData(updatedFormData);

    try {
      await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };


const handleCameraClose = async (uri: string | null) => {
  setShowCamera(false);

  // If camera closed without image → do nothing
  if (!uri) return;

  const fileName = "waterImage";
  const fileObj = await convertImageToFormData(uri, fileName);

  if (!fileObj) return;

  const updatedFormData = {
    ...formData,
    inspectioncultivation: {
      ...formData.inspectioncultivation,
      waterImage: fileObj, // 🔁 REPLACED every time
    },
  };

  setFormData(updatedFormData);
  setErrors((prev) => ({
    ...prev,
    waterImage: "",
  }));
  try {
    await AsyncStorage.setItem(
      `${jobId}`,
      JSON.stringify(updatedFormData)
    );
  } catch (e) {
    console.log("AsyncStorage save failed", e);
  }
};

const convertImageToFormData = async (
  imageUri: string,
  fieldName: string
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

const onClearImage = async () => {
  const updatedFormData = {
    ...formData,
    inspectioncultivation: {
      ...formData.inspectioncultivation,
      waterImage: null,
    },
  };

  setFormData(updatedFormData);

  setErrors((prev) => ({
    ...prev,
    waterImage: t("Error.Image of the water source is required"),
  }));

  try {
    await AsyncStorage.setItem(
      `${jobId}`,
      JSON.stringify(updatedFormData)
    );
  } catch (e) {
    console.log("AsyncStorage save failed", e);
  }
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
        <FormTabs activeKey="Cultivation Info" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <View>
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.Is the crop / cropping system suitable for overall local climatic parameters"
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
              "InspectionForm.Is the crop / cropping system suitable for local soil type"
            )}
            required
            value={
              formData.inspectioncultivation?.isCropSuitale || null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "isCropSuitale"
            }
            onOpen={() => {
              setActiveYesNoField("isCropSuitale");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isCropSuitale", value)
            }
          />
          <View className="mt-4" />
          <Input
            label={t("InspectionForm.pH")}
            placeholder="----"
            value={formData.inspectioncultivation?.ph}
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
            value={formData.inspectioncultivation?.soilType}
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
    {t("InspectionForm.Water sources")} <Text className="text-red-500">*</Text>
  </Text>

  {["Tanks","Wells", "River","Dams", "Other"].map((option) => {
    const selected =
      formData.inspectioncultivation?.waterSources?.includes(option) || false;

    return (
      <View key={option} className="flex-row items-center mb-4">
        <Checkbox
          value={selected}
            onValueChange={async () => {
            let updatedOptions = formData.inspectioncultivation?.waterSources || [];

            if (selected) {
              updatedOptions = updatedOptions.filter((o: any) => o !== option);
            } else {
              updatedOptions = [...updatedOptions, option];
            }

            const updatedFormData = {
              ...formData,
              inspectioncultivation: {
                ...formData.inspectioncultivation,
                waterSources: updatedOptions,
                otherWaterSource:
                  option === "Other" && !updatedOptions.includes("Other")
                    ? ""
                    : formData.inspectioncultivation?.otherWaterSource,
              },
            };

            setFormData(updatedFormData);

// VALIDATION
let errorMsg = "";

const waterSources = updatedFormData.inspectioncultivation.waterSources || [];

// Filter out "Other" to see if at least one real option is selected
const validWaterSources = waterSources.filter((source: string) => source !== "Other");

if (validWaterSources.length === 0) {
  // No real water source selected
  errorMsg = t("Error.Please select at least one water source");
} else if (
  waterSources.includes("Other") && 
  !updatedFormData.inspectioncultivation.otherWaterSource?.trim()
) {
  // "Other" is selected but not specified
  errorMsg = t("Error.Please specify the other water source");
}

setErrors(prev => ({ ...prev, waterSources: errorMsg }));


            try {
              await AsyncStorage.setItem(
                `${jobId}`,
                JSON.stringify(updatedFormData)
              );
            } catch (e) {
              console.log("AsyncStorage save failed", e);
            }
          }}
          color={selected ? "#000" : undefined}
        />
        <Text className="ml-2">{t(`InspectionForm.${option}`)}</Text>
      </View>
    );
  })}


  {formData.inspectioncultivation?.waterSources?.includes("Other") && (
    <TextInput
      placeholder={t("InspectionForm.--Mention Other--")}
      placeholderTextColor="#838B8C"
      className="bg-[#F6F6F6] px-4 py-4 rounded-full text-black mb-2"
      value={formData.inspectioncultivation?.otherWaterSource || ""}
    onChangeText={(text) => {
  const updatedFormData = {
    ...formData,
    inspectioncultivation: {
      ...formData.inspectioncultivation,
      otherWaterSource: text,
    },
  };

  setFormData(updatedFormData);

  let errorMsg = "";
  const waterSources = updatedFormData.inspectioncultivation.waterSources || [];
  const validWaterSources = waterSources.filter(
    (source: string) => source !== "Other"
  );

  if (validWaterSources.length === 0) {
    errorMsg = t("Error.Please select at least one water source");
  } else if (waterSources.includes("Other") && !text.trim()) {
    errorMsg = t("Error.Please specify the other water source");
  }

  setErrors((prev) => ({ ...prev, waterSources: errorMsg }));

  // 3️⃣ Save to AsyncStorage in the background (don't await here)
  AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData)).catch(e =>
    console.log("AsyncStorage save failed", e)
  );
}}

    />

  )}

    {errors.waterSources ? (
    <Text className="text-red-500 text-sm mt-1">{errors.waterSources}</Text>
  ) : null}

</View>

  <View className="mb-2 mt-4">
              <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Images of the water source")}{" "}
              <Text className="text-red-500">*</Text>
            </Text>
    <TouchableOpacity
      className="bg-[#1A1A1A] rounded-3xl px-6 py-4 flex-row justify-center items-center"
      onPress={()=> {  setShowCamera(true);}}
    >
      {image ? (
        <Feather name="rotate-ccw" size={22} color="#fff" /> 
      ) : (
        <FontAwesome6 name="camera" size={22} color="#fff" />
      )}      <Text className="text-base text-white ml-3">{t("InspectionForm.Capture Photos")}</Text>
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
    <Text className="text-red-500 text-sm mt-2">{errors.waterImage}</Text>
  ) : null}
  </View>
          <View className="mt-2">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Overall soil fertility")}{" "}
              <Text className="text-red-500">*</Text>
            </Text>

            <TouchableOpacity
              className="bg-[#F6F6F6] px-4 py-4 flex-row items-center justify-between rounded-full"
              onPress={() =>{
                setOverallSoilFertilityVisible(true)
                setFormData({
                  ...formData,
                  inspectioncultivation: {
                    ...formData.inspectioncultivation
                  },
                })
              }
              }
            >
              <Text
                className={
                  formData.inspectioncultivation?.soilfertility
                    ? "text-black"
                    : "text-[#A3A3A3]"
                }
              >
                {formData.inspectioncultivation?.soilfertility
                  ? t(
                      `InspectionForm.${formData.inspectioncultivation.soilfertility}`
                    )
                  : t("InspectionForm.--Select From Here--")}
              </Text>

              {!formData.inspectioncultivation?.soilfertility && (
                <AntDesign name="down" size={20} color="#838B8C" />
              )}
            </TouchableOpacity>
          </View>

          <YesNoSelect
            label={t("InspectionForm.Does this land receive adequate rainfall")}
            required
            value={
              formData.inspectioncultivation?.isRecevieRainFall || null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "isRecevieRainFall"
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
              "InspectionForm.Is the distribution of rainfall suitable to grow identified crops"
            )}
            required
            value={
              formData.inspectioncultivation
                ?.isRainFallSuitableCrop || null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField ===
                "isRainFallSuitableCrop"
            }
            onOpen={() => {
              setActiveYesNoField(
                "isRainFallSuitableCrop"
              );
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange(
                "isRainFallSuitableCrop",
                value
              )
            }
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is the water quality suitable for cultivation"
            )}
            required
            value={
              formData.inspectioncultivation
                ?.isRainFallSuitableCultivation || null
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
              handleyesNOFieldChange(
                "isRainFallSuitableCultivation",
                value
              )
            }
          />
          <YesNoSelect
            label={t(
              "InspectionForm.Is electricity available for lifting the water"
            )}
            required
            value={
              formData.inspectioncultivation
                ?.isElectrocityAvailable || null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "isElectrocityAvailable"
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
              handleyesNOFieldChange(
                "isElectrocityAvailable",
                value
              )
            }
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is there pump sets, micro irrigation systems"
            )}
            required
            value={
              formData.inspectioncultivation?.ispumpOrirrigation ||
              null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "ispumpOrirrigation"
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
              handleyesNOFieldChange(
                "ispumpOrirrigation",
                value
              )
            }
          />
        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity
            className="flex-1 bg-[#444444] rounded-full py-4 items-center"
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text className="text-white text-base font-semibold">
              {t("InspectionForm.Back")}
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
      <Modal
        transparent
        animationType="fade"
        visible={overallSoilFertilityVisible}
        
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
                    onPress={()=>{setOverallSoilFertilityVisible(false)}}
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
                  onPress={async () => {
                    const updatedFormData = {
                      ...formData,
                      inspectioncultivation: {
                        ...formData.inspectioncultivation,
                        soilfertility: item,
                      },
                    };

                    setFormData(updatedFormData);

                    try {
                      await AsyncStorage.setItem(
                        `${jobId}`,
                        JSON.stringify(updatedFormData)
                      );
                    } catch (e) {
                      console.log("AsyncStorage save failed", e);
                    }
                    setOverallSoilFertilityVisible(false);
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

      <Modal visible={showCamera} animationType="slide">
        <CameraScreen onClose={handleCameraClose} />
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CultivationInfo;
