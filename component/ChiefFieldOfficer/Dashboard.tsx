import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  BackHandler,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { CircularProgress } from "react-native-circular-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { useTranslation } from "react-i18next";
import { DrawerActions } from '@react-navigation/native';
import i18n from "@/i18n/i18n";
import { useDispatch } from "react-redux";
import { setUserProfile } from "@/store/authSlice";
type DashboardNavigationProps = StackNavigationProp<
  RootStackParamList,
  "Dashboard"
>;

interface DashboardProps {
  navigation: DashboardNavigationProps;
}

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

const Dashboard: React.FC<DashboardProps> = ({ navigation }) => {

  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData| null> (null)
  const dispatch = useDispatch();

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
         dispatch(setUserProfile(response.data.data));
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
        return `${profile.firstNameSinhala}`;
      case "ta":
        return `${profile.firstNameTamil}`;
      default:
        return `${profile.firstName}`;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
   const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

    const getTextStyle = () => {
    if (i18n.language === "si") {
      return {
        fontSize: 16,
        lineHeight: 20,
      };
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white p-3"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
        <View className="flex flex-row">
      <TouchableOpacity
        className="flex-row items-center mb-4 p-4"
        onPress={openDrawer}
      >
        {/* <View
          className="w-16 h-16 rounded-full mr-3 bg-black"
        /> */}
        <Image
          source={
            profile?.profileImg
              ? {uri: profile.profileImg}
              : require("../../assets/mprofile.webp")
          }
          className="w-16 h-16 rounded-full mr-3"
        />
        
        <View>
               <Text    style={[{ fontSize: 16 }, getTextStyle()]}
            className="text-lg font-bold">
         {t("Dashboard.Hello")}, {getName()}

        </Text>
               <Text
            className="text-[#6E7F96] text-lg"
          >
            {profile?.empId}
          </Text>
          </View>
      </TouchableOpacity>
      <View>
 
      </View>
</View>

    </ScrollView>
  );
};

export default Dashboard;