import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  BackHandler,
} from "react-native";
import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveCroppingInfo,
  getCroppingInfo,
  CroppingSystemsData,
} from "@/database/inspectioncropping";
import { updateLastScreen } from "@/database/inspectionprogress";

interface ValidationRule {
  required?: boolean;
  type?: string;
}

const validateField = (
  value: any,
  rules: ValidationRule,
  t: any,
  formData: CroppingSystemsData,
  fieldName: keyof CroppingSystemsData
): { value: any; error: string } => {
  let error = "";

  if (rules.type === "opportunity") {
    const opportunities = value || [];
    const otherOpportunity = formData.otherOpportunity || "";

    if (rules.required && opportunities.length === 0) {
      error = t("Error.PleaseSelectAtLeastOneOpportunityToGoFor");
    } else if (opportunities.includes("Other") && !otherOpportunity.trim()) {
      error = t("Error.PleaseSpecifyTheOtherOpportunityToGoFor");
    }
    return { value: opportunities, error };
  }

  if (rules.type === "otherOpportunity") {
    const opportunities = formData.opportunity || [];
    const trimmedValue = value.replace(/^\s+/, "");

    if (opportunities.includes("Other") && rules.required && !trimmedValue) {
      error = t("Error.PleaseSpecifyTheOtherOpportunityToGoFor");
    }
    return { value: trimmedValue, error };
  }

  if (rules.type === "hasKnowlage") {
    if (rules.required && !value) {
      error = t("Error.KnowledgeFieldIsRequired");
    }
    return { value, error };
  }

  if (rules.type === "prevExperince") {
    if (rules.required && !value) {
      error = t("Error.PreviousExperienceIsRequired");
    }
    return { value, error };
  }

  if (rules.type === "opinion") {
    const trimmedValue = value.replace(/^\s+/, "");
    let formattedValue = trimmedValue;

    if (formattedValue.length > 0 && !value.startsWith("\n")) {
      formattedValue = formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1);
    }

    if (rules.required && !formattedValue.trim()) {
      error = t("Error.GeneralOpinionOfYourFriendsIsRequired");
    }
    return { value: formattedValue, error };
  }

  return { value, error };
};

const validateAllFields = (
  data: CroppingSystemsData,
  t: any
): Record<string, string> => {
  const fieldRules: Array<{ key: keyof CroppingSystemsData; rules: ValidationRule }> = [
    { key: "opportunity", rules: { required: true, type: "opportunity" } },
    { key: "otherOpportunity", rules: { required: true, type: "otherOpportunity" } },
    { key: "hasKnowlage", rules: { required: true, type: "hasKnowlage" } },
    { key: "prevExperince", rules: { required: true, type: "prevExperince" } },
    { key: "opinion", rules: { required: true, type: "opinion" } },
  ];

  const errors: Record<string, string> = {};

  for (const { key, rules } of fieldRules) {
    const raw = data[key];
    const { error } = validateField(raw, rules, t, data, key);
    if (error) errors[key] = error;
  }

  return errors;
};

type CroppingSystemsProps = {
  navigation: any;
};

