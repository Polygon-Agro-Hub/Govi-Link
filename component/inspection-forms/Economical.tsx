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
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveEconomicalInfo,
  getEconomicalInfo,
  EconomicalData,
} from "@/database/inspectioneconomical";
import { updateLastScreen } from "@/database/inspectionprogress";
import { MaterialIcons } from "@expo/vector-icons";

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
          className="bg-[#F6F6F6] rounded-full px-4 h-[50px] flex-row items-center justify-between"
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
          <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </>
  );
};

const Economical: React.FC<EconomicalProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "Economical">>();
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();
  const [formData, setFormData] = useState<EconomicalData>({
    isSuitaleSize: undefined,
    isFinanceResource: undefined,
    isAltRoutes: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      updateLastScreen(requestId, "Economical");
    }, [requestId]),
  );

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;

        try {
          const reqId = Number(requestId);
          const localData = await getEconomicalInfo(reqId);

          if (localData) {
            const normalizedData: EconomicalData = {
              isSuitaleSize: localData.isSuitaleSize,
              isFinanceResource: localData.isFinanceResource,
              isAltRoutes: localData.isAltRoutes,
            };

            setFormData(normalizedData);
            setIsExistingData(true);
          } else {
            setIsExistingData(false);
          }
          setIsDataLoaded(true);
        } catch (error) {
          console.error("Failed to load economical info from SQLite:", error);
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
          await saveEconomicalInfo(Number(requestId), formData);
        } catch (err) {
          console.error("Error auto-saving economical info:", err);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, requestId, isDataLoaded]);

  useEffect(() => {
    const isSuitaleSizeValid =
      formData.isSuitaleSize === "Yes" || formData.isSuitaleSize === "No";

    const isFinanceResourceValid =
      formData.isFinanceResource === "Yes" ||
      formData.isFinanceResource === "No";

    const isAltRoutesValid =
      formData.isAltRoutes === "Yes" || formData.isAltRoutes === "No";

    const hasErrors = Object.values(errors).some(Boolean);

    setIsNextEnabled(
      isSuitaleSizeValid &&
      isFinanceResourceValid &&
      isAltRoutesValid &&
      !hasErrors,
    );
  }, [formData, errors]);

  const updateFormData = (updates: Partial<EconomicalData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    updateFormData({ [key]: value } as any);
  };

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: EconomicalData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
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

    if (!formData.isSuitaleSize) {
      validationErrors.isSuitaleSize = t(
        "Error.Suitable size field is required",
      );
    }
    if (!formData.isFinanceResource) {
      validationErrors.isFinanceResource = t(
        "Error.Finance resource field is required",
      );
    }
    if (!formData.isAltRoutes) {
      validationErrors.isAltRoutes = t(
        "Error.Alternative routes field is required",
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
        "inspectioneconomical",
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
                navigation.navigate("Labour", {
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
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <FormTabs
          activeKey="Economical"
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
              "InspectionForm.Are the proposed crop/cropping systems suitable for the farmer's size of land holding",
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
              "InspectionForm.Are the financial resources adequate to manage the proposed crop/cropping system",
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
              "InspectionForm.If not, can the farmer mobilize financial resources through alternative routes",
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
          onExit={() =>
            navigation.navigate("ProfitRisk", {
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

export default Economical;
