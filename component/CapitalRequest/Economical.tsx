import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { RootStackParamList } from "../types";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/services/store';
import {
  initializeEconomical,
  updateEconomical,
  setEconomical,
  markEconomicalAsExisting,
  EconomicalData,
} from '@/store/economicalSlice';

type EconomicalProps = {
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

const Economical: React.FC<EconomicalProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "Economical">>();
  const { requestNumber, requestId } = route.params;
  
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Get data from Redux
  const formData = useSelector((state: RootState) =>
    state.economical.data[requestId] || {
      isSuitaleSize: undefined,
      isFinanceResource: undefined,
      isAltRoutes: undefined,
    }
  );

  const isExistingData = useSelector((state: RootState) =>
    state.economical.isExisting[requestId] || false
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  console.log("economical", formData);

  useEffect(() => {
    const isSuitaleSizeValid =
      formData.isSuitaleSize === "Yes" || formData.isSuitaleSize === "No";

    const isFinanceResourceValid =
      formData.isFinanceResource === "Yes" || formData.isFinanceResource === "No";

    const isAltRoutesValid =
      formData.isAltRoutes === "Yes" || formData.isAltRoutes === "No";

    const hasErrors = Object.values(errors).some(Boolean);

    setIsNextEnabled(
      isSuitaleSizeValid &&
        isFinanceResourceValid &&
        isAltRoutesValid &&
        !hasErrors
    );
  }, [formData, errors]);

  const fetchInspectionData = async (
    reqId: number
  ): Promise<EconomicalData | null> => {
    try {
      console.log(`🔍 Fetching economical data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectioneconomical",
          },
        }
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing economical data:`, response.data.data);

        const data = response.data.data;

        // Helper to convert boolean (0/1) to "Yes"/"No"
        const boolToYesNo = (val: any): "Yes" | "No" | undefined => {
          if (val === 1 || val === "1" || val === true) return "Yes";
          if (val === 0 || val === "0" || val === false) return "No";
          return undefined;
        };

        return {
          isSuitaleSize: boolToYesNo(data.isSuitaleSize),
          isFinanceResource: boolToYesNo(data.isFinanceResource),
          isAltRoutes: boolToYesNo(data.isAltRoutes),
        };
      }

      console.log(`📭 No existing economical data found for reqId: ${reqId}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching economical data:`, error);
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
    data: EconomicalData,
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

      if (data.isSuitaleSize !== undefined) {
        transformedData.isSuitaleSize = yesNoToInt(data.isSuitaleSize);
      }
      if (data.isFinanceResource !== undefined) {
        transformedData.isFinanceResource = yesNoToInt(data.isFinanceResource);
      }
      if (data.isAltRoutes !== undefined) {
        transformedData.isAltRoutes = yesNoToInt(data.isAltRoutes);
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
          // Initialize Redux state
          dispatch(initializeEconomical({ requestId }));

          // Try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Attempting to fetch economical data from backend for reqId: ${reqId}`
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded economical data from backend`);

                // Save to Redux
                dispatch(setEconomical({
                  requestId,
                  data: backendData,
                  isExisting: true,
                }));

                return;
              }
            }
          }

          console.log("📝 No existing economical data - new entry");
        } catch (e) {
          console.error("Failed to load economical form data", e);
        }
      };

      loadFormData();
    }, [requestId, dispatch])
  );

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.isSuitaleSize) {
      validationErrors.isSuitaleSize = t(
        "Error.Suitable size field is required"
      );
    }
    if (!formData.isFinanceResource) {
      validationErrors.isFinanceResource = t(
        "Error.Finance resource field is required"
      );
    }
    if (!formData.isAltRoutes) {
      validationErrors.isAltRoutes = t(
        "Error.Alternative routes field is required"
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
        [{ text: t("Main.ok") }]
      );
      return;
    }

    const reqId = Number(route.params.requestId);

    if (isNaN(reqId) || reqId <= 0) {
      console.error("❌ Invalid requestId:", route.params.requestId);
      Alert.alert(
        t("Error.Error"),
        "Invalid request ID. Please go back and try again.",
        [{ text: t("Main.ok") }]
      );
      return;
    }

    console.log("✅ Using requestId:", reqId);

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false }
    );

    try {
      const saved = await saveToBackend(
        reqId,
        "inspectioneconomical",
        formData,
        isExistingData
      );

      if (saved) {
        console.log("✅ Economical info saved successfully to backend");

        // Mark as existing in Redux
        dispatch(markEconomicalAsExisting({ requestId }));

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("Labour", {
                  formData: { inspectioneconomical: formData },
                  requestNumber,
                  requestId,
                });
              },
            },
          ]
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
                navigation.navigate("Labour", {
                  formData: { inspectioneconomical: formData },
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
        t("Main.Warning"),
        t("InspectionForm.Could not save to server. Data saved locally."),
        [
          {
            text: t("Main.Continue"),
            onPress: () => {
              navigation.navigate("Labour", {
                formData: { inspectioneconomical: formData },
                requestNumber,
                requestId: route.params.requestId,
              });
            },
          },
        ]
      );
    }
  };

  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    dispatch(updateEconomical({
      requestId,
      updates: { [key]: value },
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Tabs */}
        <FormTabs activeKey="Economical" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <YesNoSelect
            label={t(
              "InspectionForm.Are the proposed crop/cropping systems suitable for the farmer's size of land holding"
            )}
            required
            value={formData.isSuitaleSize || null}
            visible={yesNoModalVisible && activeYesNoField === "isSuitaleSize"}
            onOpen={() => {
              setActiveYesNoField("isSuitaleSize");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) => handleyesNOFieldChange("isSuitaleSize", value)}
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Are the financial resources adequate to manage the proposed crop/cropping system"
            )}
            required
            value={formData.isFinanceResource || null}
            visible={
              yesNoModalVisible && activeYesNoField === "isFinanceResource"
            }
            onOpen={() => {
              setActiveYesNoField("isFinanceResource");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("isFinanceResource", value)
            }
          />
          <YesNoSelect
            label={t(
              "InspectionForm.If not, can the farmer mobilize financial resources through alternative routes"
            )}
            required
            value={formData.isAltRoutes || null}
            visible={yesNoModalVisible && activeYesNoField === "isAltRoutes"}
            onOpen={() => {
              setActiveYesNoField("isAltRoutes");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) => handleyesNOFieldChange("isAltRoutes", value)}
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

export default Economical;