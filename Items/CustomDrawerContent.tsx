import { View, Text, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState, useContext } from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
import {
  Ionicons,
  Entypo,
  FontAwesome6,
  FontAwesome,
} from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/services/store";
import { LanguageContext } from "@/context/LanguageContext";
import { useDispatch } from "react-redux";
import { logoutUser, clearAuth } from "@/store/authSlice";
import { useDrawerStatus } from "@react-navigation/drawer";
import LoadingPage from "@/component/commons/LoadingPage";

export default function CustomDrawerContent(props: any) {
  const { t } = useTranslation();
  const navigation = props.navigation;

  const [isLanguageDropdownOpen, setLanguageDropdownOpen] =
    useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(
    null,
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
  const isDrawerOpen = useDrawerStatus() === "open";

  useEffect(() => {
    setLanguageDropdownOpen(false);
    setComplaintDropdownOpen(false);
  }, [isDrawerOpen]);

  useFocusEffect(
    React.useCallback(() => {
      setComplaintDropdownOpen(false);
      setLanguageDropdownOpen(false);

      if (i18n.language === "en") {
        setSelectedLanguage("en");
      } else if (i18n.language === "si") {
        setSelectedLanguage("si");
      } else if (i18n.language === "ta") {
        setSelectedLanguage("ta");
      }
    }, [i18n.language]),
  );

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
    } catch (error) { }
  };

  const handleComplaintSelect = (complaint: string) => {
    setComplaintDropdownOpen(false);

    if (complaint === t("Drawer.Report Complaint")) {
      navigation.navigate("AddComplaint");
    } else if (complaint === t("Drawer.View Complaint History")) {
      navigation.navigate("ComplainHistory");
    }
  };

  const dispatch = useDispatch();

  const handleLogout = async () => {
    // Show confirmation alert before logout
    Alert.alert(
      t("Drawer.Logout"),
      t("Drawer.Are you sure you want to logout?"),
      [
        {
          text: t("Drawer.Cancel"),
          style: "cancel",
        },
        {
          text: t("Drawer.Logout"),
          style: "destructive",
          onPress: async () => {
            try {
              // Set intentional logout flag to prevent session expired message
              await AsyncStorage.setItem("intentional_logout", "true");

              // Show loading page
              setIsLoggingOut(true);

              // Clear all AsyncStorage data
              await AsyncStorage.multiRemove([
                "token",
                "jobRole",
                "empId",
                "userProfile",
                "tokenStoredTime",
                "tokenExpirationTime",
                "@user_language",
              ]);

              // Dispatch logout action to clear Redux state
              dispatch(logoutUser());
              dispatch(clearAuth());

              // Small delay to ensure loading page is shown
              setTimeout(() => {
                // Reset navigation stack and navigate to Login
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
                setIsLoggingOut(false);
              }, 1500);
            } catch (error) {
              console.error("Error logging out:", error);
              setIsLoggingOut(false);
              // Force navigation even if there's an error
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Show loading page while logging out
  if (isLoggingOut) {
    return (
      <LoadingPage
        fullScreen={true}
        message={t("Drawer.Logging out...")}
        color="#F35125"
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={{ padding: 0 }}>
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
                      className={`flex-row items-center py-2 px-4 rounded-lg my-1 ${selectedLanguage === language
                        ? "bg-[#FFDFF7]"
                        : "bg-transparent"
                        }`}
                    >
                      <Text
                        className={`text-base ${selectedLanguage === language
                          ? "text-black"
                          : "text-[#434343]"
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

            <TouchableOpacity
              className="flex-row items-center py-5"
              onPress={() => {
                navigation.navigate("MainTabs", {
                  screen: "Profile",
                });
                navigation.closeDrawer();
              }}
            >
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
                    className={`flex-row items-center py-2 px-4 rounded-lg my-1 ${selectedComplaint === complaint ? "bg-green-200" : ""
                      }`}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                      }}
                      className={` font-bold ${selectedComplaint === complaint
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
            {/* Change Password */}
            <TouchableOpacity
              className="flex-row items-center py-5"
              onPress={() =>
                navigation.navigate("ChangePassword", { passwordUpdate: 1 })
              }
            >
              <View className="bg-[#F4F9FB] rounded-full p-1">
                <Entypo name="lock" size={20} color="#999999" />
              </View>
              <Text className="flex-1 text-lg ml-2">
                {t("Drawer.Change Password")}
              </Text>
              <Ionicons
                name={"chevron-forward-sharp"}
                size={20}
                color="#999999"
              />
            </TouchableOpacity>
          </View>
        </View>
      </DrawerContentScrollView>
      <View className="p-4 ml-2 border-t border-gray-300">
        <TouchableOpacity
          className="flex-row items-center py-3"
          onPress={handleLogout}
        >
          <View className="bg-[#FFF2EE] rounded-full p-1">
            <Ionicons name="log-out-outline" size={20} color="red" />
          </View>
          <Text className="flex-1 text-lg ml-2 text-red-500">
            {t("Drawer.Logout")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}