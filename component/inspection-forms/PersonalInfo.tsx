// InspectionForm1.tsx - Personal Info with SQLite (COMPLETE)
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
  FlatList,
} from "react-native";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { environment } from "@/environment/environment";
import countryData from "@/assets/json/countryflag.json";
import sriLankaData from "@/assets/json/provinceDistrict.json";
import districtData from "@/assets/json/Districts.json";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import FormFooterButton from "./FormFooterButton";
import {
  savePersonalInfo,
  getPersonalInfo,
  PersonalInfo,
} from "@/database/inspectionpersonal";

interface District {
  en: string;
  si: string;
  ta: string;
}

interface DistrictsMap {
  [country: string]: District[];
}

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
  type?: string;
  minLength?: number;
  uniqueWith?: (keyof PersonalInfo)[];
};

const validateEmail = (email: string): boolean => {
  const generalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!generalEmailRegex.test(email)) return false;

  const emailLower = email.toLowerCase();
  const [localPart, domain] = emailLower.split("@");

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const validCharsRegex = /^[a-zA-Z0-9.+]+$/;
    if (!validCharsRegex.test(localPart)) return false;
    if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
    if (localPart.includes("..")) return false;
    return localPart.length > 0;
  }

  const allowedTLDs = [".com", ".gov", ".lk"];
  return allowedTLDs.some((tld) => domain.endsWith(tld));
};

const validateAndFormat = (
  text: string,
  rules: ValidationRule,
  t: any,
  formData: PersonalInfo,
  currentKey: keyof PersonalInfo,
) => {
  let value = text;
  let error = "";

  // Name fields validation
  if (
    [
      "firstName",
      "lastName",
      "otherName",
      "callName",
      "cityName",
      "street",
    ].includes(rules.type || "")
  ) {
    value = value.replace(/^\s+/, "").replace(/[^a-zA-Z\s]/g, "");
    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  // House number validation
  if (rules.type === "house") {
    value = value.replace(/[^a-zA-Z0-9 ]/g, "").replace(/^\s+/, "");
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  // Email validation
  if (rules.type === "email1" || rules.type === "email2") {
    value = value.trim();
    if (value.length === 0 && rules.type === "email1") {
      error = rules.required ? t("Error.Email is required") : "";
    } else if (value.length > 0) {
      if (!validateEmail(value)) {
        const domain = value.toLowerCase().split("@")[1];
        error =
          domain === "gmail.com" || domain === "googlemail.com"
            ? t("Error.Invalid Gmail address")
            : t("Error.Invalid email address Example");
      } else if (rules.uniqueWith) {
        const isDuplicate = rules.uniqueWith.some(
          (key) =>
            formData[key]?.toLowerCase().trim() ===
              value.toLowerCase().trim() && key !== currentKey,
        );
        if (isDuplicate) error = t("Error.Email addresses cannot be the same");
      }
    }
  }

  // Phone validation
  if (["phone1", "phone2", "familyPhone"].includes(rules.type || "")) {
    let numbersOnly = value.replace(/[^0-9]/g, "").replace(/^0+/, "");
    if (numbersOnly.length > 9) numbersOnly = numbersOnly.slice(0, 9);
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
            numbersOnly && key !== currentKey,
      );
      if (isDuplicate) error = t("Error.Phone numbers cannot be the same");
    }
  }

  // Landline validation
  if (rules.type === "landHome" || rules.type === "landWork") {
    let numbersOnly = value.replace(/[^0-9]/g, "").replace(/^0+/, "");
    if (numbersOnly.length > 9) numbersOnly = numbersOnly.slice(0, 9);
    value = numbersOnly;

    if (numbersOnly.length !== 0 && numbersOnly.length < 9) {
      // Use specific landline error message
      error = t("Error.Land number must be 9 digits long");
    } else if (rules.uniqueWith && numbersOnly.length > 0) {
      const isDuplicate = rules.uniqueWith.some(
        (key) =>
          formData[key]?.replace(/[^0-9]/g, "").replace(/^0+/, "") ===
            numbersOnly && key !== currentKey,
      );
      if (isDuplicate) error = t("Error.Phone numbers cannot be the same");
    }
  }

  return { value, error };
};

type InspectionForm1Props = {
  navigation: any;
};

