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
import axios from "axios";
import { environment } from "@/environment/environment";
import Checkbox from "expo-checkbox";
import { AntDesign } from "@expo/vector-icons";
import countryData from "@/assets/json/countryflag.json";
import sriLankaData from "@/assets/json/provinceDistrict.json";
import districtData from "@/assets/json/Districts.json";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";

interface District {
  en: string;
  si: string;
  ta: string;
}

interface DistrictsMap {
  [country: string]: District[];
}

type PersonalInfo = {
  firstName: string;
  lastName: string;
  otherNames: string;
  callName: string;
  mobile1: string;
  mobile2: string;
  familyPhone: string;
  landPhoneHome: string;
  landPhoneWork: string;
  email1: string;
  email2: string;
  houseNumber: string;
  streetName: string;
  cityName: string;
  district: string | null;
  province: string | null;
  country: string;
};

type FormData = {
  personalInfo: PersonalInfo;
};


const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  required = false,
  error,
  keyboardType = "default",
  isMobile = false,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  keyboardType?: any;
  isMobile?: boolean;
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
      {isMobile ? (
        <View className="flex-row flex-1 items-center">
          <Text className="px-5 text-base text-black">+94</Text>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#838B8C"
            className="flex-1 px-2 py-4 text-base text-black"
            value={value}
            onChangeText={onChangeText}
            keyboardType="phone-pad"
            maxLength={9}
          />
        </View>
      ) : (
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#838B8C"
          className="px-5 py-4 text-base text-black flex-1"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      )}
    </View>

    {error && <Text className="text-red-500 text-sm mt-1 ml-4">{error}</Text>}
  </View>
);

type ValidationRule = {
  required?: boolean;
  type?:
    | "firstName"
    | "lastName"
    | "email"
    | "mobile1"
    | "mobile2"
    | "familyPhone"
    | "otherNames"
    | "callName"
    | "landPhoneHome"
    | "landPhoneWork"
    | "streetName"
    | "email1"
    | "email2"
    | "cityName"
    | "houseNumber";
  minLength?: number;
 uniqueWith?: (keyof PersonalInfo)[];
};


const validateGmailLocalPart = (localPart: string): boolean => {
  const validCharsRegex = /^[a-zA-Z0-9.+]+$/;

  if (!validCharsRegex.test(localPart)) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
  if (localPart.includes("..")) return false;
  if (localPart.length === 0) return false;

  return true;
};

