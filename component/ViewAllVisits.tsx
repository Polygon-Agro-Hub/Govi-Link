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
} from "react-native";
import { RootStackParamList } from "@/component/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AntDesign, Ionicons, Feather, FontAwesome6 } from "@expo/vector-icons";

type ViewAllVisitsNavigationProps = StackNavigationProp<
  RootStackParamList,
  "ViewAllVisits"
>;

interface ViewAllVisitsProps {
  navigation: ViewAllVisitsNavigationProps;
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
  completionPercentage: number;
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

const ViewAllVisits: React.FC<ViewAllVisitsProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();

const today = dayjs();
const currentDay = today.date(); // 31
console.log("Today date:", currentDay);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedMonth] = useState(today.format("MMMM, YYYY"));
const [isOverdueSelected, setIsOverdueSelected] = useState(false);

  const dates = Array.from({ length: 8 }, (_, i) => today.add(i, "day"));
const [visits, setVisits] = useState<VisitItem[]>([]);


const filteredVisits = visits.filter((v) => {
  const visitDate = dayjs(v.sheduleDate);
  if (isOverdueSelected) {
    return visitDate.isBefore(today, "day"); // all overdue visits
  } else {
    return visitDate.isSame(selectedDate, "day"); // selected date visits
  }
});
  const [showPopup, setShowPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const scrollRef = React.useRef<ScrollView>(null);

const ITEM_WIDTH = 0; // width + margin of each date item, adjust if neede

useFocusEffect(
    useCallback(() => {
      setSelectedDate(today); // ensure current date is selected
      setIsOverdueSelected(false);
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
useEffect(() => {
  fetchVisits();
}, [selectedDate, isOverdueSelected]);

const fetchVisits = async () => {
  console.log("Fetching visits for date:", selectedDate.format("YYYY-MM-DD"), "Overdue:", isOverdueSelected);
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      const response = await axios.get(
  `${environment.API_BASE_URL}api/officer/visits/${selectedDate.format("YYYY-MM-DD")}`,
        {
          params: { isOverdueSelected : isOverdueSelected },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
 setVisits(response.data.data); 
      console.log("VISIT:", response.data.data);
    }
  } catch (error) {
    console.error("Failed to fetch officer visits:", error);
  }
};



// Count only pending visits
const pendingCount = filteredVisits.filter((item) => {
  if (item.propose === "Cluster" && item.totalClusterCount) {
    return !item.completedClusterCount || item.completedClusterCount < item.totalClusterCount;
  }
  else if(item.propose === "Requested" && item.status === "Request Reviewed"){
    return true;
  } else {
    return item.status === "Pending";
  }
}).length;

  const handleDial = (farmerMobile: string) => {
    const phoneUrl = `tel:${farmerMobile}`;
    Linking.openURL(phoneUrl).catch((err) =>
      console.error("Failed to open dial pad:", err)
    );
  };

  return (
    <View className="flex-1 bg-[#F5F7FB] pt-4">
      {/* Header */}
      <Text className="text-lg font-semibold text-center m text-[#000]">
        {selectedMonth}
      </Text>
      <View className="flex-row p-2 ml-4">
          <TouchableOpacity
  onPress={() => {
    setIsOverdueSelected(true);   // select overdue
    setSelectedDate(dayjs());      // optional: reset date
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
        <Text className="text-[#F83B4F] font-bold text-xs">{pendingCount}</Text>
      </View>
      }
 
    </View>
  </LinearGradient>
</TouchableOpacity>

      {/* Horizontal Date Selector */}
      <ScrollView
       ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
     {dates.map((dateObj, index) => {
            const dayNumber = dateObj.date();
            const isSelected = !isOverdueSelected && selectedDate.isSame(dateObj, "day");
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {setSelectedDate(dateObj)
                setIsOverdueSelected(false);
                }}
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
                          {filteredVisits.length}
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


                  let displayStatus = t(`Visits.${item.status}`);
      if (item.propose === "Cluster" && item.totalClusterCount) {
        if (item.completedClusterCount === item.totalClusterCount) {
          displayStatus = (t("Visits.Completed"));
        } else if (item.completedClusterCount && item.completedClusterCount > 0) {
          displayStatus = `${t("Visits.Completed")} (${item.completedClusterCount}/${item.totalClusterCount})`;
        } else {
          displayStatus = `${t("Visits.Pending")} (0/${item.totalClusterCount})`;
        }
      }

            return (
              <TouchableOpacity
                key={item.id}
                 onPress={() => {
                  //requested comes from govilinkjobs , individual comes from farmaudits
                  if (
                    item.propose === "Individual" ||
                    item.propose === "Requested"
                  ) {
                    setSelectedItem(item);
                    setShowPopup(true);
                  } else {
    navigation.navigate("ViewFarmsCluster", {
      jobId: item.jobId,
      feildauditId: item.id,
      farmName: item.farmerName || "",
    });
                    {
                      /*if cluster need send  clusterID , jobId    */
                    }
                  }
                }}
                disabled={(item.propose === "Cluster" && item.completedClusterCount === item.totalClusterCount )|| item.status === "Completed" || item.status === "Finished" || dayjs(item.sheduleDate).isAfter(today, "day")}
              >
              <View
                key={item.id}
                className={`bg-white border ${(item.propose === "Cluster" && item.completedClusterCount === item.totalClusterCount) || item.status === "Completed" || item.status === "Finished" || dayjs(item.sheduleDate).isAfter(today, "day") ? " border-[#9DB2CE]" : "border-[#FF1D85]"} rounded-lg p-4 mt-4`}
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                }}
              >
                <Text className="text-sm font-medium ">
                  #{item.jobId}
                </Text>
      
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

          <Text className="text-[12px] text-[#FF1D85] mt-1">
            {displayStatus}
          </Text>

              </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text className="text-center text-[#9A9A9A] mt-10">
            {t("ViewAllVisits.NoVisits")}
          </Text>
        )}
      </ScrollView>

          <Modal transparent visible={showPopup} animationType="slide"
        onRequestClose={() => {
    console.log("hitt");
    setShowPopup(false);
    setSelectedItem(null);
  }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setShowPopup(false);
            setSelectedItem(null);
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-t-3xl p-5 w-full ">
                <View className="items-center mt-4">
                  <TouchableOpacity
                    className="z-50 justify-center items-center"
                    onPress={() => {
                      setShowPopup(false);
                      setSelectedItem(null);
                    }}
                  >
                    <View className="bg-[#D9D9D9] w-20 py-0.5 rounded-full -mt-6" />
                    <View className="bg-[#D9D9D9] w-8 py-0.5 rounded-full mt-1 mb-6" />
                  </TouchableOpacity>

                  {selectedItem && (
                    <>
                      <Text className="text-base font-semibold text-[#747474]">
                        #{selectedItem.jobId || "N/A"}
                      </Text>
                      <Text className="text-lg font-bold mt-2">
                        {selectedItem.farmerName || "N/A"}
                      </Text>
                      <Text className="text-base font-semibold mt-1">
                        {(() => {
                          if (selectedItem.propose === "Individual") {
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
                                return selectedItem.servicesinhalaName || "";
                              case "ta":
                                return selectedItem.servicetamilName || "";
                              default:
                                return selectedItem.serviceenglishName || "";
                            }
                          }
                        })()}
                      </Text>

                      <Text className="text-sm font-medium text-[#4E6393] mt-1">
                         {t(`Districts.${selectedItem.district}`)} {t("VisitPopup.District")}
                      </Text>
                      <View className="flex flex-row justify-center gap-x-2 mb-4 mt-6 px-4">
                        <TouchableOpacity
                          className="flex-1"
                          disabled={
                            !selectedItem?.latitude || !selectedItem?.longitude
                          }
                          onPress={() => {
                            if (
                              selectedItem?.latitude &&
                              selectedItem?.longitude
                            ) {
                              const lat = selectedItem.latitude;
                              const lon = selectedItem.longitude;
                              const url = `https://www.google.com/maps?q=${lat},${lon}`;
                              Linking.openURL(url);
                            }
                          }}
                        >
                          <View
                            className={`flex flex-row items-center justify-center rounded-full py-2 border ${
                              selectedItem?.latitude && selectedItem?.longitude
                                ? "border-[#F83B4F]"
                                : "border-[#9DB2CE]"
                            }`}
                          >
                            <FontAwesome6
                              name="location-dot"
                              size={20}
                              color={
                                selectedItem?.latitude &&
                                selectedItem?.longitude
                                  ? "#F83B4F"
                                  : "#9DB2CE"
                              }
                            />
                            <Text
                              className={`text-base font-semibold ml-2 ${
                                selectedItem?.latitude &&
                                selectedItem?.longitude
                                  ? "text-[#000000]"
                                  : "text-[#9DB2CE]"
                              }`}
                            >
                              {t("VisitPopup.Location")}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex "
                        onPress={() => handleDial(selectedItem.farmerMobile)}
                        >
                          <View className="flex-row items-center justify-center border border-[#F83B4F] rounded-full px-6 py-2">
                            <Ionicons name="call" size={20} color="#F83B4F" />
                            <Text className="text-base font-semibold  ml-2">
                              {t("VisitPopup.Get Call")}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                      {selectedItem.city ||
                      selectedItem.plotNo ||
                      selectedItem.street ? (
                        <View className="flex text-center justify-center items-center ">
                          <Text className="text-sm font-semibold text-[#4E6393] mb-2">
                            {t("VisitPopup.Address")}
                          </Text>

                          <Text className="text-base font-medium text-[#434343]">
                            {selectedItem.plotNo}, {selectedItem.street},
                          </Text>

                          <Text className="text-base  font-medium text-[#434343]">
                            {selectedItem.city}
                          </Text>
                        </View>
                      ) : null}
                    </>
                  )}

                  <TouchableOpacity 
                    onPress={() => {
    setShowPopup(false);
    if (selectedItem?.farmerId && selectedItem?.propose === "Individual") {
      navigation.navigate("QRScanner", { farmerId: selectedItem.farmerId, jobId: selectedItem.jobId , certificationpaymentId: selectedItem.certificationpaymentId, farmerMobile:selectedItem.farmerMobile, farmId:selectedItem.farmId, clusterId:selectedItem.clusterID , isClusterAudit:false,  auditId:selectedItem.id });
    } else if (selectedItem?.propose === "Requested") {
       console.log("hitt Request")
       navigation.navigate("QRScaneerRequstAudit", { farmerId: selectedItem.farmerId, govilinkjobid: selectedItem.id , jobId: selectedItem.jobId, farmerMobile:selectedItem.farmerMobile  });
    }
  }}>
                    <LinearGradient
                      colors={["#F2561D", "#FF1D85"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className= {`py-2 items-center justify-center rounded-full mt-4 ${i18n.language==="si"? "px-24": i18n.language === "ta"? "px-24": "px-[40%]"}`}
                    >
                      <Text className="text-white text-lg font-semibold">
                        {t("VisitPopup.Start")}
                      </Text>
                      {/*if individual need send  farmerId for check with QR scan ,jobId,    */}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default ViewAllVisits;
