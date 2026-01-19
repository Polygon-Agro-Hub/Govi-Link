import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import i18n from "@/i18n/i18n";

const UserProfileImage = require("@/assets/user-profile.png");

type ManageOfficersNavigationProps = StackNavigationProp<
  RootStackParamList,
  "ManageOfficers"
>;

interface ManageOfficersProps {
  navigation: ManageOfficersNavigationProps;
}

interface Officer {
  firstName: string;
  firstNameSinhala: string;
  firstNameTamil: string;
  lastName: string;
  lastNameSinhala: string;
  lastNameTamil: string;
  empId: string;
  status: string;
  profile?: string;
}

const ManageOfficers: React.FC<ManageOfficersProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const getName = (officer: Officer) => {
    if (!officer) return "";

    switch (i18n.language) {
      case "si":
        return `${officer.firstNameSinhala || officer.firstName} ${
          officer.lastNameSinhala || officer.lastName
        }`;
      case "ta":
        return `${officer.firstNameTamil || officer.firstName} ${
          officer.lastNameTamil || officer.lastName
        }`;
      default:
        return `${officer.firstName} ${officer.lastName}`;
    }
  };

  const sortOfficersAlphabetically = (officersList: Officer[]) => {
    return [...officersList].sort((a, b) => {
      const nameA = getName(a).toLowerCase();
      const nameB = getName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const fetchFieldOfficers = async (search: string = "") => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Error.Your login session has expired. Please log in again to continue."
          ),
          [{ text: t("Main.ok") }]
        );
        navigation.navigate("Login");
        return;
      }

      let url = `${environment.API_BASE_URL}api/officer/get-field-officers`;
      if (search.trim() !== "") {
        url += `?search=${encodeURIComponent(search)}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        const fetchedOfficers = response.data.data || [];
        const sortedOfficers = sortOfficersAlphabetically(fetchedOfficers);
        setOfficers(sortedOfficers);
      } else {
        throw new Error(response.data.message || "Failed to fetch officers");
      }
    } catch (error: any) {
      console.error("Failed to fetch field officers:", error);

      if (error.response?.status === 401) {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Error.Your login session has expired. Please log in again to continue."
          ),
          [{ text: t("Main.ok") }]
        );
        navigation.navigate("Login");
      } else {
        // Alert.alert(
        //   t("Error.Error"),
        //   error.response?.data?.message || t("Error.FailedToLoadOfficers")
        // );
              Alert.alert(t("Error.Error"), t("Error.somethingWentWrong"),[{ text: t("Main.ok") }]);
        
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFieldOfficers(searchQuery);
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchFieldOfficers(searchQuery);
    }, [searchQuery])
  );

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    return statusLower === "active" || statusLower === "approved"
      ? "#4CAF50"
      : "#FF3434";
  };

  const getBorderColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    return statusLower === "active" || statusLower === "approved"
      ? "#ADADAD1A"
      : "#FF9797";
  };

  const getStatusText = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "active" || statusLower === "approved") {
      return t("ManageOfficers.Approved");
    } else {
      return t("ManageOfficers.NotApprovedYet");
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#21202B" />
        <Text className="mt-4 text-[#565559]">
          {t("ManageOfficers.LoadingOfficers")}
        </Text>
      </View>
    );
  }

  const formatCount = (count: number) => {
    return count < 10 ? `0${count}` : `${count}`;
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-[#E5E5E5]">
        <View className="flex-row items-center justify-center">
          <Text className="text-lg font-bold text-black text-center">
            {t("ManageOfficers.Officers")}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 py-4 space-y-3">
          <Text className="mt-2 text-[#21202B] text-base">
            <Text className="font-bold">
              {t("ManageOfficers.OfficersList")}{" "}
            </Text>
            <Text>
              ({t("ManageOfficers.All")} {formatCount(officers.length)})
            </Text>
          </Text>

          {officers.length === 0 ? (
            <View className="justify-center items-center py-10">
              <Image
                source={require("../../assets/no tasks.webp")}
                style={{ width: 120, height: 90 }}
                resizeMode="contain"
              />
              <Text className="italic text-[#787878] mt-4">
                {searchQuery
                  ? t("ManageOfficers.NoOfficersFound")
                  : t("ManageOfficers.NoOfficers")}
              </Text>
            </View>
          ) : (
            officers.map((officer, index) => (
              <View
                key={`${officer.empId}-${index}`}
                className="bg-white rounded-3xl py-5 px-4  flex-row items-center"
                style={{
                  borderWidth: 1,
                  borderColor: getBorderColor(officer.status),
                  backgroundColor: "#ADADAD1A",
                }}
              >
                {/* User Image */}
                <View
                  className="rounded-full bg-gray-300 items-center justify-center"
                  style={{ width: 50, height: 50 }}
                >
                  <Image
                    source={
                      officer.profile
                        ? { uri: officer.profile }
                        : UserProfileImage
                    }
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                    resizeMode="cover"
                  />
                </View>

                {/* User Info */}
                <View className="ml-4 flex-1">
                  <Text className="text-[#21202B] text-base font-semibold">
                    {truncateText(getName(officer), 14)}
                  </Text>
                  <Text className="text-[#565559] text-sm">
                    {t("ManageOfficers.EMPID")} : {officer.empId}
                  </Text>
                </View>

                {/* Status Badge */}
                {officer.status === "Not Approved" && (
                  <View
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{ color: getStatusColor(officer.status) }}
                      className="text-xs font-semibold"
                    >
                      {getStatusText(officer.status)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        className="absolute bottom-20 right-6 items-center justify-center"
        style={{
          width: 80,
          height: 80,
          borderRadius: 50,
          backgroundColor: "#21202B",
          elevation: 50,
        }}
        onPress={() => {
          navigation.navigate("AddOfficerStep1", {isnew:true});
        }}
      >
        <Ionicons name="add" size={50} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ManageOfficers;