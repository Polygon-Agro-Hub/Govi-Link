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
import axios from "axios";
import { environment } from "@/environment/environment";
import ConfirmationModal from "@/Items/ConfirmationModal";

type FormData = {
  inspectionharveststorage?: HarvestStorageData;
};

type HarvestStorageData = {
  hasOwnStorage?: "Yes" | "No";
  ifNotHasFacilityAccess?: "Yes" | "No";
  hasPrimaryProcessingAccess?: "Yes" | "No";
  knowsValueAdditionTech?: "Yes" | "No";
  hasValueAddedMarketLinkage?: "Yes" | "No";
  awareOfQualityStandards?: "Yes" | "No";
};

type HarvestStorageProps = {
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
const HarvestStorage: React.FC<HarvestStorageProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "HarvestStorage">>();
  const { requestNumber, requestId, formData: prevFormData } = route.params; // ✅ Extract all params
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isExistingData, setIsExistingData] = useState(false); // ✅ Add this
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  console.log("finance", formData);

  useEffect(() => {
    const hs = formData?.inspectionharveststorage ?? {};

    const hasOwnStorageValid =
      hs.hasOwnStorage === "Yes" || hs.hasOwnStorage === "No";

    let facilityAccessValid = true;

    if (hs.hasOwnStorage === "No") {
      facilityAccessValid =
        hs.ifNotHasFacilityAccess === "Yes" ||
        hs.ifNotHasFacilityAccess === "No";
    }

    const primaryProcessingValid =
      hs.hasPrimaryProcessingAccess === "Yes" ||
      hs.hasPrimaryProcessingAccess === "No";

    const valueAdditionTechValid =
      hs.knowsValueAdditionTech === "Yes" || hs.knowsValueAdditionTech === "No";

    const marketLinkageValid =
      hs.hasValueAddedMarketLinkage === "Yes" ||
      hs.hasValueAddedMarketLinkage === "No";

    const qualityStandardsValid =
      hs.awareOfQualityStandards === "Yes" ||
      hs.awareOfQualityStandards === "No";

    const hasErrors = Object.values(errors).some(Boolean);

    setIsNextEnabled(
      hasOwnStorageValid &&
        facilityAccessValid &&
        primaryProcessingValid &&
        valueAdditionTechValid &&
        marketLinkageValid &&
        qualityStandardsValid &&
        !hasErrors
    );
  }, [formData, errors]);

  let jobId = requestNumber;
  console.log("jobid", jobId);

  const updateFormData = async (updates: Partial<HarvestStorageData>) => {
    try {
      const updatedFormData = {
        ...formData,
        inspectionharveststorage: {
          ...formData.inspectionharveststorage,
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
    reqId: number
  ): Promise<HarvestStorageData | null> => {
    try {
      console.log(`🔍 Fetching harvest storage data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectionharveststorage",
          },
        }
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(
          `✅ Fetched existing harvest storage data:`,
          response.data.data
        );

        const data = response.data.data;

        // Helper to convert boolean (0/1) to "Yes"/"No"
        const boolToYesNo = (val: any): "Yes" | "No" | undefined => {
          if (val === 1 || val === "1" || val === true) return "Yes";
          if (val === 0 || val === "0" || val === false) return "No";
          return undefined;
        };

        return {
          hasOwnStorage: boolToYesNo(data.hasOwnStorage),
          ifNotHasFacilityAccess: boolToYesNo(data.ifNotHasFacilityAccess),
          hasPrimaryProcessingAccess: boolToYesNo(
            data.hasPrimaryProcessingAccess
          ),
          knowsValueAdditionTech: boolToYesNo(data.knowsValueAdditionTech),
          hasValueAddedMarketLinkage: boolToYesNo(
            data.hasValueAddedMarketLinkage
          ),
          awareOfQualityStandards: boolToYesNo(data.awareOfQualityStandards),
        };
      }

      console.log(
        `📭 No existing harvest storage data found for reqId: ${reqId}`
      );
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching harvest storage data:`, error);
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
    data: HarvestStorageData,
    isUpdate: boolean
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName
      );
      console.log(`📝 reqId being sent:`, reqId);

      // Yes/No fields
      const yesNoToInt = (val: any) =>
        val === "Yes" ? "1" : val === "No" ? "0" : null;

      const transformedData: any = {
        reqId,
        tableName,
      };

      if (data.hasOwnStorage !== undefined) {
        transformedData.hasOwnStorage = yesNoToInt(data.hasOwnStorage);
      }

      // Conditional field
      if (
        data.hasOwnStorage === "No" &&
        data.ifNotHasFacilityAccess !== undefined
      ) {
        transformedData.ifNotHasFacilityAccess = yesNoToInt(
          data.ifNotHasFacilityAccess
        );
      } else {
        transformedData.ifNotHasFacilityAccess = null;
      }

      if (data.hasPrimaryProcessingAccess !== undefined) {
        transformedData.hasPrimaryProcessingAccess = yesNoToInt(
          data.hasPrimaryProcessingAccess
        );
      }
      if (data.knowsValueAdditionTech !== undefined) {
        transformedData.knowsValueAdditionTech = yesNoToInt(
          data.knowsValueAdditionTech
        );
      }
      if (data.hasValueAddedMarketLinkage !== undefined) {
        transformedData.hasValueAddedMarketLinkage = yesNoToInt(
          data.hasValueAddedMarketLinkage
        );
      }
      if (data.awareOfQualityStandards !== undefined) {
        transformedData.awareOfQualityStandards = yesNoToInt(
          data.awareOfQualityStandards
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

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          // First, try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Attempting to fetch harvest storage data from backend for reqId: ${reqId}`
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded harvest storage data from backend`);

                // Update form with backend data
                const updatedFormData = {
                  ...formData,
                  inspectionharveststorage: backendData,
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
            console.log(`✅ Loaded harvest storage data from AsyncStorage`);
            setFormData(parsedData);
            setIsExistingData(true);
          } else {
            // No data found anywhere - new entry
            setIsExistingData(false);
            console.log("📝 No existing harvest storage data - new entry");
          }
        } catch (e) {
          console.error("Failed to load harvest storage form data", e);
          setIsExistingData(false);
        }
      };

      loadFormData();
    }, [requestId, jobId])
  );

  const handleNext = () => {
    const validationErrors: Record<string, string> = {};
    const harvestStorageInfo = formData.inspectionharveststorage;

    // Validate required fields
    if (!harvestStorageInfo?.hasOwnStorage) {
      validationErrors.hasOwnStorage = t("Error.Own storage field is required");
    }

    // Conditional validation
    if (
      harvestStorageInfo?.hasOwnStorage === "No" &&
      !harvestStorageInfo?.ifNotHasFacilityAccess
    ) {
      validationErrors.ifNotHasFacilityAccess = t(
        "Error.Facility access field is required"
      );
    }

    if (!harvestStorageInfo?.hasPrimaryProcessingAccess) {
      validationErrors.hasPrimaryProcessingAccess = t(
        "Error.Primary processing access field is required"
      );
    }
    if (!harvestStorageInfo?.knowsValueAdditionTech) {
      validationErrors.knowsValueAdditionTech = t(
        "Error.Value addition tech field is required"
      );
    }
    if (!harvestStorageInfo?.hasValueAddedMarketLinkage) {
      validationErrors.hasValueAddedMarketLinkage = t(
        "Error.Market linkage field is required"
      );
    }
    if (!harvestStorageInfo?.awareOfQualityStandards) {
      validationErrors.awareOfQualityStandards = t(
        "Error.Quality standards field is required"
      );
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("MAIN.OK") },
      ]);
      return;
    }

    setConfirmationModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmationModalVisible(false);
    setIsSaving(true);

    // ✅ Validate requestId exists
    if (!route.params?.requestId) {
      console.error("❌ requestId is missing!");
      setErrorModalVisible(true);
      setIsSaving(false);
      return;
    }

    const reqId = Number(route.params.requestId);

    if (isNaN(reqId) || reqId <= 0) {
      console.error("❌ Invalid requestId:", route.params.requestId);
      setErrorModalVisible(true);
      setIsSaving(false);
      return;
    }

    console.log("✅ Using requestId:", reqId);

    try {
      console.log(
        `🚀 Saving final form to backend (${
          isExistingData ? "UPDATE" : "INSERT"
        })`
      );

      const saved = await saveToBackend(
        reqId,
        "inspectionharveststorage",
        formData.inspectionharveststorage!,
        isExistingData
      );

      setIsSaving(false);

      if (saved) {
        console.log("✅ Harvest storage info saved successfully to backend");
        setIsExistingData(true);

        // ✅ Clear AsyncStorage after successful save (final form)
        try {
          await AsyncStorage.removeItem(`${jobId}`);
          console.log("🗑️ AsyncStorage cleared successfully for jobId:", jobId);
        } catch (clearError) {
          console.error("⚠️ Failed to clear AsyncStorage:", clearError);
        }

        setSuccessModalVisible(true);
      } else {
        console.log("⚠️ Backend save failed");
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error("Error during final save:", error);
      setIsSaving(false);
      setErrorModalVisible(true);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    // ✅ Navigate to ConfirmationCapitalRequest page with required parameters
    navigation.navigate("ConfirmationCapitalRequest", {
      formData: formData,
      requestNumber: requestNumber,
      requestId: requestId,
    });
  };

  const handleErrorClose = () => {
    setErrorModalVisible(false);
  };

  const handleyesNOFieldChange = async (key: string, value: "Yes" | "No") => {
    let updatedData = {
      ...formData.inspectionharveststorage,
      [key]: value,
    };

    if (key === "hasOwnStorage" && value === "Yes") {
      delete updatedData.ifNotHasFacilityAccess;
    }

    const updatedFormData = {
      ...formData,
      inspectionharveststorage: updatedData,
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
        <FormTabs activeKey="Harvest Storage" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <YesNoSelect
            label={t("InspectionForm.Does the farmer own storage facility")}
            required
            value={formData.inspectionharveststorage?.hasOwnStorage || null}
            visible={yesNoModalVisible && activeYesNoField === "hasOwnStorage"}
            onOpen={() => {
              setActiveYesNoField("hasOwnStorage");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) => handleyesNOFieldChange("hasOwnStorage", value)}
          />

          {formData.inspectionharveststorage?.hasOwnStorage === "No" && (
            <YesNoSelect
              label={t(
                "InspectionForm.If not, does the farmer have access to such facility"
              )}
              required
              value={
                formData.inspectionharveststorage?.ifNotHasFacilityAccess ||
                null
              }
              visible={
                yesNoModalVisible &&
                activeYesNoField === "ifNotHasFacilityAccess"
              }
              onOpen={() => {
                setActiveYesNoField("ifNotHasFacilityAccess");
                setYesNoModalVisible(true);
              }}
              onClose={() => {
                setYesNoModalVisible(false);
                setActiveYesNoField(null);
              }}
              onSelect={(value) =>
                handleyesNOFieldChange("ifNotHasFacilityAccess", value)
              }
            />
          )}

          <YesNoSelect
            label={t(
              "InspectionForm.Does the farmer has access to primary processing facility"
            )}
            required
            value={
              formData.inspectionharveststorage?.hasPrimaryProcessingAccess ||
              null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "hasPrimaryProcessingAccess"
            }
            onOpen={() => {
              setActiveYesNoField("hasPrimaryProcessingAccess");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("hasPrimaryProcessingAccess", value)
            }
          />
          <YesNoSelect
            label={t(
              "InspectionForm.Does the farmer knows technologies for value addition of your crop"
            )}
            required
            value={
              formData.inspectionharveststorage?.knowsValueAdditionTech || null
            }
            visible={
              yesNoModalVisible && activeYesNoField === "knowsValueAdditionTech"
            }
            onOpen={() => {
              setActiveYesNoField("knowsValueAdditionTech");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("knowsValueAdditionTech", value)
            }
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Does the farmer has market linkage for value added products"
            )}
            required
            value={
              formData.inspectionharveststorage?.hasValueAddedMarketLinkage ||
              null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "hasValueAddedMarketLinkage"
            }
            onOpen={() => {
              setActiveYesNoField("hasValueAddedMarketLinkage");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("hasValueAddedMarketLinkage", value)
            }
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is farmer aware about required quality standards of value added products of proposed crops"
            )}
            required
            value={
              formData.inspectionharveststorage?.awareOfQualityStandards || null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "awareOfQualityStandards"
            }
            onOpen={() => {
              setActiveYesNoField("awareOfQualityStandards");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("awareOfQualityStandards", value)
            }
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
      <ConfirmationModal
        visible={confirmationModalVisible}
        type="confirmation"
        onClose={() => setConfirmationModalVisible(false)}
        onConfirm={handleConfirmSubmit}
      />

      {/* Success Modal */}
      <ConfirmationModal
        visible={successModalVisible}
        type="success"
        onClose={handleSuccessClose}
      />

      {/* Error Modal */}
      <ConfirmationModal
        visible={errorModalVisible}
        type="error"
        onClose={handleErrorClose}
      />

      {/* Loading Overlay */}
      {isSaving && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
          <View className="bg-white p-6 rounded-2xl">
            <Text className="text-base text-black">
              {t("InspectionForm.Saving...")}
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default HarvestStorage;
