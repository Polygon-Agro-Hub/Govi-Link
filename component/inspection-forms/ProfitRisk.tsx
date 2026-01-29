// ProfitRisk.tsx - Fixed version with proper data handling
import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveProfitInfo,
  getProfitInfo,
  ProfitRiskData,
} from "@/database/inspectionprofit";

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  required = false,
  error,
  extra,
  keyboardType = "default",
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  keyboardType?: any;
  extra?: any;
}) => (
  <View className="mb-4">
    <Text className="text-sm text-[#070707] mb-2">
      {label} {extra && <Text className="text-black font-bold">{extra} </Text>}
      {required && <Text className="text-black">*</Text>}
    </Text>
    <View
      className={`bg-[#F6F6F6] rounded-full flex-row items-center ${
        error ? "border border-red-500" : ""
      }`}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#838B8C"
        className="px-5 py-4 text-base text-black flex-1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>

    {error && <Text className="text-red-500 text-sm mt-1 ml-4">{error}</Text>}
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

type ValidationRule = {
  required?: boolean;
  type?: "profit";
};

const validateAndFormat = (text: string, rules: ValidationRule, t: any) => {
  let value = text;
  let error = "";

  console.log("Validating:", value, rules);

  if (rules.type === "profit") {
    value = value.replace(/[^0-9.]/g, "");

    if (value.startsWith(".")) {
      value = value.slice(1);
    }

    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    value = value.replace(/\.{2,}/g, ".");

    if (value === "0") {
      error = t("Error.Value must be greater than 0");
    } else if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  return { value, error };
};

type ProfitRiskProps = {
  navigation: any;
};

const ProfitRisk: React.FC<ProfitRiskProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "ProfitRisk">>();
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();

  // Local state for form data
  const [formData, setFormData] = useState<ProfitRiskData>({
    profit: "",
    isProfitable: undefined,
    isRisk: undefined,
    risk: "",
    solution: "",
    manageRisk: undefined,
    worthToTakeRisk: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load data from SQLite when component mounts
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;

        try {
          const reqId = Number(requestId);
          const localData = await getProfitInfo(reqId);

          if (localData) {
            console.log("✅ Loaded profit/risk info from SQLite:", localData);

            // Ensure proper data types
            const normalizedData: ProfitRiskData = {
              profit: localData.profit || "",
              isProfitable: localData.isProfitable,
              isRisk: localData.isRisk,
              risk: localData.risk || "",
              solution: localData.solution || "",
              manageRisk: localData.manageRisk,
              worthToTakeRisk: localData.worthToTakeRisk || "",
            };

            setFormData(normalizedData);
            setIsExistingData(true);
          } else {
            console.log("📝 No local profit/risk data - new entry");
            setIsExistingData(false);
          }
          setIsDataLoaded(true);
        } catch (error) {
          console.error("Failed to load profit/risk info from SQLite:", error);
          setIsDataLoaded(true);
        }
      };

      loadData();
    }, [requestId]),
  );

  // Auto-save to SQLite whenever formData changes (debounced)
  useEffect(() => {
    if (!isDataLoaded) return; // Don't auto-save during initial load

    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          await saveProfitInfo(Number(requestId), formData);
          console.log("💾 Auto-saved profit/risk info to SQLite");
        } catch (err) {
          console.error("Error auto-saving profit/risk info:", err);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData, requestId, isDataLoaded]);

  // Validate form completion
  useEffect(() => {
    if (!formData) {
      setIsNextEnabled(false);
      return;
    }

    const {
      profit,
      isProfitable,
      isRisk,
      risk,
      solution,
      manageRisk,
      worthToTakeRisk,
    } = formData;

    // ---------- BASE REQUIRED (ALWAYS) ----------
    const baseValid =
      profit?.trim() !== "" &&
      profit !== "0" &&
      (isProfitable === "Yes" || isProfitable === "No") &&
      (isRisk === "Yes" || isRisk === "No");

    // ---------- CONDITIONAL REQUIRED ----------
    const risksYesValid =
      isRisk === "Yes"
        ? risk?.trim() !== "" &&
          solution?.trim() !== "" &&
          (manageRisk === "Yes" || manageRisk === "No") &&
          worthToTakeRisk?.trim() !== ""
        : true;

    // ---------- IGNORE ERRORS WHEN RISKS = NO ----------
    const filteredErrors = { ...errors };
    if (isRisk === "No") {
      delete filteredErrors.risk;
      delete filteredErrors.solution;
      delete filteredErrors.manageRisk;
      delete filteredErrors.worthToTakeRisk;
    }

    const hasErrors = Object.values(filteredErrors).some(
      (err) => err && err.length > 0,
    );

    setIsNextEnabled(baseValid && risksYesValid && !hasErrors);
  }, [formData, errors]);

  // Update form data
  const updateFormData = (updates: Partial<ProfitRiskData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Handle field changes
  const handleFieldChange = (
    key: keyof ProfitRiskData,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(text, rules, t);
    updateFormData({ [key]: value } as any);
    setErrors((prev) => ({ ...prev, [key]: error || "" }));
  };

  // Handle Yes/No field changes
  const handleyesNOFieldChange = (key: string, value: "Yes" | "No") => {
    let updates: Partial<ProfitRiskData> = {
      [key]: value,
    };

    // 🔥 CLEAR ALL RISK FIELDS WHEN "NO"
    if (key === "isRisk" && value === "No") {
      updates = {
        ...updates,
        risk: "",
        solution: "",
        manageRisk: undefined,
        worthToTakeRisk: "",
      };

      // clear related errors
      setErrors((prev) => ({
        ...prev,
        risk: "",
        solution: "",
        manageRisk: "",
        worthToTakeRisk: "",
      }));
    }

    updateFormData(updates);
  };

  // Save to backend
  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: ProfitRiskData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName,
      );

      // Yes/No fields
      const yesNoToInt = (val: any) =>
        val === "Yes" ? "1" : val === "No" ? "0" : null;

      const transformedData: any = {
        reqId,
        tableName,
      };

      // Numeric field (profit as string in DB)
      if (data.profit !== undefined && data.profit !== "") {
        transformedData.profit = data.profit;
      }

      // Boolean fields
      if (data.isProfitable !== undefined) {
        transformedData.isProfitable = yesNoToInt(data.isProfitable);
      }
      if (data.isRisk !== undefined) {
        transformedData.isRisk = yesNoToInt(data.isRisk);
      }

      // ✅ manageRisk is VARCHAR, save as "Yes" or "No" string
      if (data.manageRisk !== undefined) {
        transformedData.manageRisk = data.manageRisk; // Keep as "Yes" or "No"
      }

      // Text fields (only add if isRisk is Yes)
      if (data.isRisk === "Yes") {
        if (data.risk) {
          transformedData.risk = data.risk;
        }
        if (data.solution) {
          transformedData.solution = data.solution;
        }
        if (data.worthToTakeRisk) {
          transformedData.worthToTakeRisk = data.worthToTakeRisk;
        }
      } else {
        // If isRisk is No, send empty/null values
        transformedData.risk = null;
        transformedData.solution = null;
        transformedData.manageRisk = null;
        transformedData.worthToTakeRisk = null;
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
      return false;
    }
  };

  // Handle next button
  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    // Validate required fields
    if (
      !formData.profit ||
      formData.profit.trim() === "" ||
      formData.profit === "0"
    ) {
      validationErrors.profit = t("Error.profit is required");
    }
    if (!formData.isProfitable) {
      validationErrors.isProfitable = t(
        "Error.Profitability field is required",
      );
    }
    if (!formData.isRisk) {
      validationErrors.isRisk = t("Error.Risk field is required");
    }

    // Conditional validation when isRisk is "Yes"
    if (formData.isRisk === "Yes") {
      if (!formData.risk || formData.risk.trim() === "") {
        validationErrors.risk = t(
          "Error.What are the risks you are anticipating in the proposed crop / cropping system is required",
        );
      }
      if (!formData.solution || formData.solution.trim() === "") {
        validationErrors.solution = t(
          "Error.Do you have the solution is required",
        );
      }
      if (!formData.manageRisk) {
        validationErrors.manageRisk = t(
          "Error.Can the farmer manage the risks is required",
        );
      }
      if (!formData.worthToTakeRisk || formData.worthToTakeRisk.trim() === "") {
        validationErrors.worthToTakeRisk = t(
          "Error.Is it worth to take the risks for anticipated profits is required",
        );
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("Main.ok") },
      ]);
      return;
    }

    // Validate requestId exists
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

    console.log("✅ Using requestId:", reqId);

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false },
    );

    try {
      const saved = await saveToBackend(
        reqId,
        "inspectionprofit",
        formData,
        isExistingData,
      );

      if (saved) {
        console.log("✅ Profit/risk info saved successfully to backend");
        setIsExistingData(true);

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("Economical", {
                  requestNumber,
                  requestId,
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
                navigation.navigate("Economical", {
                  requestNumber,
                  requestId,
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
              navigation.navigate("Economical", {
                requestNumber,
                requestId,
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

        {/* Tabs */}
        <FormTabs
          activeKey="Profit & Risk"
          navigation={navigation}
          onTabPress={(key) => {
            const routesMap: Record<string, string> = {
              "Personal Info": "PersonalInfo",
              "ID Proof": "IDProof",
              "Finance Info": "FinanceInfo",
              "Land Info": "LandInfo",
              "Investment Info": "InvestmentInfo",
              "Cultivation Info": "CultivationInfo",
              "Cropping Systems": "CroppingSystems",
            };

            const route = routesMap[key];
            if (route) {
              navigation.navigate(route, {
                requestId,
                requestNumber,
              });
            }
          }}
        />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          <Input
            label={t(
              "InspectionForm.How much profit are you expecting from the proposed crop/cropping system",
            )}
            placeholder="0.00"
            value={formData.profit}
            onChangeText={(text) =>
              handleFieldChange("profit", text, {
                required: true,
                type: "profit",
              })
            }
            required
            extra={t("InspectionForm.Rs")}
            keyboardType={"phone-pad"}
            error={errors.profit}
          />

          <YesNoSelect
            label={t(
              "InspectionForm.Is this profitable than the existing crop / cropping system",
            )}
            required
            value={formData.isProfitable || null}
            visible={yesNoModalVisible && activeYesNoField === "isProfitable"}
            onOpen={() => {
              setActiveYesNoField("isProfitable");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) => handleyesNOFieldChange("isProfitable", value)}
          />

          <YesNoSelect
            label={t("InspectionForm.Are there any risks")}
            required
            value={formData.isRisk || null}
            visible={yesNoModalVisible && activeYesNoField === "isRisk"}
            onOpen={() => {
              setActiveYesNoField("isRisk");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) => handleyesNOFieldChange("isRisk", value)}
          />

          {formData.isRisk === "Yes" && (
            <>
              <View className="mt-4">
                <Text className="text-sm text-[#070707] mb-2">
                  {t(
                    "InspectionForm.What are the risks you are anticipating in the proposed crop / cropping system",
                  )}{" "}
                  <Text className="text-black">*</Text>
                </Text>

                <View
                  className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                    errors.risk ? "border border-red-500" : ""
                  }`}
                >
                  <TextInput
                    placeholder={t("InspectionForm.Type here...")}
                    value={formData.risk || ""}
                    onChangeText={(text) => {
                      let formattedText = text.replace(/^\s+/, "");

                      if (formattedText.length > 0) {
                        formattedText =
                          formattedText.charAt(0).toUpperCase() +
                          formattedText.slice(1);
                      }

                      updateFormData({ risk: formattedText });

                      setErrors((prev) => ({
                        ...prev,
                        risk:
                          formattedText.trim() === ""
                            ? t(
                                "Error.What are the risks you are anticipating in the proposed crop / cropping system is required",
                              )
                            : "",
                      }));
                    }}
                    multiline
                    textAlignVertical="top"
                    className="text-black"
                  />
                </View>

                {errors.risk && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.risk}
                  </Text>
                )}
              </View>

              <View className="mt-4">
                <Text className="text-sm text-[#070707] mb-2">
                  {t("InspectionForm.Do you have the solution")}{" "}
                  <Text className="text-black">*</Text>
                </Text>

                <View
                  className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                    errors.solution ? "border border-red-500" : ""
                  }`}
                >
                  <TextInput
                    placeholder={t("InspectionForm.Type here...")}
                    value={formData.solution || ""}
                    onChangeText={(text) => {
                      let formattedText = text.replace(/^\s+/, "");

                      if (formattedText.length > 0) {
                        formattedText =
                          formattedText.charAt(0).toUpperCase() +
                          formattedText.slice(1);
                      }

                      setErrors((prev) => ({
                        ...prev,
                        solution:
                          formattedText.trim() === ""
                            ? t("Error.Do you have the solution is required")
                            : "",
                      }));

                      updateFormData({
                        solution: formattedText,
                      });
                    }}
                    multiline
                    textAlignVertical="top"
                    className="text-black"
                  />
                </View>

                {errors.solution && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.solution}
                  </Text>
                )}
              </View>

              <YesNoSelect
                label={t("InspectionForm.Can the farmer manage the risks")}
                required
                value={formData.manageRisk || null}
                visible={yesNoModalVisible && activeYesNoField === "manageRisk"}
                onOpen={() => {
                  setActiveYesNoField("manageRisk");
                  setYesNoModalVisible(true);
                }}
                onClose={() => {
                  setYesNoModalVisible(false);
                  setActiveYesNoField(null);
                }}
                onSelect={(value) =>
                  handleyesNOFieldChange("manageRisk", value)
                }
              />

              <View className="mt-4">
                <Text className="text-sm text-[#070707] mb-2">
                  {t(
                    "InspectionForm.Is it worth to take the risks for anticipated profits",
                  )}{" "}
                  <Text className="text-black">*</Text>
                </Text>

                <View
                  className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                    errors.worthToTakeRisk ? "border border-red-500" : ""
                  }`}
                >
                  <TextInput
                    placeholder={t("InspectionForm.Type here...")}
                    value={formData.worthToTakeRisk || ""}
                    onChangeText={(text) => {
                      let formattedText = text.replace(/^\s+/, "");

                      if (formattedText.length > 0) {
                        formattedText =
                          formattedText.charAt(0).toUpperCase() +
                          formattedText.slice(1);
                      }

                      setErrors((prev) => ({
                        ...prev,
                        worthToTakeRisk:
                          formattedText.trim() === ""
                            ? t(
                                "Error.Is it worth to take the risks for anticipated profits is required",
                              )
                            : "",
                      }));

                      updateFormData({
                        worthToTakeRisk: formattedText,
                      });
                    }}
                    multiline
                    textAlignVertical="top"
                    className="text-black"
                  />
                </View>

                {errors.worthToTakeRisk && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.worthToTakeRisk}
                  </Text>
                )}
              </View>
            </>
          )}
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

export default ProfitRisk;
