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
} from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";

type FormData = {
  ProfitRisk?: ProfitRiskData;
};
type ProfitRiskData = {
  profit?: string;
  risk?: string;
  solution?:string;
  worthToTakeRisk?:string
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
type ValidationRule = {
  required?: boolean;
  type?:
    | "profit"
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
 if (rules.type === "profit") {
  value = value.replace(/[^0-9.]/g, "");

  if (value.startsWith(".")) {
    value = value.slice(1);
  }

  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts.slice(1).join("");
  }

  value = value.replace(/\.{2,}/g, ".");

  if (value === "0") {
    error = t("Error.Value must be greater than 0");
  } else if (rules.required && value.trim().length === 0) {
    error = t(`Error.${rules.type} is required`);
  }
}

 
  return { value, error };
};

type ProfitRiskProps = {
  navigation: any;
};

const ProfitRisk: React.FC<ProfitRiskProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "ProfitRisk">>();
  const { requestNumber } = route.params;
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  console.log("finance", formData);

  // useEffect(() => {
  //   const requiredFields: (keyof ProfitRiskData)[] = [
  //     "expectedFromProposedCrop",
  //   ];

  //   const allFilled = requiredFields.every((key) => {
  //     const value = formData.profitRisk?.[key];
  //     return (
  //       value !== null && value !== undefined && value.toString().trim() !== ""
  //     );
  //   });
  //   console.log(allFilled);
  //   const hasErrors = Object.values(errors).some((err) => err !== "");
  //   console.log(hasErrors);

  //   setIsNextEnabled(allFilled && !hasErrors);
  // }, [formData, errors]);

  useEffect(() => {
  const inspectionprofit = formData?.inspectionprofit;

  if (!inspectionprofit) {
    setIsNextEnabled(false);
    return;
  }

  const {
    profit,
    isProfitable,
    isRisk,
    risk,
    solution,
    manageRisk,
    worthToTakeRisk,
  } = inspectionprofit;

  // ---------- BASE REQUIRED (ALWAYS) ----------
  const baseValid =
    profit?.trim() !== "" &&
    profit !== "0" &&
    (isProfitable === "Yes" ||
      isProfitable === "No") &&
    (isRisk === "Yes" || isRisk === "No");

  // ---------- CONDITIONAL REQUIRED ----------
  const risksYesValid =
    isRisk === "Yes"
      ? risk?.trim() !== "" &&
        solution?.trim() !== "" &&
        (manageRisk === "Yes" ||
          manageRisk === "No") &&
        worthToTakeRisk?.trim() !== ""
      : true;

  // ---------- IGNORE ERRORS WHEN RISKS = NO ----------
  const filteredErrors = { ...errors };
  if (isRisk === "No") {
    delete filteredErrors.risk;
    delete filteredErrors.solution;
    delete filteredErrors.manageRisk;
    delete filteredErrors.worthToTakeRisk;
  }

  const hasErrors = Object.values(filteredErrors).some(
    (err) => err && err.length > 0
  );

  setIsNextEnabled(baseValid && risksYesValid && !hasErrors);
}, [formData, errors]);




  let jobId = requestNumber;
  console.log("jobid", jobId);

  const updateFormData = async (updates: Partial<ProfitRiskData>) => {
    try {
      const updatedFormData = {
        ...formData,
        inspectionprofit: {
          ...formData.inspectionprofit,
          ...updates,
        },
      };

      setFormData(updatedFormData);

      await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
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

  const handleFieldChange = (
    key: keyof ProfitRiskData,
    text: string,
    rules: ValidationRule
  ) => {
    const { value, error } = validateAndFormat(
      text,
      rules,
      t,
      formData.inspectionprofit,
      key
    );

    // Update nested investmentInfo
    setFormData((prev: any) => ({
      ...prev,
      inspectionprofit: {
        ...prev.inspectionprofit,
        [key]: value,
      },
    }));

    setErrors((prev) => ({ ...prev, [key]: error || "" }));
    updateFormData({ [key]: value });
  };

  // const handleyesNOFieldChange = async (key: string, value: "Yes" | "No") => {
  //   const updatedFormData = {
  //     ...formData,
  //     profitRisk: {
  //       ...formData.profitRisk,
  //       [key]: value,
  //     },
  //   };

  //   setFormData(updatedFormData);

  //   try {
  //     await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
  //   } catch (e) {
  //     console.log("AsyncStorage save failed", e);
  //   }
  // };

const handleyesNOFieldChange = async (
  key: string,
  value: "Yes" | "No"
) => {
  let updatedProfitRisk = {
    ...formData.inspectionprofit,
    [key]: value,
  };

  // 🔥 CLEAR ALL RISK FIELDS WHEN "NO"
  if (key === "isRisk" && value === "No") {
    updatedProfitRisk = {
      ...updatedProfitRisk,
      risk: "",
      solution: "",
      manageRisk: "",
      worthToTakeRisk: "",
    };

    // clear related errors
    setErrors((prev) => ({
      ...prev,
      risk: "",
      solution: "",
      manageRisk: "",
      worthToTakeRisk: "",
    }));
  }

  setFormData((prev: any) => ({
    ...prev,
    inspectionprofit: updatedProfitRisk,
  }));

  await AsyncStorage.setItem(
    `${jobId}`,
    JSON.stringify({ ...formData, inspectionprofit: updatedProfitRisk })
  );
};


  const handleNext = () => {
        navigation.navigate("Economical", { formData, requestNumber });

    const validationErrors: Record<string, string> = {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));

      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("MAIN.OK") },
      ]);
      return;
    }

    navigation.navigate("Economical", { formData, requestNumber });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="flex-row items-center justify-center py-4 mt-2">
          <TouchableOpacity
            className="absolute left-4 bg-[#F3F3F3] rounded-full p-4"
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="Profit & Risk" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <Input
            label={t(
              "InspectionForm.How much profit are you expecting from the proposed crop/cropping system"
            )}
            placeholder="0.00"
            value={formData.inspectionprofit?.profit}
            onChangeText={(text) =>
              handleFieldChange("profit", text, {
                required: true,
                type: "profit",
              })
            }
            required
            extra={t("InspectionForm.Rs")}
            keyboardType={"phone-pad"}
            error={errors.profit}
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is this profitable than the existing crop / cropping system"
            )}
            required
            value={
              formData.inspectionprofit?.isProfitable || null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "isProfitable"
            }
            onOpen={() => {
              setActiveYesNoField("isProfitable");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isProfitable", value)
            }
          />

          <YesNoSelect
            label={t("InspectionForm.Are there any risks")}
            required
            value={formData.inspectionprofit?.isRisk || null}
            visible={
              yesNoModalVisible && activeYesNoField === "isRisk"
            }
            onOpen={() => {
              setActiveYesNoField("isRisk");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isRisk", value)
            }
          />
{formData.inspectionprofit?.isRisk === "Yes" && (
  <>
  <View className="mt-4">
    <Text className="text-sm text-[#070707] mb-2">
      {t(
        "InspectionForm.What are the risks you are anticipating in the proposed crop / cropping system"
      )}{" "}
      <Text className="text-black">*</Text>
    </Text>

    <View
      className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
        errors.risk
          ? "border border-red-500"
          : ""
      }`}
    >
      <TextInput
        placeholder={t("InspectionForm.Type here...")}
        value={
          formData.inspectionprofit?.risk || ""
        }
        onChangeText={(text) => {
          let formattedText = text.replace(/^\s+/, "");

          if (formattedText.length > 0) {
            formattedText =
              formattedText.charAt(0).toUpperCase() +
              formattedText.slice(1);
          }

          setFormData((prev: any) => ({
            ...prev,
            inspectionprofit: {
              ...prev.inspectionprofit,
              risk: formattedText,
            },
          }));

          setErrors((prev) => ({
            ...prev,
            risk:
              formattedText.trim() === ""
                ? t(
                    "Error.What are the risks you are anticipating in the proposed crop / cropping system is required"
                  )
                : "",
          }));

          updateFormData({
            risk: formattedText,
          });
        }}
        multiline
        textAlignVertical="top"
        className="text-black"
      />
    </View>

    {errors.risk && (
      <Text className="text-red-500 text-sm mt-1 ml-2">
        {errors.risk}
      </Text>
    )}
  </View>


 <View className="mt-4">
    <Text className="text-sm text-[#070707] mb-2">
      {t(
        "InspectionForm.Do you have the solution"
      )}{" "}
      <Text className="text-black">*</Text>
    </Text>

    <View
      className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
        errors.solution
          ? "border border-red-500"
          : ""
      }`}
    >
      <TextInput
        placeholder={t("InspectionForm.Type here...")}
        value={
          formData.inspectionprofit?.solution || ""
        }
        onChangeText={(text) => {
          let formattedText = text.replace(/^\s+/, "");

          if (formattedText.length > 0) {
            formattedText =
              formattedText.charAt(0).toUpperCase() +
              formattedText.slice(1);
          }

          setFormData((prev: any) => ({
            ...prev,
            inspectionprofit: {
              ...prev.inspectionprofit,
              solution: formattedText,
            },
          }));

          setErrors((prev) => ({
            ...prev,
            solution:
              formattedText.trim() === ""
                ? t(
                    "Error.Do you have the solution is required"
                  )
                : "",
          }));

          updateFormData({
            solution: formattedText,
          });
        }}
        multiline
        textAlignVertical="top"
        className="text-black"
      />
    </View>

    {errors.solution && (
      <Text className="text-red-500 text-sm mt-1 ml-2">
        {errors.solution}
      </Text>
    )}
  </View>

 <YesNoSelect
            label={t("InspectionForm.Can the farmer manage the risks")}
            required
            value={formData.inspectionprofit?.manageRisk || null}
            visible={
              yesNoModalVisible && activeYesNoField === "manageRisk"
            }
            onOpen={() => {
              setActiveYesNoField("manageRisk");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("manageRisk", value)
            }
          />


   <View className="mt-4">
    <Text className="text-sm text-[#070707] mb-2">
      {t(
        "InspectionForm.Is it worth to take the risks for anticipated profits"
      )}{" "}
      <Text className="text-black">*</Text>
    </Text>

    <View
      className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
        errors.worthToTakeRisk
          ? "border border-red-500"
          : ""
      }`}
    >
      <TextInput
        placeholder={t("InspectionForm.Type here...")}
        value={
          formData.inspectionprofit?.worthToTakeRisk || ""
        }
        onChangeText={(text) => {
          let formattedText = text.replace(/^\s+/, "");

          if (formattedText.length > 0) {
            formattedText =
              formattedText.charAt(0).toUpperCase() +
              formattedText.slice(1);
          }

          setFormData((prev: any) => ({
            ...prev,
            inspectionprofit: {
              ...prev.inspectionprofit,
              worthToTakeRisk: formattedText,
            },
          }));

          setErrors((prev) => ({
            ...prev,
            worthToTakeRisk:
              formattedText.trim() === ""
                ? t(
                    "Error.Is it worth to take the risks for anticipated profits is required"
                  )
                : "",
          }));

          updateFormData({
            worthToTakeRisk: formattedText,
          });
        }}
        multiline
        textAlignVertical="top"
        className="text-black"
      />
    </View>

    {errors.worthToTakeRisk && (
      <Text className="text-red-500 text-sm mt-1 ml-2">
        {errors.worthToTakeRisk}
      </Text>
    )}
  </View>
  </>
)}

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
          {isNextEnabled == false ? (
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
    </KeyboardAvoidingView>
  );
};

export default ProfitRisk;
