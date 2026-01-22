import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { RootStackParamList } from "../types";
import axios from "axios";
import { environment } from "@/environment/environment";
import ConfirmationModal from "@/Items/ConfirmationModal";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/services/store";
import FormFooterButton from "./FormFooterButton";
import {
  initializeHarvestStorage,
  setHarvestStorageInfo,
  updateHarvestStorageInfo,
  clearConditionalField,
  markAsExisting,
  HarvestStorageData,
} from "@/store/HarvestStorageSlice";
import { clearAllInspectionSlices } from "@/store/clearAllSlices";

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
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();

  // ✅ Add refs to prevent loops
  const isFetchingRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const isInitializedRef = useRef(false); // ✅ Track if data is already loaded

  // Get data from Redux store
  const formData = useSelector(
    (state: RootState) => state.harvestStorage.data[requestId] || {},
  );

  const isExistingData = useSelector(
    (state: RootState) => state.harvestStorage.isExisting[requestId] || false,
  );

  // Validate form completion
  useEffect(() => {
    const hasOwnStorageValid =
      formData.hasOwnStorage === "Yes" || formData.hasOwnStorage === "No";

    let facilityAccessValid = true;

    if (formData.hasOwnStorage === "No") {
      facilityAccessValid =
        formData.ifNotHasFacilityAccess === "Yes" ||
        formData.ifNotHasFacilityAccess === "No";
    }

    const primaryProcessingValid =
      formData.hasPrimaryProcessingAccess === "Yes" ||
      formData.hasPrimaryProcessingAccess === "No";

    const valueAdditionTechValid =
      formData.knowsValueAdditionTech === "Yes" ||
      formData.knowsValueAdditionTech === "No";

    const marketLinkageValid =
      formData.hasValueAddedMarketLinkage === "Yes" ||
      formData.hasValueAddedMarketLinkage === "No";

    const qualityStandardsValid =
      formData.awareOfQualityStandards === "Yes" ||
      formData.awareOfQualityStandards === "No";

    const hasErrors = Object.values(errors).some(Boolean);

    setIsNextEnabled(
      hasOwnStorageValid &&
      facilityAccessValid &&
      primaryProcessingValid &&
      valueAdditionTechValid &&
      marketLinkageValid &&
      qualityStandardsValid &&
      !hasErrors,
    );
  }, [formData, errors]);

  // Save to backend
  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: HarvestStorageData,
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

      if (data.hasOwnStorage !== undefined) {
        transformedData.hasOwnStorage = yesNoToInt(data.hasOwnStorage);
      }

      if (data.hasOwnStorage === "No" && data.ifNotHasFacilityAccess !== undefined) {
        transformedData.ifNotHasFacilityAccess = yesNoToInt(
          data.ifNotHasFacilityAccess,
        );
      } else {
        transformedData.ifNotHasFacilityAccess = null;
      }

      if (data.hasPrimaryProcessingAccess !== undefined) {
        transformedData.hasPrimaryProcessingAccess = yesNoToInt(
          data.hasPrimaryProcessingAccess,
        );
      }
      if (data.knowsValueAdditionTech !== undefined) {
        transformedData.knowsValueAdditionTech = yesNoToInt(
          data.knowsValueAdditionTech,
        );
      }
      if (data.hasValueAddedMarketLinkage !== undefined) {
        transformedData.hasValueAddedMarketLinkage = yesNoToInt(
          data.hasValueAddedMarketLinkage,
        );
      }
      if (data.awareOfQualityStandards !== undefined) {
        transformedData.awareOfQualityStandards = yesNoToInt(
          data.awareOfQualityStandards,
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

  // ✅ CRITICAL FIX: Only load data ONCE per mount
  useFocusEffect(
    useCallback(() => {
      // ✅ Reset navigation flag
      hasNavigatedRef.current = false;

      // ✅ SKIP if already initialized for this requestId
      if (isInitializedRef.current) {
        console.log("⏭️ Data already loaded for this screen, skipping fetch");
        return;
      }

      const fetchInspectionData = async (
        reqId: number,
      ): Promise<HarvestStorageData | null> => {
        try {
          const response = await axios.get(
            `${environment.API_BASE_URL}api/capital-request/inspection/get`,
            {
              params: {
                reqId,
                tableName: "inspectionharveststorage",
              },
            },
          );

          if (response.data.success && response.data.data) {
            const data = response.data.data;

            const boolToYesNo = (val: any): "Yes" | "No" | undefined => {
              if (val === 1 || val === "1" || val === true) return "Yes";
              if (val === 0 || val === "0" || val === false) return "No";
              return undefined;
            };

            return {
              hasOwnStorage: boolToYesNo(data.hasOwnStorage),
              ifNotHasFacilityAccess: boolToYesNo(data.ifNotHasFacilityAccess),
              hasPrimaryProcessingAccess: boolToYesNo(
                data.hasPrimaryProcessingAccess,
              ),
              knowsValueAdditionTech: boolToYesNo(data.knowsValueAdditionTech),
              hasValueAddedMarketLinkage: boolToYesNo(
                data.hasValueAddedMarketLinkage,
              ),
              awareOfQualityStandards: boolToYesNo(data.awareOfQualityStandards),
            };
          }

          return null;
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.error(`❌ Error fetching harvest storage data:`, error);
          }
          return null;
        }
      };

      const loadData = async () => {
        if (isFetchingRef.current) {
          return;
        }

        isFetchingRef.current = true;

        try {
          dispatch(initializeHarvestStorage({ requestId }));

          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                dispatch(
                  setHarvestStorageInfo({
                    requestId,
                    data: backendData,
                    isExisting: true,
                  }),
                );
              }
            }
          }

          // ✅ Mark as initialized
          isInitializedRef.current = true;
        } catch (error) {
          console.error("Failed to load harvest storage data", error);
        } finally {
          isFetchingRef.current = false;
        }
      };

      loadData();

      // ✅ Cleanup: Reset initialization flag when component unmounts
      return () => {
        isInitializedRef.current = false;
      };
    }, [requestId, dispatch]),
  );

  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    if (key === "hasOwnStorage" && value === "Yes") {
      dispatch(clearConditionalField({ requestId }));
    }

    dispatch(
      updateHarvestStorageInfo({
        requestId,
        updates: { [key]: value },
      }),
    );
  };

  const handleNext = () => {
    const validationErrors: Record<string, string> = {};

    if (!formData?.hasOwnStorage) {
      validationErrors.hasOwnStorage = t("Error.Own storage field is required");
    }

    if (
      formData?.hasOwnStorage === "No" &&
      !formData?.ifNotHasFacilityAccess
    ) {
      validationErrors.ifNotHasFacilityAccess = t(
        "Error.Facility access field is required",
      );
    }

    if (!formData?.hasPrimaryProcessingAccess) {
      validationErrors.hasPrimaryProcessingAccess = t(
        "Error.Primary processing access field is required",
      );
    }
    if (!formData?.knowsValueAdditionTech) {
      validationErrors.knowsValueAdditionTech = t(
        "Error.Value addition tech field is required",
      );
    }
    if (!formData?.hasValueAddedMarketLinkage) {
      validationErrors.hasValueAddedMarketLinkage = t(
        "Error.Market linkage field is required",
      );
    }
    if (!formData?.awareOfQualityStandards) {
      validationErrors.awareOfQualityStandards = t(
        "Error.Quality standards field is required",
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

    setConfirmationModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmationModalVisible(false);
    setIsSaving(true);

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

    try {
      const saved = await saveToBackend(
        reqId,
        "inspectionharveststorage",
        formData,
        isExistingData,
      );

      setIsSaving(false);

      if (saved) {
        dispatch(markAsExisting({ requestId }));
        setSuccessModalVisible(true);
      } else {
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error("Error during final save:", error);
      setIsSaving(false);
      setErrorModalVisible(true);
    }
  };

  const handleSuccessClose = () => {
    if (hasNavigatedRef.current) {
      return;
    }

    hasNavigatedRef.current = true;
    setSuccessModalVisible(false);

    // ✅ Just navigate - don't clear yet
    navigation.replace("ConfirmationCapitalRequest", {
      requestNumber: requestNumber,
      requestId: requestId,
    });
  };

  const handleErrorClose = () => {
    setErrorModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        <FormTabs activeKey="Harvest Storage" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          <YesNoSelect
            label={t("InspectionForm.Does the farmer own storage facility")}
            required
            value={formData?.hasOwnStorage || null}
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

          {formData?.hasOwnStorage === "No" && (
            <YesNoSelect
              label={t(
                "InspectionForm.If not, does the farmer have access to such facility",
              )}
              required
              value={formData?.ifNotHasFacilityAccess || null}
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
              "InspectionForm.Does the farmer has access to primary processing facility",
            )}
            required
            value={formData?.hasPrimaryProcessingAccess || null}
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
              "InspectionForm.Does the farmer knows technologies for value addition of your crop",
            )}
            required
            value={formData?.knowsValueAdditionTech || null}
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
              "InspectionForm.Does the farmer has market linkage for value added products",
            )}
            required
            value={formData?.hasValueAddedMarketLinkage || null}
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
              "InspectionForm.Is farmer aware about required quality standards of value added products of proposed crops",
            )}
            required
            value={formData?.awareOfQualityStandards || null}
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

        <FormFooterButton
          exitText={t("InspectionForm.Back")}
          nextText={t("InspectionForm.Next")}
          isNextEnabled={isNextEnabled}
          onExit={() => navigation.goBack()}
          onNext={handleNext}
        />
      </View>

      <ConfirmationModal
        visible={confirmationModalVisible}
        type="confirmation"
        onClose={() => setConfirmationModalVisible(false)}
        onConfirm={handleConfirmSubmit}
      />

      <ConfirmationModal
        visible={successModalVisible}
        type="success"
        onClose={handleSuccessClose}
      />

      <ConfirmationModal
        visible={errorModalVisible}
        type="error"
        onClose={handleErrorClose}
      />

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