import React, { useState , useEffect} from "react";
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
import districts from "@/assets/json/Districts.json";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const Input = ({
  label,
  placeholder,
    value,
  onChangeText,
  required = false,
    error,
  keyboardType = "default"
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
    <View className="bg-[#F6F6F6] rounded-full">
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#838B8C"
        className=" px-5 py-4 text-base text-black"
         value={value}
        onChangeText={onChangeText}
      />
          {error && (
      <Text className="text-red-500 text-xs mt-1 ml-3">{error}</Text>
    )}
    </View>
  </View>
);


type ValidationRule = {
  required?: boolean;
  type?: "firstname" | "lastname" | "phone" | "email" | "text" | "othername";
  minLength?: number;
};

const validateAndFormat = (
  text: string,
  rules: ValidationRule,
  t: any
) => {
  let value = text;
  let error = "";
  console.log("Validating:", value, rules);

  // Filtering
if (rules.type === "firstname" || rules.type === "lastname" || rules.type ==="othername") {
  value = value
    .replace(/[^a-zA-Z]/g, "")   // ⛔ removes spaces
    .toLowerCase();

  value =
    value.length > 0
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : "";
}

  if (rules.type === "phone") {
    value = value.replace(/[^0-9]/g, "");
  }

  // Validation
  if (rules.required && value.trim().length === 0) {
    error = t("Error.Required field");
  }

  if (rules.type === "email" && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      error = t("Error.Invalid email");
    }
  }

  if (rules.minLength && value.length < rules.minLength) {
    error = t("Error.Min length", { count: rules.minLength });
  }

  return { value, error };
};

type InspectionForm1Props = {
  navigation: any;
};



const InspectionForm1: React.FC<InspectionForm1Props> = ({ navigation }) => {
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

const STORAGE_KEY = "INSPECTION_FORM_1";

const updateFormData = async (
  key: keyof typeof formData,
  value: string
) => {
  const updatedData = {
    ...formData,
    [key]: value,
  };

  setFormData(updatedData);

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedData)
    );
  } catch (e) {
    console.log("AsyncStorage save failed", e);
  }
};

const handleFieldChange = (
    key: keyof typeof formData,
    text: string,
    rules: ValidationRule
  ) => {
    const { value, error } = validateAndFormat(text, rules, t);

    updateFormData(key, value);

    setErrors((prev) => {
      const copy = { ...prev };
      if (error) copy[key] = error;
      else delete copy[key];
      return copy;
    });
  };


useFocusEffect(
  useCallback(() => {
    const loadData = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);

        // Set district
        setSelectedDistrict(parsed.district || null);

        // Find the province object by stored province name (en)
        const provinceObj = sriLankaData.provinces.find(
          (prov) => prov.name.en === parsed.province
        );

        // Set province & display in selected language
        setSelectedProvince(provinceObj?.name.en || null);
        setDisplayProvince(
          provinceObj
            ? provinceObj.name[i18n.language as keyof typeof provinceObj.name] ||
              provinceObj.name.en
            : ""
        );

        // Set country
        setDisplayCountry(parsed.country || t("InspectionForm.Sri Lanka"));
      }
    };

    loadData();
  }, [i18n.language])
);

  const [formData, setFormData] = useState({
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
  district: selectedDistrict,
  province: displayProvince,
  country: displayCountry,
});
  const isFormValid =
    Object.keys(errors).length === 0 &&
    Object.values(formData).every((v) => v !== "");
