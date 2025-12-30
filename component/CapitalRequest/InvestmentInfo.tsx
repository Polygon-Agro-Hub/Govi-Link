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
import { MaterialIcons } from "@expo/vector-icons";
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

type FormData = {
  landinfo?: LandInfoData;
};
type LandInfoData = {
  cultivationLandsDescription: string;
  // images?: {
  //   [parentKey: string]: string[]; 
  // };
};
const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  required = false,
  error,
  keyboardType = "default",
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  keyboardType?: any;
}) => (
  <View className="mb-4">
    <Text className="text-sm text-[#070707] mb-2">
      {label} {required && <Text className="text-black">*</Text>}
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


  const [isNextEnabled, setIsNextEnabled] = useState(false);


  console.log("finance", formData);

  const banks = banksData.map((bank) => ({
    id: bank.ID,
    name: bank.name,
  }));
  useEffect(() => {
    const requiredFields: (keyof FormData)[] = [

    ];

    const allFilled = requiredFields.every((key) => {
      const value = formData[key];
      return (
        value !== null && value !== undefined && value.toString().trim() !== ""
      );
    });

    const hasErrors = Object.keys(errors).length > 0;

    setIsNextEnabled(allFilled && !hasErrors);
  }, [formData, errors]);


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

      await AsyncStorage.setItem(
        `${jobId}`,
        JSON.stringify(updatedFormData)
      );

      console.log("FormData saved:", updatedFormData);
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          const savedData = await AsyncStorage.getItem(
            `${jobId}`
          );
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
    key: keyof typeof formData,
    text: string,
    rules: ValidationRule
  ) => {
    console.log("hit sfsf");
    const { value, error } = validateAndFormat(text, rules, t, formData, key);
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: error || "" }));

    if (!error) {
      updateFormData({ [key]: value });
    }
  };

  const handleNext = () => {
    const requiredFields: (keyof FormData)[] = [

    ];
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
          <Input
            label={t("InspectionForm.Account Holder’s Name")}
            placeholder="----"
            value={formData.accountholderName}
            onChangeText={(text) =>
              handleFieldChange("accountholderName", text, {
                required: true,
                type: "accountholderName",
              })
            }
            required
            error={errors.accountholderName}
          />


<View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Provide brief description to reach the cultivation land")} *
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
                  // Remove leading spaces
                  let formattedText = text.replace(/^\s+/, "");

                  // Capitalize first letter
                  if (formattedText.length > 0) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }

                  // Update state
                  setFormData((prev: FormData) => ({
                    ...prev,
                    landinfo: {
                      ...prev.landinfo,
                      cultivationLandsDescription: formattedText,
                    },
                  }));

                  // Validation
                  let error = "";
                  if (!formattedText || formattedText.trim() === "") {
                    error = t("Error.cultivationLandsDescription is required");
                  }
                  setErrors((prev) => ({ ...prev, cultivationLandsDescription: error }));

                  // Save to AsyncStorage
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

export default LandInfo;