const InspectionForm1: React.FC<InspectionForm1Props> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "PersonalInfo">>();
  const { requestNumber, requestId } = route.params;
  const { t, i18n } = useTranslation();

  // Local state for form data
  const [formData, setFormData] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    otherName: "",
    callName: "",
    phone1: "",
    phone2: "",
    familyPhone: "",
    landHome: "",
    landWork: "",
    email1: "",
    email2: "",
    house: "",
    street: "",
    cityName: "",
    district: null,
    province: null,
    country: "Sri Lanka",
  });

  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [displayProvince, setDisplayProvince] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Sri Lanka");
  const [displayCountry, setDisplayCountry] = useState(
    t("InspectionForm.Sri Lanka"),
  );
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);

  const districts: DistrictsMap = districtData;

  // Auto-save to SQLite whenever formData changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (requestId) {
        try {
          savePersonalInfo(Number(requestId), formData);
          console.log("💾 Auto-saved to SQLite");
        } catch (err) {
          console.error("Error auto-saving:", err);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData, requestId]);

  // Load data from SQLite when component mounts
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;

        try {
          const reqId = Number(requestId);
          const localData = getPersonalInfo(reqId);

          if (localData) {
            console.log("✅ Loaded from SQLite");
            setFormData(localData);
            setSelectedDistrict(localData.district);
            setSelectedCountry(localData.country || "Sri Lanka");
            setSelectedProvince(localData.province);
            setIsExistingData(true);

            // Set display values
            const provinceObj = sriLankaData["Sri Lanka"].provinces.find(
              (prov) => prov.name.en === localData.province,
            );
            setDisplayProvince(
              provinceObj
                ? provinceObj.name[
                    i18n.language as keyof typeof provinceObj.name
                  ] || provinceObj.name.en
                : "",
            );

            const countryObj = countryData.find(
              (c) => c.name.en === localData.country,
            );
            setDisplayCountry(
              countryObj
                ? countryObj.name[
                    i18n.language as keyof typeof countryObj.name
                  ] || countryObj.name.en
                : localData.country || "Sri Lanka",
            );
          } else {
            console.log("📝 No local data - new entry");
            setIsExistingData(false);
          }
        } catch (error) {
          console.error("Failed to load from SQLite:", error);
        }
      };

      loadData();
    }, [requestId, i18n.language]),
  );

  // Validate form completion
  useEffect(() => {
    const requiredFields: (keyof PersonalInfo)[] = [
      "firstName",
      "lastName",
      "otherName",
      "callName",
      "phone1",
      "familyPhone",
      "email1",
      "house",
      "street",
      "cityName",
      "district",
      "province",
      "country",
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

  // Update form data and auto-save
  const updateFormData = (updates: Partial<PersonalInfo>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleFieldChange = (
    key: keyof PersonalInfo,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(text, rules, t, formData, key);

    updateFormData({ [key]: value });

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) newErrors[key] = error;
      else delete newErrors[key];

      // Revalidate related fields
      if (rules.uniqueWith) {
        rules.uniqueWith.forEach((relatedKey) => {
          const relatedValue = formData[relatedKey];
          if (!relatedValue) {
            delete newErrors[relatedKey];
            return;
          }

          const { error: relatedError } = validateAndFormat(
            relatedValue,
            rules,
            t,
            { ...formData, [key]: value },
            relatedKey,
          );

          if (relatedError) newErrors[relatedKey] = relatedError;
          else delete newErrors[relatedKey];
        });
      }

      return newErrors;
    });
  };

  // Transform for backend
  const transformForBackend = (data: PersonalInfo) => ({
    firstName: data.firstName,
    lastName: data.lastName,
    otherName: data.otherName,
    callName: data.callName,
    phone1: data.phone1,
    phone2: data.phone2,
    familyPhone: data.familyPhone,
    landHome: data.landHome,
    landWork: data.landWork,
    email1: data.email1,
    email2: data.email2,
    house: data.house,
    street: data.street,
    city: data.cityName,
    district: data.district,
    province: data.province,
    country: data.country,
  });

  // Save to backend (only called on Next button)
  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: PersonalInfo,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      const transformedData = transformForBackend(data);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        { reqId, tableName, ...transformedData },
        { headers: { "Content-Type": "application/json" } },
      );

      return response.data.success;
    } catch (error: any) {
      console.error(`Error saving to backend:`, error);
      return false;
    }
  };

  const handleNext = async () => {
    const requiredFields: (keyof PersonalInfo)[] = [
      "firstName",
      "lastName",
      "otherName",
      "callName",
      "phone1",
      "familyPhone",
      "email1",
      "house",
      "street",
      "cityName",
      "district",
      "province",
      "country",
    ];

    // Validate
    const validationErrors: Record<string, string> = {};
    requiredFields.forEach((key) => {
      let value = formData[key];
      let error = "";

      if ((key === "district" || key === "province") && !value) {
        error = t(
          `Error.${key.charAt(0).toUpperCase() + key.slice(1)} is required`,
        );
      } else {
        let rules: ValidationRule = { required: true, type: key as any };
        if (
          key.startsWith("phone") ||
          key.includes("Phone") ||
          key.includes("land")
        ) {
          rules.uniqueWith = [
            "phone1",
            "phone2",
            "familyPhone",
            "landHome",
            "landWork",
          ].filter((k) => k !== key) as any;
        }
        if (key.includes("email")) {
          rules.uniqueWith = key === "email1" ? ["email2"] : ["email1"];
        }
        const result = validateAndFormat(value || "", rules, t, formData, key);
        error = result.error;
      }

      if (error) validationErrors[key] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));
      Alert.alert(
        t("Error.Validation Error"),
        "• " + Object.values(validationErrors).join("\n• "),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    if (!requestId) {
      Alert.alert(t("Error.Error"), "Request ID is missing", [
        { text: t("Main.ok") },
      ]);
      return;
    }

    const reqId = Number(requestId);
    if (isNaN(reqId) || reqId <= 0) {
      Alert.alert(t("Error.Error"), "Invalid request ID", [
        { text: t("Main.ok") },
      ]);
      return;
    }

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false },
    );

    // Save to backend
    const saved = await saveToBackend(
      reqId,
      "inspectionpersonal",
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
              navigation.navigate("IDProof", {
                formData: { inspectionpersonal: formData },
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
            text: t("Main.Continue"),
            onPress: () => {
              navigation.navigate("IDProof", {
                formData: { inspectionpersonal: formData },
                requestNumber,
                requestId,
              });
            },
          },
        ],
      );
    }
  };

  // District/Country dropdown functions
  const getFilteredDistricts = () => {
    const countryDistricts = districts[selectedCountry] || [];
    if (countryDistricts.length === 0) return [];
    if (districtSearch.trim()) {
      const searchTerm = districtSearch.toLowerCase();
      return countryDistricts.filter(
        (d) =>
          d.en.toLowerCase().includes(searchTerm) ||
          d.si.includes(districtSearch) ||
          d.ta.includes(districtSearch),
      );
    }
    return countryDistricts;
  };

  const clearSearch = () => setDistrictSearch("");

  const selectDistrict = (district: { en: string; si: string; ta: string }) => {
    setSelectedDistrict(district.en);
    const province = sriLankaData["Sri Lanka"].provinces.find((prov) =>
      prov.districts.some((d) => d.en === district.en),
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
        c.name.ta.includes(countrySearch),
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

  const handleExit = () => {
    navigation.navigate("Main", {
      screen: "MainTabs",
      params: { screen: "CapitalRequests" },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <StatusBar barStyle="dark-content" />
        <FormTabs activeKey="Personal Info" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <Input
            label={t("InspectionForm.First Name")}
            placeholder="----"
            value={formData.firstName}
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
            value={formData.lastName}
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
            value={formData.otherName}
            onChangeText={(text) =>
              handleFieldChange("otherName", text, {
                required: true,
                type: "otherName",
              })
            }
            required
            error={errors.otherName}
          />
          <Input
            label={t("InspectionForm.Call Name")}
            placeholder="----"
            value={formData.callName}
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
            value={formData.phone1}
            onChangeText={(text) =>
              handleFieldChange("phone1", text, {
                required: true,
                type: "phone1",
                uniqueWith: ["phone2", "familyPhone", "landWork", "landHome"],
              })
            }
            error={errors.phone1}
            keyboardType="phone-pad"
            isMobile
            required
          />
          <Input
            label={t("InspectionForm.Mobile Number - 2")}
            placeholder="7XXXXXXXX"
            value={formData.phone2}
            onChangeText={(text) =>
              handleFieldChange("phone2", text, {
                type: "phone2",
                uniqueWith: ["phone1", "familyPhone", "landWork", "landHome"],
              })
            }
            keyboardType="phone-pad"
            error={errors.phone2}
            isMobile
          />
          <Input
            label={t("InspectionForm.Phone Number of a family member")}
            placeholder="7XXXXXXXX"
            value={formData.familyPhone}
            keyboardType="phone-pad"
            onChangeText={(text) =>
              handleFieldChange("familyPhone", text, {
                required: true,
                type: "familyPhone",
                uniqueWith: ["phone1", "phone2", "landWork", "landHome"],
              })
            }
            error={errors.familyPhone}
            isMobile
            required
          />
          <Input
            label={t("InspectionForm.Land Phone Number - Home")}
            placeholder="XXXXXXXXX"
            value={formData.landHome}
            onChangeText={(text) =>
              handleFieldChange("landHome", text, {
                type: "landHome",
                uniqueWith: ["phone1", "phone2", "familyPhone", "landWork"],
              })
            }
            keyboardType="phone-pad"
            error={errors.landHome}
            isMobile
          />
          <Input
            label={t("InspectionForm.Land Phone Number - Work")}
            placeholder="XXXXXXXXX"
            value={formData.landWork}
            onChangeText={(text) =>
              handleFieldChange("landWork", text, {
                type: "landWork",
                uniqueWith: ["phone1", "phone2", "familyPhone", "landHome"],
              })
            }
            keyboardType="phone-pad"
            error={errors.landWork}
            isMobile
          />
          <Input
            label={t("InspectionForm.Email Address - 1")}
            placeholder="----"
            value={formData.email1}
            onChangeText={(text) =>
              handleFieldChange("email1", text, {
                required: true,
                type: "email1",
                uniqueWith: ["email2"],
              })
            }
            required
            error={errors.email1}
          />
          <Input
            label={t("InspectionForm.Email Address - 2")}
            placeholder="----"
            value={formData.email2}
            onChangeText={(text) =>
              handleFieldChange("email2", text, {
                type: "email2",
                uniqueWith: ["email1"],
              })
            }
            error={errors.email2}
          />

          <View className="border-t border-[#CACACA] my-4 mb-8" />

          <Input
            label={t("InspectionForm.House / Plot Number")}
            placeholder="----"
            value={formData.house}
            onChangeText={(text) =>
              handleFieldChange("house", text, {
                required: true,
                type: "alphanumericWithSpecial", // or "text"
              })
            }
            required
            error={errors.house}
          />
          <Input
            label={t("InspectionForm.Street Name")}
            placeholder="----"
            value={formData.street}
            onChangeText={(text) =>
              handleFieldChange("street", text, {
                required: true,
                type: "street",
              })
            }
            required
            error={errors.street}
          />
          <Input
            label={t("InspectionForm.City / Town Name")}
            placeholder="----"
            value={formData.cityName}
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
                  className={`text-base ${selectedCountry ? "text-black" : "text-[#838B8C]"}`}
                >
                  {displayCountry || t("InspectionForm.-- Select Country --")}
                </Text>
                <AntDesign name="down" size={20} color="#838B8C" />
              </View>
            </TouchableOpacity>
          </View>

          {selectedCountry === "Sri Lanka" && (
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
                      className={`text-base ${selectedDistrict ? "text-black" : "text-[#838B8C]"}`}
                    >
                      {selectedDistrict
                        ? t(`Districts.${selectedDistrict}`)
                        : t("InspectionForm.-- Select District --")}
                    </Text>
                    <AntDesign name="down" size={20} color="#838B8C" />
                  </View>
                </TouchableOpacity>
                {errors.district && (
                  <Text className="text-red-500 text-sm mt-1 ml-4">
                    {errors.district}
                  </Text>
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
                    className={`text-base ${selectedProvince ? "text-black" : "text-[#838B8C]"}`}
                  >
                    {selectedProvince
                      ? displayProvince
                      : t("InspectionForm.-- Select Province --")}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <FormFooterButton
          exitText={t("InspectionForm.Exit")}
          nextText={t("InspectionForm.Next")}
          isNextEnabled={isNextEnabled}
          onExit={handleExit}
          onNext={handleNext}
        />
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
        onRequestClose={() => setShowCountryDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectCountry")}
              </Text>
              <TouchableOpacity onPress={() => setShowCountryDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {renderSearchInput(
              countrySearch,
              setCountrySearch,
              t("AddOfficer.SearchCountry") || "Search country...",
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