const CroppingSystems: React.FC<CroppingSystemsProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "CroppingSystems">>();
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState<CroppingSystemsData>({
    opportunity: [],
    otherOpportunity: "",
    hasKnowlage: undefined,
    prevExperince: "",
    opinion: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [experienceModalVisible, setExperienceModalVisible] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      if (requestId) {
        try {
          saveCroppingInfo(Number(requestId), formData);
        } catch (err) {
          console.error("Error auto-saving cropping systems info:", err);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, requestId, isLoaded]);

  useFocusEffect(
    useCallback(() => {
      updateLastScreen(requestId, "CroppingSystems");
    }, [requestId]),
  );

  useFocusEffect(
    useCallback(() => {
      setIsLoaded(false);

      const loadData = async () => {
        if (!requestId) {
          setIsLoaded(true);
          return;
        }

        try {
          const reqId = Number(requestId);
          const localData = await getCroppingInfo(reqId);

          if (localData) {
            const normalizedData: CroppingSystemsData = {
              opportunity: Array.isArray(localData.opportunity)
                ? localData.opportunity
                : [],
              otherOpportunity: localData.otherOpportunity || "",
              hasKnowlage: localData.hasKnowlage,
              prevExperince: localData.prevExperince || "",
              opinion: localData.opinion || "",
            };

            setFormData(normalizedData);
            setIsExistingData(true);
          } else {
            setIsExistingData(false);
          }
        } catch (error) {
          console.error("Failed to load cropping systems info from SQLite:", error);
        } finally {
          setIsLoaded(true);
        }
      };

      loadData();
    }, [requestId]),
  );

  // Enable/disable next button based on validation
  useEffect(() => {
    if (!isLoaded) return;

    const requiredFields: (keyof CroppingSystemsData)[] = [
      "opportunity",
      "hasKnowlage",
      "prevExperince",
      "opinion",
    ];

    const allFilled = requiredFields.every((key) => {
      const value = formData[key];
      if (key === "opportunity") {
        const opportunities = value as string[];
        if (opportunities.length === 0) return false;
        if (opportunities.includes("Other") && !formData.otherOpportunity?.trim()) {
          return false;
        }
        return true;
      }
      if (key === "hasKnowlage") {
        return value !== undefined && value !== null;
      }
      if (key === "opinion") {
        return value && value.toString().trim() !== "";
      }
      return value && value.toString().trim() !== "";
    });

    const hasErrors = Object.keys(errors).length > 0;
    setIsNextEnabled(allFilled && !hasErrors);
  }, [formData, errors, isLoaded]);

  const updateFormData = (updates: Partial<CroppingSystemsData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleFieldChange = (
    key: keyof CroppingSystemsData,
    value: any,
    rules: ValidationRule
  ) => {
    const { value: validatedValue, error } = validateField(
      value,
      rules,
      t,
      formData,
      key
    );

    updateFormData({ [key]: validatedValue });

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[key] = error;
      } else {
        delete newErrors[key];
      }

      // Handle cross-field validation for opportunity and otherOpportunity
      if (key === "opportunity" || key === "otherOpportunity") {
        const opportunityRules = { required: true, type: "opportunity" };
        const otherOpportunityRules = { required: true, type: "otherOpportunity" };

        const newFormData = { ...formData, [key]: validatedValue };

        const { error: oppError } = validateField(
          key === "opportunity" ? validatedValue : newFormData.opportunity,
          opportunityRules,
          t,
          newFormData,
          "opportunity"
        );

        const { error: otherError } = validateField(
          key === "otherOpportunity" ? validatedValue : newFormData.otherOpportunity,
          otherOpportunityRules,
          t,
          newFormData,
          "otherOpportunity"
        );

        if (oppError) newErrors.opportunity = oppError;
        else delete newErrors.opportunity;

        if (otherError) newErrors.otherOpportunity = otherError;
        else delete newErrors.otherOpportunity;
      }

      return newErrors;
    });
  };

  const handleOpportunityToggle = (option: string) => {
    const prevOptions = formData.opportunity || [];
    const isSelected = prevOptions.includes(option);

    let updatedOptions = isSelected
      ? prevOptions.filter((o) => o !== option)
      : [...prevOptions, option];

    let otherOpportunity = formData.otherOpportunity;

    if (option === "Other" && isSelected) {
      otherOpportunity = "";
    }

    handleFieldChange("opportunity", updatedOptions, { required: true, type: "opportunity" });

    if (option === "Other" && isSelected) {
      handleFieldChange("otherOpportunity", "", { required: true, type: "otherOpportunity" });
    }
  };

  const handleOtherOpportunityChange = (text: string) => {
    handleFieldChange("otherOpportunity", text, { required: true, type: "otherOpportunity" });
  };

  const handleYesNoSelect = (key: string, value: "Yes" | "No") => {
    handleFieldChange(key as keyof CroppingSystemsData, value, { required: true, type: key });
    setYesNoModalVisible(false);
    setActiveYesNoField(null);
  };

  const handleExperienceSelect = (item: string) => {
    handleFieldChange("prevExperince", item, { required: true, type: "prevExperince" });
    setExperienceModalVisible(false);
  };

  const handleOpinionChange = (text: string) => {
    handleFieldChange("opinion", text, { required: true, type: "opinion" });
  };

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: CroppingSystemsData,
    isUpdate: boolean
  ): Promise<boolean> => {
    try {
      const apiFormData = new FormData();
      apiFormData.append("reqId", reqId.toString());
      apiFormData.append("tableName", tableName);

      const yesNoToInt = (val: any) =>
        val === "Yes" ? "1" : val === "No" ? "0" : null;

      const appendIfNotNull = (key: string, value: any) => {
        if (value !== null && value !== undefined && value !== "") {
          apiFormData.append(key, value);
        }
      };

      appendIfNotNull("hasKnowlage", yesNoToInt(data.hasKnowlage));

      if (data.opportunity && data.opportunity.length > 0) {
        const filteredOpportunities = data.opportunity.filter(
          (item) => item !== "Other"
        );
        if (filteredOpportunities.length > 0) {
          apiFormData.append(
            "opportunity",
            JSON.stringify(filteredOpportunities)
          );
        }
      }

      if (data.otherOpportunity && data.otherOpportunity.trim()) {
        apiFormData.append("otherOpportunity", data.otherOpportunity);
      }

      if (data.prevExperince) {
        apiFormData.append("prevExperince", data.prevExperince);
      }

      if (data.opinion && data.opinion.trim()) {
        apiFormData.append("opinion", data.opinion);
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        apiFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data.success;
    } catch (error: any) {
      console.error(`Error saving ${tableName}:`, error);
      return false;
    }
  };

  const handleNext = async () => {
    const validationErrors = validateAllFields(formData, t);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert(
        t("Error.ValidationError"),
        "• " + Object.values(validationErrors).join("\n• "),
        [{ text: t("Main.OK") }]
      );
      return;
    }

    if (!requestId) {
      Alert.alert(t("Error.Error"), "Request ID is missing", [
        { text: t("Main.OK") },
      ]);
      return;
    }

    const reqId = Number(requestId);
    if (isNaN(reqId) || reqId <= 0) {
      Alert.alert(t("Error.Error"), "Invalid request ID", [
        { text: t("Main.OK") },
      ]);
      return;
    }

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.PleaseWait..."),
      [],
      { cancelable: false }
    );

    const saved = await saveToBackend(
      reqId,
      "inspectioncropping",
      formData,
      isExistingData
    );

    if (saved) {
      setIsExistingData(true);
      Alert.alert(
        t("Main.Success"),
        t("InspectionForm.DataSavedSuccessfully"),
        [
          {
            text: t("Main.OK"),
            onPress: () => {
              navigation.navigate("ProfitRisk", {
                requestNumber,
                requestId,
              });
            },
          },
        ]
      );
    } else {
      Alert.alert(
        t("Main.Warning"),
        t("InspectionForm.CouldNotSaveToServerDataSavedLocally"),
        [{ text: t("Main.OK") }]
      );
    }
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

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate("Main", {
        screen: "MainTabs",
        params: { screen: "CapitalRequests" },
      });
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => subscription.remove();
  }, [navigation]);

  const getErrorMessage = (field: string): string => {
    const error = errors[field];
    return error || "";
  };

  const opportunityOptions = [
    "Inter cropping",
    "Mixed cropping",
    "Multistoreyed cropping",
    "Relay Cropping",
    "Crop Rotation",
    "Other",
  ];

  const experienceOptions = [
    "No previous experience",
    "Have grown this crop once or twice",
    "Have grown this crop multiple seasons",
    "Have been cultivating this crop for many years",
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
      keyboardVerticalOffset={Platform.OS === "android" ? -200 : 0}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        {/* Tabs */}
        <FormTabs
          activeKey="Cropping Systems"
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

          {/* Opportunity Section */}
          <View className="mt-2">
            <Text className="text-sm text-[#070707] mb-4">
              {t("InspectionForm.AnOpportunityToGoFor")}{" "}
              <Text className="text-black">*</Text>
            </Text>

            {opportunityOptions.map((option) => {
              const opportunityArray = formData.opportunity || [];
              const selected = opportunityArray.includes(option);

              return (
                <TouchableOpacity
                  key={option}
                  className="flex-row items-center mb-4"
                  activeOpacity={0.7}
                  onPress={() => handleOpportunityToggle(option)}
                >
                  <Checkbox
                    value={selected}
                    onValueChange={() => handleOpportunityToggle(option)}
                    color={selected ? "#000" : undefined}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: selected ? "#000" : "#D1D1D1",
                    }}
                  />
                  <Text className="ml-2 text-black">
                    {t(`InspectionForm.${option}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {formData.opportunity?.includes("Other") && (
              <View
                className={`bg-[#F6F6F6] rounded-3xl h-[50px] justify-center ${errors.otherOpportunity ? "border border-red-500" : ""
                  }`}
              >
                <TextInput
                  placeholder={t("InspectionForm.MentionOther")}
                  placeholderTextColor="#838B8C"
                  className="px-5 text-base text-black"
                  value={formData.otherOpportunity || ""}
                  onChangeText={handleOtherOpportunityChange}
                />
              </View>
            )}

            {getErrorMessage("opportunity") && (
              <View className="flex-row items-center mt-1 ml-1 gap-1">
                <FontAwesome name="exclamation-triangle" size={14} color="#EF4444" />
                <Text className="text-red-500 text-sm ml-1 flex-1">
                  {getErrorMessage("opportunity")}
                </Text>
              </View>
            )}
          </View>

          {/* Knowledge Field - Yes/No */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.DoesTheFarmerHasTheKnowledgeOnCroppingSystemsManagement")}{" "}
              <Text className="text-black">*</Text>
            </Text>

            <TouchableOpacity
              className={`bg-[#F6F6F6] rounded-full px-4 h-[50px] flex-row items-center justify-between ${errors.hasKnowlage ? "border border-red-500" : ""
                }`}
              onPress={() => {
                setActiveYesNoField("hasKnowlage");
                setYesNoModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              {formData.hasKnowlage ? (
                <Text className="text-black">{t(`InspectionForm.${formData.hasKnowlage}`)}</Text>
              ) : (
                <Text className="text-[#838B8C]">
                  {t("InspectionForm.SelectFromHere")}
                </Text>
              )}
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>

            {getErrorMessage("hasKnowlage") && (
              <View className="flex-row items-center mt-1 ml-1 gap-1">
                <FontAwesome name="exclamation-triangle" size={14} color="#EF4444" />
                <Text className="text-red-500 text-sm ml-1 flex-1">
                  {getErrorMessage("hasKnowlage")}
                </Text>
              </View>
            )}
          </View>

          {/* Previous Experience */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.WhatIsYourPreviousExperiencesWithRegardToTheCropCroppingSystemsThatTheFarmerIsPlanningToChoose")}{" "}
              <Text className="text-black">*</Text>
            </Text>

            <TouchableOpacity
              className={`bg-[#F6F6F6] px-4 h-[50px] flex-row items-center justify-between rounded-full ${errors.prevExperince ? "border border-red-500" : ""
                }`}
              onPress={() => {
                setExperienceModalVisible(true);
              }}
            >
              <View className="flex-1 mr-2">
                <Text
                  className={
                    formData.prevExperince ? "text-black" : "text-[#A3A3A3]"
                  }
                  numberOfLines={2}
                >
                  {formData.prevExperince
                    ? t(`InspectionForm.${formData.prevExperince}`)
                    : t("InspectionForm.--Select From Here--")}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>

            {getErrorMessage("prevExperince") && (
              <View className="flex-row items-center mt-1 ml-1 gap-1">
                <FontAwesome name="exclamation-triangle" size={14} color="#EF4444" />
                <Text className="text-red-500 text-sm ml-1 flex-1">
                  {getErrorMessage("prevExperince")}
                </Text>
              </View>
            )}
          </View>

          {/* Opinion */}
          <View className="mt-4 mb-8">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.WhatIsTheGeneralOpinionOfYourFriendsNeighborhoodFarmersOnProposedCropCroppingSystems")}{" "}
              <Text className="text-black">*</Text>
            </Text>
            <View
              className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${errors.opinion ? "border border-red-500" : ""
                }`}
            >
              <TextInput
                placeholder={t("InspectionForm.TypeHere...")}
                placeholderTextColor="#838B8C"
                value={formData.opinion || ""}
                onChangeText={handleOpinionChange}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
                className="text-black"
              />
            </View>
            {getErrorMessage("opinion") && (
              <View className="flex-row items-center mt-1 ml-1 gap-1">
                <FontAwesome name="exclamation-triangle" size={14} color="#EF4444" />
                <Text className="text-red-500 text-sm ml-1 flex-1">
                  {getErrorMessage("opinion")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <FormFooterButton
          exitText={t("InspectionForm.Back")}
          nextText={t("InspectionForm.Next")}
          isNextEnabled={isNextEnabled}
          onExit={() =>
            navigation.navigate("CultivationInfo", {
              requestNumber,
              requestId,
            })
          }
          onNext={handleNext}
        />
      </View>

      {/* Yes/No Modal */}
      <Modal transparent visible={yesNoModalVisible} animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => {
            setYesNoModalVisible(false);
            setActiveYesNoField(null);
          }}
        >
          <View className="bg-white w-64 rounded-2xl overflow-hidden">
            {["Yes", "No"].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-3"
                  onPress={() => handleYesNoSelect("hasKnowlage", item as "Yes" | "No")}
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

      {/* Experience Modal */}
      <Modal transparent animationType="fade" visible={experienceModalVisible}>
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => {
            setExperienceModalVisible(false);
          }}
        >
          <View className="bg-white w-10/12 rounded-2xl overflow-hidden">
            {experienceOptions.map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4"
                  onPress={() => handleExperienceSelect(item)}
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
    </KeyboardAvoidingView>
  );
};

export default CroppingSystems;