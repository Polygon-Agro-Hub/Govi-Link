import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import countryData from "@/assets/json/countryflag.json";
import banksData from "@/assets/json/banks.json";
import branchesData from "@/assets/json/branches.json";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import { RouteProp, useRoute } from "@react-navigation/native";

type AddOfficerStep2NavigationProps = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep2"
>;

interface AddOfficerStep2Props {
  navigation: AddOfficerStep2NavigationProps;
}

interface RouteParams {
  formData: any;
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
      name: { en: "Uva", si: "උව", ta: "உவா" },
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
  const { formData: step1Data } = route.params as RouteParams;

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

  // Dropdown states
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  // Search states
  const [countrySearch, setCountrySearch] = useState("");
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");

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
    setHousePlotNo(text);
  };

  const handleStreetNameChange = (text: string) => {
    clearFieldError("streetName");
    const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
    setStreetName(capitalizedText);
  };

  const handleCityChange = (text: string) => {
    clearFieldError("city");
    const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
    setCity(capitalizedText);
  };

  const handleCommissionAmountChange = (text: string) => {
    clearFieldError("commissionAmount");
    // Allow only numbers and decimal point
    const filteredText = text.replace(/[^0-9.]/g, "");
    setCommissionAmount(filteredText);
  };

  const handleAccountHolderNameChange = (text: string) => {
    clearFieldError("accountHolderName");
    const filteredText = text.replace(/[^a-zA-Z\s]/g, "");
    const capitalizedText =
      filteredText.charAt(0).toUpperCase() + filteredText.slice(1);
    setAccountHolderName(capitalizedText);
  };

  const handleAccountNumberChange = (text: string) => {
    clearFieldError("accountNumber");
    const numbersOnly = text.replace(/[^0-9]/g, "");
    setAccountNumber(numbersOnly);
  };

  const handleConfirmAccountNumberChange = (text: string) => {
    clearFieldError("confirmAccountNumber");
    const numbersOnly = text.replace(/[^0-9]/g, "");
    setConfirmAccountNumber(numbersOnly);
  };

  // Filter data based on search
  // const getFilteredCountries = () => {
  //   if (!countrySearch) return countryData;
  //   return countryData.filter((country) =>
  //     getTranslatedCountry(country)
  //       .toLowerCase()
  //       .includes(countrySearch.toLowerCase())
  //   );
  // };
  const getFilteredCountries = () => {
  if (!countrySearch) return sortCountriesAlphabetically(countryData);
  return sortCountriesAlphabetically(
    countryData.filter((country) =>
      getTranslatedCountry(country)
        .toLowerCase()
        .includes(countrySearch.toLowerCase())
    )
  );
};

const getFilteredProvinces = () => {
  if (!provinceSearch) return sortProvincesAlphabetically(availableProvinces);
  return sortProvincesAlphabetically(
    availableProvinces.filter((province) =>
      getTranslatedProvince(province)
        .toLowerCase()
        .includes(provinceSearch.toLowerCase())
    )
  );
};

