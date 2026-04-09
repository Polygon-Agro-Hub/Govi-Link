import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Linking,
  Animated,
  PanResponder,
} from "react-native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../commons/CustomHeader";
import LoadingPage from "../commons/LoadingPage";

type RequestDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RequestDetails"
>;

interface RequestDetailsProps {
  navigation: RequestDetailsNavigationProp;
}

interface RequestData {
  id: number;
  jobId: string;
  extentha: number;
  farmerId: number;
  extentac: number;
  extentp: number;
  district: string;
  investment: string;
  expectedYield: string;
  farmerName: string;
  phoneNumber: string;
  cropNameEnglish: string;
  cropNameSinhala: string;
  cropNameTamil: string;
  startDate: string;
  nicFront: string | null;
  nicBack: string | null;
  lndPlot: string;
  lndStreet: string;
  lndCity: string;
}

type ProjectDetailsProps = {
  label: string;
  value: React.ReactNode;
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ label, value }) => {
  return (
    <View className="flex-row mb-3">
      <View className="mr-2">
        <Text className="text-base text-[#070707]">●</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base text-[#070707]">{label} :</Text>
        <Text className="text-base text-[#070707]">{value}</Text>
      </View>
    </View>
  );
};

const COLLAPSED_HEIGHT = 200;

const EXPANDED_HEIGHT = 300;

const RequestDetails: React.FC<RequestDetailsProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "RequestDetails">>();
  const { requestId, requestNumber } = route.params;
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t, i18n } = useTranslation();

  const animatedHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

  const addressOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const toggleExpand = () => {
    if (isExpanded) {
      Animated.sequence([
        Animated.timing(addressOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.spring(animatedHeight, {
          toValue: COLLAPSED_HEIGHT,
          useNativeDriver: false,
          bounciness: 4,
        }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.spring(animatedHeight, {
          toValue: EXPANDED_HEIGHT,
          useNativeDriver: false,
          bounciness: 4,
        }),
        Animated.timing(addressOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
    setIsExpanded((prev) => !prev);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 8,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -20 && !isExpanded) toggleExpand();
        else if (gestureState.dy > 20 && isExpanded) toggleExpand();
      },
    }),
  ).current;

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/requests/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setRequestData(response.data.requests[0] || null);
    } catch (error) {
      console.error("Failed to fetch request details:", error);
      Alert.alert("Error", "Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const handleDial = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
      console.error("Failed to open dial pad:", err),
    );
  };

  if (loading) {
    return (
      <LoadingPage
        message={t("CapitalRequests.LoadingRequests")}
        fullScreen={true}
      />
    );
  }

  if (!requestData) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-[#565559]">Request not found</Text>
      </View>
    );
  }

  const formatNumber = (value: number | string) =>
    Number(value).toLocaleString("en-US");

  const hasNicImages = requestData.nicFront || requestData.nicBack;

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title={t("RequestLetter.Request Letter")}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: isExpanded
            ? EXPANDED_HEIGHT + 10
            : COLLAPSED_HEIGHT + 10,
        }}
      >
        <View className="mx-6 my-4 bg-white rounded-lg p-2">
          <Text className="text-base mb-4 text-[#070707] leading-6">
            {t("RequestLetter.Dear Sir/Madam")}
          </Text>

          <Text className="text-base mb-4 text-[#070707] leading-6">
            {t("RequestLetter.IRequestFarm", {
              farmerName: requestData.farmerName,
              district: t(`Districts.${requestData.district}`),
            })}
          </Text>

          <Text className="text-base mb-4 text-[#070707] leading-6">
            {t("RequestLetter.IamPlaning", {
              cropName:
                i18n.language === "si"
                  ? requestData.cropNameSinhala
                  : i18n.language === "ta"
                    ? requestData.cropNameTamil
                    : requestData.cropNameEnglish,
            })}
          </Text>

          <Text className="text-base mb-4 text-[#070707]">
            {t("RequestLetter.The project details are as follows")}
          </Text>

          <View className="space-y-3 mb-6">
            <View>
              <ProjectDetails
                label={t("RequestLetter.District")}
                value={
                  <Text className="font-bold">
                    {t(`Districts.${requestData.district}`)}
                  </Text>
                }
              />
              <ProjectDetails
                label={t("RequestLetter.Crop")}
                value={
                  <Text className="font-bold">
                    {i18n.language === "si"
                      ? requestData.cropNameSinhala
                      : i18n.language === "ta"
                        ? requestData.cropNameTamil
                        : requestData.cropNameEnglish}
                  </Text>
                }
              />
              <ProjectDetails
                label={t("RequestLetter.Extent")}
                value={
                  <>
                    <Text className="font-bold">{requestData.extentha}</Text>
                    <Text> {t("RequestLetter.hectare")}, </Text>
                    <Text className="font-bold">{requestData.extentac}</Text>
                    <Text>
                      {" "}
                      {t("RequestLetter.acres")}, {t("RequestLetter.and")}{" "}
                    </Text>
                    <Text className="font-bold">{requestData.extentp}</Text>
                    <Text> {t("RequestLetter.perches")}</Text>
                  </>
                }
              />
              <ProjectDetails
                label={t("RequestLetter.Expected Investment")}
                value={
                  <>
                    <Text>{t("RequestLetter.Rs")}. </Text>
                    <Text className="font-bold">
                      {formatNumber(requestData.investment)}
                    </Text>
                  </>
                }
              />
              <ProjectDetails
                label={t("RequestLetter.Expected Yield")}
                value={
                  <>
                    <Text className="font-bold">
                      {requestData.expectedYield}
                    </Text>
                    <Text> {t("RequestLetter.kg")}</Text>
                  </>
                }
              />
              <ProjectDetails
                label={t("RequestLetter.Cultivation Start Date")}
                value={
                  <Text className="font-bold">{requestData.startDate}</Text>
                }
              />
            </View>
          </View>

          <Text className="text-base mb-4 text-black leading-6">
            {t(
              "RequestLetter.This investment is essential for covering the costst",
            )}
          </Text>

          <Text className="text-base mb-4 text-black leading-6">
            {t(
              "RequestLetter.I have attached the necessary documents for your perusal.",
            )}
          </Text>

          {hasNicImages && (
            <View className="my-4">
              <View className="flex-row justify-between w-full">
                {requestData.nicFront && (
                  <View className="w-[48%]">
                    <Image
                      source={{ uri: requestData.nicFront }}
                      className="w-full h-40 rounded-lg border border-gray-300"
                      resizeMode="cover"
                    />
                  </View>
                )}
                {requestData.nicBack && (
                  <View className={requestData.nicFront ? "w-[48%]" : "w-full"}>
                    <Image
                      source={{ uri: requestData.nicBack }}
                      className="w-full h-40 rounded-lg border border-gray-300"
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          <Text className="text-base mt-2 text-black leading-6">
            {t(
              "RequestLetter.I am confident in the success of this venture and request",
            )}
          </Text>

          <View className="mt-8 mb-8">
            <Text className="text-base text-black">
              {t("RequestLetter.Sincerely")},
            </Text>
            <Text className="text-base text-black">
              {requestData.farmerName}
            </Text>
            <Text className="text-base text-black">
              {requestData.phoneNumber}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Animated.View
        style={{
          height: animatedHeight,
          backgroundColor: "white",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 10,
          overflow: "hidden",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: "column",
        }}
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleExpand}
            {...panResponder.panHandlers}
          >
            <View className="items-center pt-3 pb-1">
              <View className="h-[3px] w-[80px] bg-[#D0D0D0] rounded-full" />
              <View className="h-[3px] w-[40px] bg-[#D0D0D0] rounded-full mt-1" />
            </View>
          </TouchableOpacity>

          <View className="items-center mt-2 mb-3">
            <Text className="text-sm text-[#747474]">#{requestData.jobId}</Text>
          </View>

          <TouchableOpacity onPress={() => handleDial(requestData.phoneNumber)}>
            <View className="flex-row self-center w-2/3 h-[50px] items-center justify-center border border-[#F83B4F] rounded-full py-2.5">
              <FontAwesome6 name="phone-volume" size={18} color="#F83B4F" />
              <Text className="text-lg font-semibold ml-3 text-[#070707]">
                {t("VisitPopup.Get Call")}
              </Text>
            </View>
          </TouchableOpacity>

          <Animated.View style={{ opacity: addressOpacity }}>
            <View className="items-center mt-3">
              <Text className="text-xs text-[#4E6393] font-medium">
                Address :
              </Text>
            </View>
            <View className="items-center mt-1">
              <Text className="text-sm text-[#070707]">
                {requestData.lndPlot}, {requestData.lndStreet},
              </Text>
            </View>
            <View className="items-center mt-0.5">
              <Text className="text-sm text-[#070707]">
                {requestData.lndCity}
              </Text>
            </View>
          </Animated.View>
        </View>

        <View className="px-8 pb-5">
          <TouchableOpacity
            onPress={async () => {
              try {
                navigation.navigate("CapitalRequstQRScanner", {
                  farmerId: requestData.farmerId,
                  requestId: requestData.id,
                  requestNumber,
                });
              } catch (e) {
                console.log("Error navigating to QR Scanner:", e);
              }
            }}
          >
            <LinearGradient
              colors={["#F35125", "#FF1D85"]}
              className="h-[50px] rounded-3xl item-center justify-center"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 6,
              }}
            >
              <Text className="text-white text-lg font-semibold">
                {t("RequestLetter.Start")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default RequestDetails;
