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
import { useNavigation } from "@react-navigation/native";

const AddOfficerStep2 = () => {
  const navigation = useNavigation();

  // Address states
  const [housePlotNo, setHousePlotNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [city, setCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("Sri Lanka");

  // Bank details states
  const [commissionAmount, setCommissionAmount] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Dropdown states
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

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

  // Banks in Sri Lanka
  const banks = [
    "Bank of Ceylon",
    "People's Bank",
    "Commercial Bank",
    "Hatton National Bank",
    "Sampath Bank",
    "National Savings Bank",
    "DFCC Bank",
    "Seylan Bank",
    "NTB (Nations Trust Bank)",
    "Pan Asia Bank",
    "Union Bank",
    "HSBC Sri Lanka",
    "Standard Chartered Sri Lanka",
  ];

  // Branches (simplified - in real app you'd fetch based on selected bank)
  const branches = [
    "Colombo Main Branch",
    "Kandy City Branch",
    "Galle Main Branch",
    "Jaffna Branch",
    "Kurunegala Branch",
    "Matara Branch",
    "Anuradhapura Branch",
    "Ratnapura Branch",
    "Badulla Branch",
    "Trincomalee Branch",
  ];

  // District to Province mapping
  const districtToProvince: { [key: string]: string } = {
    Colombo: "Western",
    Gampaha: "Western",
    Kalutara: "Western",
    Kandy: "Central",
    Matale: "Central",
    "Nuwara Eliya": "Central",
    Galle: "Southern",
    Matara: "Southern",
    Hambantota: "Southern",
    Jaffna: "Northern",
    Kilinochchi: "Northern",
    Mannar: "Northern",
    Mullaitivu: "Northern",
    Vavuniya: "Northern",
    Anuradhapura: "North Central",
    Polonnaruwa: "North Central",
    Badulla: "Uva",
    Moneragala: "Uva",
    Ratnapura: "Sabaragamuwa",
    Kegalle: "Sabaragamuwa",
    Trincomalee: "Eastern",
    Batticaloa: "Eastern",
    Ampara: "Eastern",
    Puttalam: "North Western",
    Kurunegala: "North Western",
  };

  // Auto-select province when district changes
  useEffect(() => {
    if (selectedDistrict && districtToProvince[selectedDistrict]) {
      setProvince(districtToProvince[selectedDistrict]);
    } else {
      setProvince("");
    }
  }, [selectedDistrict]);

  const renderDistrictItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => {
        setSelectedDistrict(item);
        setShowDistrictDropdown(false);
      }}
    >
      <Text className="text-base text-gray-800">{item}</Text>
    </TouchableOpacity>
  );

  const renderBankItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => {
        setSelectedBank(item);
        setShowBankDropdown(false);
      }}
    >
      <Text className="text-base text-gray-800">{item}</Text>
    </TouchableOpacity>
  );

  const renderBranchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => {
        setSelectedBranch(item);
        setShowBranchDropdown(false);
      }}
    >
      <Text className="text-base text-gray-800">{item}</Text>
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
          <Text className="text-2xl font-bold text-black text-center flex-1">
            Add Officer
          </Text>
          <View style={{ width: 55 }} />
        </View>

        {/* Address Section */}
        <View className="px-6 mt-4">
          <View className="space-y-3">
            <TextInput
              placeholder="--House / Plot Number--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={housePlotNo}
              onChangeText={setHousePlotNo}
            />

            <TextInput
              placeholder="--Street Name--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={streetName}
              onChangeText={setStreetName}
            />

            <TextInput
              placeholder="--City--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={city}
              onChangeText={setCity}
            />

            {/* District Dropdown - SINGLE SELECT */}
            <TouchableOpacity
              className="bg-[#F4F4F4] rounded-3xl px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowDistrictDropdown(true)}
            >
              <Text
                className={`${
                  selectedDistrict ? "text-black" : "text-[#7D7D7D]"
                }`}
              >
                {selectedDistrict || "--District--"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>

            {/* Province (Auto-filled) */}
            <TextInput
              placeholder="--Province--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={province}
              onChangeText={setProvince}
              editable={false}
            />

            <TextInput
              placeholder="--Country--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={country}
              onChangeText={setCountry}
            />
          </View>
        </View>

        <View className="border border-[#ADADAD] border-b-0 mt-6"></View>

        {/* Bank Details Section */}
        <View className="px-6 mt-6">
          <View className="space-y-3">
            <TextInput
              placeholder="--Commission Amount(%)--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={commissionAmount}
              onChangeText={setCommissionAmount}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="--Account Holder's Name--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
            />

            <TextInput
              placeholder="--Account Number--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="--Confirm Account Number--"
              placeholderTextColor="#7D7D7D"
              className="bg-[#F4F4F4] rounded-3xl px-4 py-4"
              value={confirmAccountNumber}
              onChangeText={setConfirmAccountNumber}
              keyboardType="numeric"
            />

            {/* Bank Dropdown */}
            <TouchableOpacity
              className="bg-[#F4F4F4] rounded-3xl px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowBankDropdown(true)}
            >
              <Text
                className={`${selectedBank ? "text-black" : "text-[#7D7D7D]"}`}
              >
                {selectedBank || "--Bank Name--"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>

            {/* Branch Dropdown */}
            <TouchableOpacity
              className="bg-[#F4F4F4] rounded-3xl px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowBranchDropdown(true)}
            >
              <Text
                className={`${
                  selectedBranch ? "text-black" : "text-[#7D7D7D]"
                }`}
              >
                {selectedBranch || "--Branch Name--"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View className="px-6 mt-8 flex-row w-full justify-between">
          <TouchableOpacity
            className="bg-[#D9D9D9] rounded-2xl px-6 py-4 w-[48%] items-center"
            onPress={() => navigation.navigate("AddOfficerStep1")}
          >
            <Text className="text-[#686868] font-semibold">Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-black rounded-2xl px-6 py-4 w-[48%] items-center ml-3"
            onPress={() => navigation.navigate("AddOfficerStep3")}
          >
            <Text className="text-white font-semibold">Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* District Dropdown Modal */}
      <Modal
        visible={showDistrictDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictDropdown(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">Select District</Text>
              <TouchableOpacity onPress={() => setShowDistrictDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={districts}
              renderItem={renderDistrictItem}
              keyExtractor={(item) => item}
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
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={banks}
              renderItem={renderBankItem}
              keyExtractor={(item) => item}
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
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">Select Branch</Text>
              <TouchableOpacity onPress={() => setShowBranchDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={branches}
              renderItem={renderBranchItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep2;
