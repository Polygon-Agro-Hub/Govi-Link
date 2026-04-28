import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  BackHandler,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveLabourInfo,
  getLabourInfo,
  LabourData,
} from "@/database/inspectionlabour";
import { updateLastScreen } from "@/database/inspectionprogress";

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

const Labour: React.FC<LabourProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "Labour">>();
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();
  const [formData, setFormData] = useState<LabourData>({
    isManageFamilyLabour: undefined,
    isFamilyHiredLabourEquipped: undefined,
    hasAdequateAlternativeLabour: undefined,
    areThereMechanizationOptions: undefined,
    isMachineryAvailable: undefined,
    isMachineryAffordable: undefined,
    isMachineryCostEffective: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      updateLastScreen(requestId, "Labour");
    }, [requestId]),
  );

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;

        try {
          const reqId = Number(requestId);
          const localData = await getLabourInfo(reqId);

          if (localData) {
            const normalizedData: LabourData = {
              isManageFamilyLabour: localData.isManageFamilyLabour,
              isFamilyHiredLabourEquipped:
                localData.isFamilyHiredLabourEquipped,
              hasAdequateAlternativeLabour:
                localData.hasAdequateAlternativeLabour,
              areThereMechanizationOptions:
                localData.areThereMechanizationOptions,
              isMachineryAvailable: localData.isMachineryAvailable,
              isMachineryAffordable: localData.isMachineryAffordable,
              isMachineryCostEffective: localData.isMachineryCostEffective,
            };

            setFormData(normalizedData);
            setIsExistingData(true);
          } else {
            setIsExistingData(false);
          }
          setIsDataLoaded(true);
        } catch (error) {
          console.error("Failed to load labour info from SQLite:", error);
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
          await saveLabourInfo(Number(requestId), formData);
        } catch (err) {
          console.error("Error auto-saving labour info:", err);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, requestId, isDataLoaded]);

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

  const updateFormData = (updates: Partial<LabourData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    let updates: Partial<LabourData> = {
      [key]: value,
    };

    if (key === "isManageFamilyLabour") {
      updates = {
        ...updates,
        isFamilyHiredLabourEquipped: undefined,
        hasAdequateAlternativeLabour: undefined,
      };
    }

    updateFormData(updates);
  };

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: LabourData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      const yesNoToInt = (val: any) =>
        val === "Yes" ? "1" : val === "No" ? "0" : null;

      const transformedData: any = {
        reqId,
        tableName,
      };

      if (data.isManageFamilyLabour !== undefined) {
        transformedData.isManageFamilyLabour = yesNoToInt(
          data.isManageFamilyLabour,
        );
      }

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
        return true;
      }

      return false;
    } catch (error: any) {
      console.error(` Error saving ${tableName}:`, error);
      return false;
    }
  };

  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    if (!formData.isManageFamilyLabour) {
      validationErrors.isManageFamilyLabour = t(
        "Error.Family labour field is required",
      );
    }

    if (
      formData.isManageFamilyLabour === "Yes" &&
      !formData.isFamilyHiredLabourEquipped
    ) {
      validationErrors.isFamilyHiredLabourEquipped = t(
        "Error.Family/hired labour equipped field is required",
      );
    }

    if (
      formData.isManageFamilyLabour === "No" &&
      !formData.hasAdequateAlternativeLabour
    ) {
      validationErrors.hasAdequateAlternativeLabour = t(
        "Error.Adequate alternative labour field is required",
      );
    }

    if (!formData.areThereMechanizationOptions) {
      validationErrors.areThereMechanizationOptions = t(
        "Error.Mechanization options field is required",
      );
    }
    if (!formData.isMachineryAvailable) {
      validationErrors.isMachineryAvailable = t(
        "Error.Machinery available field is required",
      );
    }
    if (!formData.isMachineryAffordable) {
      validationErrors.isMachineryAffordable = t(
        "Error.Machinery affordable field is required",
      );
    }
    if (!formData.isMachineryCostEffective) {
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

    if (!requestId) {
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
      );
      return;
    }

    const reqId = Number(requestId);

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
        setIsExistingData(true);

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("HarvestStorage", {
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
          activeKey="Labour"
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

          <YesNoSelect
            label={t(
              "InspectionForm.Can the farmer manage the proposed crop/cropping system through your family labour",
            )}
            required
            value={formData.isManageFamilyLabour || null}
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

          {formData.isManageFamilyLabour === "Yes" && (
            <YesNoSelect
              label={t(
                "InspectionForm.Is family/hired labour equipped to handle the proposed crop/cropping system",
              )}
              required
              value={formData.isFamilyHiredLabourEquipped || null}
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

          {formData.isManageFamilyLabour === "No" && (
            <YesNoSelect
              label={t(
                "InspectionForm.If not, do you have adequate labours to manage the same",
              )}
              required
              value={formData.hasAdequateAlternativeLabour || null}
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
            value={formData.areThereMechanizationOptions || null}
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
            value={formData.isMachineryAvailable || null}
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
            value={formData.isMachineryAffordable || null}
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
            value={formData.isMachineryCostEffective || null}
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
          onExit={() =>
            navigation.navigate("Economical", {
              requestNumber,
              requestId,
            })
          }
          onNext={handleNext}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default Labour;
