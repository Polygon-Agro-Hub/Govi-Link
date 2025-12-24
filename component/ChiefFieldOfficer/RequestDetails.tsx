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
} from "react-native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type RequestDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RequestDetails"
>;

interface RequestDetailsProps {
  navigation: RequestDetailsNavigationProp;
}

interface RequestDetailsData {
  id: string;
  requestNumber: string;
  customerName: string;
  contactNumber: string;
  district: string;
  crop: string;
  variety: string;
  certification: string;
  extent: {
    hectares: string;
    acres: string;
    perches: string;
  };
  expectedInvestment: string;
  expectedYield: string;
  cultivationStartDate: string;
  status: "pending" | "approved" | "rejected";
}


type ProjectDetailsProps = {
  label: string;
  value: string;
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ label, value }) => {
  return (
    <View className="flex-row mb-3">
      <View className="mr-2">
        <Text className="text-base text-[#070707]">●</Text>
      </View>

      <View className="flex-1">
        <Text className="text-base text-[#070707]">
          {label} :
        </Text>
        <Text className="text-base text-[#070707]">
          {value}
        </Text>
      </View>
    </View>
  );
};


const RequestDetails: React.FC<RequestDetailsProps> = ({
  navigation,
}) => {
  const route = useRoute<RouteProp<RootStackParamList, "RequestDetails">>();
  const { requestId } = route.params;
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<RequestDetailsData | null>(
    null
  );
  const {t} = useTranslation();

  // Mock data - replace with actual API call
  const mockRequestData: RequestDetailsData = {
    id: "1",
    requestNumber: "#GC000001",
    customerName: "Kelum Dissanayake",
    contactNumber: "+94 77 123 4567",
    district: "Colombo",
    crop: "Rice",
    variety: "BG 300",
    certification: "Organic",
    extent: {
      hectares: "2.5",
      acres: "6.18",
      perches: "990",
    },
    expectedInvestment: "250,000",
    expectedYield: "4500",
    cultivationStartDate: "2024-03-15",
    status: "pending",
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, fetch by requestId
      setRequestData(mockRequestData);
    } catch (error) {
      console.error("Failed to fetch request details:", error);
      Alert.alert("Error", "Failed to load request details");
      
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    Alert.alert(
      "Approve Request",
      "Are you sure you want to approve this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: () => {
            // Handle approve logic
            Alert.alert(
              "Request Approved",
              "The loan request has been approved successfully"
            );
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      "Reject Request",
      "Are you sure you want to reject this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            // Handle reject logic
            Alert.alert(
              "Request Rejected",
              "The loan request has been rejected"
            );
          },
        },
      ]
    );
  };


  
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#21202B" />
        <Text className="mt-4 text-[#565559]"> {t("CapitalRequests.LoadingRequests")}</Text>
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

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
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
          {t("RequestLetter.Request Letter")}
        </Text>
        <View style={{ width: 55 }} />
      </View>

      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Request Letter Content */}
        <View className="mx-6 my-4 bg-white rounded-lg p-2">
          {/* Letter Content */}
          <Text className="text-base mb-4 text-[#070707] leading-6">
            Dear Sir/Madam,
          </Text>

          <Text className="text-base mb-4 text-[#070707] leading-6">
            I, {requestData.customerName}, a farmer from {requestData.district},
            am writing to formally request an agricultural loan for the upcoming
            cultivation season.
          </Text>

          <Text className="text-base mb-4 text-[#070707] leading-6">
            I am planning to cultivate {requestData.crop} of the{" "}
            {requestData.variety} variety. The cultivation will be carried out
            using {requestData.certification} certified practices, ensuring
            high-quality and sustainable output.
          </Text>

          <Text className="text-base mb-4 text-[#070707]">
            The project details are as follows:
          </Text>

          {/* Project Details */}
          <View className="space-y-3 mb-6">
<View className="">
  <ProjectDetails
    label={t("RequestLetter.District")}
    value={requestData.district}
  />
 <ProjectDetails
    label={t("RequestLetter.Crop")}
    value={requestData.crop}
  />

  <ProjectDetails
    label={t("RequestLetter.Extent")}
    value={`${requestData.extent.hectares} hectare, ${requestData.extent.acres} acres, ${requestData.extent.perches} perches`}
  />

  <ProjectDetails
    label={t("RequestLetter.Expected Investment")}
    value={`Rs. ${requestData.expectedInvestment}`}
  />

  <ProjectDetails
    label={t("RequestLetter.Expected Yield")}
    value={`${requestData.expectedYield} kg`}
  />

  <ProjectDetails
    label={t("RequestLetter.Cultivation Start Date")}
    value={requestData.cultivationStartDate}
  />
  </View>
          </View>

          <Text className="text-base mb-4 text-black leading-6">
            This loan is essential for covering the costs of high-quality seeds,
            fertilizers, pesticides, irrigation, and labor required to achieve
            the projected yield. The expected harvest is projected to generate
            sufficient revenue for the timely repayment of the loan along with
            the accrued interest.
          </Text>

          <Text className="text-base mb-4 text-black leading-6">
            I have attached the necessary documents for your perusal.
          </Text>

          {/* Sample Images */}
          <View className="my-4">
            {/* <Text className="text-base text-black mb-2">
              Attached Documents:
            </Text> */}
            <View className="flex-row justify-between w-full">
              <Image
                source={require("../../assets/request-letter.png")}
                className="w-[48%] h-40 rounded-lg border border-gray-300"
                resizeMode="cover"
              />
              <Image
                source={require("../../assets/request-letter.png")}
                className="w-[48%] h-40 rounded-lg border border-gray-300"
                resizeMode="cover"
              />
            </View>
          </View>

          <Text className="text-base  mt-2 text-black leading-6">
            I am confident in the success of this venture and request you to
            kindly approve my loan application at the earliest. Thank you for
            your time and consideration.
          </Text>

          {/* Signature */}
          <View className="mt-8 mb-8">
            <Text className="text-base text-black ">Sincerely,</Text>
            <Text className="text-base text-black">
              {requestData.customerName}
            </Text>
            <Text className="text-base text-black">
              {requestData.contactNumber}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {/* <View className="mb-20">
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

          <View className="px-12 flex-col w-full gap-4 mt-4">
            <TouchableOpacity
              onPress={handleReject}
              className="bg-[#444444] rounded-3xl px-6 py-4 w-full items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 6,
              }}
            >
              <Text className="text-white text-lg font-semibold">Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleApprove} className="w-full">
              <LinearGradient
                colors={["#F35125", "#FF1D85"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-3xl px-6 py-4 w-full items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 5,
                  elevation: 6,
                }}
              >
                <Text className="text-white text-lg font-semibold">
                  Approve
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View> */}
      </ScrollView>
      <View className=" bottom-4 bg-white " >
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
              <TouchableOpacity onPress={() => navigation.navigate("PersonalInfo")} className="w-[80%] mt-6 self-center">
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