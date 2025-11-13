import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { RootStackParamList } from "@/component/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
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

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedMonth] = useState(today.format("MMMM, YYYY"));

  const dates = Array.from({ length: 8 }, (_, i) => today.add(i, "day"));
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

  const filteredVisits = visits.filter((v) =>
    dayjs(v.date).isSame(selectedDate, "day")
  );const scrollRef = React.useRef<ScrollView>(null);

const ITEM_WIDTH = 0; // width + margin of each date item, adjust if needed

useFocusEffect(
    useCallback(() => {
      setSelectedDate(today); // ensure current date is selected
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: 0, // today is first in array, so no offset needed
            animated: true,
          });
        }
      }, 200);
    }, [])
  );


    const fetchVisits = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/officer/officer-visits/${selectedDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch officer visits:", error);
    } finally {
    }
  };

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
     {dates.map((dateObj, index) => {
            const dayNumber = dateObj.date();
            const isSelected = selectedDate.isSame(dateObj, "day");

            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedDate(dateObj)}
              >
                <View className="mx-1 items-center">
                  {isSelected ? (
                    <LinearGradient
                      colors={["#F2561D", "#FF1D85"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="border flex-row gap-x-4 rounded-full w-20 h-10 items-center justify-center border-[#F83B4F] ml-1"
                    >
                      <Text className="font-semibold text-white">
                        {dayNumber}
                      </Text>
                      <View className="bg-white rounded-full w-6 h-6 items-center justify-center">
                        <Text className="text-[#F83B4F] font-bold text-xs">
                          01
                        </Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View className="border rounded-full w-12 h-10 items-center justify-center border-[#F83B4F]">
                      <Text className="font-semibold text-black">
                        {dayNumber}
                      </Text>
                    </View>
                  )}
                  {/* <Text className="text-[10px] text-[#666] mt-1">
                    {dateObj.isSame(today, "day")
                      ? "Today"
                      : dateObj.isSame(today.add(1, "day"), "day")
                      ? "Tomorrow"
                      : dateObj.format("ddd")}
                  </Text> */}
                </View>
              </TouchableOpacity>
            );
          })}
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
