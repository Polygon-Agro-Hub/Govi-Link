import React, { useState, useCallback, useEffect, useRef } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useDispatch } from "react-redux";
import { clearAllInspectionSlices } from "@/store/clearAllSlices";
import { hasDraft, initPersonalTable } from "@/database/inspectionpersonal"; // Import the function to check drafts

type CapitalRequestsNavigationProps = StackNavigationProp<
  RootStackParamList,
  "CapitalRequests"
>;

interface CapitalRequestsProps {
  navigation: CapitalRequestsNavigationProps;
}

interface Request {
  id: number;
  farmerName: string;
  jobId: string;
}

const CapitalRequests: React.FC<CapitalRequestsProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftRequestIds, setDraftRequestIds] = useState<number[]>([]); // Track draft IDs

  // ✅ Prevent infinite refetches
  const isFetchingRef = useRef(false);

  // ✅ Initialize database on component mount
  useEffect(() => {
    console.log("🗄️ Initializing database tables...");
    try {
      initPersonalTable();
      console.log("✅ Database initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
    }
  }, []);

  // ✅ Check SQLite for draft records
  const checkForDrafts = (requests: Request[]) => {
    console.log("🔍 Starting draft check for", requests.length, "requests");
    try {
      const drafts: number[] = [];

      for (const request of requests) {
        console.log(`🔎 Checking request ID: ${request.id} (jobId: ${request.jobId})`);
        const isDraft = hasDraft(request.id);
        console.log(`   → hasDraft returned: ${isDraft}`);
        
        if (isDraft) {
          drafts.push(request.id);
          console.log(`   ✅ Added ${request.id} to drafts`);
        }
      }

      console.log("📊 Total drafts found:", drafts.length);
      console.log("📋 Draft request IDs:", drafts);
      setDraftRequestIds(drafts);
    } catch (error) {
      console.error("❌ Failed to check for drafts:", error);
    }
  };

  // ✅ Call checkForDrafts after fetching requests
  useEffect(() => {
    console.log("🔄 useEffect triggered - requests.length:", requests.length);
    if (requests.length > 0) {
      console.log("✅ Calling checkForDrafts...");
      checkForDrafts(requests);
    } else {
      console.log("⚠️ No requests, clearing draft IDs");
      setDraftRequestIds([]);
    }
  }, [requests]);

  const fetchCapitalRequests = async (search: string = "") => {
    // ✅ Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("⏭️ Already fetching, skipping");
      return;
    }

    isFetchingRef.current = true;

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        isFetchingRef.current = false;
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Requests", response.data.requests);

      const apiRequests = response.data.requests;
      setRequests(apiRequests);
    } catch (error: any) {
      console.error("Failed to fetch capital requests:", error);
      Alert.alert(t("Error.Error"), t("Error.FailedToLoadRequests"), [
        { text: t("Main.ok") },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCapitalRequests(searchQuery);
  }, [searchQuery]);

  // ✅ Only fetch on initial focus, not on every focus
  useFocusEffect(
    useCallback(() => {
      console.log("📱 CapitalRequests screen focused");
      fetchCapitalRequests(searchQuery);

      return () => {
        console.log("👋 CapitalRequests screen blurred");
      };
    }, [searchQuery])
  );

  // ✅ Handle navigation to RequestDetails (starting a new inspection)
  const handleNavigateToRequestDetails = (requestId: number, requestNumber: string) => {
    console.log(`🚀 Starting new inspection for request ${requestNumber}`);
    
    navigation.navigate("RequestDetails", {
      requestId: requestId,
      requestNumber: requestNumber,
    });
  };

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
            requests.map((request, index) => {
              const isDraft = draftRequestIds.includes(request.id);
              
              return (
                <TouchableOpacity
                  key={`${request.id}-${index}`}
                  className=""
                  onPress={() => handleNavigateToRequestDetails(request.id, request.jobId)}
                >
                  <View
                    className="bg-[#ADADAD1A] rounded-3xl p-4 flex-row items-center justify-between"
                    style={{
                      borderWidth: isDraft ? 1 : 0,
                      borderColor: isDraft ? "#FA4064" : "transparent",
                    }}
                  >
                    {/* Left side content */}
                    <View className="flex-1">
                      <View className="flex-row space-x-2 items-baseline">
                        <Text className="text-[#000000] text-base">
                          #{request.jobId}
                        </Text>
                        {isDraft && (
                          <Text className="font-bold text-[#FA345A]">
                            ({t("RequestLetter.Saved Draft")})
                          </Text>
                        )}
                      </View>

                      <Text className="text-[#212121] text-lg font-medium mt-1">
                        {request.farmerName}
                      </Text>

                      <Text className="text-[#4E6393] text-sm mt-1">
                        {t("RequestLetter.Investment Request")}
                      </Text>
                    </View>

                    {/* Right side arrow button */}
                    <MaterialIcons
                      name="keyboard-arrow-right"
                      size={40}
                      color="#000"
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CapitalRequests;