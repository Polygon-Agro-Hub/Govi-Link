import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RadioButton } from "react-native-paper";
import Checkbox from "expo-checkbox";
import { useNavigation } from "@react-navigation/native";

import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
type AddOfficerStep1NavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep1"
>;

interface AddOfficerStep1ScreenProps {
  navigation: AddOfficerStep1NavigationProp;
}

const AddOfficerStep1: React.FC<AddOfficerStep1ScreenProps> = ({ navigation }) => {
  const [type, setType] = useState<"Permanent" | "Temporary">("Permanent");
// const [languages, setLanguages] = useState<Record<LanguageKey, boolean>>({
//   Sinhala: true,
//   English: false,
//   Tamil: false,
// });

const [languages, setLanguages] = useState({
  Sinhala: true,
  English: false,
  Tamil: false,
});


// const toggleLanguage = (lang: LanguageKey) => {
//   setLanguages(prev => ({ ...prev, [lang]: !prev[lang] }));
// };

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

  // Country code dropdown states
  const [selectedCountryCode1, setSelectedCountryCode1] = useState("+94");
  const [selectedCountryCode2, setSelectedCountryCode2] = useState("+94");
  const [showCountryCodeDropdown1, setShowCountryCodeDropdown1] =
    useState(false);
  const [showCountryCodeDropdown2, setShowCountryCodeDropdown2] =
    useState(false);

  // const navigation = useNavigation();

  // Sri Lanka districts
  const districts = [
    "Ampara",
    "Anuradhapura",
    "Badulla",
    "Batticaloa",
    "Colombo",
    "Galle",
    "Gampaha",
    "Hambantota",
    "Jaffna",
    "Kalutara",
    "Kandy",
    "Kegalle",
    "Kilinochchi",
    "Kurunegala",
    "Mannar",
    "Matale",
    "Matara",
    "Moneragala",
    "Mullaitivu",
    "Nuwara Eliya",
    "Polonnaruwa",
    "Puttalam",
    "Ratnapura",
    "Trincomalee",
    "Vavuniya",
  ];

  // Country codes
  const countryCodes = [
    { code: "+94", country: "Sri Lanka" },
    { code: "+91", country: "India" },
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "Australia" },
  ];

  const toggleLanguage = (lang:  keyof typeof languages) => {
    setLanguages((prev) => ({ ...prev, [lang]: !prev[lang] }));
  };

  // Toggle district selection
  const toggleDistrictSelection = (district: string) => {
    setSelectedDistricts((prev) => {
      if (prev.includes(district)) {
        // Remove district if already selected
        return prev.filter((d) => d !== district);
      } else {
        // Add district if not selected
        return [...prev, district];
      }
    });
  };

  // Clear all selected districts
  const clearAllDistricts = () => {
    setSelectedDistricts([]);
  };

  // Get display text for districts
  const getDistrictDisplayText = () => {
    if (selectedDistricts.length === 0) {
      return "--Assigned District--";
    } else if (selectedDistricts.length === 1) {
      return selectedDistricts[0];
    } else if (selectedDistricts.length === 2) {
      return `${selectedDistricts[0]}, ${selectedDistricts[1]}`;
    } else {
      return `${selectedDistricts[0]}, ${selectedDistricts[1]} +${
        selectedDistricts.length - 2
      } more`;
    }
  };

  const renderDistrictItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 flex-row justify-between items-center"
      onPress={() => toggleDistrictSelection(item)}
    >
      <Text className="text-base text-gray-800">{item}</Text>
      <Checkbox
        value={selectedDistricts.includes(item)}
        onValueChange={() => toggleDistrictSelection(item)}
        color={selectedDistricts.includes(item) ? "#21202B" : undefined}
      />
    </TouchableOpacity>
  );

  const renderCountryCodeItem = (
    { item }: { item: { code: string; country: string } },
    setCode: Function,
    setShow: Function
  ) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 flex-row justify-between items-center rounded-3xl"
      onPress={() => {
        setCode(item.code);
        setShow(false);
      }}
    >
      <Text className="text-base text-gray-800 font-medium">{item.code}</Text>
      <Text className="text-sm text-gray-600">{item.country}</Text>
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
          <Text className="text-2xl font-bold text-black text-center flex-1">
            Add Officer
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
        <View className="px-6 mt-6">
          <View className="flex flex-row items-center space-x-6 justify-between">
            <Text className="text-base font-medium">Type:</Text>
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
              <Text className="ml-1 text-base text-[#534E4E]">Permanent</Text>
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
              <Text className="ml-1 text-base text-[#534E4E]">Temporary</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

        {/* Preferred Languages */}
        <View className="px-6 mt-4">
          <Text className="text-base font-medium mb-4">
            Preferred Languages:
          </Text>
          <View className="flex-row justify-between space-x-4">
            {/* {Object.keys(languages).map((lang) => (
              <View key={lang} className="flex-row items-center space-x-1">
                <Checkbox
                  value={languages[lang]}
                  onValueChange={() => toggleLanguage(lang)}
                  color={languages[lang] ? "#21202B" : undefined}
                />
                <Text className="text-base text-[#534E4E]">{lang}</Text>
              </View>
            ))} */}

