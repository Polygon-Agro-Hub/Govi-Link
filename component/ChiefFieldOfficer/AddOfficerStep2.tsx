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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import countryData from "@/assets/json/countryflag.json";
import banksData from "@/assets/json/banks.json";
import branchesData from "@/assets/json/branches.json";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

type AddOfficerStep2NavigationProps = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep2"
>;

interface AddOfficerStep2Props {
  navigation: AddOfficerStep2NavigationProps;
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

  // Address states - store English values for backend
  const [housePlotNo, setHousePlotNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [city, setCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Sri Lanka"); // English value
  const [selectedProvince, setSelectedProvince] = useState(""); // English value
  const [selectedDistrict, setSelectedDistrict] = useState(""); // English value

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

  // Dropdown states
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

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

    // convert ID to number
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

  // Render functions for dropdown items
  const renderCountryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl flex-row items-center"
      onPress={() => {
        setSelectedCountry(item.name.en); // Store English value
        setDisplayCountry(getTranslatedCountry(item)); // Set display value
        setShowCountryDropdown(false);
      }}
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
      onPress={() => {
        setSelectedProvince(item.name.en); // Store English value
        setDisplayProvince(getTranslatedProvince(item)); // Set display value
        setShowProvinceDropdown(false);
      }}
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
      onPress={() => {
        setSelectedDistrict(item.en); // Store English value
        setDisplayDistrict(getTranslatedDistrict(item)); // Set display value
        setShowDistrictDropdown(false);
      }}
    >
      <Text className="text-base text-gray-800">
        {getTranslatedDistrict(item)}
      </Text>
    </TouchableOpacity>
  );

  const renderBankItem = ({ item }: { item: { id: number; name: string } }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl"
      onPress={() => {
        setSelectedBank(item.name);
        setShowBankDropdown(false);
      }}
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
      onPress={() => {
        setSelectedBranch(item.name);
        setShowBranchDropdown(false);
      }}
    >
      <Text className="text-base text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );

  // Prepare data for next screen (you can use this when navigating)
  const prepareFormData = () => {
    return {
      address: {
        housePlotNo,
        streetName,
        city,
        country: selectedCountry, // English value for backend
        province: selectedProvince, // English value for backend
        district: selectedDistrict, // English value for backend
      },
      bankDetails: {
        commissionAmount,
        accountHolderName,
        accountNumber,
        confirmAccountNumber,
        bank: selectedBank,
        branch: selectedBranch,
      },
    };
  };

  const handleNext = () => {
    const formData = prepareFormData();
    console.log("Form Data for backend:", formData);
    // Navigate to next screen with the data
    navigation.navigate("AddOfficerStep3");
  };

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
              <TextInput
                placeholder={t("AddOfficer.HousePlotNumber")}
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
                value={housePlotNo}
                onChangeText={setHousePlotNo}
              />

              <TextInput
                placeholder={t("AddOfficer.StreetName")}
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
                value={streetName}
                onChangeText={setStreetName}
              />

              <TextInput
                placeholder={t("AddOfficer.City")}
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
                value={city}
                onChangeText={setCity}
              />

              {/* Country Dropdown */}
              <TouchableOpacity
                className="bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center"
                onPress={() => setShowCountryDropdown(true)}
              >
                <Text
                  className={`${
                    displayCountry ? "text-black" : "text-[#7D7D7D]"
                  }`}
                >
                  {displayCountry || t("AddOfficer.Country")}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>

              {/* Province Dropdown */}
              <TouchableOpacity
                className="bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center"
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
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>

              {/* District Dropdown */}
              <TouchableOpacity
                className="bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center"
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
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="border border-[#ADADAD] border-b-0 mt-6"></View>

          {/* Bank Details Section */}
          <View className="px-6 mt-6">
            <View className="space-y-4">
              <TextInput
                placeholder={t("AddOfficer.CommissionAmount")}
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
                value={commissionAmount}
                onChangeText={setCommissionAmount}
                keyboardType="numeric"
              />

              <TextInput
                placeholder={t("AddOfficer.AccountHolderName")}
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
                value={accountHolderName}
                onChangeText={setAccountHolderName}
              />

              <TextInput
                placeholder={t("AddOfficer.AccountNumber")}
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
              />

              <TextInput
                placeholder={t("AddOfficer.ConfirmAccountNumber")}
                placeholderTextColor="#7D7D7D"
                className="bg-[#F4F4F4] rounded-2xl px-4 py-4"
                value={confirmAccountNumber}
                onChangeText={setConfirmAccountNumber}
                keyboardType="numeric"
              />

              {/* Bank Dropdown */}
              <TouchableOpacity
                className="bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center"
                onPress={() => setShowBankDropdown(true)}
              >
                <Text
                  className={`${
                    selectedBank ? "text-black" : "text-[#7D7D7D]"
                  }`}
                >
                  {selectedBank || t("AddOfficer.BankName")}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>

              {/* Branch Dropdown */}
              <TouchableOpacity
                className="bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center"
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
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View className="px-6 mt-8 flex-row w-full justify-between">
            <TouchableOpacity
              className="bg-[#D9D9D9] rounded-3xl px-6 py-4 w-[48%] items-center"
              onPress={() => navigation.navigate("AddOfficerStep1")}
            >
              <Text className="text-[#686868] font-semibold">
                {t("AddOfficer.GoBack")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black rounded-3xl px-6 py-4 w-[48%] items-center ml-3"
              onPress={handleNext}
            >
              <Text className="text-white font-semibold">
                {t("AddOfficer.Next")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Country Dropdown Modal */}
      <Modal
        visible={showCountryDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectCountry")}
              </Text>
              <TouchableOpacity onPress={() => setShowCountryDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryData}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Province Dropdown Modal */}
      <Modal
        visible={showProvinceDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProvinceDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectProvince")}
              </Text>
              <TouchableOpacity onPress={() => setShowProvinceDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableProvinces}
              renderItem={renderProvinceItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* District Dropdown Modal */}
      <Modal
        visible={showDistrictDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectDistrict")}
              </Text>
              <TouchableOpacity onPress={() => setShowDistrictDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableDistricts}
              renderItem={renderDistrictItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Bank Dropdown Modal */}
      <Modal
        visible={showBankDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectBank")}
              </Text>
              <TouchableOpacity onPress={() => setShowBankDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={banks}
              renderItem={renderBankItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Branch Dropdown Modal */}
      <Modal
        visible={showBranchDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBranchDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectBranch")}
              </Text>
              <TouchableOpacity onPress={() => setShowBranchDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableBranches}
              renderItem={renderBranchItem}
              keyExtractor={(item) => item.ID.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep2;
