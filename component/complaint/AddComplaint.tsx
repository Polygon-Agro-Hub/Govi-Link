import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import GlobalSearchModal from "../common/GlobalSearchModal";
import { useModal } from "@/hooks/useModal";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

type AddComplaintScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddComplaint"
>;

interface AddComplaintScreenProps {
  navigation: AddComplaintScreenNavigationProp;
}

const AddComplaintScreen: React.FC<AddComplaintScreenProps> = ({
  navigation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [complaintText, setComplaintText] = useState<string>("");
  const [category, setCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Use modal hook for category selection
  const categoryModal = useModal();

  // Clear form when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      resetForm();
      return () => {};
    }, []),
  );

  // Reset form function
  const resetForm = () => {
    setSelectedCategory("");
    setComplaintText("");
    categoryModal.hide();
  };

  // Handle back button press
  const handleBackPress = () => {
    resetForm();
    navigation.goBack();
  };

  // Fetch complaint categories from API
  useEffect(() => {
    const fetchComplainCategory = async () => {
      try {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/complaint/get-complain-category`,
        );
        if (response.data.status === "success") {
          const mappedCategories = response.data.data
            .map((item: any) => ({
              label: item.categoryEnglish,
              value: item.id,
              key: item.id,
            }))
            .filter((item: { key: any }) => item.key);

          setCategory(mappedCategories);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchComplainCategory();
  }, []);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    // Check if both fields are empty
    if (!selectedCategory && !complaintText.trim()) {
      Alert.alert(
        t("Error.error"),
        t("AddComplaint.Please fill out all fields."),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    // Check if category is not selected but complaint is entered
    if (!selectedCategory && complaintText.trim()) {
      Alert.alert(
        t("Error.error"),
        t("AddComplaint.Please select a category."),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    // Check if category is selected but complaint is empty
    if (selectedCategory && !complaintText.trim()) {
      Alert.alert(
        t("Error.error"),
        t("AddComplaint.Please enter your complaint."),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Error.Your login session has expired. Please log in again to continue.",
          ),
          [{ text: t("Main.ok") }],
        );
        return;
      }
      setLoading(true);
      const apiUrl = `${environment.API_BASE_URL}api/complaint/add-complaint`;

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
        },
      );

      Alert.alert(
        t("Main.Success"),
        t("AddComplaint.Complaint submitted successfully!"),
        [{ text: t("Main.ok") }],
      );
      resetForm();
      navigation.navigate("Main", { screen: "Dashboard" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        Alert.alert(
          t("Error.Sorry"),
          t("AddComplaint.Failed to submit complaint. Please try again."),
          [{ text: t("Main.ok") }],
        );
      } else {
        console.error("An unknown error occurred.");
        Alert.alert(t("Error.Sorry"), t("Main.somethingWentWrong"), [
          { text: t("Main.ok") },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection from modal
  const handleCategorySelect = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      setSelectedCategory(selectedValues[0]);
    }
  };

  // Get selected category label
  const getSelectedLabel = () => {
    const selected = category.find((item) => item.value === selectedCategory);
    return selected
      ? selected.label
      : t("AddComplaint.Select Complaint Category");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <StatusBar style="dark" backgroundColor="#fff" />
      <CustomHeader
        title={""}
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={handleBackPress}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ paddingHorizontal: wp(4), paddingVertical: hp(4) }}
        className="flex-1 bg-white"
      >
        <View className="flex-1 p-4">
          <View className="items-center mb-6 -mt-12">
            <Image
              source={require("@/assets/images/complaint/add-complaint.webp")}
              style={{
                width: 280,
                height: 200,
              }}
              resizeMode="contain"
            />
            <Text className="text-xl font-bold text-[#424242] mt-2">
              {t("AddComplaint.Tell us the problem")}
            </Text>
          </View>

          {/* Custom Dropdown Trigger using GlobalSearchModal */}
          <TouchableOpacity
            onPress={categoryModal.show}
            className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-5 flex-row items-center justify-between"
            style={{
              height: 55,
              borderRadius: 25,
            }}
          >
            <Text
              className={`text-base ${selectedCategory ? "text-black" : "text-[#434343]"}`}
            >
              {getSelectedLabel()}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          <Text className="text-center text-black mb-4 mt-4">
            -- {t("AddComplaint.We will get back to you within 2 days")} --
          </Text>

          <View className="mb-8">
            <TextInput
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder={t("AddComplaint.Add the Complaint here..")}
              placeholderTextColor="#808FA2"
              className="text-black bg-white border border-[#9DB2CE] rounded-lg p-4 min-h-[280px]"
              value={complaintText}
              onChangeText={(text) => {
                if (text.startsWith(" ")) {
                  return;
                }
                if (text.length > 0) {
                  const firstChar = text.charAt(0);
                  const isAlphabetic = /^[a-zA-Z]$/.test(firstChar);
                  if (!isAlphabetic) {
                    return;
                  }
                  if (text.length === 1) {
                    text = text.toUpperCase();
                  }
                }
                setComplaintText(text);
              }}
              autoCapitalize="sentences"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            className="mx-auto shadow-lg px-4 w-full pb-8"
            disabled={loading}
          >
            <LinearGradient
              colors={["#F2561D", "#FF1D85"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-3 rounded-full flex-row items-center justify-center"
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white text-lg font-bold ml-2">
                    {t("AddComplaint.Submitting...")}
                  </Text>
                </>
              ) : (
                <Text className="text-white text-lg font-bold">
                  {t("AddComplaint.Submit")}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* GlobalSearchModal for Category Selection */}
      <GlobalSearchModal
        visible={categoryModal.isVisible}
        onClose={categoryModal.hide}
        title={t("AddComplaint.Select Complaint Category")}
        data={category}
        selectedItems={selectedCategory ? [selectedCategory] : []}
        onSelect={handleCategorySelect}
        searchPlaceholder={t("AddComplaint.Search category...")}
        doneButtonText={t("AddComplaint.Done") || "Done"}
        noResultsText={t("AddComplaint.No categories found")}
        multiSelect={false}
      />
    </KeyboardAvoidingView>
  );
};

export default AddComplaintScreen;
