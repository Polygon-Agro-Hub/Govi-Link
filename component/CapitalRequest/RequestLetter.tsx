import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../Common/CustomHeader";

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

const RequestDetails: React.FC<RequestDetailsProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "RequestDetails">>();
  const { requestId, requestNumber } = route.params;
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      
      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/requests/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("Request details:", response.data.requests);
      setRequestData(response.data.requests[0] || null);
    } catch (error) {
      console.error("Failed to fetch request details:", error);
      Alert.alert("Error", "Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const handleDial = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch((err) =>
      console.error("Failed to open dial pad:", err),
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#21202B" />
        <Text className="mt-4 text-[#565559]">
          {" "}
          {t("CapitalRequests.LoadingRequests")}
        </Text>
      </View>
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

  // Check if NIC images exist
  const hasNicImages = requestData.nicFront || requestData.nicBack;

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <CustomHeader
        title={t("RequestLetter.Request Letter")}
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Request Letter Content */}
        <View className="mx-6 my-4 bg-white rounded-lg p-2">
          {/* Letter Content */}
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

          {/* Project Details */}
          <View className="space-y-3 mb-6">
            <View className="">
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
                    <Text>{t("RequestLetter.Rs")} </Text>
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
            {t("RequestLetter.This loan is essential for covering the costst")}
          </Text>

          <Text className="text-base mb-4 text-black leading-6">
            {t(
              "RequestLetter.I have attached the necessary documents for your perusal.",
            )}
          </Text>

          {/* NIC Images - Show if available */}
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

          <Text className="text-base  mt-2 text-black leading-6">
            {t(
              "RequestLetter.I am confident in the success of this venture and request",
            )}
          </Text>

          {/* Signature */}
          <View className="mt-8 mb-8">
            <Text className="text-base text-black ">
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
      <View className=" bottom-4 bg-white ">
        <View
          style={{
            height: 1,
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
        />
        <TouchableOpacity
          className="flex "
          onPress={() => handleDial(requestData.phoneNumber)}
        >
          <View className="flex-row mt-4 self-center items-center justify-center border border-[#F83B4F] rounded-full px-6 w-[50%] py-3">
            <FontAwesome6 name="phone-volume" size={20} color="#F83B4F" />
            <Text className="text-base font-semibold  ml-2">
              {t("VisitPopup.Get Call")}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            try {
              navigation.navigate("PersonalInfo", {
                requestNumber,
                requestId: requestData.id,
              });
            } catch (e) {
              console.log("Error clearing AsyncStorage:", e);
            }
          }}
          className="w-[80%] mt-4 self-center"
        >
          <LinearGradient
            colors={["#F35125", "#FF1D85"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-full px-6 py-3 w-full items-center"
            style={{
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
    </View>
  );
};

export default RequestDetails;