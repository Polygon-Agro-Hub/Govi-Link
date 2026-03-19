import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveInvestmentInfo,
  getInvestmentInfo,
  InvestmentInfoData,
} from "@/database/inspectioninvestment";
import { updateLastScreen } from "@/database/inspectionprogress";

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
  type?: "expected" | "repaymentMonth" | "purpose" | "text";
};

const validateAndFormat = (text: string, rules: ValidationRule, t: any) => {
  let value = text;
  let error = "";

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

  if (rules.type === "purpose" || rules.type === "text") {
    value = value.replace(/^\s+/, "");
    if (rules.type === "purpose") {
      value = value.replace(/[^a-zA-Z\s]/g, "");

      if (value.length > 0) {
        value = value.charAt(0).toUpperCase() + value.slice(1);
      }
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
  const { t } = useTranslation();
  const [formData, setFormData] = useState<InvestmentInfoData>({
    expected: 0,
    purpose: "",
    repaymentMonth: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);

  useFocusEffect(
    useCallback(() => {
      updateLastScreen(requestId, "InvestmentInfo");
    }, [requestId])
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          await saveInvestmentInfo(Number(requestId), formData);
        } catch (err) {
          console.error("Error auto-saving investment info:", err);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, requestId]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;

        try {
          const reqId = Number(requestId);
          const localData = await getInvestmentInfo(reqId);

          if (localData) {
            setFormData(localData);
            setIsExistingData(true);
          } else {
            setIsExistingData(false);
          }
        } catch (error) {
          console.error("Failed to load investment info from SQLite:", error);
        }
      };

      loadData();
    }, [requestId]),
  );

  useEffect(() => {
    const requiredFields: (keyof InvestmentInfoData)[] = [
      "expected",
      "purpose",
      "repaymentMonth",
    ];

    const allFilled = requiredFields.every((key) => {
      const value = formData[key];
      return (
        value !== null &&
        value !== undefined &&
        value.toString().trim() !== "" &&
        (key !== "expected" && key !== "repaymentMonth"
          ? true
          : Number(value) > 0)
      );
    });

    const hasErrors = Object.values(errors).some((err) => err !== "");

    setIsNextEnabled(allFilled && !hasErrors);
  }, [formData, errors]);

  const updateFormData = (updates: Partial<InvestmentInfoData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleFieldChange = (
    key: keyof InvestmentInfoData,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(text, rules, t);

    let processedValue: string | number = value;
    if (key === "expected") {
      processedValue = value ? parseFloat(value) : 0;
    } else if (key === "repaymentMonth") {
      processedValue = value ? parseInt(value, 10) : 0;
    }

    updateFormData({ [key]: processedValue as any });
    setErrors((prev) => ({ ...prev, [key]: error || "" }));
  };

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: InvestmentInfoData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      const transformedData = {
        expected: data.expected?.toString() || "0",
        purpose: data.purpose || "",
        repaymentMonth: data.repaymentMonth
          ? parseInt(data.repaymentMonth.toString())
          : 0,
      };

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
        return true;
      } else {
        console.error(` ${tableName} save failed:`, response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error(` Error saving ${tableName}:`, error);
      return false;
    }
  };

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

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

    if (!requestId) {
      console.error(" requestId is missing!");
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    const reqId = Number(requestId);

    if (isNaN(reqId) || reqId <= 0) {
      console.error(" Invalid requestId:", requestId);
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
        "inspectioninvestment",
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
                navigation.navigate("CultivationInfo", {
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
                navigation.navigate("CultivationInfo", {
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
                requestNumber,
                requestId,
              });
            },
          },
        ],
      );
    }
  };

  const formatWithCommas = (value: string): string => {
    if (!value) return "";

    const numericValue = value.replace(/,/g, "");

    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleTabPress = (tabKey: string) => {
    const routeMap: Record<string, string> = {
      "Personal Info": "PersonalInfo",
      "ID Proof": "IDProof",
      "Finance Info": "FinanceInfo",
      "Land Info": "LandInfo",
      "Investment Info": "InvestmentInfo",
      "Cultivation Info": "CultivationInfo",
      "Cropping Systems": "CroppingSystems",
      "Profit & Risk": "ProfitRisk",
      Economical: "Economical",
      Labour: "Labour",
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
      <View className="flex-1 bg-[#F3F3F3] ">
        <FormTabs
          activeKey="Investment Info"
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

          <Input
            label={t("InspectionForm.Expected investment by the farmer")}
            placeholder="0.00"
            value={
              formData.expected
                ? formatWithCommas(formData.expected.toString())
                : ""
            }
            onChangeText={(text) => {
              const numericValue = text.replace(/,/g, "");
              handleFieldChange("expected", numericValue, {
                required: true,
                type: "expected",
              });
            }}
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
                type: "text",
              })
            }
            required
            error={errors.purpose}
          />

          <Input
            label={t(
              "InspectionForm.Expected repayment period as per the farmer in months",
            )}
            placeholder="--"
            value={
              formData.repaymentMonth && formData.repaymentMonth !== 0
                ? formData.repaymentMonth.toString()
                : ""
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