const validateEmail = (email: string): boolean => {
  console.log("hit email v")
  const generalEmailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!generalEmailRegex.test(email)) return false;

  const emailLower = email.toLowerCase();
  const [localPart, domain] = emailLower.split("@");

  const allowedTLDs = [".com", ".gov", ".lk"];

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return validateGmailLocalPart(localPart);
  }

  if (domain === "yahoo.com") {
    return true;
  }

  return allowedTLDs.some((tld) => domain.endsWith(tld));
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

  // Filtering
  if (
    rules.type === "firstName" ||
    rules.type === "lastName" ||
    rules.type === "otherNames" ||
    rules.type === "callName" ||
    rules.type === "houseNumber" ||
    rules.type === "cityName" ||
    rules.type === "streetName"
  ) {
    value = value.replace(/^\s+/, "");
    value = value.replace(/[^a-zA-Z\s]/g, "").toLowerCase();

    value = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : "";
    console.log("hit", value);

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

if (rules.type === "email1" || rules.type === "email2") {
  value = value.trim();

  if (value.length === 0 && rules.type === "email1") {
    error = rules.required ? t("Error.Email is required") : "";
  } 
  else if (value.length > 0) {
    if (!validateEmail(value)) {
      const domain = value.toLowerCase().split("@")[1];

      if (domain === "gmail.com" || domain === "googlemail.com") {
        error = t("Error.Invalid Gmail address");
      } else {
        error = t("Error.Invalid email address Example");
      }
    } 
    else if (rules.uniqueWith) {
      const isDuplicate = rules.uniqueWith.some(
        (key) =>
          formData[key]?.toLowerCase().trim() === value.toLowerCase().trim() &&
          key !== currentKey
      );

      if (isDuplicate) {
        error = t("Error.Email addresses cannot be the same");
      }
    }
  }
}



  if (rules.minLength && value.length < rules.minLength) {
    error = t("Error.Min length", { count: rules.minLength });
  }

  if (
    rules.type === "mobile1" ||
    rules.type === "mobile2" ||
    rules.type === "familyPhone"
  ) {
    let numbersOnly = value.replace(/[^0-9]/g, "");

    numbersOnly = numbersOnly.replace(/^0+/, "");

    if (numbersOnly.length > 9) {
      numbersOnly = numbersOnly.slice(0, 9);
    }

    value = numbersOnly;

    if (numbersOnly.length === 0) {
      error = t("Error.Phone number is required");
    } else if (!numbersOnly.startsWith("7")) {
      error = t("Error.Invalid phone number");
    } else if (numbersOnly.length < 9) {
      error = t("Error.Phone number must be 9 digits long");
    } else if (rules.uniqueWith) {
      const isDuplicate = rules.uniqueWith.some(
        (key) =>
          formData[key]?.replace(/[^0-9]/g, "").replace(/^0+/, "") ===
            numbersOnly && key !== currentKey
      );

      if (isDuplicate) {
        error = t("Error.Phone numbers cannot be the same");
      }
    }
  }

  if (rules.type === "landPhoneHome" || rules.type === "landPhoneWork") {
    let numbersOnly = value.replace(/[^0-9]/g, "");

    numbersOnly = numbersOnly.replace(/^0+/, "");

    if (numbersOnly.length > 9) {
      numbersOnly = numbersOnly.slice(0, 9);
    }

    value = numbersOnly;
    if (numbersOnly.length != 0 && numbersOnly.length < 9) {
      error = t("Error.Phone number must be 9 digits long");
    } else if (rules.uniqueWith) {
      const isDuplicate = rules.uniqueWith.some(
        (key) =>
          formData[key]?.replace(/[^0-9]/g, "").replace(/^0+/, "") ===
            numbersOnly &&
          key !== currentKey &&
          numbersOnly.length > 0
      );

      if (isDuplicate) {
        error = t("Error.Phone numbers cannot be the same");
      }
    }
  }

  return { value, error };
};

type InspectionForm1Props = {
  navigation: any;
};

