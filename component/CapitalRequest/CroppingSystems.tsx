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

type CroppingSystemsData = {
  opportunity?: string[];
  otherOpportunity?: string;
  hasKnowlage?: "Yes" | "No";
  prevExperince?: string;
  opinion?: string;
};

type FormData = {
  inspectioncropping?: CroppingSystemsData;
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

type CroppingSystemsProps = {
  navigation: any;
};

const CroppingSystems: React.FC<CroppingSystemsProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "CroppingSystems">>();
  const { requestNumber, requestId } = route.params; // ✅ Add requestId
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExistingData, setIsExistingData] = useState(false); // ✅ Add this

  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [overallSoilFertilityVisible, setOverallSoilFertilityVisible] =
    useState(false);
  console.log("finance", formData);

  useEffect(() => {
    const cs = formData?.inspectioncropping ?? {};

    const isOpportunityValid =
      cs.opportunity?.length > 0 &&
      (!cs.opportunity.includes("Other") || cs.otherOpportunity?.trim());

    const isKnowledgeValid =
      cs.hasKnowlage === "Yes" || cs.hasKnowlage === "No";

    const isExperienceValid = !!cs.prevExperince;

    const isOpinionValid = !!cs.opinion?.trim();

    const hasErrors = Object.values(errors).some(Boolean);

    setIsNextEnabled(
      isOpportunityValid &&
        isKnowledgeValid &&
        isExperienceValid &&
        isOpinionValid &&
        !hasErrors,
    );
  }, [formData, errors]);

  let jobId = requestNumber;
  console.log("jobid", jobId);

  const updateFormData = async (updates: Partial<CroppingSystemsData>) => {
    try {
      const updatedFormData = {
        ...formData,
        inspectioncropping: {
          ...formData.inspectioncropping,
          ...updates,
        },
      };

      setFormData(updatedFormData);
      await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };

  const fetchInspectionData = async (
    reqId: number,
  ): Promise<CroppingSystemsData | null> => {
    try {
      console.log(`🔍 Fetching cropping systems data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectioncropping",
          },
        },
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(
          `✅ Fetched existing cropping systems data:`,
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

        return {
          opportunity: safeJsonParse(data.opportunity),
          otherOpportunity: data.otherOpportunity || "",
          hasKnowlage: boolToYesNo(data.hasKnowlage),
          prevExperince: data.prevExperince || "",
          opinion: data.opinion || "",
        };
      }

      console.log(
        `📭 No existing cropping systems data found for reqId: ${reqId}`,
      );
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching cropping systems data:`, error);
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
    data: CroppingSystemsData,
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

      // Yes/No fields
      const yesNoToInt = (val: any) =>
        val === "Yes" ? "1" : val === "No" ? "0" : null;

      const appendIfNotNull = (key: string, value: any) => {
        if (value !== null && value !== undefined) {
          apiFormData.append(key, value);
        }
      };

      appendIfNotNull("hasKnowlage", yesNoToInt(data.hasKnowlage));

      // JSON array field
      if (data.opportunity && data.opportunity.length > 0) {
        apiFormData.append("opportunity", JSON.stringify(data.opportunity));
      }

      // Text fields
      if (data.otherOpportunity) {
        apiFormData.append("otherOpportunity", data.otherOpportunity);
      }
      if (data.prevExperince) {
        apiFormData.append("prevExperince", data.prevExperince);
      }
      if (data.opinion) {
        apiFormData.append("opinion", data.opinion);
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

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          // First, try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Attempting to fetch cropping systems data from backend for reqId: ${reqId}`,
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded cropping systems data from backend`);

                // Update form with backend data
                const updatedFormData = {
                  ...formData,
                  inspectioncropping: backendData,
                };

                setFormData(updatedFormData);
                setIsExistingData(true);

                // Save to AsyncStorage as backup
                await AsyncStorage.setItem(
                  `${jobId}`,
                  JSON.stringify(updatedFormData),
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
            console.log(`✅ Loaded cropping systems data from AsyncStorage`);
            setFormData(parsedData);
            setIsExistingData(true);
          } else {
            // No data found anywhere - new entry
            setIsExistingData(false);
            console.log("📝 No existing cropping systems data - new entry");
          }
        } catch (e) {
          console.error("Failed to load cropping systems form data", e);
          setIsExistingData(false);
        }
      };

      loadFormData();
    }, [requestId, jobId]),
  );

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};
    const croppingInfo = formData.inspectioncropping;

    // Validate required fields
    if (!croppingInfo?.opportunity || croppingInfo.opportunity.length === 0) {
      validationErrors.opportunity = t(
        "Error.Please select at least one opportunity to go for",
      );
    }
    if (
      croppingInfo?.opportunity?.includes("Other") &&
      !croppingInfo?.otherOpportunity?.trim()
    ) {
      validationErrors.opportunity = t(
        "Error.Please specify the other opportunity to go for",
      );
    }
    if (!croppingInfo?.hasKnowlage) {
      validationErrors.hasKnowlage = t("Error.Knowledge field is required");
    }
    if (!croppingInfo?.prevExperince) {
      validationErrors.prevExperince = t(
        "Error.Previous experience is required",
      );
    }
    if (!croppingInfo?.opinion?.trim()) {
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
        "inspectioncropping",
        formData.inspectioncropping!,
        isExistingData,
      );

      if (saved) {
        console.log("✅ Cropping systems info saved successfully to backend");
        setIsExistingData(true);

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("ProfitRisk", {
                  formData,
                  requestNumber,
                  requestId: route.params.requestId,
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
                navigation.navigate("ProfitRisk", {
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
              navigation.navigate("ProfitRisk", {
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

  const handleyesNOFieldChange = async (key: string, value: "Yes" | "No") => {
    const updatedFormData = {
      ...formData,
      inspectioncropping: {
        ...formData.inspectioncropping,
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Tabs */}
        <FormTabs activeKey="Cropping Systems" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          <View className="mt-2">
            <Text className="text-sm text-[#070707] mb-4">
              {t("InspectionForm.An opportunity to go for")}{" "}
              <Text className="text-red-500">*</Text>
            </Text>

            {[
              "Inter cropping",
              "Mixed cropping",
              "Multistoreyed cropping",
              "Relay Cropping",
              "Crop Rotation",
              "Other",
            ].map((option) => {
              const selected =
                formData.inspectioncropping?.opportunity?.includes(option) ||
                false;

              return (
                <View key={option} className="flex-row items-center mb-4">
                  <Checkbox
                    value={selected}
                    onValueChange={async () => {
                      let updatedOptions =
                        formData.inspectioncropping?.opportunity || [];

                      if (selected) {
                        updatedOptions = updatedOptions.filter(
                          (o: any) => o !== option,
                        );
                      } else {
                        updatedOptions = [...updatedOptions, option];
                      }

                      const updatedFormData = {
                        ...formData,
                        inspectioncropping: {
                          ...formData.inspectioncropping,
                          opportunity: updatedOptions,
                          otherOpportunity:
                            option === "Other" &&
                            !updatedOptions.includes("Other")
                              ? ""
                              : formData.inspectioncropping?.otherOpportunity,
                        },
                      };

                      setFormData(updatedFormData);

                      let errorMsg = "";

                      const opportunity =
                        updatedFormData.inspectioncropping.opportunity || [];

                      // Filter out "Other" to see if at least one real option is selected
                      const validopportunity = opportunity.filter(
                        (source: string) => source !== "Other",
                      );

                      if (validopportunity.length === 0) {
                        // No real water source selected
                        errorMsg = t(
                          "Error.Please select at least one opportunity to go for",
                        );
                      } else if (
                        opportunity.includes("Other") &&
                        !updatedFormData.inspectioncropping.otherOpportunity?.trim()
                      ) {
                        // "Other" is selected but not specified
                        errorMsg = t(
                          "Error.Please specify the other opportunity to go for",
                        );
                      }

                      setErrors((prev) => ({
                        ...prev,
                        opportunity: errorMsg,
                      }));

                      try {
                        await AsyncStorage.setItem(
                          `${jobId}`,
                          JSON.stringify(updatedFormData),
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

            {formData.inspectioncropping?.opportunity?.includes("Other") && (
              <TextInput
                placeholder={t("InspectionForm.--Mention Other--")}
                placeholderTextColor="#838B8C"
                className="bg-[#F6F6F6] px-4 py-4 rounded-full text-black mb-2"
                value={formData.inspectioncropping?.otherOpportunity || ""}
                onChangeText={async (text) => {
                  const updatedFormData = {
                    ...formData,
                    inspectioncropping: {
                      ...formData.inspectioncropping,
                      otherOpportunity: text,
                    },
                  };
                  setFormData(updatedFormData);
                  let errorMsg = "";
                  const opportunity =
                    updatedFormData.inspectioncropping.opportunity || [];
                  const validopportunity = opportunity.filter(
                    (source: string) => source !== "Other",
                  );

                  if (validopportunity.length === 0) {
                    errorMsg = t(
                      "Error.Please select at least one opportunity to go for",
                    );
                  } else if (opportunity.includes("Other") && !text.trim()) {
                    errorMsg = t(
                      "Error.Please specify the other opportunity to go for",
                    );
                  }

                  setErrors((prev) => ({ ...prev, opportunity: errorMsg }));

                  try {
                    await AsyncStorage.setItem(
                      `${jobId}`,
                      JSON.stringify(updatedFormData),
                    );
                  } catch (e) {
                    console.log("AsyncStorage save failed", e);
                  }
                }}
              />
            )}

            {errors.opportunity ? (
              <Text className="text-red-500 text-sm mt-1">
                {errors.opportunity}
              </Text>
            ) : null}
          </View>

          <YesNoSelect
            label={t(
              "InspectionForm.Does the farmer has the knowledge on cropping systems management",
            )}
            required
            value={formData.inspectioncropping?.hasKnowlage || null}
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

          <View className="mt-2">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.What is your previous experiences with regard to the crop/cropping systems that the farmer is planning to choose",
              )}{" "}
              <Text className="text-red-500">*</Text>
            </Text>

            <TouchableOpacity
              className="bg-[#F6F6F6] px-4 py-4 flex-row items-center justify-between rounded-full"
              onPress={() => {
                setOverallSoilFertilityVisible(true);
                setFormData({
                  ...formData,
                  inspectioncropping: {
                    ...formData.inspectioncropping,
                  },
                });
              }}
            >
              <Text
                className={
                  formData.inspectioncropping?.prevExperince
                    ? "text-black"
                    : "text-[#A3A3A3]"
                }
              >
                {formData.inspectioncropping?.prevExperince
                  ? t(
                      `InspectionForm.${formData.inspectioncropping.prevExperince}`,
                    )
                  : t("InspectionForm.--Select From Here--")}
              </Text>

              {!formData.inspectioncropping?.prevExperince && (
                <AntDesign name="down" size={20} color="#838B8C" />
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t(
                "InspectionForm.What is the general opinion of your friends, neighborhood farmers on proposed crop / cropping systems",
              )}{" "}
              *
            </Text>
            <View
              className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                errors.debts ? "border border-red-500" : ""
              }`}
            >
              <TextInput
                placeholder={t("InspectionForm.Type here...")}
                value={formData.inspectioncropping?.opinion || ""}
                onChangeText={(text) => {
                  let formattedText = text.replace(/^\s+/, "");

                  if (formattedText.length > 0) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }

                  setFormData((prev: FormData) => ({
                    ...prev,
                    inspectioncropping: {
                      ...prev.inspectioncropping,
                      opinion: formattedText,
                    },
                  }));

                  let error = "";
                  if (!formattedText || formattedText.trim() === "") {
                    error = t(
                      "Error.General opinion of your friends is required",
                    );
                  }
                  setErrors((prev) => ({
                    ...prev,
                    opinion: error,
                  }));

                  updateFormData({
                    opinion: formattedText,
                  });
                }}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            {errors.opinion && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.opinion}
              </Text>
            )}
          </View>
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
            {[
              "No previous experience",
              "Have grown this crop once or twice",
              "Have grown this crop multiple seasons",
              "Have been cultivating this crop for many years",
            ].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4"
                  onPress={async () => {
                    const updatedFormData = {
                      ...formData,
                      inspectioncropping: {
                        ...formData.inspectioncropping,
                        prevExperince: item,
                      },
                    };

                    setFormData(updatedFormData);

                    try {
                      await AsyncStorage.setItem(
                        `${jobId}`,
                        JSON.stringify(updatedFormData),
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
    </KeyboardAvoidingView>
  );
};

export default CroppingSystems;
