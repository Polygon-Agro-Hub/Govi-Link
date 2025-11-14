import React, { useState } from "react";
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
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RadioButton } from "react-native-paper";
import Checkbox from "expo-checkbox";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import countryData from "@/assets/json/countryflag.json";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

type AddOfficerStep1NavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep1"
>;

interface AddOfficerStep1ScreenProps {
  navigation: AddOfficerStep1NavigationProp;
}

const AddOfficerStep1: React.FC<AddOfficerStep1ScreenProps> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const [type, setType] = useState<"Permanent" | "Temporary">("Permanent");
  const [languages, setLanguages] = useState({
    Sinhala: true,
    English: false,
    Tamil: false,
  });

  const [firstNameEN, setFirstNameEN] = useState("");
  const [lastNameEN, setLastNameEN] = useState("");
  const [firstNameSI, setFirstNameSI] = useState("");
  const [lastNameSI, setLastNameSI] = useState("");
  const [firstNameTA, setFirstNameTA] = useState("");
  const [lastNameTA, setLastNameTA] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");

  // District dropdown states - MULTI SELECT
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");

  // Country code dropdown states
  const [selectedCountryCode1, setSelectedCountryCode1] = useState("+94");
  const [selectedCountryCode2, setSelectedCountryCode2] = useState("+94");
  const [showCountryCodeDropdown1, setShowCountryCodeDropdown1] =
    useState(false);
  const [showCountryCodeDropdown2, setShowCountryCodeDropdown2] =
    useState(false);

  // Sri Lanka districts with translations
  const districts = [
    { en: "Ampara", si: "අම්පාර", ta: "அம்பாறை" },
    { en: "Anuradhapura", si: "අනුරාධපුර", ta: "அனுராதபுரம்" },
    { en: "Badulla", si: "බදුල්ල", ta: "பதுளை" },
    { en: "Batticaloa", si: "මඩකලපුව", ta: "மட்டக்களப்பு" },
    { en: "Colombo", si: "කොළඹ", ta: "கொழும்பு" },
    { en: "Galle", si: "ගාල්ල", ta: "காலி" },
    { en: "Gampaha", si: "ගම්පහ", ta: "கம்பஹா" },
    { en: "Hambantota", si: "හම්බන්තොට", ta: "அம்பாந்தோட்டை" },
    { en: "Jaffna", si: "යාපනය", ta: "யாழ்ப்பாணம்" },
    { en: "Kalutara", si: "කළුතර", ta: "களுத்துறை" },
    { en: "Kandy", si: "මහනුවර", ta: "கண்டி" },
    { en: "Kegalle", si: "කැගල්ල", ta: "கேகாலை" },
    { en: "Kilinochchi", si: "කිලිනොච්චි", ta: "கிளிநொச்சி" },
    { en: "Kurunegala", si: "කුරුණෑගල", ta: "குருநாகல்" },
    { en: "Mannar", si: "මන්නාරම", ta: "மன்னார்" },
    { en: "Matale", si: "මාතලේ", ta: "மாதளை" },
    { en: "Matara", si: "මාතර", ta: "மாத்தறை" },
    { en: "Moneragala", si: "මොනරාගල", ta: "மொனராகலை" },
    { en: "Mullaitivu", si: "මුල්ලයිතීවු", ta: "முல்லைத்தீவு" },
    { en: "Nuwara Eliya", si: "නුවරඑළිය", ta: "நுவரெலியா" },
    { en: "Polonnaruwa", si: "පොලොන්නරුව", ta: "பொலன்னறுவை" },
    { en: "Puttalam", si: "පුත්තලම", ta: "புத்தளம்" },
    { en: "Ratnapura", si: "රත්නපුර", ta: "இரத்தினபுரி" },
    { en: "Trincomalee", si: "ත්‍රිකුණාමලය", ta: "திருகோணமலை" },
    { en: "Vavuniya", si: "වවුනියාව", ta: "வவுனியா" },
  ];

  const toggleLanguage = (lang: keyof typeof languages) => {
    setLanguages((prev) => ({ ...prev, [lang]: !prev[lang] }));
  };

  // Get current language
  const getCurrentLanguage = () => {
    return i18n.language || "en";
  };

  // Get translated district name
  const getTranslatedDistrict = (district: {
    en: string;
    si: string;
    ta: string;
  }) => {
    const lang = getCurrentLanguage();
    return district[lang as keyof typeof district] || district.en;
  };

  // Get translated country name
  const getTranslatedCountry = (country: {
    name: { en: string; si: string; ta: string };
  }) => {
    const lang = getCurrentLanguage();
    return country.name[lang as keyof typeof country.name] || country.name.en;
  };

  // Filter districts based on search
  const getFilteredDistricts = () => {
    if (!districtSearch) return districts;

    return districts.filter((district) => {
      const searchTerm = districtSearch.toLowerCase();
      return (
        district.en.toLowerCase().includes(searchTerm) ||
        district.si.includes(districtSearch) || // Sinhala doesn't need lowercase
        district.ta.includes(districtSearch) || // Tamil doesn't need lowercase
        getTranslatedDistrict(district).toLowerCase().includes(searchTerm)
      );
    });
  };

  // Toggle district selection
  const toggleDistrictSelection = (district: {
    en: string;
    si: string;
    ta: string;
  }) => {
    const districtKey = district.en;
    setSelectedDistricts((prev) => {
      if (prev.includes(districtKey)) {
        // Remove district if already selected
        return prev.filter((d) => d !== districtKey);
      } else {
        // Add district if not selected
        return [...prev, districtKey];
      }
    });
  };

  // Clear all selected districts
  const clearAllDistricts = () => {
    setSelectedDistricts([]);
  };

  // Clear search
  const clearSearch = () => {
    setDistrictSearch("");
  };

  // Handle modal close
  const handleDistrictModalClose = () => {
    setDistrictSearch("");
    setShowDistrictDropdown(false);
  };

  // Get display text for districts
  const getDistrictDisplayText = () => {
    if (selectedDistricts.length === 0) {
      return t("AddOfficer.AssignedDistrict");
    } else if (selectedDistricts.length === 1) {
      const district = districts.find((d) => d.en === selectedDistricts[0]);
      return district ? getTranslatedDistrict(district) : selectedDistricts[0];
    } else if (selectedDistricts.length === 2) {
      const district1 = districts.find((d) => d.en === selectedDistricts[0]);
      const district2 = districts.find((d) => d.en === selectedDistricts[1]);
      const name1 = district1
        ? getTranslatedDistrict(district1)
        : selectedDistricts[0];
      const name2 = district2
        ? getTranslatedDistrict(district2)
        : selectedDistricts[1];
      return `${name1}, ${name2}`;
    } else {
      const district1 = districts.find((d) => d.en === selectedDistricts[0]);
      const district2 = districts.find((d) => d.en === selectedDistricts[1]);
      const name1 = district1
        ? getTranslatedDistrict(district1)
        : selectedDistricts[0];
      const name2 = district2
        ? getTranslatedDistrict(district2)
        : selectedDistricts[1];
      return `${name1}, ${name2} +${selectedDistricts.length - 2} ${t(
        "AddOfficer.more"
      )}`;
    }
  };

  const renderDistrictItem = ({
    item,
  }: {
    item: { en: string; si: string; ta: string };
  }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 flex-row justify-between items-center"
      onPress={() => toggleDistrictSelection(item)}
    >
      <Text className="text-base text-gray-800">
        {getTranslatedDistrict(item)}
      </Text>
      <Checkbox
        value={selectedDistricts.includes(item.en)}
        onValueChange={() => toggleDistrictSelection(item)}
        color={selectedDistricts.includes(item.en) ? "#21202B" : undefined}
      />
    </TouchableOpacity>
  );

  // Search input component for districts
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

  // Updated renderCountryCodeItem with translated country names
  const renderCountryCodeItem = (
    { item }: { item: any },
    setCode: Function,
    setShow: Function
  ) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => {
        setCode(item.dial_code);
        setShow(false);
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">{item.emoji}</Text>
          <Text className="text-sm text-gray-600">{item.dial_code}</Text>
        </View>
        <Text className="text-base text-gray-800 font-medium">
          {getTranslatedCountry(item)}
        </Text>
      </View>
    </TouchableOpacity>
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
            onPress={() => navigation.navigate("ManageOfficers")}
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

        {/* Profile Picture */}
        <View className="items-center mt-6">
          <View className="w-20 h-20 bg-gray-300 rounded-full items-center justify-center">
            <Ionicons name="person" size={40} color="#fff" />
            <View className="absolute bottom-0 right-0 w-6 h-6 bg-gray-800 rounded-full items-center justify-center">
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </View>
        </View>

        {/* Type */}
        <View className="p-4">
          <View className="px-6 mt-6">
            <View className="flex flex-row items-center space-x-6 justify-between">
              <Text className="text-base font-medium">
                {t("AddOfficer.Type")}:
              </Text>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setType("Permanent")}
              >
                <RadioButton
                  value="Permanent"
                  status={type === "Permanent" ? "checked" : "unchecked"}
                  onPress={() => setType("Permanent")}
                  color="#21202B"
                />
                <Text className="ml-1 text-base text-[#534E4E]">
                  {t("AddOfficer.Permanent")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setType("Temporary")}
              >
                <RadioButton
                  value="Temporary"
                  status={type === "Temporary" ? "checked" : "unchecked"}
                  onPress={() => setType("Temporary")}
                  color="#21202B"
                />
                <Text className="ml-1 text-base text-[#534E4E]">
                  {t("AddOfficer.Temporary")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

          {/* Preferred Languages */}
          <View className="px-6 mt-4">
            <Text className="text-base font-medium mb-4">
              {t("AddOfficer.PreferredLanguages")}:
            </Text>
            <View className="flex-row justify-between space-x-4">
              {(Object.keys(languages) as Array<keyof typeof languages>).map(
                (lang) => (
                  <View key={lang} className="flex-row items-center space-x-1">
                    <Checkbox
                      value={languages[lang]}
                      onValueChange={() => toggleLanguage(lang)}
                      color={languages[lang] ? "#21202B" : undefined}
                    />
                    <Text className="text-base text-[#534E4E]">
                      {t(`AddOfficer.${lang}`)}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>

          <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

          {/* Form Fields */}
          <View className="px-6 mt-4 space-y-4">
            {/* District Dropdown - MULTI SELECT */}
            <TouchableOpacity
              className="bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowDistrictDropdown(true)}
            >
              <Text
                className={`${
                  selectedDistricts.length > 0 ? "text-black" : "text-[#7D7D7D]"
                }`}
              >
                {getDistrictDisplayText()}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>

            <TextInput
              placeholder={t("AddOfficer.FirstNameEnglish")}
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
              value={firstNameEN}
              onChangeText={setFirstNameEN}
              underlineColorAndroid="transparent"
            />
            <TextInput
              placeholder={t("AddOfficer.LastNameEnglish")}
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
              value={lastNameEN}
              onChangeText={setLastNameEN}
              underlineColorAndroid="transparent"
            />

            <TextInput
              placeholder={t("AddOfficer.FirstNameSinhala")}
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
              value={firstNameSI}
              onChangeText={setFirstNameSI}
              underlineColorAndroid="transparent"
            />
            <TextInput
              placeholder={t("AddOfficer.LastNameSinhala")}
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
              value={lastNameSI}
              onChangeText={setLastNameSI}
              underlineColorAndroid="transparent"
            />

            <TextInput
              placeholder={t("AddOfficer.FirstNameTamil")}
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
              value={firstNameTA}
              onChangeText={setFirstNameTA}
              underlineColorAndroid="transparent"
            />
            <TextInput
              placeholder={t("AddOfficer.LastNameTamil")}
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
              value={lastNameTA}
              onChangeText={setLastNameTA}
              underlineColorAndroid="transparent"
            />
          </View>
          <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

          <View className="px-6 mt-4 space-y-4">
            {/* Phone Numbers */}
            <View className="flex-row space-x-2">
              {/* Phone 1 Country Code */}
              <TouchableOpacity
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4 w-20 flex-row justify-between items-center"
                onPress={() => setShowCountryCodeDropdown1(true)}
              >
                <Text className="text-black">{selectedCountryCode1}</Text>
                <MaterialIcons name="arrow-drop-down" size={18} color="#666" />
              </TouchableOpacity>

              <TextInput
                placeholder="7XXXXXXXX"
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4 flex-1"
                value={phone1}
                onChangeText={setPhone1}
                keyboardType="phone-pad"
                underlineColorAndroid="transparent"
              />
            </View>

            <View className="flex-row space-x-2">
              {/* Phone 2 Country Code */}
              <TouchableOpacity
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4 w-20 flex-row justify-between items-center"
                onPress={() => setShowCountryCodeDropdown2(true)}
              >
                <Text className="text-black">{selectedCountryCode2}</Text>
                <MaterialIcons name="arrow-drop-down" size={18} color="#666" />
              </TouchableOpacity>

              <TextInput
                placeholder="7XXXXXXXX"
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4 flex-1"
                value={phone2}
                onChangeText={setPhone2}
                keyboardType="phone-pad"
                underlineColorAndroid="transparent"
              />
            </View>

            <TextInput
              placeholder={t("AddOfficer.NICNumber")}
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
              value={nic}
              onChangeText={setNic}
              underlineColorAndroid="transparent"
            />
            <TextInput
              placeholder={t("AddOfficer.EmailAddress")}
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              underlineColorAndroid="transparent"
            />
          </View>

          {/* Buttons */}
          <View className="px-6 mt-6 flex-row w-full justify-between">
            <TouchableOpacity
              className="bg-[#D9D9D9] rounded-3xl px-6 py-4 w-[48%] items-center"
              onPress={() => navigation.navigate("ManageOfficers")}
            >
              <Text className="text-[#686868]">{t("AddOfficer.Cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black rounded-3xl px-6 py-4 w-[48%] items-center ml-3"
              onPress={() => navigation.navigate("AddOfficerStep2")}
            >
              <Text className="text-white">{t("AddOfficer.Next")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* District Dropdown Modal - MULTI SELECT with Search */}
      <Modal
        visible={showDistrictDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDistrictModalClose}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <View>
                <Text className="text-lg font-semibold">
                  {t("AddOfficer.SelectDistricts")}
                </Text>
                {selectedDistricts.length > 0 && (
                  <Text className="text-sm text-green-600">
                    {selectedDistricts.length} {t("AddOfficer.selected")}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center">
                {selectedDistricts.length > 0 && (
                  <TouchableOpacity
                    onPress={clearAllDistricts}
                    className="mr-3"
                  >
                    <Text className="text-red-500 text-sm font-medium">
                      {t("AddOfficer.ClearAll")}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleDistrictModalClose}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            {renderDistrictSearchInput()}

            <FlatList
              data={getFilteredDistricts()}
              renderItem={renderDistrictItem}
              keyExtractor={(item) => item.en}
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
            <View className="px-4 py-3 border-t border-gray-200">
              <TouchableOpacity
                className="bg-[#21202B] rounded-xl py-3 items-center"
                onPress={handleDistrictModalClose}
              >
                <Text className="text-white font-semibold text-base">
                  {t("AddOfficer.Done")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Code Dropdown Modal 1 with Flags */}
      <Modal
        visible={showCountryCodeDropdown1}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeDropdown1(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectCountryCode")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryCodeDropdown1(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryData}
              renderItem={({ item }) =>
                renderCountryCodeItem(
                  { item },
                  setSelectedCountryCode1,
                  setShowCountryCodeDropdown1
                )
              }
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Country Code Dropdown Modal 2 with Flags */}
      <Modal
        visible={showCountryCodeDropdown2}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeDropdown2(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectCountryCode")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryCodeDropdown2(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryData}
              renderItem={({ item }) =>
                renderCountryCodeItem(
                  { item },
                  setSelectedCountryCode2,
                  setShowCountryCodeDropdown2
                )
              }
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep1;
