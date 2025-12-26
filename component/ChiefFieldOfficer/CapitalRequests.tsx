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
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

type CapitalRequestsNavigationProps = StackNavigationProp<
  RootStackParamList,
  "CapitalRequests"
>;

interface CapitalRequestsProps {
  navigation: CapitalRequestsNavigationProps;
}

interface Request {
  id: string;
  requestNumber: string;
  customerName: string;
  requestType: string;
}

const CapitalRequests: React.FC<CapitalRequestsProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Dummy data for capital requests
  const dummyRequests: Request[] = [
    {
      id: "1",
      requestNumber: "#GC000001",
      customerName: "Kelum Dissanayake",
      requestType: "Loan Request",
    },
    {
      id: "2",
      requestNumber: "#GC000002",
      customerName: "Kamal Perera",
      requestType: "Investment Request",
    },
    {
      id: "3",
      requestNumber: "#GC000003",
      customerName: "Nimal Fernando",
      requestType: "Loan Request",
    },
    {
      id: "4",
      requestNumber: "#GC000004",
      customerName: "Sunil Rathnayake",
      requestType: "Investment Request",
    },
  ];

  const fetchCapitalRequests = async (search: string = "") => {
    try {
      setLoading(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, using dummy data
      // In real implementation, you would make API call here
      let filteredRequests = dummyRequests;

      if (search.trim() !== "") {
        filteredRequests = dummyRequests.filter(
          (request) =>
            request.requestNumber
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            request.customerName.toLowerCase().includes(search.toLowerCase()) ||
            request.requestType.toLowerCase().includes(search.toLowerCase())
        );
      }

      setRequests(filteredRequests);
    } catch (error: any) {
      console.error("Failed to fetch capital requests:", error);
      Alert.alert(t("Error.Error"), t("Error.FailedToLoadRequests"),[{ text: t("MAIN.OK") }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCapitalRequests(searchQuery);
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchCapitalRequests(searchQuery);
    }, [searchQuery])
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#21202B" />
        <Text className="mt-4 text-[#565559]">
          {t("CapitalRequests.LoadingRequests")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => navigation.navigate("ManageOfficers")}
          className="bg-[#F6F6F680] rounded-full py-4 px-3"
        >
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color="black"
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black text-center flex-1">
          {t("CapitalRequests.CapitalRequests")}
        </Text>
        <View style={{ width: 55 }} />
      </View>

      <ScrollView
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6 py-4 space-y-5">
          {requests.length === 0 ? (
            <View className="flex justify-center items-center mt-40">
              <Image
                source={require("../../assets/no tasks.webp")}
                style={{ width: 120, height: 90 }}
                resizeMode="contain"
              />
              <Text className="italic text-[#787878] mt-4">
                {searchQuery
                  ? t("CapitalRequests.NoRequestsFound")
                  : t("CapitalRequests.NoRequests")}
              </Text>
            </View>
          ) : (
            requests.map((request, index) => (
              <View
                key={`${request.id}-${index}`}
                className="bg-[#ADADAD1A] rounded-3xl p-6 flex-row items-center justify-between"
              >
                {/* Left side content */}
                <View className="flex-1">
                  <Text className="text-[#000000] text-base">
                    {request.requestNumber}
                  </Text>

                  <Text className="text-[#212121] text-lg font-medium mt-1">
                    {request.customerName}
                  </Text>

                  <Text className="text-[#4E6393] text-sm mt-1">
                    {request.requestType}
                  </Text>
                </View>

                {/* Right side arrow button */}
                <TouchableOpacity
                  className="ml-3 p-2"
                  onPress={() => {
                    navigation.navigate("RequestDetails", {
                      requestId: request.id,
                      requestNumber: request.requestNumber
                    });
                  }}
                >
                  <MaterialIcons
                    name="keyboard-arrow-right"
                    size={40}
                    color="#000"
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CapitalRequests;
