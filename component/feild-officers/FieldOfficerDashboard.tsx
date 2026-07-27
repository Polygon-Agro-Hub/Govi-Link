import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { RootStackParamList } from "../types/types";
import { useTranslation } from "react-i18next";
import { DrawerActions } from "@react-navigation/native";
import i18n from "@/i18n/i18n";
import { useDispatch } from "react-redux";
import { setUserProfile } from "@/store/authSlice";
import { AntDesign } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

type FieldOfficerDashboardNavigationProps = StackNavigationProp<
  RootStackParamList,
  "FieldOfficerDashboard"
>;

interface FieldOfficerDashboardProps {
  navigation: FieldOfficerDashboardNavigationProps;
}

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

const FieldOfficerDashboard: React.FC<FieldOfficerDashboardProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const dispatch = useDispatch();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      
      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user-profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(response.data.data);
      dispatch(setUserProfile(response.data.data));
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  }, []);

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

  const getTextStyle = () => {
    if (i18n.language === "si") {
      return {
        fontSize: 16,
        lineHeight: 20,
      };
    }
  };

  return (
    <View className="flex bg-white" style={{ flex: 1 }}>
      <ScrollView
        className="bg-white p-3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={true}
      >
        <View className="flex flex-row ">
          <TouchableOpacity
            className="flex-row items-center mb-4 p-4"
            onPress={openDrawer}
          >
            <Image
              source={
                profile?.profileImg
                  ? { uri: profile.profileImg }
                  : require("@/assets/images/auth/my-profile.webp")
              }
              className="w-16 h-16 rounded-full mr-3"
            />

            <View>
              <Text
                style={[{ fontSize: 16 }, getTextStyle()]}
                className="text-lg font-bold"
              >
                {t("Dashboard.Hello")}, {getName()}
              </Text>
              <Text className="text-[#6E7F96] text-lg">{profile?.empId}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", justifyContent: "center", marginTop: 40 }}>
          <LottieView
            source={require("@/assets/lottie/coming-soon.json")}
            style={{ width: wp("70%"), height: hp("35%") }}
            autoPlay
            loop
          />
          <Text style={{ fontSize: 16, color: "#666", marginTop: 8, textAlign: "center", paddingHorizontal: 20 }}>
            We're building something amazing.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default FieldOfficerDashboard;
