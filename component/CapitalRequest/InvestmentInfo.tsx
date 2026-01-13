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
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import banksData from "@/assets/json/banks.json";
import branchesData from "@/assets/json/branches.json";
import axios from "axios";
import { environment } from "@/environment/environment";

type FormData = {
  inspectioninvestment?: InvestmentInfoData;
};
type InvestmentInfoData = {
  expected: number;
  purpose: number;
  repaymentMonth: number;
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
  type?: "expected" | "repaymentMonth" | "purpose";
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
  if (rules.type === "expected") {
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
  if (rules.type === "repaymentMonth") {
    value = value.replace(/[^0-9]/g, "");
    if (value.startsWith("0")) {
      value = value.slice(1);
    }
    if (rules.required && value.length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  if (rules.type === "purpose") {
    value = value.replace(/^\s+/, "");
    value = value.replace(/[^a-zA-Z\s]/g, "");

    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  return { value, error };
};

type InvestmentInfoProps = {
  navigation: any;
};

const InvestmentInfo: React.FC<InvestmentInfoProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "InvestmentInfo">>();
  const { requestNumber, requestId } = route.params; // ✅ Add requestId
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExistingData, setIsExistingData] = useState(false); // ✅ Add this
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  console.log("finance", formData);

  const banks = banksData.map((bank) => ({
    id: bank.ID,
    name: bank.name,
  }));
  useEffect(() => {
    const requiredFields: (keyof InvestmentInfoData)[] = [
      "expected",
      "purpose",
      "repaymentMonth",
    ];

    const allFilled = requiredFields.every((key) => {
      const value = formData.inspectioninvestment?.[key];
      return (
        value !== null && value !== undefined && value.toString().trim() !== ""
      );
    });
    console.log(allFilled);
    const hasErrors = Object.values(errors).some((err) => err !== "");
    console.log(hasErrors);

    setIsNextEnabled(allFilled && !hasErrors);
  }, [formData, errors]);

  let jobId = requestNumber;
  console.log("jobid", jobId);

  const fetchInspectionData = async (
    reqId: number
  ): Promise<InvestmentInfoData | null> => {
    try {
      console.log(`🔍 Fetching investment inspection data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectioninvestment",
          },
        }
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing investment data:`, response.data.data);

        const data = response.data.data;

        return {
          expected: data.expected ? parseFloat(data.expected) : 0,
          purpose: data.purpose || "",
          repaymentMonth: data.repaymentMonth
            ? parseInt(data.repaymentMonth)
            : 0,
        };
      }

      console.log(`📭 No existing investment data found for reqId: ${reqId}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching investment inspection data:`, error);
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
    data: InvestmentInfoData,
    isUpdate: boolean
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName
      );
      console.log(`📝 reqId being sent:`, reqId);

      const transformedData = {
        expected: data.expected?.toString() || "0",
        purpose: data.purpose || "",
        repaymentMonth: data.repaymentMonth
          ? parseInt(data.repaymentMonth.toString())
          : 0,
      };

      console.log(`📦 Transformed data:`, transformedData);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        {
          reqId,
          tableName,
          ...transformedData,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        console.log(`✅ ${tableName} ${response.data.operation}d successfully`);
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

  const updateFormData = async (updates: Partial<InvestmentInfoData>) => {
    try {
      const updatedFormData = {
        ...formData,
        inspectioninvestment: {
          ...formData.inspectioninvestment,
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
          // First, try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Attempting to fetch investment data from backend for reqId: ${reqId}`
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded investment data from backend`);

                // Update form with backend data
                const updatedFormData = {
                  ...formData,
                  inspectioninvestment: backendData,
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
            console.log(`✅ Loaded investment data from AsyncStorage`);
            setFormData(parsedData);
            setIsExistingData(true);
          } else {
            // No data found anywhere - new entry
            setIsExistingData(false);
            console.log("📝 No existing investment data - new entry");
          }
        } catch (e) {
          console.error("Failed to load investment form data", e);
          setIsExistingData(false);
        }
      };

      loadFormData();
    }, [requestId, jobId])
  );

  const handleFieldChange = (
    key: keyof InvestmentInfoData,
    text: string,
    rules: ValidationRule
  ) => {
    const { value, error } = validateAndFormat(
      text,
      rules,
      t,
      formData.inspectioninvestment,
      key
    );

    // Update nested investmentInfo
    setFormData((prev: any) => ({
      ...prev,
      inspectioninvestment: {
        ...prev.inspectioninvestment,
        [key]: value,
      },
    }));

    setErrors((prev) => ({ ...prev, [key]: error || "" }));
    updateFormData({ [key]: value });
  };

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};
    const investmentInfo = formData.inspectioninvestment;

    // Validate required fields
    if (
      !investmentInfo?.expected ||
      investmentInfo.expected.toString().trim() === "" ||
      investmentInfo.expected === 0
    ) {
      validationErrors.expected = t("Error.expected is required");
    }
    if (!investmentInfo?.purpose || investmentInfo.purpose.trim() === "") {
      validationErrors.purpose = t("Error.purpose is required");
    }
    if (
      !investmentInfo?.repaymentMonth ||
      investmentInfo.repaymentMonth.toString().trim() === "" ||
      investmentInfo.repaymentMonth === 0
    ) {
      validationErrors.repaymentMonth = t("Error.repaymentMonth is required");
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
        "inspectioninvestment",
        formData.inspectioninvestment!,
        isExistingData
      );

      if (saved) {
        console.log("✅ Investment info saved successfully to backend");
        setIsExistingData(true);

        Alert.alert(
          t("MAIN.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("MAIN.OK"),
              onPress: () => {
                navigation.navigate("CultivationInfo", {
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
                navigation.navigate("CultivationInfo", {
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
              navigation.navigate("CultivationInfo", {
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
        <FormTabs activeKey="Investment Info" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <Input
            label={t("InspectionForm.Expected investment by the farmer")}
            placeholder="0.00"
            value={formData.inspectioninvestment?.expected?.toString() || ""}
            onChangeText={(text) =>
              handleFieldChange("expected", text, {
                required: true,
                type: "expected",
              })
            }
            required
            extra={t("InspectionForm.Rs")}
            keyboardType={"phone-pad"}
            error={errors.expected}
          />

          <Input
            label={t(
              "InspectionForm.Purpose for investment required as per the farmer"
            )}
            placeholder="----"
            value={formData.inspectioninvestment?.purpose}
            onChangeText={(text) =>
              handleFieldChange("purpose", text, {
                required: true,
                type: "purpose",
              })
            }
            required
            error={errors.purpose}
          />

          <Input
            label={t(
              "InspectionForm.Expected repayment period as per the farmer in months"
            )}
            placeholder="----"
            value={
              formData.inspectioninvestment?.repaymentMonth?.toString() || ""
            }
            onChangeText={(text) =>
              handleFieldChange("repaymentMonth", text, {
                required: true,
                type: "repaymentMonth",
              })
            }
            required
            keyboardType={"phone-pad"}
            error={errors.repaymentMonth}
          />
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
    </KeyboardAvoidingView>
  );
};

export default InvestmentInfo;
