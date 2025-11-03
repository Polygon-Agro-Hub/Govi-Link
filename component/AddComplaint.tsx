import React, { useState, useEffect} from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
  } from "react-native-responsive-screen";
import axios from "axios";
import{ environment} from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import { AntDesign } from "@expo/vector-icons"; 
import { useTranslation } from "react-i18next";
type AddComplaintScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddComplaint"
>;

interface AddComplaintScreenProps {
  navigation: AddComplaintScreenNavigationProp;
}

const AddComplaintScreen: React.FC<AddComplaintScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  console.log(selectedCategory)
  const [complaintText, setComplaintText] = useState<string>("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [category, setCategory] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
  
    const [searchValue, setSearchValue] = useState('');
const [filteredCategory, setFilteredCategory] = useState<any[]>([]);
  const { t } = useTranslation();
    useEffect(() => {
      let appName = "GoviLink";

  
      console.log("appName", appName);
      const fetchComplainCategory = async () => {
        try {
          const response = await axios.get(
            `${environment.API_BASE_URL}api/complain/get-complain/category/${appName}`
          );
          console.log("response", response.data);
        if (response.data.status === "success") {
        const mappedCategories = response.data.data
            .map((item: any) => ({
                key: item.id,
                value: item.categoryEnglish
            }))
            .filter((item: { key: any }) => item.key);
        
        setCategory(mappedCategories);
        setFilteredCategory(mappedCategories); // Initialize filtered list
    }
        } catch (error) {
          console.error(error);
        }
      };
  
      fetchComplainCategory();
    }, []);

    const handleSubmit = async () => {
      if (!selectedCategory || !complaintText.trim()) {
        Alert.alert(t("Error.error"), t("AddComplaint.Please fill out all fields."));
        return;
      }
    
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          Alert.alert(t("Error.error"), "No authentication token found");
          return;
        }
    
        console.log(selectedCategory, complaintText);     
    
        const apiUrl = `${environment.API_BASE_URL}api/complain/add-complain`;
    
        const response = await axios.post(
          apiUrl,
          {
            language: "English",
            category: selectedCategory,
            complain: complaintText,
          },
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
    
        alert(t("AddComplaint.Complaint submitted successfully!"));
        setSelectedCategory(""); // Clear form after submission
        setComplaintText("");
        navigation.goBack(); // Navigate back after submitting
       } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          alert(t("AddComplaint.Failed to submit complaint. Please try again."));
        } else {
          console.error("An unknown error occurred.");
          alert(t("Main.somethingWentWrong"));
        }
      }
    }

// Also add this useEffect to sync when category changes
useEffect(() => {
    setFilteredCategory(category);
}, [category]);

const handleSearchChange = (text: string) => {
    let filteredText = text;
    
    // Remove leading spaces
    if (filteredText.startsWith(' ')) {
        filteredText = filteredText.replace(/^\s+/, '');
    }
    
    // Allow only letters, numbers, and spaces
    filteredText = filteredText.replace(/[^a-zA-Z0-9\s]/g, '');
    
    // Clean up multiple spaces
    filteredText = filteredText.replace(/\s+/g, ' ');
    
    setSearchValue(filteredText);
    
    // Filter categories based on cleaned search text
    if (filteredText.trim() === '') {
        setFilteredCategory(category); // Show all if search is empty
    } else {
        const filtered = category.filter(item => 
            item.value.toLowerCase().includes(filteredText.toLowerCase())
        );
        setFilteredCategory(filtered);
    }
};



  return (
         

  <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })} // Adjust this value as needed
              style={{ flex: 1 ,backgroundColor: "white" }}
            >
      <ScrollView 
      keyboardShouldPersistTaps="handled"
      style={{ paddingHorizontal: wp(4) }}
      className="flex-1 bg-white"
      >

<View>
                  <TouchableOpacity 
                   style = {{ paddingHorizontal: wp(2), paddingVertical: hp(2)}}
                  onPress={() => navigation.goBack()}>
                    <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                      <AntDesign name="left" size={20} color="black" />
                    </View>
                  </TouchableOpacity>

</View>
            <View className="flex-1 p-4">
                <View className="items-center mb-6 -mt-10">
                  <Image source={require("../assets/add complaint.webp")} 
                  style={{
                    width:300,
                    height: 200
                  }}
                resizeMode="contain" />
                  <Text className="text-xl font-bold text-[#424242] mt-2">
                    {t("AddComplaint.Tell us the problem")}
                  </Text>
                </View>

<DropDownPicker
  open={open}
  setOpen={setOpen}
  value={selectedCategory}
  setValue={setSelectedCategory}
  items={filteredCategory.map(item => ({
    label: item.value,
    value: item.key
  }))}
  searchable={true}
  searchPlaceholder={t("AddComplaint.Search category...")}
  placeholder={t("AddComplaint.Select Complaint Category")}
  style={{
    borderColor: "#fff",
    borderRadius: 30,
    height: 50,
    backgroundColor: "#F6F6F6",
  }}
  dropDownContainerStyle={{
    // borderBottomColor:"#0a0a0bff",
    borderColor: "#fff",
    backgroundColor: "#F6F6F6",
    maxHeight: 500,
  }}
  textStyle={{
    color: "#434343",
    fontSize: 14,
  }}
  searchTextInputStyle={{
    borderColor: "#0c0c0cff",
    color: "#434343",
  }}
  searchContainerStyle={{
    borderBottomColor: "#E5E7EB",
  }}
  listItemLabelStyle={{
    fontSize: 12,
  }}
  zIndex={3000}
  zIndexInverse={1000}
  listMode="SCROLLVIEW"
  searchTextInputProps={{
    onChangeText: handleSearchChange,
    value: searchValue,
  }}
/>
              

                

                <Text className="text-center text-black mb-4 mt-4">
                  -- {t("AddComplaint.We will get back to you within 2 days")} --
                </Text>
<View className="mb-8">
  <TextInput
    multiline
    numberOfLines={6}
    textAlignVertical="top"
    placeholder="Add the Complaint here.."
    placeholderTextColor="#808FA2 text-italic" 
    className="text-black bg-white border border-[#9DB2CE] rounded-lg p-4 min-h-[280px] "
    value={complaintText}
    onChangeText={(text) => {
      // Prevent leading spaces
      if (text.startsWith(' ')) {
        return; // Don't update state if text starts with space
      }
      
      // Check if first character is alphabetic only (no numbers or special characters)
      if (text.length > 0) {
        const firstChar = text.charAt(0);
        const isAlphabetic = /^[a-zA-Z]$/.test(firstChar);
        
        if (!isAlphabetic) {
          return; // Don't update state if first character is not alphabetic
        }
        
        // Capitalize first letter if it's the first character
        if (text.length === 1) {
          text = text.toUpperCase();
        }
      }
      
      setComplaintText(text);
    }}
    autoCapitalize="sentences"
  />
</View>

                <TouchableOpacity onPress={handleSubmit} className="mx-auto shadow-lg px-4 w-full pb-8 ">
  <LinearGradient
    colors={["#F2561D", "#FF1D85"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="py-3 rounded-full items-center"
  >
    <Text className="text-white text-lg font-bold">{t("AddComplaint.Submit")}</Text>
  </LinearGradient>
</TouchableOpacity>

            </View>
   
      </ScrollView>
      </KeyboardAvoidingView>
  );
};

export default AddComplaintScreen;


