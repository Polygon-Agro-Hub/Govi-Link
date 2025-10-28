import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React, { useCallback, useEffect, useState, useContext } from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import axios from "axios";
import i18n from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
import {
  Ionicons,
  MaterialIcons,
  AntDesign,
  Entypo,
  FontAwesome6,
  FontAwesome,
} from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/services/store";
import { LanguageContext } from "@/context/LanguageContext";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/authSlice";
interface ProfileData {
  firstName: string;
  lastName: string;
  profileImg: string;
  firstNameSinhala: string;
  lastNameSinhala: string;
  firstNameTamil: string;
  lastNameTamil: string;
  empId: string;
}

export default function CustomDrawerContent(props: any) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLanguageDropdownOpen, setLanguageDropdownOpen] =
    useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(
    null
  );
  const [isComplaintDropdownOpen, setComplaintDropdownOpen] =
    useState<boolean>(false);
  const { changeLanguage } = useContext(LanguageContext);

  const userProfile = useSelector((state: RootState) => state.auth.userProfile);

  const getName = () => {
    if (!userProfile) return "Loading...";
    switch (i18n.language) {
      case "si":
        return `${userProfile.firstNameSinhala} ${userProfile.lastNameSinhala}`;
      case "ta":
        return `${userProfile.firstNameTamil} ${userProfile.lastNameTamil}`;
      default:
        return `${userProfile.firstName} ${userProfile.lastName}`;
    }
  };

  const getTextStyle = () => {
    if (i18n.language === "si") {
      return {
        fontSize: 16,
        lineHeight: 20,
      };
    }
  };

  const complaintOptions = [
    t("Drawer.Report Complaint"),
    t("Drawer.View Complaint History"),
  ];

  const handleLanguageSelect = async (language: string) => {
    setSelectedLanguage(language);
    changeLanguage(language);
    setLanguageDropdownOpen(false);
    try {
      await AsyncStorage.setItem("user_language", language);
    } catch (error) {}
  };

  const handleComplaintSelect = (complaint: string) => {
    setComplaintDropdownOpen(false);

    if (complaint === t("Drawer.Report Complaint")) {
      // navigation.navigate("ComplainPage" as any, { userId: 0 });
    } else if (complaint === t("Drawer.View Complaint History")) {
      // navigation.navigate("Main", { screen: "ComplainHistory" ,params: {fullname: getFullName }} );
    }
  };

  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      dispatch(logoutUser());
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" as never }],
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={{ padding: 0 }}>
          {/* Example: List of items */}
          <DrawerItemList {...props} />

          <View className="ml-4">
            <Text
              style={[{ fontSize: 16 }, getTextStyle()]}
              className="text-lg font-bold"
            >
              {getName()}
            </Text>
            <Text className="text-[#6E7F96] text-lg">{userProfile?.empId}</Text>
          </View>

          <View className="flex-1 p-4 ">
            <View className="bg-[#D2D2D2] my-2 h-0.5  " />

            <TouchableOpacity
              onPress={() => setLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex-row items-center py-3"
            >
              <View className="bg-[#F4F9FB] rounded-full p-1">
                <Ionicons name="globe-outline" size={18} color="#999999" />
              </View>
              <Text className="flex-1 text-lg ml-2">
                {t("Drawer.Language")}
              </Text>
              <Ionicons
                name={
                  isLanguageDropdownOpen
                    ? "chevron-up"
                    : "chevron-forward-sharp"
                }
                size={20}
                color="#999999"
              />
            </TouchableOpacity>

            {/* Then render dropdown AFTER the trigger */}
            {isLanguageDropdownOpen && (
              <View className="pl-8 bg-white  rounded-lg mt-2">
                {["en", "si", "ta"].map((language) => {
                  const displayLanguage =
                    language === "si"
                      ? "සිංහල"
                      : language === "ta"
                      ? "தமிழ்"
                      : language === "en"
                      ? "English"
                      : language;
                  return (
                    <TouchableOpacity
                      key={language}
                      onPress={() => handleLanguageSelect(language)}
                      className={`flex-row items-center py-2 px-4 rounded-lg my-1 ${
                        selectedLanguage === language
                          ? "bg-[#FFDFF7]"
                          : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-base ${
                          selectedLanguage === language
                            ? "text-black"
                            : "text-[#434343]" // Fixed: Added "text-" prefix
                        }`}
                      >
                        {displayLanguage}
                      </Text>
                      {selectedLanguage === language && (
                        <View className="absolute right-4">
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#999999"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity className="flex-row items-center py-5">
              <View className="bg-[#F4F9FB] rounded-full p-1">
                <FontAwesome6 name="user-large" size={18} color="#999999" />
              </View>
              <Text className="flex-1 text-lg ml-2">{t("Drawer.Profile")}</Text>
              <Ionicons
                name={"chevron-forward-sharp"}
                size={20}
                color="#999999"
              />
            </TouchableOpacity>

            {/* Change Password */}
            <TouchableOpacity
              className="flex-row items-center py-5"
              // onPress={() =>
              //   navigation.navigate("ChangePassword")}
            >
              <View className="bg-[#F4F9FB] rounded-full p-1">
                <Entypo name="lock" size={20} color="#999999" />
              </View>
              <Text className="flex-1 text-lg ml-2">
                {t("Drawer.Change Password")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setComplaintDropdownOpen(!isComplaintDropdownOpen)}
              className="flex-row items-center py-5"
            >
              <View className="bg-[#F4F9FB] rounded-full p-1">
                <FontAwesome name="question-circle" size={20} color="#999999" />
              </View>
              <Text className="flex-1 text-lg ml-2">
                {t("Drawer.Complaints")}
              </Text>
              <Ionicons
                name={
                  isComplaintDropdownOpen
                    ? "chevron-up"
                    : "chevron-forward-sharp"
                }
                size={20}
                color="#999999"
              />
            </TouchableOpacity>

            {isComplaintDropdownOpen && (
              <View className="pl-8">
                {complaintOptions.map((complaint) => (
                  <TouchableOpacity
                    key={complaint}
                    onPress={() => handleComplaintSelect(complaint)}
                    className={`flex-row items-center py-2 px-4 rounded-lg my-1 ${
                      selectedComplaint === complaint ? "bg-green-200" : ""
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        selectedComplaint === complaint
                          ? "text-black"
                          : "#434343"
                      }`}
                    >
                      {complaint}
                    </Text>
                    {selectedComplaint === complaint && (
                      <View className="absolute right-4">
                        <Ionicons name="checkmark" size={20} color="#999999" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </DrawerContentScrollView>
      <View className="p-4 ml-2 border-t border-gray-300">
        <TouchableOpacity
          className="flex-row items-center py-3"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="red" />
          <Text className="flex-1 text-lg ml-2 text-red-500">
            {t("Drawer.Logout")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
