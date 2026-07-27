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
  Dimensions,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
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
import CustomHeader from "../commons/CustomHeader";
import GlobalSearchModal from "../commons/GlobalSearchModal";
import { useModal } from "@/hooks/useModal";
import { MaterialIcons } from "@expo/vector-icons";

type AddComplaintScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddComplaint"
>;

interface AddComplaintScreenProps {
  navigation: AddComplaintScreenNavigationProp;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const AddComplaintScreen: React.FC<AddComplaintScreenProps> = ({
  navigation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [complaintText, setComplaintText] = useState<string>("");
  const [category, setCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const categoryModal = useModal();

  useFocusEffect(
    React.useCallback(() => {
      resetForm();
      return () => {};
    }, []),
  );

  const resetForm = () => {
    setSelectedCategory("");
    setComplaintText("");
    categoryModal.hide();
  };

  const handleBackPress = () => {
    resetForm();
    navigation.goBack();
  };

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

    if (!selectedCategory && !complaintText.trim()) {
      Alert.alert(
        t("Error.Sorry"),
        t("AddComplaint.PleaseFillOutAllFields"),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    if (!selectedCategory && complaintText.trim()) {
      Alert.alert(
        t("Error.Sorry"),
        t("AddComplaint.PleaseSelectACategory"),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    if (selectedCategory && !complaintText.trim()) {
      Alert.alert(
        t("Error.Sorry"),
        t("AddComplaint.PleaseEnterYourComplaint"),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Error.YourLoginSessionHasExpiredPleaseLogInAgainToContinue",
          ),
          [{ text: t("Main.OK") }],
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
        t("AddComplaint.ComplaintSubmittedSuccessfully"),
        [{ text: t("Main.Ok") }],
      );
      resetForm();
      navigation.navigate("Main", { screen: "Dashboard" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        Alert.alert(
          t("Error.Sorry"),
          t("AddComplaint.FailedToSubmitComplaintPleaseTryAgain"),
          [{ text: t("Main.OK") }],
        );
      } else {
        console.error("An unknown error occurred.");
        Alert.alert(t("Error.Sorry"), t("Main.SomethingWentWrongPleaseTryAgainLater"), [
          { text: t("Main.OK") },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      setSelectedCategory(selectedValues[0]);
    }
  };

  const getSelectedLabel = () => {
    const selected = category.find((item) => item.value === selectedCategory);
    return selected
      ? selected.label
      : t("AddComplaint.SelectComplaintCategory");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <CustomHeader
        title={""}
        navigation={navigation}
        showBackButton={true}
        onBackPress={handleBackPress}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        className="flex-1 bg-white px-0"
      >
        <View className="flex-1 p-6">
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
              {t("AddComplaint.TellUsTheProblem")}
            </Text>
          </View>

          <TouchableOpacity
            onPress={categoryModal.show}
            className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-5 flex-row items-center justify-between h-[50px]"
            
          >
            <Text
              className={`text-base ${selectedCategory ? "text-black" : "text-[#434343]"}`}
            >
              {getSelectedLabel()}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          <Text className="text-center text-black mb-4 mt-4">
            -- {t("AddComplaint.WeWillGetBackToYouWithin2Days")} --
          </Text>

          <View className="mb-8">
            <TextInput
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder={t("AddComplaint.AddTheComplaintHere")}
              placeholderTextColor="#808FA2"
              className="text-black bg-white border border-[#9DB2CE] rounded-lg p-4 min-h-[280px]"
              style={{ fontStyle: complaintText ? "normal" : "italic" }}
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

          <View style={{ width: "100%", alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: "100%",
                borderRadius: 999,
                shadowColor: "#FF1D85",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 12,
                elevation: 12,
              }}
            >
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                style={{ width: "100%", borderRadius: 999 }}
              >
                <LinearGradient
                  colors={["#F2561D", "#FF1D85"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 999,
                    paddingVertical: 16,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text
                        style={{
                          color: "white",
                          fontSize: SCREEN_HEIGHT > 900 ? 20 : 18,
                          fontWeight: "700",
                          marginLeft: 8,
                        }}
                      >
                        {t("AddComplaint.Submitting...")}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{
                        color: "white",
                        fontSize: SCREEN_HEIGHT > 900 ? 20 : 18,
                        fontWeight: "700",
                      }}
                    >
                      {t("AddComplaint.Submit")}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <GlobalSearchModal
        visible={categoryModal.isVisible}
        onClose={categoryModal.hide}
        title={t("AddComplaint.SelectComplaintCategory")}
        data={category}
        selectedItems={selectedCategory ? [selectedCategory] : []}
        onSelect={handleCategorySelect}
        searchPlaceholder={t("AddComplaint.SearchCategory...")}
        doneButtonText={t("AddComplaint.Done") || "Done"}
        noResultsText={t("AddComplaint.No categories found")}
        multiSelect={false}
      />
    </KeyboardAvoidingView>
  );
};

export default AddComplaintScreen;
