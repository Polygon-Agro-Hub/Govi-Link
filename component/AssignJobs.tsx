import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  ActivityIndicator
} from "react-native";
import { RootStackParamList } from "@/component/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AntDesign, Ionicons, Feather, FontAwesome6 } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

type AssignJobsNavigationProps = StackNavigationProp<
  RootStackParamList,
  "AssignJobs"
>;

interface AssignJobsProps {
  navigation: AssignJobsNavigationProps;
}

interface VisitItem {
    serviceenglishName: string;
  servicesinhalaName: string;
  servicetamilName: string;
  certificationpaymentId: number;
  jobId: string;
  userId: number;
  tickCompleted: number;
  photoCompleted: number;
  totalCompleted: number;
  completionPercentage: string;
  farmerName?: string; 
  farmerId: number;   
  propose?: string;  
  farmerMobile:number;
  id:number;
  clusterId:number
  farmId:number
  date:string;  
  district:string;
  status:string;
  sheduleDate:string;
  completedClusterCount?: number;
  totalClusterCount?: number;
  
}

const AssignJobs: React.FC<AssignJobsProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();

const [selectedDate, setSelectedDate] = useState<string>("");
const [isOverdueSelected, setIsOverdueSelected] = useState(false);
const [loading, setLoading] = useState(false);
useEffect(() => {
  const today = new Date().toISOString().split("T")[0];
  setSelectedDate(today);
}, []);

const [visits, setVisits] = useState<VisitItem[]>([]);


const fetchVisits = async () => {
  console.log("Fetching visits for date:",  "Overdue:", isOverdueSelected);
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      const response = await axios.get(
  `${environment.API_BASE_URL}api/assign-jobs/visits/${selectedDate}`,
        {
          params: { isOverdueSelected : isOverdueSelected },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("VISIT:", response.data.data);
      setVisits(response.data.data);
    }
  } catch (error) {
    console.error("Failed to fetch officer visits:", error);
  }finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchVisits();
}, [selectedDate, isOverdueSelected]);




  return (
    <View className="flex-1 bg-white pt-4">

      <View className="flex-row p-2 justify-center items-center gap-x-6 border-b border-gray-200">
          <TouchableOpacity
          className="mb-2"
  onPress={() => {
    setIsOverdueSelected(true);   // select overdue
  }}
>
  <LinearGradient
    colors={isOverdueSelected ? ["#F2561D", "#FF1D85"] : ["#FFF", "#FFF"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    className={`flex-row items-center px-4 h-10 rounded-full mr-2 border ${
      isOverdueSelected ? "border-transparent" : "border-[#F83B4F]"
    }`}
  >
    <View className="flex-row items-center">
      <Text
        className={`font-semibold mr-2 ${
          isOverdueSelected ? "text-white" : "text-[#F83B4F]"
        }`}
      >
        {t("Visits.Over Due")}
      </Text>
      { isOverdueSelected &&
           <View className="bg-white rounded-full w-6 h-6 items-center justify-center">
        <Text className="text-[#F83B4F] font-bold text-xs">01</Text>
      </View>
      }
 
    </View>
  </LinearGradient>
</TouchableOpacity>

     <TouchableOpacity
               className="mb-2"

  onPress={() => {
    setIsOverdueSelected(false); 
  }}
>
  <LinearGradient
    colors={!isOverdueSelected ? ["#F2561D", "#FF1D85"] : ["#FFF", "#FFF"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    className={`flex-row items-center px-4 h-10 rounded-full mr-2 border ${
      !isOverdueSelected ? "border-transparent" : "border-[#F83B4F]"
    }`}
  >
    <View className="flex-row items-center">
      <Text
        className={`font-semibold mr-2 ${
          !isOverdueSelected ? "text-white" : "text-[#F83B4F]"
        }`}
      >
        {t("Visits.Today")}
      </Text>
      { !isOverdueSelected &&
           <View className="bg-white rounded-full w-6 h-6 items-center justify-center">
        <Text className="text-[#F83B4F] font-bold text-xs">01</Text>
      </View>
      }
 
    </View>
  </LinearGradient>
</TouchableOpacity>

      </View>
            <View className="flex-row p-2 justify-center items-center gap-x-6">
              <TouchableOpacity
                className=""

              >
                  <LinearGradient
    colors={ ["#F2561D", "#FF1D85"] }
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    className="flex-row  px-4 h-10 rounded-full items-center"
  >
               <Text className="text-white font-bold text-lg">
                Start
               </Text>
               </LinearGradient>
              </TouchableOpacity>
              
                            <TouchableOpacity
                className=""

              >
                  <LinearGradient
    colors={ ["#000000", "#2C2C2C"] }
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    className="flex-row  px-4 h-10 rounded-full items-center"
  >
               <Text className="text-white font-bold text-lg">
                Assign
               </Text>
               </LinearGradient>
              </TouchableOpacity>
            </View>
{loading ?
(
      <View className="flex-1 justify-center items-center mt-6 px-4 bg-white rounded-t-3xl">

      <ActivityIndicator size="large" color="#FF1D85" />
    </View>
):

 ( visits.length > 0 && (
    <ScrollView className="flex-1 mt-6 px-4 bg-white rounded-t-3xl">
      {visits.map((item) => (    
          <TouchableOpacity
            key={item.jobId}

          >

            <View
              key={item.jobId}
              className="border-[#FF1D85] border p-4 mb-4 rounded-lg"
          
              style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 }}
            >
              <Text className="text-sm font-medium">#{item.jobId}</Text>

              {item.propose ? (
                <Text className="text-[16px] font-bold text-[#000] mt-1">
                  {(() => {
                    if (item.propose === "Cluster") {
                      switch (i18n.language) {
                        case "si":
                          return "ගොවි සමූහ විගණනය";
                        case "ta":
                          return "உழவர் குழு தணிக்கை";
                        default:
                          return "Farm Cluster Audit";
                      }
                    } else if (item.propose === "Individual") {
                      switch (i18n.language) {
                        case "si":
                          return "තනි ගොවි විගණනය";
                        case "ta":
                          return "தனிப்பட்ட விவசாயி தணிக்கை";
                        default:
                          return "Individual Farmer Audit";
                      }
                    } else {
                      switch (i18n.language) {
                        case "si":
                          return item.servicesinhalaName || "";
                        case "ta":
                          return item.servicetamilName || "";
                        default:
                          return item.serviceenglishName || "";
                      }
                    }
                  })()}
                </Text>
              ) : null}

              <Text className="text-[12px] font-medium text-[#4E6393] mt-1">
                {t(`Districts.${item.district}`)} {t("VisitPopup.District")}
              </Text>
              <Text className="text-[12px] font-medium text-[#4E6393] mt-1">
                {item.status}
              </Text>


            </View>
          </TouchableOpacity>
      ))}
      
    </ScrollView>
 ) )} 
  
    </View>
  );
};

export default AssignJobs;