const getFilteredDistricts = () => {
  if (!districtSearch) return sortDistrictsAlphabetically(availableDistricts);
  return sortDistrictsAlphabetically(
    availableDistricts.filter((district) =>
      getTranslatedDistrict(district)
        .toLowerCase()
        .includes(districtSearch.toLowerCase())
    )
  );
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

const sortCountriesAlphabetically = (countries: any[]) => {
  return [...countries].sort((a, b) => {
    const nameA = getTranslatedCountry(a).toLowerCase();
    const nameB = getTranslatedCountry(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

// Sort provinces by translated name
const sortProvincesAlphabetically = (provinces: Array<{ name: { en: string; si: string; ta: string } }>) => {
  return [...provinces].sort((a, b) => {
    const nameA = getTranslatedProvince(a).toLowerCase();
    const nameB = getTranslatedProvince(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

// Sort districts by translated name
const sortDistrictsAlphabetically = (districts: Array<{ en: string; si: string; ta: string }>) => {
  return [...districts].sort((a, b) => {
    const nameA = getTranslatedDistrict(a).toLowerCase();
    const nameB = getTranslatedDistrict(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

// Sort banks by name
const sortBanksAlphabetically = (banks: Array<{ id: number; name: string }>) => {
  return [...banks].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

// Sort branches by name
const sortBranchesAlphabetically = (branches: Array<{ ID: number; name: string }>) => {
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
        (p) => p.name.en === selectedProvince
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
        (p) => p.name.en === selectedProvince
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

  // Reset search when modal closes
  const handleModalClose = (modalType: string) => {
    switch (modalType) {
      case "country":
        setCountrySearch("");
        setShowCountryDropdown(false);
        break;
      case "province":
        setProvinceSearch("");
        setShowProvinceDropdown(false);
        break;
      case "district":
        setDistrictSearch("");
        setShowDistrictDropdown(false);
        break;
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

  // Handle dropdown selections with error clearing
  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country.name.en);
    setDisplayCountry(getTranslatedCountry(country));
    clearFieldError("country");
    handleModalClose("country");
  };

  const handleProvinceSelect = (province: { name: { en: string; si: string; ta: string } }) => {
    setSelectedProvince(province.name.en);
    setDisplayProvince(getTranslatedProvince(province));
    clearFieldError("province");
    handleModalClose("province");
  };

  const handleDistrictSelect = (district: { en: string; si: string; ta: string }) => {
    setSelectedDistrict(district.en);
    setDisplayDistrict(getTranslatedDistrict(district));
    clearFieldError("district");
    handleModalClose("district");
  };

  const handleBankSelect = (bank: { id: number; name: string }) => {
    setSelectedBank(bank.name);
    clearFieldError("bank");
    handleModalClose("bank");
  };

  const handleBranchSelect = (branch: { ID: number; name: string }) => {
    setSelectedBranch(branch.name);
    clearFieldError("branch");
    handleModalClose("branch");
  };

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
        "Error.Confirm account number is required"
      );
    if (!selectedBank) newErrors.bank = t("Error.Bank is required");
    if (!selectedBranch) newErrors.branch = t("Error.Branch is required");

    if (accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = t("Error.Account numbers do not match");
    }

    if (commissionAmount && isNaN(parseFloat(commissionAmount))) {
      newErrors.commissionAmount = t(
        "Error.Commission amount must be a number"
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep2()) {
      Alert.alert(
        t("Error.Validation Error"),
        t("Error.Please fix all errors before proceeding")
      );
      return;
    }

    // Prepare form data for next step
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

    // Combine step1 and step2 data
    const combinedData = {
      ...step1Data,
      ...step2Data,
    };

    navigation.navigate("AddOfficerStep3", { formData: combinedData });
  };

  // Render functions for dropdown items
  const renderCountryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl flex-row items-center"
      onPress={() => handleCountrySelect(item)}
    >
      <Text className="text-2xl mr-3">{item.emoji}</Text>
      <View className="flex-1">
        <Text className="text-base text-gray-800 font-medium">
          {getTranslatedCountry(item)}
        </Text>
        <Text className="text-sm text-gray-600">{item.dial_code}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderProvinceItem = ({
    item,
  }: {
    item: { name: { en: string; si: string; ta: string } };
  }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl"
      onPress={() => handleProvinceSelect(item)}
    >
      <Text className="text-base text-gray-800">
        {getTranslatedProvince(item)}
      </Text>
    </TouchableOpacity>
  );

  const renderDistrictItem = ({
    item,
  }: {
    item: { en: string; si: string; ta: string };
  }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl"
      onPress={() => handleDistrictSelect(item)}
    >
      <Text className="text-base text-gray-800">
        {getTranslatedDistrict(item)}
      </Text>
    </TouchableOpacity>
  );

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

  // Search input component
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={() => navigation.navigate("AddOfficerStep1")}
            className="bg-[#F6F6F680] rounded-full py-4 px-3"
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-black text-center flex-1">
            {t("AddOfficer.AddOfficer")}
          </Text>
          <View style={{ width: 55 }} />
        </View>
        <View className="p-4">
          {/* Address Section */}
          <View className="px-6 mt-4">
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
                  onPress={() => setShowCountryDropdown(true)}
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
                  onPress={() => setShowProvinceDropdown(true)}
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
                  onPress={() => setShowDistrictDropdown(true)}
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
          <View className="px-6 mt-6">
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
                  onPress={() => setShowBankDropdown(true)}
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
                  onPress={() => setShowBranchDropdown(true)}
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
          <View className="px-6 flex-col w-full gap-4 mt-4">
            <TouchableOpacity
              className="bg-[#D9D9D9] rounded-3xl px-6 py-4 w-full items-center"
              onPress={() => navigation.navigate("AddOfficerStep1")}
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

      {/* Country Dropdown Modal */}
      <Modal
        visible={showCountryDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => handleModalClose("country")}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectCountry")}
              </Text>
              <TouchableOpacity onPress={() => handleModalClose("country")}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {renderSearchInput(
              countrySearch,
              setCountrySearch,
              t("AddOfficer.SearchCountry") || "Search country..."
            )}
            <FlatList
              data={getFilteredCountries()}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              className="max-h-96"
            />
          </View>
        </View>
      </Modal>

      {/* Province Dropdown Modal */}
      <Modal
        visible={showProvinceDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => handleModalClose("province")}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectProvince")}
              </Text>
              <TouchableOpacity onPress={() => handleModalClose("province")}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {renderSearchInput(
              provinceSearch,
              setProvinceSearch,
              t("AddOfficer.SearchProvince") || "Search province..."
            )}
            <FlatList
              data={getFilteredProvinces()}
              renderItem={renderProvinceItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              className="max-h-96"
            />
          </View>
        </View>
      </Modal>

      {/* District Dropdown Modal */}
      <Modal
        visible={showDistrictDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => handleModalClose("district")}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectDistrict")}
              </Text>
              <TouchableOpacity onPress={() => handleModalClose("district")}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {renderSearchInput(
              districtSearch,
              setDistrictSearch,
              t("AddOfficer.SearchDistrict") || "Search district..."
            )}
            <FlatList
              data={getFilteredDistricts()}
              renderItem={renderDistrictItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              className="max-h-96"
            />
          </View>
        </View>
      </Modal>

      {/* Bank Dropdown Modal */}
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

      {/* Branch Dropdown Modal */}
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
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep2;
