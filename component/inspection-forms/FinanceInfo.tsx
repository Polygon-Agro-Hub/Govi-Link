import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  BackHandler,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import banksData from "@/assets/json/bank-names.json";
import branchesData from "@/assets/json/bank-branches.json";
import axios from "axios";
import { environment } from "@/environment/environment";
import FormFooterButton from "./FormFooterButton";
import {
  saveFinanceInfo,
  getFinanceInfo,
  FinanceInfo as FinanceInfoData,
} from "@/database/inspectionfinance";
import { updateLastScreen } from "@/database/inspectionprogress";

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
      className={`bg-[#F6F6F6] rounded-3xl flex-row items-center ${error ? "border border-red-500" : ""
        }`}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#838B8C"
        className="px-5 h-[50px] text-base text-black flex-1"
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

  useFocusEffect(
    useCallback(() => {
      updateLastScreen(requestId, "FinanceInfo");
    }, [requestId]),
  );

  const updateFormData = useCallback((updates: Partial<FinanceInfoData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          await saveFinanceInfo(Number(requestId), formData);
        } catch (err) {
          console.error("Error auto-saving finance info:", err);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, requestId]);

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
    const accountNumbersMatch =
      formData.accountNumber === formData.confirmAccountNumber;
    const hasAssets = hasValidAssetSelection();
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

  useEffect(() => {
    if (formData.confirmAccountNumber && formData.accountNumber) {
      if (formData.confirmAccountNumber !== formData.accountNumber) {
        setErrors((prev) => ({
          ...prev,
          confirmAccountNumber: t("Error.Account numbers do not match"),
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmAccountNumber;
          return newErrors;
        });
      }
    }
  }, [formData.confirmAccountNumber, formData.accountNumber, t]);

  useEffect(() => {
    const valid = hasValidAssetSelection();
    if (!valid) {
      setErrors((prev) => ({
        ...prev,
        assets: t(
          "Error.At least one option must be selected.",
        ),
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.assets;
        return newErrors;
      });
    }
  }, [
    checkedAssets,
    formData.assetsLand,
    formData.assetsBuilding,
    formData.assetsVehicle,
    formData.assetsMachinery,
    formData.assetsFarmTool,
  ]);

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

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: FinanceInfoData,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      const transformedData = transformFinanceInfoForBackend(data);
      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        { reqId, tableName, ...transformedData },
        { headers: { "Content-Type": "application/json" } },
      );
      if (response.data.success) return true;
      console.error(`${tableName} save failed:`, response.data.message);
      return false;
    } catch (error: any) {
      console.error(`Error saving ${tableName}:`, error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return false;
    }
  };

  const fetchInspectionData = async (
    reqId: number,
  ): Promise<FinanceInfoData | null> => {
    try {
      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        { params: { reqId, tableName: "inspectionfinance" } },
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        const safeJsonParse = (field: any): string[] => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === "string") {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.warn("Failed to parse JSON field:", field);
              return [];
            }
          }
          if (typeof field === "object")
            return Array.isArray(field) ? field : [];
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
      return null;
    } catch (error: any) {
      console.error("Error fetching inspection data:", error);
      if (error.response?.status === 404) return null;
      return null;
    }
  };

  const buildCheckedAssets = (
    data: FinanceInfoData,
  ): Record<string, boolean> => {
    const checked: Record<string, boolean> = {};
    if (data.assetsLand && data.assetsLand.length > 0)
      checked.assetsLand = true;
    if (data.assetsBuilding && data.assetsBuilding.length > 0)
      checked.assetsBuilding = true;
    if (data.assetsVehicle && data.assetsVehicle.length > 0)
      checked.assetsVehicle = true;
    if (data.assetsMachinery && data.assetsMachinery.length > 0)
      checked.assetsMachinery = true;
    if (data.assetsFarmTool && data.assetsFarmTool.trim() !== "")
      checked.assetsFarmTool = true;
    return checked;
  };

  const applyBankData = (data: FinanceInfoData) => {
    if (data.bank) {
      setSelectedBank(data.bank);
      const bankObj = banks.find((b) => b.name === data.bank);
      if (bankObj) {
        setAvailableBranches(
          (branchesData as any)[bankObj.id.toString()] || [],
        );
      }
    }
    if (data.branch) setSelectedBranch(data.branch);
  };

  const validateAllFinanceFields = (
    data: FinanceInfoData,
    checked: Record<string, boolean>,
  ): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (!data.accHolder || data.accHolder.trim() === "") {
      errs.accHolder = t("Error.accHolder is required");
    }
    if (!data.accountNumber || data.accountNumber.toString().trim() === "") {
      errs.accountNumber = t("Error.accountNumber is required");
    }
    if (
      !data.confirmAccountNumber ||
      data.confirmAccountNumber.toString().trim() === ""
    ) {
      errs.confirmAccountNumber = t("Error.Confirm account number is required");
    } else if (data.confirmAccountNumber !== data.accountNumber) {
      errs.confirmAccountNumber = t("Error.Account numbers do not match");
    }
    if (!data.bank || data.bank.trim() === "") {
      errs.bank = t("Error.Bank is required");
    }
    if (!data.branch || data.branch.trim() === "") {
      errs.branch = t("Error.Branch is required");
    }

    if (!data.debtsOfFarmer || data.debtsOfFarmer.trim() === "") {
      errs.debtsOfFarmer = t("Error.debtsOfFarmer is required");
    }

    if (!data.noOfDependents || data.noOfDependents.toString().trim() === "") {
      errs.noOfDependents = t("Error.noOfDependents is required");
    }

    const anyChecked = Object.values(checked).some(Boolean);
    if (!anyChecked) {
      errs.assets = t("Error.At least one option must be selected.");
    } else {
      const assetInvalid = assetCategories.some((category) => {
        const isChecked = !!checked[category.key];
        if (!isChecked) return false;
        if (category.key === "assetsFarmTool") {
          return !(data.assetsFarmTool && data.assetsFarmTool.trim() !== "");
        }
        if (category.subCategories && category.subCategories.length > 0) {
          const value = data[category.key as keyof FinanceInfoData];
          return !(Array.isArray(value) && value.length > 0);
        }
        return false;
      });
      if (assetInvalid) {
        errs.assets = t("Error.At least one option must be selected.");
      }
    }

    return errs;
  };

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        if (isDataLoadedRef.current) return;

        try {
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              const localData = await getFinanceInfo(reqId);

              if (localData) {
                const builtChecked = buildCheckedAssets(localData);
                setFormData(localData);
                setIsExistingData(true);
                setCheckedAssets(builtChecked);
                applyBankData(localData);

                // Validation errors are delayed until user interaction or form submission
                isDataLoadedRef.current = true;
                return;
              }

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                const builtChecked = buildCheckedAssets(backendData);
                setFormData(backendData);
                setIsExistingData(true);
                setCheckedAssets(builtChecked);
                applyBankData(backendData);

                // Validation errors are delayed until user interaction or form submission
                isDataLoadedRef.current = true;
                return;
              }
            }
          }

          setIsExistingData(false);
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

  const handleFieldChange = (
    key: keyof FinanceInfoData,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(text, rules, t);
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: error || "" }));
  };

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
      if (key === "assetsFarmTool")
        return typeof value === "string" && value.trim() !== "";
      return Array.isArray(value) && value.length > 0;
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
      {
        cancelable: false,
      },
    );

    try {
      const saved = await saveToBackend(
        reqId,
        "inspectionfinance",
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
              onPress: () =>
                navigation.navigate("LandInfo", { requestNumber, requestId }),
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

  const handleModalClose = (modalType: string) => {
    if (modalType === "bank") {
      setBankSearch("");
      setShowBankDropdown(false);
    }
    if (modalType === "branch") {
      setBranchSearch("");
      setShowBranchDropdown(false);
    }
  };

  const handleBankSelect = (bank: { id: number; name: string }) => {
    setSelectedBank(bank.name);
    const filteredBranches = (branchesData as any)[bank.id.toString()] || [];
    setAvailableBranches(filteredBranches);
    setSelectedBranch("");
    setShowBankDropdown(false);

    updateFormData({ bank: bank.name, branch: "" });
    setErrors((prev) => ({ ...prev, bank: "", branch: "" }));
  };

  const handleBranchSelect = (branch: { ID: number; name: string }) => {
    setSelectedBranch(branch.name);
    handleModalClose("branch");
    updateFormData({ branch: branch.name });

    setErrors((prev) => ({ ...prev, branch: "" }));
  };

  const sortBanksAlphabetically = (
    banks: Array<{ id: number; name: string }>,
  ) =>
    [...banks].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

  const sortBranchesAlphabetically = (
    branches: Array<{ ID: number; name: string }>,
  ) =>
    [...branches].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

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

  const renderBankItem = ({ item }: { item: { id: number; name: string } }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl"
      onPress={() => handleBankSelect(item)}
    >
      <Text className="text-base text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );

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
      <View className="bg-gray-100 rounded-3xl h-[50px] px-3 flex-row items-center">
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

  const hasValidAssetSelection = (): boolean => {
    const anyChecked = Object.values(checkedAssets).some(Boolean);
    if (!anyChecked) return false;

    return assetCategories.every((category) => {
      const isChecked = !!checkedAssets[category.key];
      if (!isChecked) return true;

      if (category.key === "assetsFarmTool") {
        return !!(
          formData.assetsFarmTool && formData.assetsFarmTool.trim() !== ""
        );
      }

      if (category.subCategories && category.subCategories.length > 0) {
        const value = formData[category.key as keyof FinanceInfoData];
        return Array.isArray(value) && value.length > 0;
      }

      return true;
    });
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
    if (route) navigation.navigate(route, { requestId, requestNumber });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <FormTabs
          activeKey="Finance Info"
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
              setFormData((prev) => ({ ...prev, accountNumber: numericValue }));
              const error = !numericValue.trim()
                ? t("Error.accountNumber is required")
                : "";
              setErrors((prev) => ({ ...prev, accountNumber: error }));
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

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Bank Name")} *
            </Text>
            <TouchableOpacity
              className={`bg-[#F4F4F4] rounded-full px-4 h-[50px] flex-row justify-between items-center ${errors.bank ? "border border-red-500" : ""
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
              <View className="flex-row items-center mt-1 ml-4">
                <FontAwesome
                  name="exclamation-triangle"
                  size={16}
                  color="#EF4444"
                />
                <Text className="text-red-500 text-sm ml-1 flex-1">
                  {errors.bank}
                </Text>
              </View>
            )}
          </View>

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Branch Name")} *
            </Text>
            <TouchableOpacity
              className={`bg-[#F4F4F4] rounded-full px-4 h-[50px] flex-row justify-between items-center ${errors.branch ? "border border-red-500" : ""
                }`}
              onPress={() => setShowBranchDropdown(true)}
              disabled={availableBranches.length === 0}
            >
              <Text
                className={`${selectedBranch ? "text-black" : "text-[#7D7D7D]"}`}
              >
                {selectedBranch || t("InspectionForm.Select Branch")}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {errors.branch && (
              <View className="flex-row items-center mt-1 ml-4">
                <FontAwesome
                  name="exclamation-triangle"
                  size={16}
                  color="#EF4444"
                />
                <Text className="text-red-500 text-sm ml-1 flex-1">
                  {errors.branch}
                </Text>
              </View>
            )}
          </View>

          <View className="border-t border-[#CACACA] my-10 mb-4" />

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Existing debts of the farmer")} *
            </Text>
            <View
              className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${errors.debtsOfFarmer ? "border border-red-500" : ""
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
                  setFormData((prev) => ({
                    ...prev,
                    debtsOfFarmer: formattedText,
                  }));
                  const error =
                    formattedText.trim() === ""
                      ? t("Error.debtsOfFarmer is required")
                      : "";
                  setErrors((prev) => ({ ...prev, debtsOfFarmer: error }));
                }}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            {errors.debtsOfFarmer && (
              <View className="flex-row items-center mt-1 ml-4">
                <FontAwesome
                  name="exclamation-triangle"
                  size={16}
                  color="#EF4444"
                />
                <Text className="text-red-500 text-sm ml-1 flex-1">
                  {errors.debtsOfFarmer}
                </Text>
              </View>
            )}
          </View>

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
              keyboardType="phone-pad"
              required
            />
          </View>

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-4">
              {t("InspectionForm.Assets owned by the farmer")} *
            </Text>

            {assetCategories.map((category) => {
              const isChecked = !!checkedAssets[category.key];

              return (
                <View key={category.key} className="mb-4 ml-4">
                  <View className="flex-row items-center mb-2">
                    <Checkbox
                      value={isChecked}
                      onValueChange={(newValue) => {
                        setCheckedAssets((prev) => ({
                          ...prev,
                          [category.key]: newValue,
                        }));
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
                                  if (!updated.includes(sub.key))
                                    updated.push(sub.key);
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

                  {category.key === "assetsFarmTool" && isChecked && (
                    <View className="mt-2 ml-4">
                      <View className="bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ml-[-5%]">
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
                            updateFormData({ assetsFarmTool: formattedText });
                          }}
                          multiline
                          textAlignVertical="top"
                        />
                      </View>
                      {(!formData.assetsFarmTool || formData.assetsFarmTool.trim() === "") && (
                        <View className="flex-row items-start mt-2">
                          <FontAwesome
                            name="exclamation-triangle"
                            size={14}
                            color="#EF4444"
                            style={{ marginTop: 2 }}
                          />
                          <Text className="text-red-500 text-sm ml-2 flex-1">
                            {t("InspectionForm.Special Farm Tools Instruction")}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {errors.assets &&
              !(
                checkedAssets.assetsFarmTool &&
                (!formData.assetsFarmTool ||
                  formData.assetsFarmTool.trim() === "")
              ) && (
                <View className="flex-row items-start ml-4">
                  <FontAwesome
                    name="exclamation-triangle"
                    size={16}
                    color="#EF4444"
                    style={{ marginTop: 2 }}
                  />
                  <Text className="text-red-500 text-sm  ml-2">
                    {errors.assets}
                  </Text>
                </View>
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
            <View className="bg-white rounded-2xl w-10/12 max-h-3/4">
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
            <View className="bg-white rounded-2xl w-10/12 max-h-3/4">
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
          onExit={() =>
            navigation.navigate("IDProof", {
              formData: { inspectionpersonal: formData },
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

export default FinanceInfo;