const InspectionForm1: React.FC<InspectionForm1Props> = ({ navigation }) => {
    const route = useRoute<RouteProp<RootStackParamList, "PersonalInfo">>();
    const {requestNumber } = route.params;
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [displayProvince, setDisplayProvince] = useState("");
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Sri Lanka");
  const [displayCountry, setDisplayCountry] = useState(
    t("InspectionForm.Sri Lanka")
  );
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
const [formData, setFormData] = useState<FormData>({
  personalInfo: {
    firstName: "",
    lastName: "",
    otherNames: "",
    callName: "",
    mobile1: "",
    mobile2: "",
    familyPhone: "",
    landPhoneHome: "",
    landPhoneWork: "",
    email1: "",
    email2: "",
    houseNumber: "",
    streetName: "",
    cityName: "",
    district: null,
    province: null,
    country: "Sri Lanka",
  },
});

  console.log(formData)
  const districts: DistrictsMap = districtData;

  useEffect(() => {
  const requiredFields: (keyof PersonalInfo)[] = [
    "firstName",
    "lastName",
    "otherNames",
    "callName",
    "mobile1",
    "familyPhone",
    "email1",
    "houseNumber",
    "streetName",
    "cityName",
    "district",
    "province",
    "country",
  ];
  const allFilled = requiredFields.every((key) => {
    const value = formData.personalInfo[key];
    return value !== null && value !== undefined && value.toString().trim() !== "";
  });

  const hasErrors = Object.keys(errors).length > 0;

  setIsNextEnabled(allFilled && !hasErrors);
}, [formData, errors]);



  let jobId = requestNumber;
  console.log("jobid", jobId)

const updateFormData = async (
  updates: Partial<PersonalInfo>
) => {
  const updatedData: FormData = {
    ...formData,
    personalInfo: {
      ...formData.personalInfo,
      ...updates,
    },
  };

  setFormData(updatedData);

  try {
    await AsyncStorage.setItem(
      `${jobId}`,
      JSON.stringify(updatedData)
    );
  } catch (e) {
    console.log("AsyncStorage save failed", e);
  }
};

  const handleFieldChange = (
  key: keyof PersonalInfo,
  text: string,
  rules: ValidationRule
) => {
  const { value, error } = validateAndFormat(
    text,
    rules,
    t,
    formData.personalInfo,
    key
  );

  // Update state
  setFormData((prev) => ({
    ...prev,
    personalInfo: {
      ...prev.personalInfo,
      [key]: value,
    },
  }));

  // Errors
  setErrors((prev) => {
    const newErrors = { ...prev };

    if (error) newErrors[key] = error;
    else delete newErrors[key];

    // Revalidate unique fields
    if (rules.uniqueWith) {
      rules.uniqueWith.forEach((relatedKey) => {
        const relatedValue = formData.personalInfo[relatedKey];
        if (!relatedValue) {
          delete newErrors[relatedKey];
          return;
        }

        const { error: relatedError } = validateAndFormat(
          relatedValue,
          rules,
          t,
          {
            ...formData.personalInfo,
            [key]: value,
          },
          relatedKey
        );

        if (relatedError) newErrors[relatedKey] = relatedError;
        else delete newErrors[relatedKey];
      });
    }

    return newErrors;
  });

  // Save only if valid
  if (!error) {
    updateFormData({ [key]: value });
  }
};

useFocusEffect(
  useCallback(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem(`${jobId}`);
        console.log("saved", saved);

        if (saved) {
          const parsed = JSON.parse(saved);

          // Set the full formData object correctly
          setFormData({
            personalInfo: parsed.personalInfo || {
              firstName: "",
              lastName: "",
              otherNames: "",
              callName: "",
              mobile1: "",
              mobile2: "",
              familyPhone: "",
              landPhoneHome: "",
              landPhoneWork: "",
              email1: "",
              email2: "",
              houseNumber: "",
              streetName: "",
              cityName: "",
              district: null,
              province: null,
              country: "Sri Lanka",
            },
          });

          const personal = parsed.personalInfo || {};

          setSelectedDistrict(personal.district || null);
          setSelectedCountry(personal.country || "Sri Lanka");

          const provinceObj = sriLankaData["Sri Lanka"].provinces.find(
            (prov) => prov.name.en === personal.province
          );
          setSelectedProvince(provinceObj?.name.en || null);
          setDisplayProvince(
            provinceObj
              ? provinceObj.name[i18n.language as keyof typeof provinceObj.name] ||
                provinceObj.name.en
              : ""
          );

          const countryObj = countryData.find(
            (c) => c.name.en === personal.country
          );
          setDisplayCountry(
            countryObj
              ? countryObj.name[i18n.language as keyof typeof countryObj.name] ||
                countryObj.name.en
              : personal.country || "Sri Lanka"
          );
        }
      } catch (error) {
        console.log("Failed to load saved data", error);
      }
    };

    loadData();
  }, [i18n.language])
);

 

  const getFilteredDistricts = () => {
    const countryDistricts = districts[selectedCountry] || [];

    if (countryDistricts.length === 0) return [];

    if (districtSearch.trim()) {
      const searchTerm = districtSearch.toLowerCase();
      return countryDistricts.filter(
        (d) =>
          d.en.toLowerCase().includes(searchTerm) ||
          d.si.includes(districtSearch) ||
          d.ta.includes(districtSearch)
      );
    }

    return countryDistricts;
  };

  const clearSearch = () => setDistrictSearch("");

  const selectDistrict = async (district: {
    en: string;
    si: string;
    ta: string;
  }) => {
    setSelectedDistrict(district.en);


    const province = sriLankaData["Sri Lanka"].provinces.find((prov) =>
      prov.districts.some((d) => d.en === district.en)
    );

    const displayProv = province
      ? province.name[i18n.language as keyof typeof province.name] ||
        province.name.en
      : "";

    setSelectedProvince(province?.name.en || null);
    setDisplayProvince(displayProv);
    updateFormData({
      district: district.en,
      province: province?.name.en,
    });
      setErrors((prev) => {
    const newErrors = { ...prev };
    delete newErrors.district;
    return newErrors;
  });
    setShowDistrictDropdown(false);
  };

  const getFilteredCountries = () => {
    if (!countryData || countryData.length === 0) return [];
    if (!countrySearch) return countryData;

    const term = countrySearch.toLowerCase();
    return countryData.filter(
      (c) =>
        c.name.en.toLowerCase().includes(term) ||
        c.name.si.includes(countrySearch) ||
        c.name.ta.includes(countrySearch)
    );
  };

  const getTranslatedDistrict = (district: {
    en: string;
    si: string;
    ta: string;
  }) => {
    const lang = i18n.language;
    return district[lang as keyof typeof district] || district.en;
  };

  const renderDistrictItem = ({
    item,
  }: {
    item: { en: string; si: string; ta: string };
  }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => selectDistrict(item)}
    >
      <Text className="text-base text-gray-800">
        {getTranslatedDistrict(item)}
      </Text>
    </TouchableOpacity>
  );

  const renderDistrictSearchInput = () => (
    <View className="px-4 py-2 border-b border-gray-200">
      <View className="bg-gray-100 rounded-lg px-3 flex-row items-center">
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          placeholder={t("AddOfficer.SearchDistrict") || "Search district..."}
          value={districtSearch}
          onChangeText={setDistrictSearch}
          className="flex-1 ml-2 text-base"
          placeholderTextColor="#666"
        />
        {districtSearch ? (
          <TouchableOpacity onPress={clearSearch}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const handleCountrySelect = (country: any) => {
    setSelectedDistrict(null);
    setSelectedProvince(null);
    setDisplayProvince("");

    setSelectedCountry(country.name.en);
    const display =
      country.name[i18n.language as keyof typeof country.name] ||
      country.name.en;
    setDisplayCountry(display);

    updateFormData({
      country: country.name.en,
      district: null,
      province: "",
    });
    setShowCountryDropdown(false);
  };

  const handleModalClose = () => {
    setShowCountryDropdown(false);
  };


  const handleNext = () => {
      navigation.navigate("IDProof", { formData, requestNumber });
  const requiredFields: (keyof PersonalInfo)[] = [
    "firstName",
    "lastName",
    "otherNames",
    "callName",
    "mobile1",
    "familyPhone",
    "email1",
    "houseNumber",
    "streetName",
    "cityName",
    "district",
    "province",
    "country",
  ];
  // If country is Sri Lanka, district is required
  if (formData.personalInfo.country === "Sri Lanka") {
    requiredFields.push("district");
  }

  // Validate all fields
  const validationErrors: Record<string, string> = {};
  requiredFields.forEach((key) => {
    let value = formData.personalInfo[key];
    let error = "";

    if ((key === "district" || key === "province") && !value) {
      error = t(`Error.${key.charAt(0).toUpperCase() + key.slice(1)} is required`);
    } else {
      let rules: ValidationRule = { required: true, type: key as any };

      if (key.startsWith("mobile") || key.includes("Phone")) {
        rules.type = key as
          | "mobile1"
          | "mobile2"
          | "familyPhone"
          | "landPhoneHome"
          | "landPhoneWork";
      }
      if (key.includes("email")) {
        rules.type = key as "email1" | "email2";
        rules.uniqueWith = key === "email1" ? ["email2"] : ["email1"];
      }

      const result = validateAndFormat(value || "", rules, t, formData, key);
      error = result.error;
    }

    if (error) validationErrors[key] = error;
  });

  if (Object.keys(validationErrors).length > 0) {
    setErrors((prev) => ({ ...prev, ...validationErrors }));
    const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
    Alert.alert(t("Error.Validation Error"), errorMessage, [
      { text: t("MAIN.OK") },
    ]);
    return;
  }

  navigation.navigate("IDProof", { formData });
};


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
          <TouchableOpacity className="absolute left-4 bg-[#F3F3F3] rounded-full p-2" onPress={()=> navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="Personal Info" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <Input
            label={t("InspectionForm.First Name")}
            placeholder="----"
            value={formData.personalInfo.firstName}
            onChangeText={(text) =>
              handleFieldChange("firstName", text, {
                required: true,
                type: "firstName",
              })
            }
            required
            error={errors.firstName}
          />
          <Input
            label={t("InspectionForm.Last Name")}
            placeholder="----"
            value={formData.personalInfo.lastName}
            onChangeText={(text) =>
              handleFieldChange("lastName", text, {
                required: true,
                type: "lastName",
              })
            }
            required
            error={errors.lastName}
          />
          <Input
            label={t("InspectionForm.Other Names")}
            placeholder="----"
            value={formData.personalInfo.otherNames}
            onChangeText={(text) =>
              handleFieldChange("otherNames", text, {
                required: true,
                type: "otherNames",
              })
            }
            required
            error={errors.otherNames}
          />
          <Input
            label={t("InspectionForm.Call Name")}
            placeholder="----"
            value={formData.personalInfo.callName}
            onChangeText={(text) =>
              handleFieldChange("callName", text, {
                required: true,
                type: "callName",
              })
            }
            required
            error={errors.callName}
          />

          <View className="border-t border-[#CACACA] my-4 mb-8" />

          <Input
            label={t("InspectionForm.Mobile Number - 1")}
            placeholder="7XXXXXXXX"
            value={formData.personalInfo.mobile1}
            onChangeText={(text) =>
              handleFieldChange("mobile1", text, {
                required: true,
                type: "mobile1",
                uniqueWith: [
                  "mobile2",
                  "familyPhone",
                  "landPhoneWork",
                  "landPhoneHome",
                ],
              })
            }
            error={errors.mobile1}
            keyboardType={"phone-pad"}
            isMobile={true}
            required
          />
          <Input
            label={t("InspectionForm.Mobile Number - 2")}
            placeholder="7XXXXXXXX"
            value={formData.personalInfo.mobile2}
            onChangeText={(text) =>
              handleFieldChange("mobile2", text, {
                required: false,
                type: "mobile2",
                uniqueWith: [
                  "mobile1",
                  "familyPhone",
                  "landPhoneWork",
                  "landPhoneHome",
                ],
              })
            }
            keyboardType={"phone-pad"}
            error={errors.mobile2}
            isMobile={true}
          />
          <Input
            label={t("InspectionForm.Phone Number of a family member")}
            placeholder="7XXXXXXXX"
            value={formData.personalInfo.familyPhone}
            keyboardType={"phone-pad"}
            onChangeText={(text) =>
              handleFieldChange("familyPhone", text, {
                required: true,
                type: "familyPhone",
                uniqueWith: [
                  "mobile1",
                  "mobile2",
                  "landPhoneWork",
                  "landPhoneHome",
                ],
              })
            }
            error={errors.familyPhone}
            isMobile={true}
            required
          />
          <Input
            label={t("InspectionForm.Land Phone Number - Home")}
            placeholder="XXXXXXXXX"
            value={formData.personalInfo.landPhoneHome}
            onChangeText={(text) =>
              handleFieldChange("landPhoneHome", text, {
                required: false,
                type: "landPhoneHome",
                uniqueWith: [
                  "mobile1",
                  "mobile2",
                  "familyPhone",
                  "landPhoneWork",
                ],
              })
            }
            keyboardType={"phone-pad"}
            error={errors.landPhoneHome}
            isMobile={true}
          />
          <Input
            label={t("InspectionForm.Land Phone Number - Work")}
            placeholder="XXXXXXXXX"
            value={formData.personalInfo.landPhoneWork}
            onChangeText={(text) =>
              handleFieldChange("landPhoneWork", text, {
                required: false,
                type: "landPhoneWork",
                uniqueWith: [
                  "mobile1",
                  "mobile2",
                  "familyPhone",
                  "landPhoneHome",
                ],
              })
            }
            keyboardType={"phone-pad"}
            error={errors.landPhoneWork}
            isMobile={true}
          />
          <Input
            label={t("InspectionForm.Email Address - 1")}
            placeholder="----"
            value={formData.personalInfo.email1}
            onChangeText={(text) =>
              handleFieldChange("email1", text, {
                required: true,
                type: "email1",
                     uniqueWith: [
                  "email2"
                ]
              })
            }
            required
            error={errors.email1}
          />
          <Input
            label={t("InspectionForm.Email Address - 2")}
            placeholder="----"
            value={formData.personalInfo.email2}
            onChangeText={(text) =>
              handleFieldChange("email2", text, {
                required: false,
                type: "email2",
                    uniqueWith: [
                  "email1"
                ]
              })
            }
            error={errors.email2}
          />

          <View className="border-t  border-[#CACACA] my-4 mb-8" />

          <Input
            label={t("InspectionForm.House / Plot Number")}
            placeholder="----"
            value={formData.personalInfo.houseNumber}
            onChangeText={(text) =>
              handleFieldChange("houseNumber", text, {
                required: true,
                type: "houseNumber",
              })
            }
            required
            error={errors.houseNumber}
          />
          <Input
            label={t("InspectionForm.Street Name")}
            placeholder="----"
            value={formData.personalInfo.streetName}
            onChangeText={(text) =>
              handleFieldChange("streetName", text, {
                required: true,
                type: "streetName",
              })
            }
            required
            error={errors.streetName}
          />
          <Input
            label={t("InspectionForm.City / Town Name")}
            placeholder="----"
            value={formData.personalInfo.cityName}
            onChangeText={(text) =>
              handleFieldChange("cityName", text, {
                required: true,
                type: "cityName",
              })
            }
            required
            error={errors.cityName}
          />

          <View className="relative mb-4">
            <Text className="text-sm text-[#070707] mb-1">
              <Text className="text-black">
                {t("InspectionForm.Country")} *
              </Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCountryDropdown(true)}
              activeOpacity={0.8}
            >
              <View className="bg-[#F6F6F6] rounded-full px-5 py-4 flex-row items-center justify-between">
                <Text
                  className={`text-base ${
                    selectedCountry ? "text-black" : "text-[#838B8C]"
                  }`}
                >
                  {displayCountry || t("InspectionForm.-- Select Country --")}
                </Text>
                <AntDesign name="down" size={20} color="#838B8C" />
              </View>
            </TouchableOpacity>
          </View>
          {selectedCountry === "Sri Lanka" ? (
            <>
              <View className="relative mb-4">
                <Text className="text-sm text-[#070707] mb-1">
                  <Text className="text-black">
                    {t("InspectionForm.District")} *
                  </Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDistrictDropdown(true)}
                  activeOpacity={0.8}
                >
                  <View className="bg-[#F6F6F6] rounded-full px-5 py-4 flex-row items-center justify-between">
                    <Text
                      className={`text-base ${
                        selectedDistrict ? "text-black" : "text-[#838B8C]"
                      }`}
                    >
                      {selectedDistrict
                        ? t(`Districts.${selectedDistrict}`)
                        : t("InspectionForm.-- Select District --")}
                    </Text>
                    <AntDesign name="down" size={20} color="#838B8C" />
                  </View>
                </TouchableOpacity>
                  {errors.district && (
    <Text className="text-red-500 text-sm mt-1 ml-4">{errors.district}</Text>
  )}
              </View>
              <View className="relative mb-4">
                <Text className="text-sm text-[#070707] mb-1">
                  <Text className="text-black">
                    {t("InspectionForm.Province")}
                  </Text>
                </Text>
                <View className="bg-[#F6F6F6] rounded-full px-5 py-4">
                  <Text
                    className={`text-base ${
                      selectedProvince ? "text-black" : "text-[#838B8C]"
                    }`}
                  >
                    {selectedProvince
                      ? displayProvince
                      : t("InspectionForm.-- Select Province --")}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity className="flex-1 bg-[#444444] rounded-full py-4 items-center"  onPress={() =>
    navigation.navigate("Main", {
      screen: "MainTabs",
      params: {
        screen: "CapitalRequests",
      },
    })
  }>
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Exit")}</Text>
          </TouchableOpacity>
           {isNextEnabled == false ? (
              <View className="flex-1">
          <TouchableOpacity
            className="flex-1 "
            onPress={handleNext}
          >
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
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Next")}</Text>
            </LinearGradient>
          </TouchableOpacity>
          </View>

): (
  <View className="flex-1 bg-gray-300 rounded-full py-4 items-center">
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Next")}</Text>
          </View>
)}

        </View>
      </View>

      <Modal
        visible={showDistrictDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectDistricts")}
              </Text>
              <TouchableOpacity onPress={() => setShowDistrictDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {renderDistrictSearchInput()}

            <FlatList
              data={getFilteredDistricts()}
              keyExtractor={(item) => item.en}
              renderItem={renderDistrictItem}
              showsVerticalScrollIndicator={false}
              className="max-h-64"
              ListEmptyComponent={
                <View className="px-4 py-8 items-center">
                  <Text className="text-gray-500 text-base">
                    {t("AddOfficer.NoDistrictsFound") || "No districts found"}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCountryDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectCountry")}
              </Text>
              <TouchableOpacity onPress={handleModalClose}>
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="px-4 py-3 border-b border-gray-200 flex-row items-center"
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text className="text-2xl mr-3">{item.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-base text-gray-800 font-medium">
                      {item.name[i18n.language as keyof typeof item.name] ||
                        item.name.en}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {item.dial_code}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              className="max-h-96"
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default InspectionForm1;