{(Object.keys(languages) as Array<keyof typeof languages>).map((lang) => (
  <View key={lang} className="flex-row items-center space-x-1">
    <Checkbox
      value={languages[lang]}
      onValueChange={() => toggleLanguage(lang)}
      color={languages[lang] ? "#21202B" : undefined}
    />
    <Text className="text-base text-[#534E4E]">{lang}</Text>
  </View>
))}

          </View>
        </View>

        <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

        {/* Form Fields */}
        <View className="px-6 mt-4 space-y-3">
          {/* District Dropdown - MULTI SELECT */}
          <TouchableOpacity
            className="bg-[#F4F4F4] rounded-3xl px-4 py-3 flex-row justify-between items-center"
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
            placeholder="--First Name in English--"
            placeholderTextColor="#7D7D7D"
            className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
            value={firstNameEN}
            onChangeText={setFirstNameEN}
          />
          <TextInput
            placeholder="--Last Name in English--"
            placeholderTextColor="#7D7D7D"
            className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
            value={lastNameEN}
            onChangeText={setLastNameEN}
          />

          <TextInput
            placeholder="--First Name in Sinhala--"
            placeholderTextColor="#7D7D7D"
            className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
            value={firstNameSI}
            onChangeText={setFirstNameSI}
          />
          <TextInput
            placeholder="--Last Name in Sinhala--"
            placeholderTextColor="#7D7D7D"
            className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
            value={lastNameSI}
            onChangeText={setLastNameSI}
          />

          <TextInput
            placeholder="--First Name in Tamil--"
            placeholderTextColor="#7D7D7D"
            className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
            value={firstNameTA}
            onChangeText={setFirstNameTA}
          />
          <TextInput
            placeholder="--Last Name in Tamil--"
            placeholderTextColor="#7D7D7D"
            className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
            value={lastNameTA}
            onChangeText={setLastNameTA}
          />
        </View>
        <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

        <View className="px-6 mt-4 space-y-3">
          {/* Phone Numbers */}
          <View className="flex-row space-x-2">
            {/* Phone 1 Country Code */}
            <TouchableOpacity
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4 w-20 flex-row justify-between items-center"
              onPress={() => setShowCountryCodeDropdown1(true)}
            >
              <Text className="text-black">{selectedCountryCode1}</Text>
              <MaterialIcons name="arrow-drop-down" size={18} color="#666" />
            </TouchableOpacity>

            <TextInput
              placeholder="7XXXXXXXX"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4 flex-1"
              value={phone1}
              onChangeText={setPhone1}
              keyboardType="phone-pad"
            />
          </View>

          <View className="flex-row space-x-2">
            {/* Phone 2 Country Code */}
            <TouchableOpacity
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4 w-20 flex-row justify-between items-center"
              onPress={() => setShowCountryCodeDropdown2(true)}
            >
              <Text className="text-black">{selectedCountryCode2}</Text>
              <MaterialIcons name="arrow-drop-down" size={18} color="#666" />
            </TouchableOpacity>

            <TextInput
              placeholder="7XXXXXXXX"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4 flex-1"
              value={phone2}
              onChangeText={setPhone2}
              keyboardType="phone-pad"
            />
          </View>

          <TextInput
            placeholder="--NIC Number--"
            placeholderTextColor="#7D7D7D"
            className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
            value={nic}
            onChangeText={setNic}
          />
          <TextInput
            placeholder="--Email Address--"
            placeholderTextColor="#7D7D7D"
            className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Buttons */}
        <View className="px-6 mt-6 flex-row w-full justify-between">
          <TouchableOpacity
            className="bg-[#D9D9D9] rounded-2xl px-6 py-4 w-[48%] items-center"
            onPress={() => navigation.navigate("ManageOfficers")}
          >
            <Text className="text-[#686868]">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-black rounded-2xl px-6 py-4 w-[48%] items-center ml-3"
            onPress={() => navigation.navigate("AddOfficerStep2")}
          >
            <Text className="text-white">Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* District Dropdown Modal - MULTI SELECT */}
      <Modal
        visible={showDistrictDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-96">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <View>
                <Text className="text-lg font-semibold">Select Districts</Text>
                {selectedDistricts.length > 0 && (
                  <Text className="text-sm text-green-600">
                    {selectedDistricts.length} selected
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
                      Clear All
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setShowDistrictDropdown(false)}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={districts}
              renderItem={renderDistrictItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              className="max-h-64"
            />
            <View className="px-4 py-3 border-t border-gray-200">
              <TouchableOpacity
                className="bg-[#21202B] rounded-xl py-3 items-center"
                onPress={() => setShowDistrictDropdown(false)}
              >
                <Text className="text-white font-semibold text-base">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Code Dropdown Modal 1 */}
      <Modal
        visible={showCountryCodeDropdown1}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeDropdown1(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">Select Country Code</Text>
              <TouchableOpacity
                onPress={() => setShowCountryCodeDropdown1(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
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

      {/* Country Code Dropdown Modal 2 */}
      <Modal
        visible={showCountryCodeDropdown2}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeDropdown2(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">Select Country Code</Text>
              <TouchableOpacity
                onPress={() => setShowCountryCodeDropdown2(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
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
