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
import { AntDesign, FontAwesome } from "@expo/vector-icons";
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

const ErrorMessage = ({ message }: { message: string }) => (
  <View className="flex-row items-center mt-1 ml-1 gap-1">
    <FontAwesome name="exclamation-triangle" size={14} color="#EF4444" />
    <Text className="text-red-500 text-sm ml-1">{message}</Text>
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
          <View className="bg-white w-64 rounded-2xl overflow-hidden">
            {["Yes", "No"].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-3"
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
          <AntDesign name="down" size={20} color="#838B8C" />
        </TouchableOpacity>
      </View>
    </>
  );
};

type CroppingSystemsProps = {
  navigation: any;
};

const isOpportunitySelectionValid = (
  opportunity: string[],
  otherOpportunity: string,
): boolean => {
  const nonOtherSelected = opportunity.filter((o) => o !== "Other").length > 0;
  const otherFilledIn =
    opportunity.includes("Other") && !!otherOpportunity?.trim();
  return nonOtherSelected || otherFilledIn;
};

const getOpportunityError = (
  opportunity: string[],
  otherOpportunity: string,
  t: (key: string) => string,
): string => {
  if (opportunity.length === 0) {
    return t("Error.Please select at least one opportunity to go for");
  }
  if (opportunity.includes("Other") && !otherOpportunity?.trim()) {
    return t("Error.Please specify the other opportunity to go for");
  }
  const nonOtherSelected = opportunity.filter((o) => o !== "Other").length > 0;
  if (!nonOtherSelected && !opportunity.includes("Other")) {
    return t("Error.Please select at least one opportunity to go for");
  }
  return "";
};

