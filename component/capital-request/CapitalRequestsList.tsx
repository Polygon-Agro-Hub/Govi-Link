import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { hasDraft, initPersonalTable } from "@/database/inspectionpersonal";
import LoadingPage from "../common/LoadingPage";
import CustomHeader from "../common/CustomHeader";

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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftRequestIds, setDraftRequestIds] = useState<number[]>([]);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    try {
      initPersonalTable();
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  }, []);

  const checkForDrafts = (requests: Request[]) => {
    try {
      const drafts: number[] = [];

      for (const request of requests) {
        const isDraft = hasDraft(request.id);

        if (isDraft) {
          drafts.push(request.id);
        }
      }

      setDraftRequestIds(drafts);
    } catch (error) {
      console.error(
        "Failed to check for drafts (Capital RequestsList Screen):",
        error,
      );
    }
  };

  useEffect(() => {
    if (requests.length > 0) {
      checkForDrafts(requests);
    } else {
      setDraftRequestIds([]);
    }
  }, [requests]);

  const fetchCapitalRequests = async (search: string = "") => {
    if (isFetchingRef.current) {
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
        },
      );

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

  useFocusEffect(
    useCallback(() => {
      fetchCapitalRequests(searchQuery);
    }, [searchQuery]),
  );

  const handleNavigateToRequestDetails = (
    requestId: number,
    requestNumber: string,
  ) => {
    navigation.navigate("RequestDetails", {
      requestId: requestId,
      requestNumber: requestNumber,
    });
  };

  if (loading && !refreshing) {
    return (
      <LoadingPage
        message={t("CapitalRequests.LoadingRequests")}
        fullScreen={true}
      />
    );
  }

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title={t("CapitalRequests.CapitalRequests")}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        <View className="px-6 py-4 space-y-5">
          {requests.length === 0 ? (
            <View className="flex justify-center items-center mt-40">
              <Image
                source={require("../../assets/images/dashboard/no-tasks.webp")}
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
                  onPress={() =>
                    handleNavigateToRequestDetails(request.id, request.jobId)
                  }
                >
                  <View
                    className="bg-[#ADADAD1A] rounded-3xl p-4 flex-row items-center justify-between"
                    style={{
                      borderWidth: isDraft ? 1 : 0,
                      borderColor: isDraft ? "#FA4064" : "transparent",
                    }}
                  >
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
