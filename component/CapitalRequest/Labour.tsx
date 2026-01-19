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
import axios from "axios";
import { environment } from "@/environment/environment";

type FormData = {
  inspectionlabour?: LabourData;
};

type LabourData = {
  isManageFamilyLabour?: "Yes" | "No";
  isFamilyHiredLabourEquipped?: "Yes" | "No";
  hasAdequateAlternativeLabour?: "Yes" | "No";
  areThereMechanizationOptions?: "Yes" | "No";
  isMachineryAvailable?: "Yes" | "No";
  isMachineryAffordable?: "Yes" | "No";
  isMachineryCostEffective?: "Yes" | "No";
};

type LabourProps = {
  navigation: any;
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
const Labour: React.FC<LabourProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "Labour">>();
  const { requestNumber, requestId } = route.params; // ✅ Add requestId
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isExistingData, setIsExistingData] = useState(false); // ✅ Add this
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  console.log("finance", formData);

  useEffect(() => {
    const labour = formData?.inspectionlabour ?? {};

    const hasBaseAnswer =
      labour.isManageFamilyLabour === "Yes" ||
      labour.isManageFamilyLabour === "No";

    let conditionalValid = false;

    if (labour.isManageFamilyLabour === "Yes") {
      conditionalValid =
        labour.isFamilyHiredLabourEquipped === "Yes" ||
        labour.isFamilyHiredLabourEquipped === "No";
    }

    if (labour.isManageFamilyLabour === "No") {
      conditionalValid =
        labour.hasAdequateAlternativeLabour === "Yes" ||
        labour.hasAdequateAlternativeLabour === "No";
    }

    const mechanizationValid =
      labour.areThereMechanizationOptions === "Yes" ||
      labour.areThereMechanizationOptions === "No";

    const machineryAvailableValid =
      labour.isMachineryAvailable === "Yes" ||
      labour.isMachineryAvailable === "No";

    const machineryAffordableValid =
      labour.isMachineryAffordable === "Yes" ||
      labour.isMachineryAffordable === "No";

    const machineryCostEffectiveValid =
      labour.isMachineryCostEffective === "Yes" ||
      labour.isMachineryCostEffective === "No";

    const hasErrors = Object.values(errors).some(Boolean);

    setIsNextEnabled(
      hasBaseAnswer &&
        conditionalValid &&
        mechanizationValid &&
        machineryAvailableValid &&
        machineryAffordableValid &&
        machineryCostEffectiveValid &&
        !hasErrors,
    );
  }, [formData, errors]);

  let jobId = requestNumber;
  console.log("jobid", jobId);

  const updateFormData = async (updates: Partial<LabourData>) => {
    try {
      const updatedFormData = {
        ...formData,
        inspectionlabour: {
          ...formData.inspectionlabour,
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
  ): Promise<LabourData | null> => {
    try {
      console.log(`🔍 Fetching labour data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectionlabour",
          },
        },
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing labour data:`, response.data.data);

        const data = response.data.data;

        // Helper to convert boolean (0/1) to "Yes"/"No"
        const boolToYesNo = (val: any): "Yes" | "No" | undefined => {
          if (val === 1 || val === "1" || val === true) return "Yes";
          if (val === 0 || val === "0" || val === false) return "No";
          return undefined;
        };

        return {
          isManageFamilyLabour: boolToYesNo(data.isManageFamilyLabour),
          isFamilyHiredLabourEquipped: boolToYesNo(
            data.isFamilyHiredLabourEquipped,
          ),
          hasAdequateAlternativeLabour: boolToYesNo(
            data.hasAdequateAlternativeLabour,
          ),
          areThereMechanizationOptions: boolToYesNo(
            data.areThereMechanizationOptions,
          ),
          isMachineryAvailable: boolToYesNo(data.isMachineryAvailable),
          isMachineryAffordable: boolToYesNo(data.isMachineryAffordable),
          isMachineryCostEffective: boolToYesNo(data.isMachineryCostEffective),
        };
      }

      console.log(`📭 No existing labour data found for reqId: ${reqId}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching labour data:`, error);
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
    data: LabourData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName,
      );
      console.log(`📝 reqId being sent:`, reqId);

      // Yes/No fields
      const yesNoToInt = (val: any) =>
        val === "Yes" ? "1" : val === "No" ? "0" : null;

      const transformedData: any = {
        reqId,
        tableName,
      };

      // Base question
      if (data.isManageFamilyLabour !== undefined) {
        transformedData.isManageFamilyLabour = yesNoToInt(
          data.isManageFamilyLabour,
        );
      }

      // Conditional fields based on isManageFamilyLabour
      if (data.isManageFamilyLabour === "Yes") {
        if (data.isFamilyHiredLabourEquipped !== undefined) {
          transformedData.isFamilyHiredLabourEquipped = yesNoToInt(
            data.isFamilyHiredLabourEquipped,
          );
        }
        // Set the other conditional field to null
        transformedData.hasAdequateAlternativeLabour = null;
      } else if (data.isManageFamilyLabour === "No") {
        if (data.hasAdequateAlternativeLabour !== undefined) {
          transformedData.hasAdequateAlternativeLabour = yesNoToInt(
            data.hasAdequateAlternativeLabour,
          );
        }
        // Set the other conditional field to null
        transformedData.isFamilyHiredLabourEquipped = null;
      }

      // Other fields
      if (data.areThereMechanizationOptions !== undefined) {
        transformedData.areThereMechanizationOptions = yesNoToInt(
          data.areThereMechanizationOptions,
        );
      }
      if (data.isMachineryAvailable !== undefined) {
        transformedData.isMachineryAvailable = yesNoToInt(
          data.isMachineryAvailable,
        );
      }
      if (data.isMachineryAffordable !== undefined) {
        transformedData.isMachineryAffordable = yesNoToInt(
          data.isMachineryAffordable,
        );
      }
      if (data.isMachineryCostEffective !== undefined) {
        transformedData.isMachineryCostEffective = yesNoToInt(
          data.isMachineryCostEffective,
        );
      }

      console.log(`📦 Transformed data:`, transformedData);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        transformedData,
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

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          // First, try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Attempting to fetch labour data from backend for reqId: ${reqId}`,
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded labour data from backend`);

                // Update form with backend data
                const updatedFormData = {
                  ...formData,
                  inspectionlabour: backendData,
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
            console.log(`✅ Loaded labour data from AsyncStorage`);
            setFormData(parsedData);
            setIsExistingData(true);
          } else {
            // No data found anywhere - new entry
            setIsExistingData(false);
            console.log("📝 No existing labour data - new entry");
          }
        } catch (e) {
          console.error("Failed to load labour form data", e);
          setIsExistingData(false);
        }
      };

      loadFormData();
    }, [requestId, jobId]),
  );

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};
    const labourInfo = formData.inspectionlabour;

    // Validate required fields
    if (!labourInfo?.isManageFamilyLabour) {
      validationErrors.isManageFamilyLabour = t(
        "Error.Family labour field is required",
      );
    }

    // Conditional validation
    if (
      labourInfo?.isManageFamilyLabour === "Yes" &&
      !labourInfo?.isFamilyHiredLabourEquipped
    ) {
      validationErrors.isFamilyHiredLabourEquipped = t(
        "Error.Family/hired labour equipped field is required",
      );
    }

    if (
      labourInfo?.isManageFamilyLabour === "No" &&
      !labourInfo?.hasAdequateAlternativeLabour
    ) {
      validationErrors.hasAdequateAlternativeLabour = t(
        "Error.Adequate alternative labour field is required",
      );
    }

    if (!labourInfo?.areThereMechanizationOptions) {
      validationErrors.areThereMechanizationOptions = t(
        "Error.Mechanization options field is required",
      );
    }
    if (!labourInfo?.isMachineryAvailable) {
      validationErrors.isMachineryAvailable = t(
        "Error.Machinery available field is required",
      );
    }
    if (!labourInfo?.isMachineryAffordable) {
      validationErrors.isMachineryAffordable = t(
        "Error.Machinery affordable field is required",
      );
    }
    if (!labourInfo?.isMachineryCostEffective) {
      validationErrors.isMachineryCostEffective = t(
        "Error.Machinery cost effective field is required",
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
        "inspectionlabour",
        formData.inspectionlabour!,
        isExistingData,
      );

      if (saved) {
        console.log("✅ Labour info saved successfully to backend");
        setIsExistingData(true);

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("HarvestStorage", {
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
                navigation.navigate("HarvestStorage", {
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
              navigation.navigate("HarvestStorage", {
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
    let updatedLabour = {
      ...formData.inspectionlabour,
      [key]: value,
    };

    if (key === "isManageFamilyLabour") {
      if (value === "Yes") {
        delete updatedLabour.hasAdequateAlternativeLabour;
      } else {
        delete updatedLabour.isFamilyHiredLabourEquipped;
      }
    }

    const updatedFormData = {
      ...formData,
      inspectionlabour: updatedLabour,
    };

    setFormData(updatedFormData);
    await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Tabs */}
        <FormTabs activeKey="Labour" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <YesNoSelect
            label={t(
              "InspectionForm.Can the farmer manage the proposed crop/cropping system through your family labour",
            )}
            required
            value={formData.inspectionlabour?.isManageFamilyLabour || null}
            visible={
              yesNoModalVisible && activeYesNoField === "isManageFamilyLabour"
            }
            onOpen={() => {
              setActiveYesNoField("isManageFamilyLabour");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isManageFamilyLabour", value)
            }
          />
          {formData.inspectionlabour?.isManageFamilyLabour === "Yes" && (
            <YesNoSelect
              label={t(
                "InspectionForm.Is family/hired labour equipped to handle the proposed crop/cropping system",
              )}
              required
              value={
                formData.inspectionlabour?.isFamilyHiredLabourEquipped || null
              }
              visible={
                yesNoModalVisible &&
                activeYesNoField === "isFamilyHiredLabourEquipped"
              }
              onOpen={() => {
                setActiveYesNoField("isFamilyHiredLabourEquipped");
                setYesNoModalVisible(true);
              }}
              onClose={() => {
                setYesNoModalVisible(false);
                setActiveYesNoField(null);
              }}
              onSelect={(value) =>
                handleyesNOFieldChange("isFamilyHiredLabourEquipped", value)
              }
            />
          )}

          {formData.inspectionlabour?.isManageFamilyLabour === "No" && (
            <YesNoSelect
              label={t(
                "InspectionForm.If not, do you have adequate labours to manage the same",
              )}
              required
              value={
                formData.inspectionlabour?.hasAdequateAlternativeLabour || null
              }
              visible={
                yesNoModalVisible &&
                activeYesNoField === "hasAdequateAlternativeLabour"
              }
              onOpen={() => {
                setActiveYesNoField("hasAdequateAlternativeLabour");
                setYesNoModalVisible(true);
              }}
              onClose={() => {
                setYesNoModalVisible(false);
                setActiveYesNoField(null);
              }}
              onSelect={(value) =>
                handleyesNOFieldChange("hasAdequateAlternativeLabour", value)
              }
            />
          )}

          <YesNoSelect
            label={t(
              "InspectionForm.Are there any mechanization options to substitute the labour",
            )}
            required
            value={
              formData.inspectionlabour?.areThereMechanizationOptions || null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "areThereMechanizationOptions"
            }
            onOpen={() => {
              setActiveYesNoField("areThereMechanizationOptions");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("areThereMechanizationOptions", value)
            }
          />
          <YesNoSelect
            label={t("InspectionForm.Is machinery available")}
            required
            value={formData.inspectionlabour?.isMachineryAvailable || null}
            visible={
              yesNoModalVisible && activeYesNoField === "isMachineryAvailable"
            }
            onOpen={() => {
              setActiveYesNoField("isMachineryAvailable");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isMachineryAvailable", value)
            }
          />

          <YesNoSelect
            label={t("InspectionForm.Is machinery affordable")}
            required
            value={formData.inspectionlabour?.isMachineryAffordable || null}
            visible={
              yesNoModalVisible && activeYesNoField === "isMachineryAffordable"
            }
            onOpen={() => {
              setActiveYesNoField("isMachineryAffordable");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isMachineryAffordable", value)
            }
          />

          <YesNoSelect
            label={t("InspectionForm.Is machinery cost effective")}
            required
            value={formData.inspectionlabour?.isMachineryCostEffective || null}
            visible={
              yesNoModalVisible &&
              activeYesNoField === "isMachineryCostEffective"
            }
            onOpen={() => {
              setActiveYesNoField("isMachineryCostEffective");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isMachineryCostEffective", value)
            }
          />
        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity
            className="flex-1 bg-[#444444] rounded-full py-4 items-center"
            onPress={() => navigation.goBack()}
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
    </KeyboardAvoidingView>
  );
};

export default Labour;
