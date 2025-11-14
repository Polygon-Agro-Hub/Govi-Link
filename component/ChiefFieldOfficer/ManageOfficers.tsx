import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { Ionicons } from "@expo/vector-icons";
const UserProfileImage = require("@/assets/user-profile.png");

type ManageOfficersNavigationProps = StackNavigationProp<
  RootStackParamList,
  "ManageOfficers"
>;

interface ManageOfficersProps {
  navigation: ManageOfficersNavigationProps;
}

interface Officer {
  name: string;
  empId: string;
  status: "approved" | "pending";
  image?: string;
}

const ManageOfficers: React.FC<ManageOfficersProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>([
    {
      name: "Amal Perera",
      empId: "FI00127",
      status: "approved",
      image: "https://example.com/dulaj.jpg",
    },
    { name: "Bhathiya Dias", empId: "FI00134", status: "approved" },
    {
      name: "Dulaj Nawanjana",
      empId: "FI00155",
      status: "approved",
      image: "https://example.com/dulaj.jpg",
    },
    { name: "Samitha Herath", empId: "FI00147", status: "approved" },
    {
      name: "Umesh Kalhara",
      empId: "FI00137",
      status: "approved",
      image: "https://example.com/umesh.jpg",
    },
    { name: "Viraj Perera", empId: "FI00137", status: "pending" },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) =>
    status === "approved" ? "#4CAF50" : "#FF3434";

  const getBorderColor = (status: string) =>
    status === "approved" ? "#ADADAD1A" : "#FF9797";

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-[#E5E5E5]">
        <View className="flex-row items-center justify-center">
          <Text className="text-2xl font-bold text-black text-center">
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
              ({t("ManageOfficers.All")} {officers.length})
            </Text>
          </Text>

          {officers.map((officer, index) => (
            <View
              key={index}
              className="bg-white rounded-3xl p-4 flex-row items-center"
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
                {officer.image ? (
                  <Image
                    source={{ uri: officer.image }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={UserProfileImage}
                    style={{ width: 50, height: 50 }}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* User Info */}
              <View className="ml-4 flex-1">
                <Text className="text-[#21202B] text-base font-semibold">
                  {officer.name}
                </Text>
                <Text className="text-[#565559] text-sm">
                  {t("ManageOfficers.EMPID")} : {officer.empId}
                </Text>
              </View>

              {/* Status Badge */}
              {officer.status === "pending" && (
                <View
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text className="text-[#FF3434] text-xs">
                    {t("ManageOfficers.NotApprovedYet")}
                  </Text>
                </View>
              )}
            </View>
          ))}
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
          navigation.navigate("AddOfficerStep1");
        }}
      >
        <Ionicons name="add" size={50} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ManageOfficers;
