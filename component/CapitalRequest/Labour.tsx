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
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { RootStackParamList } from "../types";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/services/store";
import {
  initializeLabour,
  setLabourInfo,
  updateLabourInfo,
  clearConditionalFields,
  markAsExisting,
  LabourData,
} from "@/store/labourSlice";

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
  const { requestNumber, requestId } = route.params;
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  const dispatch = useDispatch();

  // Get data from Redux store
  const formData = useSelector(
    (state: RootState) => state.labourInfo.data[requestId] || {},
  );

  const isExistingData = useSelector(
    (state: RootState) => state.labourInfo.isExisting[requestId] || false,
  );

  // Validate form completion
  useEffect(() => {
    const hasBaseAnswer =
      formData.isManageFamilyLabour === "Yes" ||
      formData.isManageFamilyLabour === "No";

    let conditionalValid = false;

    if (formData.isManageFamilyLabour === "Yes") {
      conditionalValid =
        formData.isFamilyHiredLabourEquipped === "Yes" ||
        formData.isFamilyHiredLabourEquipped === "No";
    }

    if (formData.isManageFamilyLabour === "No") {
      conditionalValid =
        formData.hasAdequateAlternativeLabour === "Yes" ||
        formData.hasAdequateAlternativeLabour === "No";
    }

    const mechanizationValid =
      formData.areThereMechanizationOptions === "Yes" ||
      formData.areThereMechanizationOptions === "No";

    const machineryAvailableValid =
      formData.isMachineryAvailable === "Yes" ||
      formData.isMachineryAvailable === "No";

    const machineryAffordableValid =
      formData.isMachineryAffordable === "Yes" ||
      formData.isMachineryAffordable === "No";

    const machineryCostEffectiveValid =
      formData.isMachineryCostEffective === "Yes" ||
      formData.isMachineryCostEffective === "No";

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

  // Fetch labour info from backend
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

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing labour data:`, response.data.data);

        const data = response.data.data;

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

      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching labour data:`, error);
      if (error.response?.status === 404) {
        console.log(`📝 No existing record - will create new`);
      }
      return null;
    }
  };

  // Save to backend
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
        transformedData.hasAdequateAlternativeLabour = null;
      } else if (data.isManageFamilyLabour === "No") {
        if (data.hasAdequateAlternativeLabour !== undefined) {
          transformedData.hasAdequateAlternativeLabour = yesNoToInt(
            data.hasAdequateAlternativeLabour,
          );
        }
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
      }

      return false;
    } catch (error: any) {
      console.error(`❌ Error saving ${tableName}:`, error);
      return false;
    }
  };

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          dispatch(initializeLabour({ requestId }));

          // Try to fetch from backend first
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded labour data from backend`);
                dispatch(
                  setLabourInfo({
                    requestId,
                    data: backendData,
                    isExisting: true,
                  }),
                );
                return;
              }
            }
          }

          console.log("📝 No existing labour data - new entry");
        } catch (error) {
          console.error("Failed to load labour data", error);
        }
      };

      loadData();
    }, [requestId, dispatch]),
  );

  // Handle field changes
  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    if (key === "isManageFamilyLabour") {
      dispatch(
        clearConditionalFields({
          requestId,
          familyLabourAnswer: value,
        }),
      );
    }

    dispatch(
      updateLabourInfo({
        requestId,
        updates: { [key]: value },
      }),
    );
  };

  // Handle next button
  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData?.isManageFamilyLabour) {
      validationErrors.isManageFamilyLabour = t(
        "Error.Family labour field is required",
      );
    }

    // Conditional validation
    if (
      formData?.isManageFamilyLabour === "Yes" &&
      !formData?.isFamilyHiredLabourEquipped
    ) {
      validationErrors.isFamilyHiredLabourEquipped = t(
        "Error.Family/hired labour equipped field is required",
      );
    }

    if (
      formData?.isManageFamilyLabour === "No" &&
      !formData?.hasAdequateAlternativeLabour
    ) {
      validationErrors.hasAdequateAlternativeLabour = t(
        "Error.Adequate alternative labour field is required",
      );
    }

    if (!formData?.areThereMechanizationOptions) {
      validationErrors.areThereMechanizationOptions = t(
        "Error.Mechanization options field is required",
      );
    }
    if (!formData?.isMachineryAvailable) {
      validationErrors.isMachineryAvailable = t(
        "Error.Machinery available field is required",
      );
    }
    if (!formData?.isMachineryAffordable) {
      validationErrors.isMachineryAffordable = t(
        "Error.Machinery affordable field is required",
      );
    }
    if (!formData?.isMachineryCostEffective) {
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

    if (!route.params?.requestId) {
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    const reqId = Number(route.params.requestId);

    if (isNaN(reqId) || reqId <= 0) {
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
        "inspectionlabour",
        formData,
        isExistingData,
      );

      if (saved) {
        console.log("✅ Labour info saved successfully to backend");
        dispatch(markAsExisting({ requestId }));

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("HarvestStorage", {
                  requestNumber,
                  requestId: route.params.requestId,
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
                navigation.navigate("HarvestStorage", {
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
                requestNumber,
                requestId: route.params.requestId,
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
            value={formData?.isManageFamilyLabour || null}
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

          {formData?.isManageFamilyLabour === "Yes" && (
            <YesNoSelect
              label={t(
                "InspectionForm.Is family/hired labour equipped to handle the proposed crop/cropping system",
              )}
              required
              value={formData?.isFamilyHiredLabourEquipped || null}
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

          {formData?.isManageFamilyLabour === "No" && (
            <YesNoSelect
              label={t(
                "InspectionForm.If not, do you have adequate labours to manage the same",
              )}
              required
              value={formData?.hasAdequateAlternativeLabour || null}
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
            value={formData?.areThereMechanizationOptions || null}
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
            value={formData?.isMachineryAvailable || null}
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
            value={formData?.isMachineryAffordable || null}
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
            value={formData?.isMachineryCostEffective || null}
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

export default Labour;