// FinanceInfo.tsx - Finance Info with SQLite (All Functions Preserved)
import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "../CapitalRequest/FormTabs";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import banksData from "@/assets/json/banks.json";
import branchesData from "@/assets/json/branches.json";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveFinanceInfo,
  getFinanceInfo,
  FinanceInfo as FinanceInfoData,
} from "@/database/inspectionfinance";

type AssetCategory = {
  key: string;
  label: string;
  subCategories?: { key: string; label: string }[];
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
    <Text className="text-sm text-[#070707] mb-2">
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
      {error && (
      <View className="flex-row items-center mt-1 ml-4">
        <FontAwesome name="exclamation-triangle" size={16} color="#EF4444" />
        <Text className="text-red-500 text-sm ml-1"> {error}</Text>
      </View>
    )}
  </View>
);

type ValidationRule = {
  required?: boolean;
  type?: "accHolder" | "accountNumber" | "noOfDependents";
  minLength?: number;
};

const validateAndFormat = (text: string, rules: ValidationRule, t: any) => {
  let value = text;
  let error = "";

  if (rules.type === "accHolder") {
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
  }

  if (rules.type === "noOfDependents") {
    value = value.replace(/[^0-9]/g, "");
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
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();

  // Local state for form data
  const [formData, setFormData] = useState<FinanceInfoData>({
    accHolder: "",
    accountNumber: "",
    confirmAccountNumber: "",
    bank: "",
    branch: "",
    debtsOfFarmer: "",
    noOfDependents: "",
    assetsLand: [],
    assetsBuilding: [],
    assetsVehicle: [],
    assetsMachinery: [],
    assetsFarmTool: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkedAssets, setCheckedAssets] = useState<Record<string, boolean>>(
    {},
  );
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<
    Array<{ ID: number; name: string }>
  >([]);
  const isDataLoadedRef = useRef(false);

  const banks = banksData.map((bank) => ({
    id: bank.ID,
    name: bank.name,
  }));

  // Auto-save to SQLite whenever formData changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          await saveFinanceInfo(Number(requestId), formData);
          console.log("💾 Auto-saved finance info to SQLite");
        } catch (err) {
          console.error("Error auto-saving finance info:", err);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, requestId]);

  // Validate form completion
  useEffect(() => {
    const requiredFields = [
      "accHolder",
      "accountNumber",
      "confirmAccountNumber",
    ];

    const allFilled = requiredFields.every((key) => {
      const value = formData[key as keyof FinanceInfoData];
      return (
        value !== null && value !== undefined && value.toString().trim() !== ""
      );
    });

    // Check if account numbers match
    const accountNumbersMatch =
      formData.accountNumber === formData.confirmAccountNumber;

    // Check if at least one valid asset is selected
    const hasAssets = hasValidAssetSelection();

    // Check if bank and branch are selected
    const hasBankInfo = !!(
      formData.bank &&
      formData.bank.trim() !== "" &&
      formData.branch &&
      formData.branch.trim() !== ""
    );

    const hasErrors = Object.values(errors).some(
      (err) => err && err.trim() !== "",
    );

    setIsNextEnabled(
      allFilled &&
        accountNumbersMatch &&
        hasAssets &&
        hasBankInfo &&
        !hasErrors,
    );
  }, [formData, errors]);

  // Update form data
  const updateFormData = (updates: Partial<FinanceInfoData>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
      bank: updates.bank ?? selectedBank,
      branch: updates.branch ?? selectedBranch,
    }));
  };

  // Transform data for backend
  const transformFinanceInfoForBackend = (data: FinanceInfoData) => {
    return {
      accHolder: data.accHolder,
      accNum: data.accountNumber?.toString() || "",
      bank: data.bank || "",
      branch: data.branch || "",
      debtsOfFarmer: data.debtsOfFarmer || "",
      noOfDependents: data.noOfDependents
        ? parseInt(data.noOfDependents)
        : null,
      assetsLand:
        data.assetsLand && data.assetsLand.length > 0
          ? JSON.stringify(data.assetsLand)
          : null,
      assetsBuilding:
        data.assetsBuilding && data.assetsBuilding.length > 0
          ? JSON.stringify(data.assetsBuilding)
          : null,
      assetsVehicle:
        data.assetsVehicle && data.assetsVehicle.length > 0
          ? JSON.stringify(data.assetsVehicle)
          : null,
      assetsMachinery:
        data.assetsMachinery && data.assetsMachinery.length > 0
          ? JSON.stringify(data.assetsMachinery)
          : null,
      assetsFarmTool:
        data.assetsFarmTool && data.assetsFarmTool.trim() !== ""
          ? data.assetsFarmTool
          : null,
    };
  };

  // Save to backend
  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: FinanceInfoData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName,
      );
      console.log(`📝 reqId being sent:`, reqId);

      const transformedData = transformFinanceInfoForBackend(data);

      console.log(`📦 Original data:`, data);
      console.log(`📦 Transformed data:`, transformedData);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        {
          reqId,
          tableName,
          ...transformedData,
        },
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

  // Fetch from backend
  const fetchInspectionData = async (
    reqId: number,
  ): Promise<FinanceInfoData | null> => {
    try {
      console.log(`🔍 Fetching inspection data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectionfinance",
          },
        },
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing data:`, response.data.data);

        const data = response.data.data;

        const safeJsonParse = (field: any): string[] => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === "string") {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.warn(`Failed to parse JSON field:`, field);
              return [];
            }
          }
          if (typeof field === "object") {
            return Array.isArray(field) ? field : [];
          }
          return [];
        };

        return {
          accHolder: data.accHolder || "",
          accountNumber: data.accNum || "",
          confirmAccountNumber: data.accNum || "",
          bank: data.bank || "",
          branch: data.branch || "",
          debtsOfFarmer: data.debtsOfFarmer || "",
          noOfDependents: data.noOfDependents?.toString() || "",
          assetsLand: safeJsonParse(data.assetsLand),
          assetsBuilding: safeJsonParse(data.assetsBuilding),
          assetsVehicle: safeJsonParse(data.assetsVehicle),
          assetsMachinery: safeJsonParse(data.assetsMachinery),
          assetsFarmTool: data.assetsFarmTool || "",
        };
      }

      console.log(`📭 No existing data found for reqId: ${reqId}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching inspection data:`, error);
      console.error("Error details:", error.response?.data);

      if (error.response?.status === 404) {
        console.log(`📝 No existing record - will create new`);
        return null;
      }
      return null;
    }
  };


  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        if (isDataLoadedRef.current) {
          console.log("⏭️ Data already loaded, skipping...");
          return;
        }

        try {
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              // First try SQLite
              const localData = await getFinanceInfo(reqId);

              if (localData) {
                console.log(`✅ Loaded data from SQLite`);
                setFormData(localData);
                setIsExistingData(true);

                // Update checkedAssets based on loaded data
                const newCheckedAssets: Record<string, boolean> = {};
                if (localData.assetsLand && localData.assetsLand.length > 0) {
                  newCheckedAssets.assetsLand = true;
                }
                if (
                  localData.assetsBuilding &&
                  localData.assetsBuilding.length > 0
                ) {
                  newCheckedAssets.assetsBuilding = true;
                }
                if (
                  localData.assetsVehicle &&
                  localData.assetsVehicle.length > 0
                ) {
                  newCheckedAssets.assetsVehicle = true;
                }
                if (
                  localData.assetsMachinery &&
                  localData.assetsMachinery.length > 0
                ) {
                  newCheckedAssets.assetsMachinery = true;
                }
                if (
                  localData.assetsFarmTool &&
                  localData.assetsFarmTool.trim() !== ""
                ) {
                  newCheckedAssets.assetsFarmTool = true;
                }
                setCheckedAssets(newCheckedAssets);

                if (localData.bank) {
                  setSelectedBank(localData.bank);
                  const bankObj = banks.find((b) => b.name === localData.bank);
                  if (bankObj) {
                    const filteredBranches =
                      (branchesData as any)[bankObj.id.toString()] || [];
                    setAvailableBranches(filteredBranches);
                  }
                }

                if (localData.branch) {
                  setSelectedBranch(localData.branch);
                }

                isDataLoadedRef.current = true;
                return;
              }

              // If no SQLite data, try backend
              console.log(
                `🔄 Attempting to fetch data from backend for reqId: ${reqId}`,
              );
              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded data from backend`);
                setFormData(backendData);
                setIsExistingData(true);

                // Update checkedAssets based on loaded backend data
                const newCheckedAssets: Record<string, boolean> = {};
                if (
                  backendData.assetsLand &&
                  backendData.assetsLand.length > 0
                ) {
                  newCheckedAssets.assetsLand = true;
                }
                if (
                  backendData.assetsBuilding &&
                  backendData.assetsBuilding.length > 0
                ) {
                  newCheckedAssets.assetsBuilding = true;
                }
                if (
                  backendData.assetsVehicle &&
                  backendData.assetsVehicle.length > 0
                ) {
                  newCheckedAssets.assetsVehicle = true;
                }
                if (
                  backendData.assetsMachinery &&
                  backendData.assetsMachinery.length > 0
                ) {
                  newCheckedAssets.assetsMachinery = true;
                }
                if (
                  backendData.assetsFarmTool &&
                  backendData.assetsFarmTool.trim() !== ""
                ) {
                  newCheckedAssets.assetsFarmTool = true;
                }
                setCheckedAssets(newCheckedAssets);

                if (backendData.bank) {
                  setSelectedBank(backendData.bank);
                  const bankObj = banks.find(
                    (b) => b.name === backendData.bank,
                  );
                  if (bankObj) {
                    const filteredBranches =
                      (branchesData as any)[bankObj.id.toString()] || [];
                    setAvailableBranches(filteredBranches);
                  }
                }

                if (backendData.branch) {
                  setSelectedBranch(backendData.branch);
                }

                isDataLoadedRef.current = true;
                return;
              }
            }
          }

          setIsExistingData(false);
          console.log("📝 No existing data - new entry");
          isDataLoadedRef.current = true;
        } catch (e) {
          console.error("Failed to load form data", e);
          setIsExistingData(false);
          isDataLoadedRef.current = true;
        }
      };

      loadFormData();

      return () => {
        isDataLoadedRef.current = false;
      };
    }, [requestId]),
  );

  // Handle field change
  const handleFieldChange = (
    key: keyof FinanceInfoData,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(text, rules, t);

    setFormData((prev) => ({
      ...prev,
      [key]: value,
      bank: selectedBank,
      branch: prev.branch ?? selectedBranch,
    }));

    setErrors((prev) => ({ ...prev, [key]: error || "" }));
  };

  // Handle next button
  const handleNext = async () => {
    const validationErrors: Record<string, string> = {};

    if (!formData.accHolder || formData.accHolder.trim() === "") {
      validationErrors.accHolder = t("Error.accHolder is required");
    }

    if (
      !formData.accountNumber ||
      formData.accountNumber.toString().trim() === ""
    ) {
      validationErrors.accountNumber = t("Error.accountNumber is required");
    }

    if (!formData.confirmAccountNumber) {
      validationErrors.confirmAccountNumber = t(
        "Error.Confirm account number is required",
      );
    } else if (formData.confirmAccountNumber !== formData.accountNumber) {
      validationErrors.confirmAccountNumber = t(
        "Error.Account numbers do not match",
      );
    }
    // Validate at least one valid asset selection
    if (!hasValidAssetSelection()) {
      validationErrors.assets = t(
        "Error.At least one option must be selected.",
      );
    }

    const assetKeys: (keyof FinanceInfoData)[] = [
      "assetsLand",
      "assetsBuilding",
      "assetsVehicle",
      "assetsMachinery",
      "assetsFarmTool",
    ];

    const anyAssetSelected = assetKeys.some((key) => {
      const value = formData[key];
      if (key === "assetsFarmTool") {
        return typeof value === "string" && value.trim() !== "";
      } else {
        return Array.isArray(value) && value.length > 0;
      }
    });

    if (!anyAssetSelected) {
      validationErrors.assets = t(
        "Error.At least one option must be selected.",
      );
    }

    if (!formData.bank || formData.bank === "") {
      validationErrors.bank = t("Error.Bank is required");
    }
    if (!formData.branch || formData.branch === "") {
      validationErrors.branch = t("Error.Branch is required");
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
      console.log(
        `🚀 Saving to backend (${isExistingData ? "UPDATE" : "INSERT"})`,
      );

      const saved = await saveToBackend(
        reqId,
        "inspectionfinance",
        formData,
        isExistingData,
      );

      if (saved) {
        console.log("✅ Finance info saved successfully to backend");
        setIsExistingData(true);

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("LandInfo", {
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
                navigation.navigate("LandInfo", {
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
              navigation.navigate("LandInfo", {
                requestNumber,
                requestId,
              });
            },
          },
        ],
      );
    }
  };

  // Modal handlers
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

    setSelectedBranch("");
    setShowBankDropdown(false);
    updateFormData({
      bank: bank.name,
      branch: "",
    });
  };

  const handleBranchSelect = (branch: { ID: number; name: string }) => {
    setSelectedBranch(branch.name);
    handleModalClose("branch");
    updateFormData({
      branch: branch.name,
    });
  };

  // Sorting functions
  const sortBanksAlphabetically = (
    banks: Array<{ id: number; name: string }>,
  ) => {
    return [...banks].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const sortBranchesAlphabetically = (
    branches: Array<{ ID: number; name: string }>,
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
        bank.name.toLowerCase().includes(bankSearch.toLowerCase()),
      ),
    );
  };

  const getFilteredBranches = () => {
    if (!branchSearch) return sortBranchesAlphabetically(availableBranches);
    return sortBranchesAlphabetically(
      availableBranches.filter((branch) =>
        branch.name.toLowerCase().includes(branchSearch.toLowerCase()),
      ),
    );
  };

  // Render functions
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
    placeholder: string,
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

  // Asset categories
  const assetCategories: AssetCategory[] = [
    {
      key: "assetsLand",
      label: t("InspectionForm.Land"),
      subCategories: [
        {
          key: "Land Residential",
          label: t("InspectionForm.Land Residential"),
        },
        { key: "Land Farm", label: t("InspectionForm.Land Farm") },
      ],
    },
    {
      key: "assetsBuilding",
      label: t("InspectionForm.Building"),
      subCategories: [
        {
          key: "House Residential",
          label: t("InspectionForm.House Residential"),
        },
        {
          key: "Building at the farm",
          label: t("InspectionForm.Building at the farm"),
        },
      ],
    },
    {
      key: "assetsVehicle",
      label: t("InspectionForm.Vehicle"),
      subCategories: [
        { key: "Motor bike", label: t("InspectionForm.Motor bike") },
        { key: "Three Wheeler", label: t("InspectionForm.Three Wheeler") },
        { key: "Motor car", label: t("InspectionForm.Motor car") },
        { key: "Motor van", label: t("InspectionForm.Motor van") },
        { key: "Tractor", label: t("InspectionForm.Tractor") },
      ],
    },
    {
      key: "assetsMachinery",
      label: t("InspectionForm.Machinery"),
      subCategories: [
        {
          key: "Combined Harvestor",
          label: t("InspectionForm.Combined Harvestor"),
        },
        { key: "JCB", label: t("InspectionForm.JCB") },
      ],
    },
    {
      key: "assetsFarmTool",
      label: t("InspectionForm.Special Farm Tools"),
    },
  ];

  // Check if any selected category has no sub-items
  const hasAssetWarnings = (): boolean => {
    return assetCategories.some((category) => {
      const isCategorySelected = formData.hasOwnProperty(category.key);
      return (
        isCategorySelected &&
        category.key !== "assetsFarmTool" &&
        ((formData[category.key as keyof FinanceInfoData] as string[]) || [])
          .length === 0
      );
    });
  };

  const hasValidAssetSelection = (): boolean => {
    // Check if Special Farm Tool has text
    if (formData.assetsFarmTool && formData.assetsFarmTool.trim() !== "") {
      return true;
    }

    // Check if any category with sub-items has at least one sub-item selected
    const categoryKeys: (keyof FinanceInfoData)[] = [
      "assetsLand",
      "assetsBuilding",
      "assetsVehicle",
      "assetsMachinery",
    ];

    return categoryKeys.some((key) => {
      const value = formData[key];
      return Array.isArray(value) && value.length > 0;
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <StatusBar barStyle="dark-content" />
        <FormTabs activeKey="Finance Info" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          <Input
            label={t("InspectionForm.Account Holder Name")}
            placeholder="----"
            value={formData.accHolder || ""}
            onChangeText={(text) =>
              handleFieldChange("accHolder", text, {
                required: true,
                type: "accHolder",
              })
            }
            required
            error={errors.accHolder}
          />

          <Input
            label={t("InspectionForm.Account Number")}
            placeholder="----"
            value={formData.accountNumber?.toString() || ""}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, "");
              setFormData((prev) => ({
                ...prev,
                accountNumber: numericValue,
              }));
              updateFormData({ accountNumber: numericValue });
            }}
            error={errors.accountNumber}
            keyboardType="number-pad"
            required
          />

          <Input
            label={t("InspectionForm.Confirm Account Number")}
            placeholder="----"
            value={formData.confirmAccountNumber?.toString() || ""}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, "");
              setFormData((prev) => ({
                ...prev,
                confirmAccountNumber: numericValue,
              }));
              updateFormData({ confirmAccountNumber: numericValue });

              let error = "";
              if (!numericValue) {
                error = t("Error.Confirm account number is required");
              } else if (numericValue !== formData.accountNumber) {
                error = t("Error.Account numbers do not match");
              }
              setErrors((prev) => ({ ...prev, confirmAccountNumber: error }));
            }}
            error={errors.confirmAccountNumber}
            keyboardType="number-pad"
            required
          />
          {/* Bank Name Dropdown */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
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

          {/* Branch Name Dropdown */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
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

          <View className="border-t border-[#CACACA] my-10 mb-4" />

          {/* Existing Debts */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Existing debts of the farmer")} *
            </Text>
            <View
              className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                errors.debtsOfFarmer ? "border border-red-500" : ""
              }`}
            >
              <TextInput
                placeholder={t("InspectionForm.Type here...")}
                value={formData.debtsOfFarmer || ""}
                onChangeText={(text) => {
                  let formattedText = text.replace(/^\s+/, "");

                  if (formattedText.length > 0) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }

                  updateFormData({
                    debtsOfFarmer: formattedText,
                  });

                  // Validation
                  const error =
                    formattedText.trim() === ""
                      ? t("Error.debtsOfFarmer is required")
                      : "";
                  setErrors((prev) => ({
                    ...prev,
                    debtsOfFarmer: error,
                  }));
                }}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            {errors.debtsOfFarmer && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.debtsOfFarmer}
              </Text>
            )}
          </View>

          {/* No of Dependents */}
          <View className="mt-4">
            <Input
              label={t("InspectionForm.No of Dependents")}
              placeholder={t("InspectionForm.0 or more")}
              value={formData.noOfDependents || ""}
              onChangeText={(text) =>
                handleFieldChange("noOfDependents", text, {
                  required: true,
                  type: "noOfDependents",
                })
              }
              error={errors.noOfDependents}
              keyboardType={"phone-pad"}
              required
            />
          </View>

          {/* Assets owned by the farmer */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-4">
              {t("InspectionForm.Assets owned by the farmer")} *
            </Text>

            {assetCategories.map((category) => {
              const isChecked = !!checkedAssets[category.key];

              return (
                <View key={category.key} className="mb-4 ml-4">
                  {/* MAIN CATEGORY */}
                  <View className="flex-row items-center mb-2">
                    <Checkbox
                      value={isChecked}
                      onValueChange={(newValue) => {
                        setCheckedAssets((prev) => ({
                          ...prev,
                          [category.key]: newValue,
                        }));

                        // Clear data ONLY when unchecked
                        if (!newValue) {
                          updateFormData({
                            [category.key]:
                              category.key === "assetsFarmTool" ? "" : [],
                          } as Partial<FinanceInfoData>);
                        }
                      }}
                      color={isChecked ? "#000" : undefined}
                      style={{ borderRadius: 6 }}
                    />

                    <Text className="ml-2 text-black">{category.label}</Text>
                  </View>

                  {/* SUB CATEGORIES */}
                  {isChecked && category.subCategories && (
                    <View className="ml-6 mt-2">
                      {category.subCategories.map((sub) => {
                        const currentArray =
                          (formData[
                            category.key as keyof FinanceInfoData
                          ] as string[]) || [];

                        const isSubSelected = currentArray.includes(sub.key);

                        return (
                          <View
                            key={sub.key}
                            className="flex-row items-center mb-2"
                          >
                            <Checkbox
                              value={isSubSelected}
                              onValueChange={(newValue) => {
                                let updated = [...currentArray];

                                if (newValue) {
                                  if (!updated.includes(sub.key)) {
                                    updated.push(sub.key);
                                  }
                                } else {
                                  updated = updated.filter(
                                    (item) => item !== sub.key,
                                  );
                                }

                                updateFormData({
                                  [category.key]: updated,
                                } as Partial<FinanceInfoData>);
                              }}
                              color={isSubSelected ? "#000" : undefined}
                              style={{ borderRadius: 6 }}
                            />

                            <Text className="ml-2 text-black">{sub.label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* FARM TOOL TEXTAREA */}
                  {category.key === "assetsFarmTool" && isChecked && (
                    <View className="mt-2 bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ml-[-5%]">
                      <TextInput
                        placeholder={t("InspectionForm.Type here...")}
                        value={formData.assetsFarmTool || ""}
                        onChangeText={(text) => {
                          let formattedText = text.replace(/^\s+/, "");

                          if (formattedText.length > 0) {
                            formattedText =
                              formattedText.charAt(0).toUpperCase() +
                              formattedText.slice(1);
                          }

                          updateFormData({
                            assetsFarmTool: formattedText,
                          });
                        }}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {errors.assets && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.assets}
              </Text>
            )}
          </View>
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
                t("AddOfficer.SearchBank") || "Search bank...",
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
                t("AddOfficer.SearchBranch") || "Search branch...",
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

export default FinanceInfo;
