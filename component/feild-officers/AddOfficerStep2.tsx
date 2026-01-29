import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import countryData from "@/assets/json/countryflag.json";
import banksData from "@/assets/json/banks.json";
import branchesData from "@/assets/json/branches.json";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import { RouteProp, useRoute, useFocusEffect } from "@react-navigation/native";
import GlobalSearchModal from "@/component/common/GlobalSearchModal";
import { useModal } from "@/hooks/useModal";
import CustomHeader from "@/component/common/CustomHeader";

type AddOfficerStep2NavigationProps = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep2"
>;

interface AddOfficerStep2Props {
  navigation: AddOfficerStep2NavigationProps;
}

interface RouteParams {
  formData: any;
  isnewsecondstep?: boolean;
}

// Sri Lanka provinces and districts data
const sriLankaData = {
  provinces: [
    {
      name: { en: "Western", si: "බටහිර", ta: "மேற்கு" },
      districts: [
        { en: "Colombo", si: "කොළඹ", ta: "கொழும்பு" },
        { en: "Gampaha", si: "ගම්පහ", ta: "கம்பஹா" },
        { en: "Kalutara", si: "කළුතර", ta: "களுத்துறை" },
      ],
    },
    {
      name: { en: "Central", si: "මධ්‍යම", ta: "மத்திய" },
      districts: [
        { en: "Kandy", si: "මහනුවර", ta: "கண்டி" },
        { en: "Matale", si: "මාතලේ", ta: "மாதளை" },
        { en: "Nuwara Eliya", si: "නුවරඑළිය", ta: "நுவரேலியா" },
      ],
    },
    {
      name: { en: "Southern", si: "දකුණ", ta: "தெற்கு" },
      districts: [
        { en: "Galle", si: "ගාල්ල", ta: "காலி" },
        { en: "Matara", si: "මාතර", ta: "மாத்தறை" },
        { en: "Hambantota", si: "හම්බන්තොට", ta: "ஹம்பாந்தோட்டை" },
      ],
    },
    {
      name: { en: "Eastern", si: "නැගෙනහිර", ta: "கிழக்கு" },
      districts: [
        { en: "Ampara", si: "අම්පාර", ta: "அம்பாறை" },
        { en: "Batticaloa", si: "මඩකලපුව", ta: "பாட்டிக்கோடை" },
        { en: "Trincomalee", si: "ත්‍රිකුණාමලය", ta: "திருகோணமலை" },
      ],
    },
    {
      name: { en: "Northern", si: " උතුරු", ta: "வடக்கு" },
      districts: [
        { en: "Jaffna", si: "යාපනය", ta: "யாழ்ப்பாணம்" },
        { en: "Kilinochchi", si: "කිලිනොච්චි", ta: "கில்லினோச்சி" },
        { en: "Mullaitivu", si: "මුල්ලිතිවු", ta: "முல்லைத்தீவு" },
        { en: "Vavuniya", si: "වවුනියාව", ta: "வவுனியா" },
        { en: "Mannar", si: "මන්නාරම", ta: "மன்னார்" },
      ],
    },
    {
      name: { en: "North Western", si: "උතුරු මැද", ta: "வடமேல்" },
      districts: [
        { en: "Kurunegala", si: "කුරුණෑගල", ta: "குருநாகல்" },
        { en: "Puttalam", si: "පුත්තලම", ta: "புத்தளம்" },
      ],
    },
    {
      name: { en: "North Central", si: "උතුරු මධ්‍යම", ta: "வட மத்திய" },
      districts: [
        { en: "Anuradhapura", si: "අනුරාධපුර", ta: "அனுராதபுரம்" },
        { en: "Polonnaruwa", si: "පොලොන්නරුව", ta: "பொலன்னருவ" },
      ],
    },
    {
      name: { en: "Uva", si: "ඌව", ta: "உவா" },
      districts: [
        { en: "Badulla", si: "බදුල්ල", ta: "பதுளை" },
        { en: "Moneragala", si: "මොනරාගල", ta: "முனரகலை" },
      ],
    },
    {
      name: { en: "Sabaragamuwa", si: "සබරගමුව", ta: "சபரகமுவ" },
      districts: [
        { en: "Ratnapura", si: "රත්නපුර", ta: "ரத்நாபுர" },
        { en: "Kegalle", si: "කැගල්ල", ta: "கெகலே" },
      ],
    },
  ],
};