console.log("Form Data:", formData);
  const getFilteredDistricts = () => {
    if (!districts || districts.length === 0) return [];

    let filtered = districts;

    if (districtSearch) {
      const searchTerm = districtSearch.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.en.toLowerCase().includes(searchTerm) ||
          d.si.includes(districtSearch) ||
          d.ta.includes(districtSearch)
      );
    }

    return filtered;
  };

  const clearSearch = () => setDistrictSearch("");

  const selectDistrict =async (district: { en: string; si: string; ta: string }) => {
    setSelectedDistrict(district.en);
    const province = sriLankaData.provinces.find((prov) =>
      prov.districts.some((d) => d.en === district.en)
    );
    const displayProv = province
      ? province.name[i18n.language as keyof typeof province.name] || province.name.en
      : "";
    setSelectedProvince(province?.name.en || null);
    setDisplayProvince(displayProv);
  const updatedData = {
    ...formData,
    district: district.en,
    province: province?.name.en || "",
  };
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedData)
  );
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
    setSelectedCountry(country.name.en);
    const display = country.name[i18n.language as keyof typeof country.name] || country.name.en;
    setDisplayCountry(display);
    setFormData({
      ...formData,
      country: display,
    });
    setShowCountryDropdown(false);
  };

  const handleModalClose = () => {
    setShowCountryDropdown(false);
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
      <View className="flex-1 bg-[#F3F3F3]">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="flex-row items-center justify-center py-4">
          <TouchableOpacity className="absolute left-4 bg-[#F3F3F3] rounded-full p-2">
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
            value={formData.firstName}
            onChangeText={(text) =>
            handleFieldChange("firstName", text, {
              required: true,
              type: "firstname",
            })
            }             
           required
          />
          <Input
            label={t("InspectionForm.Last Name")}
            placeholder="----"
            value={formData.lastName}
            onChangeText={(text) =>
            handleFieldChange("lastName", text, {
              required: true,
              type: "lastname",
            })
            } 
            required
          />
          <Input
            label={t("InspectionForm.Other Names")}
            placeholder="----"
            value={formData.otherNames}
            onChangeText={(text) => updateFormData("otherNames", text)}
            required
          />
          <Input
            label={t("InspectionForm.Call Name")}
            placeholder="----"
            value={formData.callName}
            onChangeText={(text) => updateFormData("callName", text)}
            required
          />

          <View className="border-t border-[#CACACA] my-4 mb-8" />

          <Input
            label={t("InspectionForm.Mobile Number - 1")}
            placeholder="07XXXXXXXX"
            value={formData.mobile1}
            onChangeText={(text) => updateFormData("mobile1", text)}
            required
          />
          <Input
            label={t("InspectionForm.Mobile Number - 2")}
            placeholder="07XXXXXXXX"
            value={formData.mobile2}
            onChangeText={(text) => updateFormData("mobile2", text)}
          />
          <Input
            label={t("InspectionForm.Phone Number of a family member")}
            placeholder="07XXXXXXXX"
            value={formData.familyPhone}
            onChangeText={(text) => updateFormData("familyPhone", text)}
            required
          />
          <Input
            label={t("InspectionForm.Land Phone Number - Home")}
            placeholder="0XXXXXXXXX"
            value={formData.landPhoneHome}
            onChangeText={(text) => updateFormData("landPhoneHome", text)}
          />
          <Input
            label={t("InspectionForm.Land Phone Number - Work")}
            placeholder="0XXXXXXXXX"
            value={formData.landPhoneWork}
            onChangeText={(text) => updateFormData("landPhoneWork", text)}
          />
          <Input
            label={t("InspectionForm.Email Address - 1")}
            placeholder="----"
            value={formData.email1}
            onChangeText={(text) =>  updateFormData("email1", text)}
            required
          />
          <Input
            label={t("InspectionForm.Email Address - 2")}
            placeholder="----"
            value={formData.email2}
            onChangeText={(text) => updateFormData("email2", text)}
          />


          {/* Divider */}
          <View className="border-t  border-[#CACACA] my-4 mb-8" />

          <Input
            label={t("InspectionForm.House / Plot Number")}
            placeholder="----"
            value={formData.houseNumber}
            onChangeText={(text) => updateFormData("houseNumber", text)}
            required
          />
          <Input
            label={t("InspectionForm.Street Name")}
            placeholder="----"
            value={formData.streetName}
            onChangeText={(text) => updateFormData("streetName", text)}
            required
          />
          <Input
            label={t("InspectionForm.City / Town Name")}
            placeholder="----"
            value={formData.cityName}
            onChangeText={(text) => updateFormData("cityName", text)}
            required
          />

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
          </View>

          <View className="relative mb-4">
            <Text className="text-sm text-[#070707] mb-1">
              <Text className="text-black">{t("InspectionForm.Province")}</Text>
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
        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200">
          <TouchableOpacity className="flex-1 bg-[#444444] rounded-full py-4 items-center">
            <Text className="text-white text-base font-semibold">Exit</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 bg-gray-300 rounded-full py-4 items-center"
            onPress={() => navigation.navigate("NextPage", { formData })}
            >
            <Text className="text-white text-base font-semibold">Next</Text>
          </TouchableOpacity>
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
