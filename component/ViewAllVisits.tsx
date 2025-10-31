import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { RootStackParamList } from "@/component/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
type ViewAllVisitsNavigationProps = StackNavigationProp<
  RootStackParamList,
  "ViewAllVisits"
>;

interface ViewAllVisitsProps {
  navigation: ViewAllVisitsNavigationProps;
}

interface VisitItem {
  id: string;
  serviceenglishName: string;
  servicesinhalaName: string;
  servicetamilName: string;
  district: string;
  status: string;
  latitude?: number;
  longitude?: number;
  date: number;
}

const ViewAllVisits: React.FC<ViewAllVisitsProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();

const today = dayjs();
const currentDay = today.date(); // 31
console.log("Today date:", currentDay);

const [selectedDate, setSelectedDate] = useState<number>(currentDay);
  const [selectedMonth] = useState(today.format("MMMM, YYYY"));

  const dates = Array.from({ length: today.daysInMonth() }, (_, i) => i + 1);

  const visits: VisitItem[] = [
    {
      id: "SR20251012001",
      serviceenglishName: "Consultation",
      servicesinhalaName: "උපදේශනය",
      servicetamilName: "ஆலோசனை",
      district: "Galle",
      status: "Pending",
      latitude: 6.0535,
      longitude: 80.2209,
      date: 1,
    },
  ];

  const filteredVisits = visits.filter((v) => v.date === selectedDate);
const scrollRef = React.useRef<ScrollView>(null);

const ITEM_WIDTH = 50; // width + margin of each date item, adjust if needed

useFocusEffect(
  useCallback(() => {
    // Scroll to current date whenever screen is focused
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          x: (currentDay - 1) * ITEM_WIDTH,
          animated: true,
        });
      }
    }, 100);
  }, [currentDay])
);
  return (
    <View className="flex-1 bg-[#F5F7FB] pt-4">
      {/* Header */}
      <Text className="text-lg font-semibold text-center m text-[#000]">
        {selectedMonth}
      </Text>
      <View className="flex-row p-2 ml-4">
   <LinearGradient
          colors={["#F2561D", "#FF1D85"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="flex-row items-center px-4 h-10 rounded-full mr-2"
        >
          <Text className="text-white font-semibold mr-2">
            {t("OverDue")}
          </Text>
          <View className="bg-white rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-[#F83B4F] font-bold text-xs">01</Text>
          </View>
        </LinearGradient>
      {/* Horizontal Date Selector */}
      <ScrollView
       ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {dates.map((day) => (
          <TouchableOpacity
            key={day}
            onPress={() => setSelectedDate(day)}
       
          >
           <View className="mx-1">
  {selectedDate === day ? (
    <LinearGradient
      colors={["#F2561D", "#FF1D85"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="border flex-row gap-x-4 rounded-full w-20 h-10 items-center justify-center border-[#F83B4F] ml-1"
    >
      <Text className="font-semibold text-white">{day}</Text>
     <View className="bg-white rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-[#F83B4F] font-bold text-xs">01</Text>
          </View>
    </LinearGradient>
  ) : (
    <View className="border rounded-full w-10 h-10 items-center justify-center border-[#D3D3D3]">
      <Text className="font-semibold text-black">{day}</Text>
    </View>
  )}
</View>


          </TouchableOpacity>
        ))}
      </ScrollView>

      </View>
     
      {/* Visit Cards */}
      <ScrollView className="mt-6 px-4 bg-white rounded-t-3xl">
        {filteredVisits.length > 0 ? (
          filteredVisits.map((item) => {
            const serviceName =
              i18n.language === "si"
                ? item.servicesinhalaName
                : i18n.language === "ta"
                ? item.servicetamilName
                : item.serviceenglishName;

            return (
              <View
                key={item.id}
                className="bg-white border border-[#FF1D85] rounded-lg p-4 mt-4"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                }}
              >
                <Text className="text-sm font-medium ">
                  #{item.id}
                </Text>
                <Text className="text-lg font-bold text-[#000] ">
                  {serviceName}
                </Text>
                <Text className="text-sm font-medium text-[#4E6393] mt-1">
                  {t(`Districts.${item.district}`)} {t("VisitPopup.District")}
                </Text>
                <Text className="text-base font-medium text-[#FF1D85] mt-1">
                  {t(item.status)}
                </Text>

              </View>
            );
          })
        ) : (
          <Text className="text-center text-[#9A9A9A] mt-10">
            {t("ViewAllVisits.NoVisits")}
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default ViewAllVisits;