const AddOfficerStep2: React.FC<AddOfficerStep2Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, "AddOfficerStep2">>();
  const { formData: step1Data, isnewsecondstep } = route.params ?? {};

  // Modal hooks for all dropdowns
  const countryModal = useModal();
  const provinceModal = useModal();
  const districtModal = useModal();
  const bankModal = useModal();
  const branchModal = useModal();

  // Address states - store English values for backend
  const [housePlotNo, setHousePlotNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [city, setCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Sri Lanka");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Display states - for showing translated values
  const [displayCountry, setDisplayCountry] = useState("Sri Lanka");
  const [displayProvince, setDisplayProvince] = useState("");
  const [displayDistrict, setDisplayDistrict] = useState("");

  // Bank details states
  const [commissionAmount, setCommissionAmount] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Available provinces and districts based on country selection
  const [availableProvinces, setAvailableProvinces] = useState<
    Array<{ name: { en: string; si: string; ta: string } }>
  >([]);
  const [availableDistricts, setAvailableDistricts] = useState<
    Array<{ en: string; si: string; ta: string }>
  >([]);

  // Available branches based on bank selection
  const [availableBranches, setAvailableBranches] = useState<
    Array<{ ID: number; name: string }>
  >([]);

  // Process banks data
  const banks = banksData.map((bank) => ({
    id: bank.ID,
    name: bank.name,
  }));

  useFocusEffect(
    useCallback(() => {
      console.log("focus effect", isnewsecondstep);
      if (isnewsecondstep === true) {
        setHousePlotNo("");
        setStreetName("");
        setCity("");
        setSelectedProvince("");
        setSelectedDistrict("");
        setCommissionAmount("");
        setAccountHolderName("");
        setAccountNumber("");
        setConfirmAccountNumber("");
        setSelectedBank("");
        setSelectedBranch("");
        setErrors({});
      }
    }, [isnewsecondstep]),
  );

  // Get current language
  const getCurrentLanguage = () => {
    return i18n.language || "en";
  };

  // Get translated country name for display
  const getTranslatedCountry = (country: {
    name: { en: string; si: string; ta: string };
  }) => {
    const lang = getCurrentLanguage();
    return country.name[lang as keyof typeof country.name] || country.name.en;
  };

  // Get translated province name for display
  const getTranslatedProvince = (province: {
    name: { en: string; si: string; ta: string };
  }) => {
    const lang = getCurrentLanguage();
    return (
      province.name[lang as keyof typeof province.name] || province.name.en
    );
  };

  // Get translated district name for display
  const getTranslatedDistrict = (district: {
    en: string;
    si: string;
    ta: string;
  }) => {
    const lang = getCurrentLanguage();
    return district[lang as keyof typeof district] || district.en;
  };

  // Prepare data functions for GlobalSearchModal
  const getCountriesData = () => {
    return sortCountriesAlphabetically(countryData).map((country) => ({
      label: getTranslatedCountry(country),
      value: country.name.en,
      emoji: country.emoji,
      dial_code: country.dial_code,
      ...country,
    }));
  };

  const getProvincesData = () => {
    return sortProvincesAlphabetically(availableProvinces).map((province) => ({
      label: getTranslatedProvince(province),
      value: province.name.en,
      ...province,
    }));
  };

  const getDistrictsData = () => {
    return sortDistrictsAlphabetically(availableDistricts).map((district) => ({
      label: getTranslatedDistrict(district),
      value: district.en,
      ...district,
    }));
  };

  const getBanksData = () => {
    return sortBanksAlphabetically(banks).map((bank) => ({
      label: bank.name,
      value: bank.name,
      id: bank.id,
    }));
  };

  const getBranchesData = () => {
    return sortBranchesAlphabetically(availableBranches).map((branch) => ({
      label: branch.name,
      value: branch.name,
      ID: branch.ID,
    }));
  };

  // Clear specific field error
  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Field change handlers
  const handleHousePlotNoChange = (text: string) => {
    clearFieldError("housePlotNo");
    if (text.length === 0) {
      setErrors((prev) => ({
        ...prev,
        housePlotNo: t("Error.House/Plot number is required"),
      }));
    }
    setHousePlotNo(text);
  };

  const handleStreetNameChange = (text: string) => {
    clearFieldError("streetName");
    const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
    if (text.length === 0) {
      setErrors((prev) => ({
        ...prev,
        streetName: t("Error.Street name is required"),
      }));
    }
    setStreetName(capitalizedText);
  };

  const handleCityChange = (text: string) => {
    clearFieldError("city");
    if (text.length === 0) {
      setErrors((prev) => ({
        ...prev,
        city: t("Error.City is required"),
      }));
    }
    const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
    setCity(capitalizedText);
  };

  const handleCommissionAmountChange = (text: string) => {
    clearFieldError("commissionAmount");
    if (text.length === 0) {
      setErrors((prev) => ({
        ...prev,
        commissionAmount: t("Error.Commission amount is required"),
      }));
    }
    let filteredText = text.replace(/[^0-9.]/g, "");

    const dotCount = (filteredText.match(/\./g) || []).length;
    if (dotCount > 1) return;

    if (filteredText === "") {
      setCommissionAmount("");
      return;
    }

    const value = Number(filteredText);

    if (!isNaN(value) && value > 100) {
      setErrors((prev) => ({
        ...prev,
        commissionAmount: t("Error.Commission amount cannot exceed 100"),
      }));
      return;
    }

    if (value < 0) return;

    setCommissionAmount(filteredText);
  };

  const handleAccountHolderNameChange = (text: string) => {
    clearFieldError("accountHolderName");
    if (text.length === 0) {
      setErrors((prev) => ({
        ...prev,
        accountHolderName: t("Error.Account holder name is required"),
      }));
    }
    const filteredText = text.replace(/[^a-zA-Z\s]/g, "");
    const capitalizedText =
      filteredText.charAt(0).toUpperCase() + filteredText.slice(1);
    setAccountHolderName(capitalizedText);
  };

  const handleAccountNumberChange = (text: string) => {
    clearFieldError("accountNumber");
    if (text.length === 0) {
      setErrors((prev) => ({
        ...prev,
        accountNumber: t("Error.Account number is required"),
      }));
    }
    const numbersOnly = text.replace(/[^0-9]/g, "");
    setAccountNumber(numbersOnly);
  };

  const handleConfirmAccountNumberChange = (text: string) => {
    clearFieldError("confirmAccountNumber");
    if (text.length === 0) {
      setErrors((prev) => ({
        ...prev,
        confirmAccountNumber: t("Error.Confirm account number is required"),
      }));
    }
    if (text.length !== 0 && accountNumber && text !== accountNumber) {
      setErrors((prev) => ({
        ...prev,
        confirmAccountNumber: t("Error.Account numbers do not match"),
      }));
    }
    const numbersOnly = text.replace(/[^0-9]/g, "");
    setConfirmAccountNumber(numbersOnly);
  };

  // Sorting functions
  const sortCountriesAlphabetically = (countries: any[]) => {
    return [...countries].sort((a, b) => {
      const nameA = getTranslatedCountry(a).toLowerCase();
      const nameB = getTranslatedCountry(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const sortProvincesAlphabetically = (
    provinces: Array<{ name: { en: string; si: string; ta: string } }>,
  ) => {
    return [...provinces].sort((a, b) => {
      const nameA = getTranslatedProvince(a).toLowerCase();
      const nameB = getTranslatedProvince(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const sortDistrictsAlphabetically = (
    districts: Array<{ en: string; si: string; ta: string }>,
  ) => {
    return [...districts].sort((a, b) => {
      const nameA = getTranslatedDistrict(a).toLowerCase();
      const nameB = getTranslatedDistrict(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

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

  // Update display values when language changes
  useEffect(() => {
    // Update country display
    if (selectedCountry === "Sri Lanka") {
      const country = countryData.find((c) => c.name.en === "Sri Lanka");
      if (country) {
        setDisplayCountry(getTranslatedCountry(country));
      }
    } else {
      setDisplayCountry(selectedCountry);
    }

    // Update province display
    if (selectedProvince) {
      const province = sriLankaData.provinces.find(
        (p) => p.name.en === selectedProvince,
      );
      if (province) {
        setDisplayProvince(getTranslatedProvince(province));
      }
    } else {
      setDisplayProvince("");
    }

    // Update district display
    if (selectedDistrict) {
      const allDistricts = sriLankaData.provinces.flatMap((p) => p.districts);
      const district = allDistricts.find((d) => d.en === selectedDistrict);
      if (district) {
        setDisplayDistrict(getTranslatedDistrict(district));
      }
    } else {
      setDisplayDistrict("");
    }
  }, [selectedCountry, selectedProvince, selectedDistrict, i18n.language]);

  // Filter branches by selected bank
  const getBranchesByBank = (bankName: string) => {
    const bank = banks.find((b) => b.name === bankName);
    if (!bank) return [];

    const bankID = bank.id.toString();
    const branches = branchesData[bankID as keyof typeof branchesData] || [];

    return branches.map((b: any) => ({
      ID: Number(b.ID),
      name: b.name,
    }));
  };

  // Update available provinces when country changes
  useEffect(() => {
    if (selectedCountry === "Sri Lanka") {
      setAvailableProvinces(sriLankaData.provinces);
      setSelectedProvince("");
      setSelectedDistrict("");
    } else {
      setAvailableProvinces([]);
      setAvailableDistricts([]);
      setSelectedProvince("");
      setSelectedDistrict("");
    }
  }, [selectedCountry]);

  // Update available districts when province changes
  useEffect(() => {
    if (selectedProvince && selectedCountry === "Sri Lanka") {
      const province = sriLankaData.provinces.find(
        (p) => p.name.en === selectedProvince,
      );
      setAvailableDistricts(province ? province.districts : []);
      setSelectedDistrict("");
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedProvince, selectedCountry]);

  // Update available branches when bank changes
  useEffect(() => {
    if (selectedBank) {
      const branches = getBranchesByBank(selectedBank);
      setAvailableBranches(branches);
      setSelectedBranch("");
    } else {
      setAvailableBranches([]);
      setSelectedBranch("");
    }
  }, [selectedBank]);

  // Handle dropdown selections
  const handleCountrySelect = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      const country = countryData.find((c) => c.name.en === selectedValues[0]);
      if (country) {
        setSelectedCountry(country.name.en);
        setDisplayCountry(getTranslatedCountry(country));
        clearFieldError("country");
      }
    }
    countryModal.hide();
  };

  const handleProvinceSelect = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      const province = availableProvinces.find(
        (p) => p.name.en === selectedValues[0],
      );
      if (province) {
        setSelectedProvince(province.name.en);
        setDisplayProvince(getTranslatedProvince(province));
        clearFieldError("province");
      }
    }
    provinceModal.hide();
  };

  const handleDistrictSelect = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      const district = availableDistricts.find(
        (d) => d.en === selectedValues[0],
      );
      if (district) {
        setSelectedDistrict(district.en);
        setDisplayDistrict(getTranslatedDistrict(district));
        clearFieldError("district");
      }
    }
    districtModal.hide();
  };

  const handleBankSelect = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      setSelectedBank(selectedValues[0]);
      clearFieldError("bank");
    }
    bankModal.hide();
  };

  const handleBranchSelect = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      setSelectedBranch(selectedValues[0]);
      clearFieldError("branch");
    }
    branchModal.hide();
  };

  // Custom render items for GlobalSearchModal
  const renderCountryItem = (item: any, isSelected: boolean) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 flex-row items-center"
      onPress={() => handleCountrySelect([item.value])}
    >
      <Text className="text-2xl mr-3">{item.emoji}</Text>
      <View className="flex-1">
        <Text className="text-base text-gray-800 font-medium">
          {item.label}
        </Text>
        <Text className="text-sm text-gray-600">{item.dial_code}</Text>
      </View>
      {isSelected && (
        <MaterialIcons name="check" size={20} color="#21202B" />
      )}
    </TouchableOpacity>
  );

  const renderProvinceItem = (item: any, isSelected: boolean) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => handleProvinceSelect([item.value])}
    >
      <Text className="text-base text-gray-800">{item.label}</Text>
      {isSelected && (
        <MaterialIcons name="check" size={20} color="#21202B" />
      )}
    </TouchableOpacity>
  );

  const renderDistrictItem = (item: any, isSelected: boolean) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => handleDistrictSelect([item.value])}
    >
      <Text className="text-base text-gray-800">{item.label}</Text>
      {isSelected && (
        <MaterialIcons name="check" size={20} color="#21202B" />
      )}
    </TouchableOpacity>
  );

  const renderBankItem = (item: any, isSelected: boolean) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => handleBankSelect([item.value])}
    >
      <Text className="text-base text-gray-800">{item.label}</Text>
      {isSelected && (
        <MaterialIcons name="check" size={20} color="#21202B" />
      )}
    </TouchableOpacity>
  );

  const renderBranchItem = (item: any, isSelected: boolean) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => handleBranchSelect([item.value])}
    >
      <Text className="text-base text-gray-800">{item.label}</Text>
      {isSelected && (
        <MaterialIcons name="check" size={20} color="#21202B" />
      )}
    </TouchableOpacity>
  );

  // Validate all fields before proceeding
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!housePlotNo.trim())
      newErrors.housePlotNo = t("Error.House/Plot number is required");
    if (!streetName.trim())
      newErrors.streetName = t("Error.Street name is required");
    if (!city.trim()) newErrors.city = t("Error.City is required");
    if (!selectedCountry) newErrors.country = t("Error.Country is required");
    if (!selectedProvince) newErrors.province = t("Error.Province is required");
    if (!selectedDistrict) newErrors.district = t("Error.District is required");
    if (!commissionAmount.trim())
      newErrors.commissionAmount = t("Error.Commission amount is required");
    if (!accountHolderName.trim())
      newErrors.accountHolderName = t("Error.Account holder name is required");
    if (!accountNumber.trim())
      newErrors.accountNumber = t("Error.Account number is required");
    if (!confirmAccountNumber.trim())
      newErrors.confirmAccountNumber = t(
        "Error.Confirm account number is required",
      );

    if (
      accountNumber.trim() &&
      confirmAccountNumber.trim() &&
      accountNumber !== confirmAccountNumber
    ) {
      newErrors.confirmAccountNumber = t("Error.Account numbers do not match");
    }
    if (!selectedBank) newErrors.bank = t("Error.Bank is required");
    if (!selectedBranch) newErrors.branch = t("Error.Branch is required");

    if (commissionAmount && isNaN(parseFloat(commissionAmount))) {
      newErrors.commissionAmount = t(
        "Error.Commission amount must be a number",
      );
    }
    if (commissionAmount && parseFloat(commissionAmount) > 100) {
      newErrors.commissionAmount = t("Error.Commission amount cannot exceed 100");
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleNext = () => {
    Keyboard.dismiss();
    const validationErrors = validateStep2();

    if (Object.keys(validationErrors).length > 0) {
      const errorMessage = Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), `• ${errorMessage}`, [
        { text: t("Main.ok") },
      ]);
      return;
    }

    const step2Data = {
      house: housePlotNo,
      street: streetName,
      city,
      country: selectedCountry,
      province: selectedProvince,
      distrct: selectedDistrict,
      comAmount: parseFloat(commissionAmount),
      accName: accountHolderName,
      accNumber: accountNumber,
      bank: selectedBank,
      branch: selectedBranch,
    };

    const combinedData = {
      ...step1Data,
      ...step2Data,
    };

    navigation.navigate("AddOfficerStep3", {
      formData: combinedData,
      isnewthirdstep: isnewsecondstep,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <CustomHeader
        title={t("AddOfficer.AddOfficer")}
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.navigate("AddOfficerStep1", { isnew: false })}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-2">
          {/* Address Section */}
          <View className="px-2 mt-4">
            <View className="space-y-4">
              <View>
                <TextInput
                  placeholder={t("AddOfficer.HousePlotNumber")}
                  placeholderTextColor="#7D7D7D"
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                    errors.housePlotNo ? "border border-red-500" : ""
                  }`}
                  value={housePlotNo}
                  onChangeText={handleHousePlotNoChange}
                />
                {errors.housePlotNo && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.housePlotNo}
                  </Text>
                )}
              </View>

              <View>
                <TextInput
                  placeholder={t("AddOfficer.StreetName")}
                  placeholderTextColor="#7D7D7D"
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                    errors.streetName ? "border border-red-500" : ""
                  }`}
                  value={streetName}
                  onChangeText={handleStreetNameChange}
                />
                {errors.streetName && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.streetName}
                  </Text>
                )}
              </View>

              <View>
                <TextInput
                  placeholder={t("AddOfficer.City")}
                  placeholderTextColor="#7D7D7D"
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                    errors.city ? "border border-red-500" : ""
                  }`}
                  value={city}
                  onChangeText={handleCityChange}
                />
                {errors.city && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.city}
                  </Text>
                )}
              </View>

              {/* Country Dropdown */}
              <View>
                <TouchableOpacity
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center ${
                    errors.country ? "border border-red-500" : ""
                  }`}
                  onPress={countryModal.show}
                >
                  <Text
                    className={`${
                      displayCountry ? "text-black" : "text-[#7D7D7D]"
                    }`}
                  >
                    {displayCountry || t("AddOfficer.Country")}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
                {errors.country && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.country}
                  </Text>
                )}
              </View>

              {/* Province Dropdown */}
              <View>
                <TouchableOpacity
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center ${
                    errors.province ? "border border-red-500" : ""
                  }`}
                  onPress={provinceModal.show}
                  disabled={availableProvinces.length === 0}
                >
                  <Text
                    className={`${
                      displayProvince ? "text-black" : "text-[#7D7D7D]"
                    }`}
                  >
                    {displayProvince || t("AddOfficer.Province")}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
                {errors.province && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.province}
                  </Text>
                )}
              </View>

              {/* District Dropdown */}
              <View>
                <TouchableOpacity
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center ${
                    errors.district ? "border border-red-500" : ""
                  }`}
                  onPress={districtModal.show}
                  disabled={availableDistricts.length === 0}
                >
                  <Text
                    className={`${
                      displayDistrict ? "text-black" : "text-[#7D7D7D]"
                    }`}
                  >
                    {displayDistrict || t("AddOfficer.District")}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
                {errors.district && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.district}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className="border border-[#ADADAD] border-b-0 mt-6"></View>

          {/* Bank Details Section */}
          <View className="px-2 mt-6">
            <View className="space-y-4">
              <View>
                <TextInput
                  placeholder={t("AddOfficer.CommissionAmount")}
                  placeholderTextColor="#7D7D7D"
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                    errors.commissionAmount ? "border border-red-500" : ""
                  }`}
                  value={commissionAmount}
                  onChangeText={handleCommissionAmountChange}
                  keyboardType="numeric"
                />
                {errors.commissionAmount && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.commissionAmount}
                  </Text>
                )}
              </View>

              <View>
                <TextInput
                  placeholder={t("AddOfficer.AccountHolderName")}
                  placeholderTextColor="#7D7D7D"
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                    errors.accountHolderName ? "border border-red-500" : ""
                  }`}
                  value={accountHolderName}
                  onChangeText={handleAccountHolderNameChange}
                />
                {errors.accountHolderName && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.accountHolderName}
                  </Text>
                )}
              </View>

              <View>
                <TextInput
                  placeholder={t("AddOfficer.AccountNumber")}
                  placeholderTextColor="#7D7D7D"
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                    errors.accountNumber ? "border border-red-500" : ""
                  }`}
                  value={accountNumber}
                  onChangeText={handleAccountNumberChange}
                  keyboardType="numeric"
                />
                {errors.accountNumber && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.accountNumber}
                  </Text>
                )}
              </View>

              <View>
                <TextInput
                  placeholder={t("AddOfficer.ConfirmAccountNumber")}
                  placeholderTextColor="#7D7D7D"
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                    errors.confirmAccountNumber ? "border border-red-500" : ""
                  }`}
                  value={confirmAccountNumber}
                  onChangeText={handleConfirmAccountNumberChange}
                  keyboardType="numeric"
                />
                {errors.confirmAccountNumber && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.confirmAccountNumber}
                  </Text>
                )}
              </View>

              {/* Bank Dropdown */}
              <View>
                <TouchableOpacity
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center ${
                    errors.bank ? "border border-red-500" : ""
                  }`}
                  onPress={bankModal.show}
                >
                  <Text
                    className={`${
                      selectedBank ? "text-black" : "text-[#7D7D7D]"
                    }`}
                  >
                    {selectedBank || t("AddOfficer.BankName")}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
                {errors.bank && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.bank}
                  </Text>
                )}
              </View>

              {/* Branch Dropdown */}
              <View>
                <TouchableOpacity
                  className={`bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center ${
                    errors.branch ? "border border-red-500" : ""
                  }`}
                  onPress={branchModal.show}
                  disabled={availableBranches.length === 0}
                >
                  <Text
                    className={`${
                      selectedBranch ? "text-black" : "text-[#7D7D7D]"
                    }`}
                  >
                    {selectedBranch || t("AddOfficer.BranchName")}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
                {errors.branch && (
                  <Text className="text-red-500 text-sm mt-1 ml-2">
                    {errors.branch}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View className="px-2 flex-col w-full gap-4 mt-4">
            <TouchableOpacity
              className="bg-[#D9D9D9] rounded-3xl px-6 py-4 w-full items-center"
              onPress={() =>
                navigation.navigate("AddOfficerStep1", { isnew: false })
              }
            >
              <Text className="text-[#686868] font-semibold">
                {t("AddOfficer.GoBack")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black rounded-3xl px-6 py-4 w-full items-center"
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold">
                  {t("AddOfficer.Next")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Country Selection Modal using GlobalSearchModal */}
      <GlobalSearchModal
        visible={countryModal.isVisible}
        onClose={countryModal.hide}
        title={t("AddOfficer.SelectCountry")}
        data={getCountriesData()}
        selectedItems={[selectedCountry]}
        onSelect={handleCountrySelect}
        searchPlaceholder={t("AddOfficer.SearchCountry")}
        doneButtonText={t("AddOfficer.Select")}
        noResultsText={t("AddOfficer.NoCountriesFound")}
        multiSelect={false}
        renderItem={renderCountryItem}
        searchKeys={["label", "value", "name.en", "name.si", "name.ta"]}
      />

      {/* Province Selection Modal using GlobalSearchModal */}
      <GlobalSearchModal
        visible={provinceModal.isVisible}
        onClose={provinceModal.hide}
        title={t("AddOfficer.SelectProvince")}
        data={getProvincesData()}
        selectedItems={[selectedProvince]}
        onSelect={handleProvinceSelect}
        searchPlaceholder={t("AddOfficer.SearchProvince")}
        doneButtonText={t("AddOfficer.Select")}
        noResultsText={t("AddOfficer.NoProvincesFound")}
        multiSelect={false}
        renderItem={renderProvinceItem}
        searchKeys={["label", "value", "name.en", "name.si", "name.ta"]}
      />

      {/* District Selection Modal using GlobalSearchModal */}
      <GlobalSearchModal
        visible={districtModal.isVisible}
        onClose={districtModal.hide}
        title={t("AddOfficer.SelectDistrict")}
        data={getDistrictsData()}
        selectedItems={[selectedDistrict]}
        onSelect={handleDistrictSelect}
        searchPlaceholder={t("AddOfficer.SearchDistrict")}
        doneButtonText={t("AddOfficer.Select")}
        noResultsText={t("AddOfficer.NoDistrictsFound")}
        multiSelect={false}
        renderItem={renderDistrictItem}
        searchKeys={["label", "value", "en", "si", "ta"]}
      />

      {/* Bank Selection Modal using GlobalSearchModal */}
      <GlobalSearchModal
        visible={bankModal.isVisible}
        onClose={bankModal.hide}
        title={t("AddOfficer.SelectBank")}
        data={getBanksData()}
        selectedItems={[selectedBank]}
        onSelect={handleBankSelect}
        searchPlaceholder={t("AddOfficer.SearchBank")}
        doneButtonText={t("AddOfficer.Select")}
        noResultsText={t("AddOfficer.NoBanksFound")}
        multiSelect={false}
        renderItem={renderBankItem}
        searchKeys={["label", "value"]}
      />

      {/* Branch Selection Modal using GlobalSearchModal */}
      <GlobalSearchModal
        visible={branchModal.isVisible}
        onClose={branchModal.hide}
        title={t("AddOfficer.SelectBranch")}
        data={getBranchesData()}
        selectedItems={[selectedBranch]}
        onSelect={handleBranchSelect}
        searchPlaceholder={t("AddOfficer.SearchBranch")}
        doneButtonText={t("AddOfficer.Select")}
        noResultsText={t("AddOfficer.NoBranchesFound")}
        multiSelect={false}
        renderItem={renderBranchItem}
        searchKeys={["label", "value"]}
      />
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep2;