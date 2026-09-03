import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  PanResponder,
  Pressable,
} from "react-native";
import { RootStackParamList } from "@/component/types/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import NoDataComponent from "../commons/NoDataComponent";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";

type ViewAllVisitsNavigationProps = StackNavigationProp<
  RootStackParamList,
  "ViewAllVisits"
>;

type ViewAllVisitsRouteProp = RouteProp<RootStackParamList, "ViewAllVisits">;

interface ViewAllVisitsProps {
  navigation: ViewAllVisitsNavigationProps;
  route: ViewAllVisitsRouteProp;
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
  farmerMobile: number;
  id: number;
  clusterId: number;
  farmId: number;
  date: string;
  district: string;
  status: string;
  sheduleDate: string;
  completedClusterCount?: number;
  totalClusterCount?: number;
}

const ViewAllVisits: React.FC<ViewAllVisitsProps> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const userRole = useSelector((state: RootState) => state.auth.jobRole);
  const [storedRole, setStoredRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const role = await AsyncStorage.getItem("jobRole");
      setStoredRole(role);
    };
    getRole();
  }, []);

  const officerId = route.params?.officerId ?? "";
  const today = dayjs();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const monthNames: Record<string, string[]> = {
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    si: [
      "ජනවාරි",
      "පෙබරවාරි",
      "මාර්තු",
      "අප්‍රේල්",
      "මැයි",
      "ජූනි",
      "ජූලි",
      "අගෝස්තු",
      "සැප්තැම්බර්",
      "ඔක්තෝබර්",
      "නොවැම්බර්",
      "දෙසැම්බර්",
    ],
    ta: [
      "ஜனவரி",
      "பிப்ரவரி",
      "மார்ச்",
      "ஏப்ரல்",
      "மே",
      "ஜூன்",
      "ஜூலை",
      "ஆகஸ்ட்",
      "செப்டம்பர்",
      "அக்டோபர்",
      "நவம்பர்",
      "டிசம்பர்",
    ],
  };
  const lang = i18n.language;
  const month =
    monthNames[lang]?.[today.month()] || monthNames["en"][today.month()];
  const selectedMonth = `${month}, ${today.year()}`;
  const [isOverdueSelected, setIsOverdueSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const dates = Array.from({ length: 14 }, (_, i) => today.add(i, "day"));
  const [visits, setVisits] = useState<VisitItem[]>([]);

  const filteredVisits = visits.filter((v) => {
    const visitDate = dayjs(v.sheduleDate);
    if (isOverdueSelected) {
      return visitDate.isBefore(today, "day");
    } else {
      return visitDate.isSame(selectedDate, "day");
    }
  });
  const [showPopup, setShowPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const scrollRef = React.useRef<ScrollView>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 5,
      onStartShouldSetPanResponder: () => true,

      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) {
          setShowPopup(false);
          Animated.timing(translateY, {
            toValue: 600,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            setShowPopup(false);
            setSelectedItem(null);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (showPopup) {
      translateY.setValue(0);
    }
  }, [showPopup]);

  useFocusEffect(
    useCallback(() => {
      setSelectedDate(today);
      setIsOverdueSelected(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: 0,
            animated: true,
          });
        }
      }, 200);
    }, []),
  );
  useEffect(() => {
    fetchVisits();
  }, [selectedDate, isOverdueSelected]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/officer/visits/${selectedDate.format("YYYY-MM-DD")}`,
          {
            params: { isOverdueSelected: isOverdueSelected },
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setVisits(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch officer visits:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = filteredVisits.filter((item) => {
    if (item.propose === "Cluster" && item.totalClusterCount) {
      return (
        !item.completedClusterCount ||
        item.completedClusterCount < item.totalClusterCount
      );
    } else if (
      item.propose === "Requested" &&
      (item.status === "Pending" || item.status === "Ongoing")
    ) {
      return true;
    } else {
      return item.status === "Pending" || item.status === "Ongoing";
    }
  }).length;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);

    fetchVisits().finally(() => setRefreshing(false));
  };

  const handleDial = (farmerMobile: string) => {
    const phoneUrl = `tel:${farmerMobile}`;
    Linking.openURL(phoneUrl).catch((err) =>
      console.error("Failed to open dial pad:", err),
    );
  };

  const handleLocationPress = () => {
    if (selectedItem?.latitude && selectedItem?.longitude) {
      const lat = selectedItem.latitude;
      const lon = selectedItem.longitude;
      const url = `https://www.google.com/maps?q=${lat},${lon}`;
      Linking.openURL(url);
    } else {
      setShowPopup(false);
      setTimeout(() => {
        Alert.alert(
          t("VisitPopup.NoLocationTitle"),
          t("VisitPopup.NoLocationMessage"),
        );
      }, 400);
    }
  };

  const effectiveRole = userRole || storedRole;
  const shouldShowBackButton = effectiveRole === "Field Officer";

  return (
    <View className="flex-1 bg-[#F5F7FB] pt-4">
      <View className="flex-row items-center justify-center px-4 mb-2">
        {shouldShowBackButton && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="absolute left-4 bg-[#EAEAEA] rounded-full h-8 w-8 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <View className="items-center">
          <Text className="text-lg font-semibold text-[#000]">
            {selectedMonth}
          </Text>
        </View>
      </View>
      <View className="flex-row p-2 ml-4">
        <TouchableOpacity
          onPress={() => {
            setIsOverdueSelected(true);
            setSelectedDate(dayjs());
          }}
        >
          <LinearGradient
            colors={
              isOverdueSelected ? ["#F2561D", "#FF1D85"] : ["#FFF", "#FFF"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
              height: 40,
              borderRadius: 9999,
              marginRight: 8,
              borderWidth: 1,
              borderColor: isOverdueSelected ? "transparent" : "#F83B4F",
              overflow: "hidden",
            }}
          >
            <View className="flex-row items-center">
              <Text
                className={`font-semibold ${
                  isOverdueSelected ? "text-white" : "text-[#F83B4F]"
                }`}
              >
                {t("Visits.OverDue")}
              </Text>
              {isOverdueSelected && (
                <View className="bg-white rounded-full w-6 h-6 items-center justify-center ml-2">
                  <Text className="text-[#F83B4F] font-bold text-xs">
                    {pendingCount}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {dates.map((dateObj, index) => {
            const dayNumber = dateObj.date();
            const isSelected =
              !isOverdueSelected && selectedDate.isSame(dateObj, "day");
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedDate(dateObj);
                  setIsOverdueSelected(false);
                }}
              >
                <View className="mx-1 items-center">
                  {isSelected ? (
                    <LinearGradient
                      colors={["#F2561D", "#FF1D85"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 80,
                        height: 40,
                        borderRadius: 9999,
                        borderWidth: 1,
                        borderColor: "transparent",
                        marginLeft: 8,
                        paddingLeft: 8,
                        overflow: "hidden",
                        gap: 4,
                      }}
                    >
                      <Text className="font-semibold text-white">
                        {dayNumber}
                      </Text>
                      <View className="bg-white rounded-full w-6 h-6 items-center justify-center mr-2">
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
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center mt-6 px-4 bg-white rounded-t-3xl">
          <ActivityIndicator size="large" color="#FF1D85" />
        </View>
      ) : (
        <ScrollView
          className="mt-6 px-6 bg-white rounded-t-3xl"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {filteredVisits.length > 0 ? (
            [...filteredVisits]
              .sort((a, b) => {
                const getStatusRank = (item: VisitItem) => {
                  if (item.status === "Ongoing") return 1;

                  if (item.propose === "Cluster" && item.totalClusterCount) {
                    if (item.completedClusterCount === item.totalClusterCount)
                      return 4;

                    if (
                      item.completedClusterCount &&
                      item.completedClusterCount > 0
                    ) {
                      if (item.completionPercentage >= "20") return 4;
                      return 2;
                    }

                    return 3;
                  }

                  if (item.status === "Pending") return 3;

                  if (item.status === "Completed" || item.status === "Finished")
                    return 4;

                  return 3;
                };

                return getStatusRank(a) - getStatusRank(b);
              })
              .map((item) => {
                let displayStatus = t(`Visits.${item.status}`);
                if (item.propose === "Cluster" && item.totalClusterCount) {
                  if (item.completedClusterCount === item.totalClusterCount) {
                    displayStatus = t("Visits.Completed");
                  } else if (
                    item.completedClusterCount &&
                    item.completedClusterCount > 0 &&
                    item.completionPercentage >= "20"
                  ) {
                    displayStatus = `${t("Visits.Completed")} (${item.completedClusterCount}/${item.totalClusterCount})`;
                  } else if (
                    item.completedClusterCount &&
                    item.completedClusterCount > 0 &&
                    item.completionPercentage < "20"
                  ) {
                    displayStatus = `${t("Visits.Pending")} (${item.completedClusterCount}/${item.totalClusterCount})`;
                  } else if (item.status === "Ongoing") {
                    displayStatus = `${t("Visits.Ongoing")} (${item.completedClusterCount || 0}/${item.totalClusterCount})`;
                  } else {
                    displayStatus = `${t("Visits.Pending")} (0/${item.totalClusterCount})`;
                  }
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
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
                          screenName: "ViewAllVisits",
                        });
                      }
                    }}
                    disabled={
                      (item.propose === "Cluster" &&
                        item.completedClusterCount ===
                          item.totalClusterCount) ||
                      item.completionPercentage >= "20" ||
                      item.status === "Completed" ||
                      item.status === "Finished" ||
                      dayjs(item.sheduleDate).isAfter(today, "day")
                    }
                  >
                    <View
                      key={item.id}
                      className={`bg-white border ${
                        (item.propose === "Cluster" &&
                          item.completedClusterCount ===
                            item.totalClusterCount) ||
                        item.completionPercentage >= "20" ||
                        item.status === "Completed" ||
                        item.status === "Finished" ||
                        dayjs(item.sheduleDate).isAfter(today, "day")
                          ? "border-[#9DB2CE]"
                          : "border-[#FF1D85]"
                      } rounded-lg p-4 mt-4`}
                      style={{
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                      }}
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
                        {t(`Districts.${item.district}`)}{" "}
                        {t("VisitPopup.District")}
                      </Text>

                      <Text className="text-[12px] text-[#FF1D85] mt-1">
                        {displayStatus}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
          ) : (
            <View className="flex-1 items-center justify-center mt-[75%]">
              <NoDataComponent message={t("Visits.NoJobsAvailable")} />
            </View>
          )}
        </ScrollView>
      )}

      <Modal transparent visible={showPopup} animationType="none">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              setShowPopup(false);
              setSelectedItem(null);
            }}
          />
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              transform: [{ translateY }],
            }}
            className="bg-white rounded-t-3xl p-5 w-full"
          >
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
                  <Text className="text-lg font-semibold text-[#747474]">
                    #{selectedItem.jobId || "N/A"}
                  </Text>
                  <Text className="text-xl font-bold mt-2">
                    {selectedItem.farmerName || "N/A"}
                  </Text>
                  <Text className="text-lg font-semibold mt-1">
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

                  <Text className="text-base font-medium text-[#4E6393] mt-1">
                    {t(`Districts.${selectedItem.district}`)}{" "}
                    {t("VisitPopup.District")}
                  </Text>
                  <View className="flex flex-row justify-center gap-x-2 mb-4 mt-6 px-4">
                    <TouchableOpacity
                      className="flex w-1/2"
                      onPress={handleLocationPress}
                    >
                      <View
                        className="flex flex-row items-center justify-center rounded-full border border-[#F83B4F]"
                        style={{
                          height: 40,
                        }}
                      >
                        <FontAwesome6
                          name="location-dot"
                          size={20}
                          color="#F83B4F"
                        />
                        <Text className="text-base font-semibold ml-2 text-[#000000]">
                          {t("VisitPopup.Location")}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex w-1/2"
                      onPress={() => handleDial(selectedItem.farmerMobile)}
                    >
                      <View
                        className="flex-row items-center justify-center border border-[#F83B4F] rounded-full px-6 "
                        style={{
                          height: 40,
                        }}
                      >
                        <Ionicons name="call" size={20} color="#F83B4F" />
                        <Text className="text-base font-semibold  ml-2">
                          {t("VisitPopup.GetCall")}
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
                  if (
                    selectedItem?.farmerId &&
                    selectedItem?.propose === "Individual"
                  ) {
                    navigation.navigate("QRScanner", {
                      farmerId: selectedItem.farmerId,
                      jobId: selectedItem.jobId,
                      certificationpaymentId:
                        selectedItem.certificationpaymentId,
                      farmerMobile: selectedItem.farmerMobile,
                      farmId: selectedItem.farmId,
                      clusterId: selectedItem.clusterID,
                      isClusterAudit: false,
                      auditId: selectedItem.id,
                      screenName: "ViewAllVisits",
                    });
                  } else if (selectedItem?.propose === "Requested") {
                    navigation.navigate("QRScaneerRequstAudit", {
                      farmerId: selectedItem.farmerId,
                      govilinkjobid: selectedItem.id,
                      jobId: selectedItem.jobId,
                      farmerMobile: selectedItem.farmerMobile,
                      screenName: "ViewAllVisits",
                    });
                  }
                }}
              >
                <LinearGradient
                  colors={["#F2561D", "#FF1D85"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 50,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9999,
                    marginTop: 16,
                    marginBottom: 30,
                    paddingHorizontal:
                      i18n.language === "si"
                        ? 96
                        : i18n.language === "ta"
                          ? 96
                          : "40%",
                    overflow: "hidden",
                  }}
                >
                  <Text
                    className={`text-white  font-semibold ${i18n.language === "si" ? "text-base" : i18n.language === "ta" ? "text-base" : "text-lg"}`}
                  >
                    {t("VisitPopup.Start")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default ViewAllVisits;
