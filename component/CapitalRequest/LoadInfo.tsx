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
import { MaterialIcons } from "@expo/vector-icons";
import FormTabs from "../CapitalRequest/FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import banksData from "@/assets/json/banks.json";
import branchesData from "@/assets/json/branches.json";

type FormData = {
  accountholderName: string;
  accountNumber: string;
  bank?: string;
  branch?: string;
};

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  required = false,
  error,
  keyboardType = "default",
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  keyboardType?: any;
}) => (
  <View className="mb-4">
    <Text className="text-sm text-[#070707] mb-1">
      {label} {required && <Text className="text-black">*</Text>}
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

type ValidationRule = {
  required?: boolean;
  type?: "accountholderName" | "accountNumber";
  minLength?: number;
  uniqueWith?: (keyof FormData)[];
};

const validateAndFormat = (
  text: string,
  rules: ValidationRule,
  t: any,
  formData: any,
  currentKey: keyof typeof formData
) => {
  let value = text;
  let error = "";

  console.log("Validating:", value, rules);

  if (rules.type === "accountholderName") {
    value = value.replace(/^\s+/, "");
    value = value.replace(/[^a-zA-Z\s]/g, "");

    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  if (rules.minLength && value.length < rules.minLength) {
    error = t("Error.Min length", { count: rules.minLength });
  }

  if (rules.type === "accountNumber") {
    value = value.replace(/[^0-9]/g, ""); 

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  return { value, error };
};

type FinanceInfoProps = {
  navigation: any;
};

const FinanceInfo: React.FC<FinanceInfoProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "FinanceInfo">>();
  const { requestNumber } = route.params;
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [availableBranches, setAvailableBranches] = useState<
    Array<{ ID: number; name: string }>
  >([]);

  console.log("finance", formData);

  const banks = banksData.map((bank) => ({
    id: bank.ID,
    name: bank.name,
  }));
  useEffect(() => {
    const requiredFields: (keyof FormData)[] = [
      "accountholderName",
      "accountNumber",
    ];

    const allFilled = requiredFields.every((key) => {
      const value = formData[key];
      return (
        value !== null && value !== undefined && value.toString().trim() !== ""
      );
    });

    const hasErrors = Object.keys(errors).length > 0;

    setIsNextEnabled(allFilled && !hasErrors);
  }, [formData, errors]);

  const STORAGE_KEY = "INSPECTION_FORM_1";

  let jobId = requestNumber;
  console.log("jobid", jobId);

  const updateFormData = async (updates: Partial<FormData>) => {
    console.log("hit update");
    try {
      const updatedFormData = {
        ...formData,
        ...updates,
        bank: selectedBank,
        branch: updates.branch ?? selectedBranch,
      };

      setFormData(updatedFormData);

      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${jobId}`,
        JSON.stringify(updatedFormData)
      );

      console.log("FormData saved:", updatedFormData);
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          const savedData = await AsyncStorage.getItem(
            `${STORAGE_KEY}_${jobId}`
          );
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setFormData(parsedData);

            if (parsedData.bank) setSelectedBank(parsedData.bank);
            if (parsedData.branch) setSelectedBranch(parsedData.branch);

            if (parsedData.bank) {
              const bankObj = banks.find((b) => b.name === parsedData.bank);
              if (bankObj) {
                const filteredBranches =
                  (branchesData as any)[bankObj.id.toString()] || [];
                setAvailableBranches(filteredBranches);
              }
            }
          }
        } catch (e) {
          console.log("Failed to load form data", e);
        }
      };

      loadFormData();
    }, [])
  );

  const handleFieldChange = (
    key: keyof typeof formData,
    text: string,
    rules: ValidationRule
  ) => {
    console.log("hit sfsf");
    const { value, error } = validateAndFormat(text, rules, t, formData, key);
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: error || "" }));

    if (!error) {
      updateFormData({ [key]: value });
    }
  };

  const handleNext = () => {
    const requiredFields: (keyof FormData)[] = [
      "accountholderName",
      "accountNumber",
    ];
    const validationErrors: Record<string, string> = {};

    requiredFields.forEach((key) => {
      const value = formData[key];
      let error = "";

      if (!value || value.trim() === "") {
        error = t(`Error.${key} is required`);
      }

      if (error) validationErrors[key] = error;
    });

    if (!confirmAccountNumber || confirmAccountNumber.trim() === "") {
      validationErrors.confirmAccountNumber = t(
        "Error.Confirm account number is required"
      );
    } else if (confirmAccountNumber !== formData.accountNumber) {
      validationErrors.confirmAccountNumber = t(
        "Error.Account numbers do not match"
      );
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));

      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("MAIN.OK") },
      ]);
      return;
    }

    navigation.navigate("IDProof", { formData, requestNumber });
  };

  const handleModalClose = (modalType: string) => {
    switch (modalType) {
      case "bank":
        setBankSearch("");
        setShowBankDropdown(false);
        break;
      case "branch":
        setBranchSearch("");
        setShowBranchDropdown(false);
        break;
    }
  };
  const handleBankSelect = (bank: { id: number; name: string }) => {
    setSelectedBank(bank.name);

    const filteredBranches = (branchesData as any)[bank.id.toString()] || [];
    setAvailableBranches(filteredBranches);

    setSelectedBranch(""); // reset branch
    setShowBankDropdown(false); // close modal
    updateFormData({
      bank: bank.name,
      branch: "", // reset branch in formData
    });
  };

  const handleBranchSelect = (branch: { ID: number; name: string }) => {
    setSelectedBranch(branch.name);
    handleModalClose("branch");
    updateFormData({
      branch: branch.name,
    });
  };

  const sortBanksAlphabetically = (
    banks: Array<{ id: number; name: string }>
  ) => {
    return [...banks].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Sort branches by name
  const sortBranchesAlphabetically = (
    branches: Array<{ ID: number; name: string }>
  ) => {
    return [...branches].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const getFilteredBanks = () => {
    if (!bankSearch) return sortBanksAlphabetically(banks);
    return sortBanksAlphabetically(
      banks.filter((bank) =>
        bank.name.toLowerCase().includes(bankSearch.toLowerCase())
      )
    );
  };

  const getFilteredBranches = () => {
    if (!branchSearch) return sortBranchesAlphabetically(availableBranches);
    return sortBranchesAlphabetically(
      availableBranches.filter((branch) =>
        branch.name.toLowerCase().includes(branchSearch.toLowerCase())
      )
    );
  };
  const renderBankItem = ({ item }: { item: { id: number; name: string } }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl"
      onPress={() => handleBankSelect(item)}
    >
      <Text className="text-base text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );

  const renderBranchItem = ({
    item,
  }: {
    item: { ID: number; name: string };
  }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl"
      onPress={() => handleBranchSelect(item)}
    >
      <Text className="text-base text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );
  const renderSearchInput = (
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string
  ) => (
    <View className="px-4 py-2 border-b border-gray-200">
      <View className="bg-gray-100 rounded-lg px-3 flex-row items-center">
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          className="flex-1 ml-2 text-base"
          placeholderTextColor="#666"
        />
        {value ? (
          <TouchableOpacity onPress={() => onChangeText("")}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="flex-row items-center justify-center py-4">
          <TouchableOpacity
            className="absolute left-4 bg-[#F3F3F3] rounded-full p-2"
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="Finance Info" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <Input
            label={t("InspectionForm.Account Holder’s Name")}
            placeholder="----"
            value={formData.accountholderName}
            onChangeText={(text) =>
              handleFieldChange("accountholderName", text, {
                required: true,
                type: "accountholderName",
              })
            }
            required
            error={errors.accountholderName}
          />

          <Input
            label={t("InspectionForm.Account Number")}
            placeholder="----"
            value={formData.accountNumber}
            onChangeText={(text) =>
              handleFieldChange("accountNumber", text, {
                required: true,
                type: "accountNumber",
              })
            }
            error={errors.accountNumber}
            keyboardType={"phone-pad"}
            required
          />

          <Input
            label={t("InspectionForm.Confirm Account Number")}
            placeholder="----"
            value={confirmAccountNumber}
            onChangeText={(text) => {
              setConfirmAccountNumber(text);

              let error = "";

              if (text.trim().length === 0) {
                error = t("Error.Confirm account number is required");
              } else if (text !== formData.accountNumber) {
                error = t("Error.Account numbers do not match");
              }

              setErrors((prev) => ({ ...prev, confirmAccountNumber: error }));
            }}
            error={errors.confirmAccountNumber}
            keyboardType="phone-pad"
            required
          />

          <View>
            <Text className="text-sm text-[#070707] mb-1">
              {t("InspectionForm.Bank Name")} *
            </Text>
            <TouchableOpacity
              className={`bg-[#F4F4F4] rounded-full px-4 py-4 flex-row justify-between items-center ${
                errors.bank ? "border border-red-500" : ""
              }`}
              onPress={() => setShowBankDropdown(true)}
            >
              <Text
                className={`${selectedBank ? "text-black" : "text-[#7D7D7D]"}`}
              >
                {selectedBank || t("InspectionForm.Select Bank")}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {errors.bank && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.bank}
              </Text>
            )}
          </View>

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-1">
              {t("InspectionForm.Branch Name")} *
            </Text>
            <TouchableOpacity
              className={`bg-[#F4F4F4] rounded-full px-4 py-4 flex-row justify-between items-center ${
                errors.branch ? "border border-red-500" : ""
              }`}
              onPress={() => setShowBranchDropdown(true)}
              disabled={availableBranches.length === 0}
            >
              <Text
                className={`${
                  selectedBranch ? "text-black" : "text-[#7D7D7D]"
                }`}
              >
                {selectedBranch || t("InspectionForm.Select Branch")}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {errors.branch && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.branch}
              </Text>
            )}
          </View>

          <View className="border-t border-[#CACACA] my-8 mb-8" />
        </ScrollView>
        <Modal
          visible={showBankDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => handleModalClose("bank")}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                <Text className="text-lg font-semibold">
                  {t("AddOfficer.SelectBank")}
                </Text>
                <TouchableOpacity onPress={() => handleModalClose("bank")}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {renderSearchInput(
                bankSearch,
                setBankSearch,
                t("AddOfficer.SearchBank") || "Search bank..."
              )}
              <FlatList
                data={getFilteredBanks()}
                renderItem={renderBankItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                className="max-h-96"
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showBranchDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => handleModalClose("branch")}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                <Text className="text-lg font-semibold">
                  {t("AddOfficer.SelectBranch")}
                </Text>
                <TouchableOpacity onPress={() => handleModalClose("branch")}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {renderSearchInput(
                branchSearch,
                setBranchSearch,
                t("AddOfficer.SearchBranch") || "Search branch..."
              )}
              <FlatList
                data={getFilteredBranches()}
                renderItem={renderBranchItem}
                keyExtractor={(item) => item.ID.toString()}
                showsVerticalScrollIndicator={false}
                className="max-h-96"
              />
            </View>
          </View>
        </Modal>
        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity
            className="flex-1 bg-[#444444] rounded-full py-4 items-center"
            onPress={() =>
              navigation.navigate("Main", {
                screen: "MainTabs",
                params: {
                  screen: "CapitalRequests",
                },
              })
            }
          >
            <Text className="text-white text-base font-semibold">
              {t("InspectionForm.Exit")}
            </Text>
          </TouchableOpacity>
          {isNextEnabled == false ? (
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

export default FinanceInfo;
