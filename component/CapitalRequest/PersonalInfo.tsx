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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/services/store"; // Adjust path to your store
import {
  initializePersonalInfo,
  updatePersonalInfo,
  setPersonalInfo,
  markAsExisting,
  PersonalInfo, // Import the type from slice
} from "@/store/personalInfoSlice";
import FormFooterButton from "./FormFooterButton";

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
  type?:
    | "firstName"
    | "lastName"
    | "email"
    | "phone1"
    | "phone2"
    | "familyPhone"
    | "otherName"
    | "callName"
    | "landHome"
    | "landWork"
    | "street"
    | "email1"
    | "email2"
    | "cityName"
    | "house";
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
  console.log("hit email v");
  const generalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
  currentKey: keyof typeof formData,
) => {
  let value = text;
  let error = "";

  console.log("Validating:", value, rules);

  // Filtering
  if (
    rules.type === "firstName" ||
    rules.type === "lastName" ||
    rules.type === "otherName" ||
    rules.type === "callName" ||
    rules.type === "cityName" ||
    rules.type === "street"
  ) {
    // value = value.replace(/^\s+/, "");
    // value = value.replace(/[^a-zA-Z\s]/g, "").toLowerCase();

    // value = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : "";
    // console.log("hit", value);

    // if (rules.required && value.trim().length === 0) {
    //   error = t(`Error.${rules.type} is required`);
    // }
    value = value.replace(/^\s+/, "");
    value = value.replace(/[^a-zA-Z\s]/g, "");

    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  if (rules.type === "house") {
    let cleaned = value.replace(/[^a-zA-Z0-9 ]/g, "");

    cleaned = cleaned.replace(/^\s+/, "");

    value = cleaned;

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  if (rules.type === "email1" || rules.type === "email2") {
    value = value.trim();

    if (value.length === 0 && rules.type === "email1") {
      error = rules.required ? t("Error.Email is required") : "";
    } else if (value.length > 0) {
      if (!validateEmail(value)) {
        const domain = value.toLowerCase().split("@")[1];

        if (domain === "gmail.com" || domain === "googlemail.com") {
          error = t("Error.Invalid Gmail address");
        } else {
          error = t("Error.Invalid email address Example");
        }
      } else if (rules.uniqueWith) {
        const isDuplicate = rules.uniqueWith.some(
          (key) =>
            formData[key]?.toLowerCase().trim() ===
              value.toLowerCase().trim() && key !== currentKey,
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
    rules.type === "phone1" ||
    rules.type === "phone2" ||
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
            numbersOnly && key !== currentKey,
      );

      if (isDuplicate) {
        error = t("Error.Phone numbers cannot be the same");
      }
    }
  }

  if (rules.type === "landHome" || rules.type === "landWork") {
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
          numbersOnly.length > 0,
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
  const { requestNumber, requestId } = route.params;
  const dispatch = useDispatch();

  console.log("Request Number:", requestNumber);
  console.log("Request ID:", requestId);

  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [displayProvince, setDisplayProvince] = useState("");
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Sri Lanka");
  const [displayCountry, setDisplayCountry] = useState(
    t("InspectionForm.Sri Lanka"),
  );
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  const formData = useSelector(
    (state: RootState) =>
      state.inspectionpersonal.data[requestId] || {
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
      },
  );

  const isExistingData = useSelector(
    (state: RootState) =>
      state.inspectionpersonal.isExisting[requestId] || false,
  );

  console.log("Form Data:", formData);
  console.log("Is Existing Data (UPDATE mode):", isExistingData);

  const districts: DistrictsMap = districtData;
  let jobId = requestNumber;

  const transformPersonalInfoForBackend = (data: PersonalInfo) => {
    return {
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
    };
  };

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: PersonalInfo,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      console.log(
        `💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`,
        tableName,
      );
      console.log(`📝 reqId being sent:`, reqId);

      // ✅ Transform data to match backend schema
      const transformedData = transformPersonalInfoForBackend(data);

      console.log(`📦 Original data:`, data);
      console.log(`📦 Transformed data:`, transformedData);

      // ✅ Send with data spread at root level, not nested
      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        {
          reqId,
          tableName,
          ...transformedData, // ✅ CORRECT - spreads fields at root level
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

  const updateFormData = (updates: Partial<PersonalInfo>) => {
    dispatch(
      updatePersonalInfo({
        requestId,
        updates,
      }),
    );
  };

  const handleFieldChange = (
    key: keyof PersonalInfo,
    text: string,
    rules: ValidationRule,
  ) => {
    const { value, error } = validateAndFormat(
      text,
      rules,
      t,
      formData, // Now from Redux
      key,
    );

    // Update Redux store instead of local state
    dispatch(
      updatePersonalInfo({
        requestId,
        updates: { [key]: value },
      }),
    );

    // Errors handling remains the same
    setErrors((prev) => {
      const newErrors = { ...prev };

      if (error) newErrors[key] = error;
      else delete newErrors[key];

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
            {
              ...formData,
              [key]: value,
            },
            relatedKey,
          );

          if (relatedError) newErrors[relatedKey] = relatedError;
          else delete newErrors[relatedKey];
        });
      }

      return newErrors;
    });
  };

  const fetchInspectionData = async (
    reqId: number,
  ): Promise<PersonalInfo | null> => {
    try {
      console.log(`🔍 Fetching personal inspection data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectionpersonal",
          },
        },
      );

      console.log("📦 Raw response:", response.data);

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing personal data:`, response.data.data);

        const data = response.data.data;

        // ✅ Map backend field names to frontend field names
        return {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          otherName: data.otherName || "",
          callName: data.callName || "",
          phone1: data.phone1 || "",
          phone2: data.phone2 || "",
          familyPhone: data.familyPhone || "",
          landHome: data.landHome || "",
          landWork: data.landWork || "",
          email1: data.email1 || "",
          email2: data.email2 || "",
          house: data.house || "",
          street: data.street || "",
          cityName: data.city || "", // ✅ Backend uses 'city', frontend uses 'cityName'
          district: data.district || null,
          province: data.province || null,
          country: data.country || "Sri Lanka",
        };
      }

      console.log(`📭 No existing personal data found for reqId: ${reqId}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching personal inspection data:`, error);
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
      const loadData = async () => {
        try {
          // Initialize Redux state for this request
          dispatch(initializePersonalInfo({ requestId }));

          // Try to fetch from backend
          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              console.log(
                `🔄 Fetching personal data from backend for reqId: ${reqId}`,
              );

              const backendData = await fetchInspectionData(reqId);

              if (backendData) {
                console.log(`✅ Loaded personal data from backend`);

                // Save to Redux
                dispatch(
                  setPersonalInfo({
                    requestId,
                    data: backendData,
                    isExisting: true,
                  }),
                );

                // Set UI state for district/province/country
                setSelectedDistrict(backendData.district || null);
                setSelectedCountry(backendData.country || "Sri Lanka");

                const provinceObj = sriLankaData["Sri Lanka"].provinces.find(
                  (prov) => prov.name.en === backendData.province,
                );
                setSelectedProvince(provinceObj?.name.en || null);
                setDisplayProvince(
                  provinceObj
                    ? provinceObj.name[
                        i18n.language as keyof typeof provinceObj.name
                      ] || provinceObj.name.en
                    : "",
                );

                const countryObj = countryData.find(
                  (c) => c.name.en === backendData.country,
                );
                setDisplayCountry(
                  countryObj
                    ? countryObj.name[
                        i18n.language as keyof typeof countryObj.name
                      ] || countryObj.name.en
                    : backendData.country || "Sri Lanka",
                );

                return;
              }
            }
          }

          // If no backend data, Redux already has initialized empty state
          console.log(
            "📝 No existing personal data - new entry - will INSERT on save",
          );
        } catch (error) {
          console.error("Failed to load saved data", error);
        }
      };

      loadData();
    }, [i18n.language, requestId, dispatch]),
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
          d.ta.includes(districtSearch),
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

  const handleModalClose = () => {
    setShowCountryDropdown(false);
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

    // Validate all fields
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
          rules.type = key as any;
          rules.uniqueWith = [
            "phone1",
            "phone2",
            "familyPhone",
            "landHome",
            "landWork",
          ].filter((k) => k !== key) as any;
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
        { text: t("Main.ok") },
      ]);
      return;
    }

    // ✅ Validate requestId exists
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

    // ✅ Validate it's a valid number
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

    // Show loading indicator
    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false },
    );

    // Save to backend
    try {
      console.log(
        `🚀 Saving to backend (${isExistingData ? "UPDATE" : "INSERT"})`,
      );

      const saved = await saveToBackend(
        reqId,
        "inspectionpersonal",
        formData, // Now from Redux
        isExistingData,
      );

      if (saved) {
        console.log("✅ Personal info saved successfully to backend");

        // Mark as existing in Redux
        dispatch(markAsExisting({ requestId }));

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
        // Continue with local Redux data
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
    } catch (error) {
      console.error("Error during final save:", error);
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
      params: {
        screen: "CapitalRequests",
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
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
            keyboardType={"phone-pad"}
            isMobile={true}
            required
          />
          <Input
            label={t("InspectionForm.Mobile Number - 2")}
            placeholder="7XXXXXXXX"
            value={formData.phone2}
            onChangeText={(text) =>
              handleFieldChange("phone2", text, {
                required: false,
                type: "phone2",
                uniqueWith: ["phone1", "familyPhone", "landWork", "landHome"],
              })
            }
            keyboardType={"phone-pad"}
            error={errors.phone2}
            isMobile={true}
          />
          <Input
            label={t("InspectionForm.Phone Number of a family member")}
            placeholder="7XXXXXXXX"
            value={formData.familyPhone}
            keyboardType={"phone-pad"}
            onChangeText={(text) =>
              handleFieldChange("familyPhone", text, {
                required: true,
                type: "familyPhone",
                uniqueWith: ["phone1", "phone2", "landWork", "landHome"],
              })
            }
            error={errors.familyPhone}
            isMobile={true}
            required
          />
          <Input
            label={t("InspectionForm.Land Phone Number - Home")}
            placeholder="XXXXXXXXX"
            value={formData.landHome}
            onChangeText={(text) =>
              handleFieldChange("landHome", text, {
                required: false,
                type: "landHome",
                uniqueWith: ["phone1", "phone2", "familyPhone", "landWork"],
              })
            }
            keyboardType={"phone-pad"}
            error={errors.landHome}
            isMobile={true}
          />
          <Input
            label={t("InspectionForm.Land Phone Number - Work")}
            placeholder="XXXXXXXXX"
            value={formData.landWork}
            onChangeText={(text) =>
              handleFieldChange("landWork", text, {
                required: false,
                type: "landWork",
                uniqueWith: ["phone1", "phone2", "familyPhone", "landHome"],
              })
            }
            keyboardType={"phone-pad"}
            error={errors.landWork}
            isMobile={true}
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
                required: false,
                type: "email2",
                uniqueWith: ["email1"],
              })
            }
            error={errors.email2}
          />

          <View className="border-t  border-[#CACACA] my-4 mb-8" />

          <Input
            label={t("InspectionForm.House / Plot Number")}
            placeholder="----"
            value={formData.house}
            onChangeText={(text) =>
              handleFieldChange("house", text, {
                required: true,
                type: "house",
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
