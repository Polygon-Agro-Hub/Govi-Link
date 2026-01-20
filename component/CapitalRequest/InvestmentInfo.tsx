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
import banksData from "@/assets/json/banks.json";
import branchesData from "@/assets/json/branches.json";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/services/store";
import {
  initializeInvestmentInfo,
  updateInvestmentInfo,
  setInvestmentInfo,
  markInvestmentAsExisting,
  InvestmentInfoData,
} from "@/store/investmentInfoSlice";
import FormFooterButton from "./FormFooterButton";

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
  currentKey: keyof typeof formData,
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
  const { requestNumber, requestId } = route.params;

  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  // Get data from Redux
  const formData = useSelector(
    (state: RootState) =>
      state.investmentInfo.data[requestId] || {
        expected: 0,
        purpose: "",
        repaymentMonth: 0,
      },
  );

  const isExistingData = useSelector(
    (state: RootState) => state.investmentInfo.isExisting[requestId] || false,
  );

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
      const value = formData[key];
      return (
        value !== null && value !== undefined && value.toString().trim() !== ""
      );
    });
    console.log(allFilled);
    const hasErrors = Object.values(errors).some((err) => err !== "");
    console.log(hasErrors);

    setIsNextEnabled(allFilled && !hasErrors);
  }, [formData, errors]);

  // 5. REPLACE updateFormData - Remove AsyncStorage
  const updateFormData = (updates: Partial<InvestmentInfoData>) => {
    dispatch(
      updateInvestmentInfo({
        requestId,
        updates,
      }),
    );
  };

  // 6. UPDATE useFocusEffect - Use Redux instead of AsyncStorage
  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          // Initialize Redux state
          dispatch(initializeInvestmentInfo({ requestId }));

          // Try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Attempting to fetch investment data from backend for reqId: ${reqId}`,
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded investment data from backend`);

                // Save to Redux
                dispatch(
                  setInvestmentInfo({
                    requestId,
                    data: backendData,
                    isExisting: true,
                  }),
                );

                return; // Exit after loading from backend
              }
            }
          }

          // If no backend data, Redux already has initialized empty state
          console.log("📝 No existing investment data - new entry");
        } catch (e) {
          console.error("Failed to load investment form data", e);
        }
      };

      loadFormData();
    }, [requestId, dispatch]),
  );

  let jobId = requestNumber;
  console.log("jobid", jobId);

  const fetchInspectionData = async (
    reqId: number,
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
        },
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
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName,
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
        },
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

  // 7. UPDATE handleFieldChange
  const handleFieldChange = (
    key: keyof InvestmentInfoData,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(text, rules, t, formData, key);

    // Update Redux
    dispatch(
      updateInvestmentInfo({
        requestId,
        updates: { [key]: value },
      }),
    );

    setErrors((prev) => ({ ...prev, [key]: error || "" }));
  };

  // 8. UPDATE handleNext - Mark as existing after save
  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    // Validate required fields
    if (
      !formData?.expected ||
      formData.expected.toString().trim() === "" ||
      formData.expected === 0
    ) {
      validationErrors.expected = t("Error.expected is required");
    }
    if (!formData?.purpose || formData.purpose.trim() === "") {
      validationErrors.purpose = t("Error.purpose is required");
    }
    if (
      !formData?.repaymentMonth ||
      formData.repaymentMonth.toString().trim() === "" ||
      formData.repaymentMonth === 0
    ) {
      validationErrors.repaymentMonth = t("Error.repaymentMonth is required");
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("Main.ok") },
      ]);
      return;
    }

    // Validate requestId exists
    if (!requestId) {
      console.error("❌ requestId is missing!");
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    const reqId = Number(requestId);

    // Validate it's a valid number
    if (isNaN(reqId) || reqId <= 0) {
      console.error("❌ Invalid requestId:", requestId);
      Alert.alert(
        t("Error.Error"),
        "Invalid request ID. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    console.log("✅ Using requestId:", reqId);

    // Show loading indicator
    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false },
    );

    // Save to backend
    try {
      console.log(
        `🚀 Saving to backend (${isExistingData ? "UPDATE" : "INSERT"})`,
      );

      const saved = await saveToBackend(
        reqId,
        "inspectioninvestment",
        formData, // Now from Redux
        isExistingData,
      );

      if (saved) {
        console.log("✅ Investment info saved successfully to backend");

        // Mark as existing in Redux
        dispatch(markInvestmentAsExisting({ requestId }));

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("CultivationInfo", {
                  formData: { inspectioninvestment: formData },
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
                navigation.navigate("CultivationInfo", {
                  formData: { inspectioninvestment: formData },
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
              navigation.navigate("CultivationInfo", {
                formData: { inspectioninvestment: formData },
                requestNumber,
                requestId,
              });
            },
          },
        ],
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
        <FormTabs activeKey="Investment Info" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <Input
            label={t("InspectionForm.Expected investment by the farmer")}
            placeholder="0.00"
            value={formData.expected?.toString() || ""}
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
              "InspectionForm.Purpose for investment required as per the farmer",
            )}
            placeholder="----"
            value={formData.purpose}
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
              "InspectionForm.Expected repayment period as per the farmer in months",
            )}
            placeholder="----"
            value={formData.repaymentMonth?.toString() || ""}
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

        <FormFooterButton
          exitText={t("InspectionForm.Back")}
          nextText={t("InspectionForm.Next")}
          isNextEnabled={isNextEnabled}
          onExit={() => navigation.goBack()}
          onNext={handleNext}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default InvestmentInfo;