const CroppingSystems: React.FC<CroppingSystemsProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "CroppingSystems">>();
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();
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
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      updateLastScreen(requestId, "CroppingSystems");
    }, [requestId]),
  );

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;

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

            const restoredErrors: Record<string, string> = {};

            if (
              !isOpportunitySelectionValid(
                normalizedData.opportunity,
                normalizedData.otherOpportunity || "",
              )
            ) {
              restoredErrors.opportunity = getOpportunityError(
                normalizedData.opportunity,
                normalizedData.otherOpportunity || "",
                t,
              );
            }

            if (!normalizedData.hasKnowlage) {
              restoredErrors.hasKnowlage = t(
                "Error.Knowledge field is required",
              );
            }

            if (!normalizedData.prevExperince) {
              restoredErrors.prevExperince = t(
                "Error.Previous experience is required",
              );
            }

            if (!normalizedData.opinion?.trim()) {
              restoredErrors.opinion = t(
                "Error.General opinion of your friends is required",
              );
            }

            setErrors(restoredErrors);
          } else {
            setIsExistingData(false);
          }
          setIsDataLoaded(true);
        } catch (error) {
          console.error(
            "Failed to load cropping systems info from SQLite:",
            error,
          );
          setIsDataLoaded(true);
        }
      };

      loadData();
    }, [requestId]),
  );

  useEffect(() => {
    if (!isDataLoaded) return;

    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          await saveCroppingInfo(Number(requestId), formData);
        } catch (err) {
          console.error("Error auto-saving cropping systems info:", err);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, requestId, isDataLoaded]);

  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error !== "");

    if (hasErrors) {
      setIsNextEnabled(false);
      return;
    }

    const isOpportunityValid = isOpportunitySelectionValid(
      formData.opportunity ?? [],
      formData.otherOpportunity ?? "",
    );

    const isKnowledgeValid =
      formData.hasKnowlage === "Yes" || formData.hasKnowlage === "No";

    const isExperienceValid = !!formData.prevExperince;
    const isOpinionValid = !!formData.opinion?.trim();

    setIsNextEnabled(
      isOpportunityValid &&
        isKnowledgeValid &&
        isExperienceValid &&
        isOpinionValid,
    );
  }, [formData, errors]);

  const updateFormData = (updates: Partial<CroppingSystemsData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    updateFormData({ [key]: value } as any);

    if (key === "hasKnowlage") {
      setErrors((prev) => ({ ...prev, hasKnowlage: "" }));
    }
  };

  const handleOpportunityToggle = (option: string) => {
    setFormData((prev) => {
      const prevOptions = prev.opportunity || [];
      const isSelected = prevOptions.includes(option);

      const updatedOptions = isSelected
        ? prevOptions.filter((o) => o !== option)
        : [...prevOptions, option];

      const otherOpportunity =
        option === "Other" && isSelected ? "" : (prev.otherOpportunity ?? "");

      const errorMsg = isOpportunitySelectionValid(
        updatedOptions,
        otherOpportunity,
      )
        ? ""
        : getOpportunityError(updatedOptions, otherOpportunity, t);

      setErrors((prevErr) => ({ ...prevErr, opportunity: errorMsg }));

      return {
        ...prev,
        opportunity: updatedOptions,
        otherOpportunity,
      };
    });
  };

  const handleOtherOpportunityChange = (text: string) => {
    const trimmedText = text.replace(/^\s+/, "");

    updateFormData({ otherOpportunity: trimmedText });

    const opportunities = formData.opportunity || [];
    const errorMsg = isOpportunitySelectionValid(opportunities, trimmedText)
      ? ""
      : getOpportunityError(opportunities, trimmedText, t);

    setErrors((prev) => ({ ...prev, opportunity: errorMsg }));
  };

  const handleExperienceSelect = (item: string) => {
    updateFormData({ prevExperince: item });
    setExperienceModalVisible(false);

    setErrors((prev) => ({ ...prev, prevExperince: "" }));
  };

  const handleOpinionChange = (text: string) => {
    let formattedText = text.replace(/^\s+/, "");

    if (formattedText.length > 0 && !text.startsWith("\n")) {
      formattedText =
        formattedText.charAt(0).toUpperCase() + formattedText.slice(1);
    }

    updateFormData({ opinion: formattedText });

    let error = "";
    if (!formattedText || formattedText.trim() === "") {
      error = t("Error.General opinion of your friends is required");
    }
    setErrors((prev) => ({
      ...prev,
      opinion: error,
    }));
  };

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: CroppingSystemsData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      const apiFormData = new FormData();
      apiFormData.append("reqId", reqId.toString());
      apiFormData.append("tableName", tableName);

      const yesNoToInt = (val: any) =>
        val === "Yes" ? "1" : val === "No" ? "0" : null;

      const appendIfNotNull = (key: string, value: any) => {
        if (value !== null && value !== undefined) {
          apiFormData.append(key, value);
        }
      };

      appendIfNotNull("hasKnowlage", yesNoToInt(data.hasKnowlage));

      if (data.opportunity && data.opportunity.length > 0) {
        const filteredOpportunities = data.opportunity.filter(
          (item) => item !== "Other",
        );
        if (filteredOpportunities.length > 0) {
          apiFormData.append(
            "opportunity",
            JSON.stringify(filteredOpportunities),
          );
        }
      }

      if (data.otherOpportunity) {
        apiFormData.append("otherOpportunity", data.otherOpportunity);
      }
      if (data.prevExperince) {
        apiFormData.append("prevExperince", data.prevExperince);
      }
      if (data.opinion) {
        apiFormData.append("opinion", data.opinion);
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
        return true;
      } else {
        console.error(` ${tableName} save failed:`, response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error(` Error saving ${tableName}:`, error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return false;
    }
  };

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    if (
      !isOpportunitySelectionValid(
        formData.opportunity ?? [],
        formData.otherOpportunity ?? "",
      )
    ) {
      validationErrors.opportunity = getOpportunityError(
        formData.opportunity ?? [],
        formData.otherOpportunity ?? "",
        t,
      );
    }

    if (!formData.hasKnowlage) {
      validationErrors.hasKnowlage = t("Error.Knowledge field is required");
    }

    if (!formData.prevExperince) {
      validationErrors.prevExperince = t(
        "Error.Previous experience is required",
      );
    }

    if (!formData.opinion?.trim()) {
      validationErrors.opinion = t(
        "Error.General opinion of your friends is required",
      );
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
      console.error("❌ requestId is missing!");
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    const reqId = Number(requestId);

    if (isNaN(reqId) || reqId <= 0) {
      console.error("❌ Invalid requestId:", requestId);
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
        "inspectioncropping",
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
                navigation.navigate("ProfitRisk", {
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
              text: t("Main.ok"),
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
            text: t("Main.ok"),
          },
        ],
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
      handleBackPress,
    );

    return () => subscription.remove();
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
      keyboardVerticalOffset={Platform.OS === "android" ? -200 : 0}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
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

          <View className="mt-2">
            <Text className="text-sm text-[#070707] mb-4">
              {t("InspectionForm.An opportunity to go for")}{" "}
              <Text className="text-black">*</Text>
            </Text>

            {[
              "Inter cropping",
              "Mixed cropping",
              "Multistoreyed cropping",
              "Relay Cropping",
              "Crop Rotation",
              "Other",
            ].map((option) => {
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
              <TextInput
                placeholder={t("InspectionForm.--Mention Other--")}
                placeholderTextColor="#838B8C"
                className="bg-[#F6F6F6] px-4 h-[50px] rounded-3xl text-black mb-2"
                value={formData.otherOpportunity || ""}
                onChangeText={handleOtherOpportunityChange}
              />
            )}

            {errors.opportunity && (
              <ErrorMessage message={errors.opportunity} />
            )}
          </View>

          <YesNoSelect
            label={t(
              "InspectionForm.Does the farmer has the knowledge on cropping systems management",
            )}
            required
            value={formData.hasKnowlage || null}
            visible={yesNoModalVisible && activeYesNoField === "hasKnowlage"}
            onOpen={() => {
              setActiveYesNoField("hasKnowlage");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) => handleyesNOFieldChange("hasKnowlage", value)}
          />
          {errors.hasKnowlage && <ErrorMessage message={errors.hasKnowlage} />}

          <View className="mt-2">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.What is your previous experiences with regard to the crop/cropping systems that the farmer is planning to choose",
              )}{" "}
              <Text className="text-black">*</Text>
            </Text>

            <TouchableOpacity
              className="bg-[#F6F6F6] px-4 py-4 flex-row items-center justify-between rounded-full"
              onPress={() => {
                setExperienceModalVisible(true);
              }}
            >
              <Text
                className={
                  formData.prevExperince ? "text-black" : "text-[#A3A3A3]"
                }
              >
                {formData.prevExperince
                  ? t(`InspectionForm.${formData.prevExperince}`)
                  : t("InspectionForm.--Select From Here--")}
              </Text>
              <AntDesign name="down" size={20} color="#838B8C" />
            </TouchableOpacity>
            {errors.prevExperince && (
              <ErrorMessage message={errors.prevExperince} />
            )}
          </View>

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.What is the general opinion of your friends, neighborhood farmers on proposed crop / cropping systems",
              )}{" "}
              *
            </Text>
            <View
              className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${errors.opinion ? "border border-red-500" : ""}`}
            >
              <TextInput
                placeholder={t("InspectionForm.Type here...")}
                value={formData.opinion || ""}
                onChangeText={handleOpinionChange}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            {errors.opinion && <ErrorMessage message={errors.opinion} />}
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

      {/* Experience Modal */}
      <Modal transparent animationType="fade" visible={experienceModalVisible}>
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => {
            setExperienceModalVisible(false);
          }}
        >
          <View className="bg-white w-80 rounded-2xl overflow-hidden">
            {[
              "No previous experience",
              "Have grown this crop once or twice",
              "Have grown this crop multiple seasons",
              "Have been cultivating this crop for many years",
            ].map((item, index, arr) => (
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
