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

type DashboardNavigationProps = StackNavigationProp<
  RootStackParamList,
  "Dashboard"
>;

interface DashboardProps {
  navigation: DashboardNavigationProps;
}

const Dashboard: React.FC<DashboardProps> = ({ navigation }) => {

  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");

  

  return (
    <ScrollView
      className="flex-1 bg-white p-3"
      refreshControl={
        <RefreshControl refreshing={refreshing}  />
      }
    >
        <View className="">
      {/* Profile Section */}
      <TouchableOpacity
        className="flex-row items-center mb-4 p-4"
      >
        <View
          className="w-16 h-16 rounded-full mr-3 bg-black"
        />
      </TouchableOpacity>
</View>
<Text className="font-bold text-lg">
    Cheif Field Officer Dashboard
</Text>
    </ScrollView>
  );
};

export default Dashboard;