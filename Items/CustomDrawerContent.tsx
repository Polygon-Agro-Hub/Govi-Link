import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useState } from "react";
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import axios from "axios";
import i18n from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialIcons, AntDesign, Entypo, FontAwesome6, FontAwesome } from "@expo/vector-icons";


interface ProfileData {
  firstName: string;
  lastName: string;
  profileImg: string;
  firstNameSinhala: string;
  lastNameSinhala: string;
  firstNameTamil: string;
  lastNameTamil: string;
  empId: string
}

export default function CustomDrawerContent(props: any) {
  const { bottom } = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const { t } = useTranslation();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<ProfileData| null> (null)
   const [isLanguageDropdownOpen, setLanguageDropdownOpen] = useState<boolean>(false);
     const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(
    null
  );
  const [isComplaintDropdownOpen, setComplaintDropdownOpen] =
    useState<boolean>(false);
  console.log("profileim", profile?.profileImg)
      const openDrawer = ()=>{
        navigation.dispatch(DrawerActions.openDrawer())
    }
  


     const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/auth/user-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(response.data.data);
       console.log("data", response.data.data);
       
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

   useEffect(() => {
    fetchUserProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

    const getName = () => {
    if (!profile) return "Loading...";
    switch (i18n.language) {
      case "si":
        return `${profile.firstNameSinhala} ${profile.lastNameSinhala}`;
      case "ta":
        return `${profile.firstNameTamil} ${profile.lastNameTamil}`;
      default:
        return `${profile.firstName} ${profile.lastName}`;
    }
  };
  const closeDrawer = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
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
    t("EngProfile.Report Complaint"),
    t("EngProfile.View Complaint History"),
  ];

  const LanguageSelect = async (language: string) => {
    try {
      await AsyncStorage.setItem("user_language", language);
      // changeLanguage(language);
    } catch (error) {}
  };

  const handleLanguageSelect = (language: string) => {
    console.log("Selected language:", language);
    // setSelectedLanguage(language);
    setLanguageDropdownOpen(false);
    try {
      if (language === "ENGLISH") {
        LanguageSelect("en");
        // HanldeAsynStorage("en");
      } else if (language === "TAMIL") {
        LanguageSelect("ta");
        // HanldeAsynStorage("ta");
      } else if (language === "SINHALA") {
        LanguageSelect("si");
        // HanldeAsynStorage("si");
      }
    } catch (error) {}
  };

    const handleComplaintSelect = (complaint: string) => {
    setComplaintDropdownOpen(false);

    if (complaint === t("EngProfile.Report Complaint")) {
      // navigation.navigate("ComplainPage" as any, { userId: 0 });
    } else if (complaint === t("EngProfile.View Complaint History")) {
      // navigation.navigate("Main", { screen: "ComplainHistory" ,params: {fullname: getFullName }} );
    }
  };

  return (
    <View style={{ flex: 1 }}>
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 0 }}>
        {/* Example: List of items */}
        <DrawerItemList {...props} />

                <View className='ml-4'>
                       <Text    style={[{ fontSize: 16 }, getTextStyle()]}
                    className="text-lg font-bold">
                 {getName()}
        
                </Text>
                       <Text
                    className="text-[#6E7F96] text-lg"
                  >
                    {profile?.empId}
                  </Text>
                  </View>

                        <View className="flex-1 p-4 ">
         
          <View className="bg-[#D2D2D2] my-2" />

           <TouchableOpacity
    onPress={() => setLanguageDropdownOpen(!isLanguageDropdownOpen)}
    className="flex-row items-center py-3"
  >
    <Ionicons name="globe-outline" size={20} color="black" />
    <Text className="flex-1 text-lg ml-2">
      {t("Drawer.Language")}
    </Text>
    <Ionicons
      name={isLanguageDropdownOpen ? "chevron-up" : "chevron-down"}
      size={20}
      color="black"
    />
  </TouchableOpacity>

  {/* Then render dropdown AFTER the trigger */}
  {isLanguageDropdownOpen && (
    <View className="pl-8 bg-white  rounded-lg mt-2">
      {["ENGLISH", "SINHALA", "TAMIL"].map((language) => {
        const displayLanguage =
          language === "SINHALA" ? "සිංහල" : language === "TAMIL" ? "தமிழ்" : language === "ENGLISH" ? "English" : language;
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
                : "text-[#434343]"  // Fixed: Added "text-" prefix
            }`}
          >
            {displayLanguage}
          </Text>
          {selectedLanguage === language && (
            <View className="absolute right-4">
              <Ionicons name="checkmark" size={20} color="black" />
            </View>
          )}
        </TouchableOpacity>
           );
              })}
    </View>
  )}

  
           <TouchableOpacity
    className="flex-row items-center py-5"
  >
    <FontAwesome6 name="user-large" size={20} color="black"  />
    <Text className="flex-1 text-lg ml-2">
      {t("Drawer.Profile")}
    </Text>
    <Ionicons
      name={"chevron-up"}
      size={20}
      color="black"
    />
  </TouchableOpacity>


          {/* Change Password */}
          <TouchableOpacity
            className="flex-row items-center py-5"
            // onPress={() =>
            //   navigation.navigate("ChangePassword")}
          >
            <Entypo name="lock" size={20} color="black" />
            <Text className="flex-1 text-lg ml-2">
              {t("Drawer.Change Password")}
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() => setComplaintDropdownOpen(!isComplaintDropdownOpen)}
            className="flex-row items-center py-5"
          >
            <FontAwesome name="question-circle" size={20} color="black" />
            <Text className="flex-1 text-lg ml-2">
              {t("Drawer.Complaints")}
            </Text>
            <Ionicons
              name={isComplaintDropdownOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color="black"
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
                      <Ionicons name="checkmark" size={20} color="black" />
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
        // onPress={handleLogout}
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
