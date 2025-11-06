import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
  Pressable,
  Modal,
  BackHandler,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { useTranslation } from "react-i18next";
import { DrawerActions } from "@react-navigation/native";
import i18n from "@/i18n/i18n";
import { useDispatch } from "react-redux";
import { setUserProfile } from "@/store/authSlice";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, Ionicons, Feather, FontAwesome6 } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";
type DashboardNavigationProps = StackNavigationProp<
  RootStackParamList,
  "Dashboard"
>;

interface DashboardProps {
  navigation: DashboardNavigationProps;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  profileImg: string;
  firstNameSinhala: string;
  lastNameSinhala: string;
  firstNameTamil: string;
  lastNameTamil: string;
  empId: string;
}
interface VisitsData {
  farmerName: string;
  jobId: string;
  propose: string;
  serviceenglishName: string;
  servicesinhalaName: string;
  servicetamilName: string;
}

interface DraftVisit {
  certificationpaymentId: number;
  jobId: string;
  userId: number;
  totalTasks: number;
  tickCompleted: number;
  photoCompleted: number;
  totalCompleted: number;
  completionPercentage: number;
  farmerName?: string; 
  farmerId?: number;   
  propose?: string;    
}


const Dashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const dispatch = useDispatch();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [visitsData, setVisitsData] = useState<VisitsData[]>([]);
const [draftVisits, setDraftVisits] = useState<DraftVisit[]>([]);
        console.log("officer draft visit", draftVisits)

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const scrollToIndex = (index: number) => {
    if (!flatListRef.current || !visitsData || visitsData.length === 0) return;

    const validIndex = Math.max(0, Math.min(index, visitsData.length - 1));

    try {
      flatListRef.current.scrollToIndex({ index: validIndex, animated: true });
      setCurrentIndex(validIndex);
    } catch (error) {
      console.warn("scrollToIndex error:", error);
      flatListRef.current.scrollToOffset({
        offset: validIndex * 320,
        animated: true,
      });
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/auth/user-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(response.data.data);
        dispatch(setUserProfile(response.data.data));
      }
    } catch (error:any) {
      console.error("Failed to fetch user profile:", error);
      if (error.response?.status === 401) {
      Alert.alert("Session expired, please login again");
      navigation.navigate("Login");
    }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchVisits();
    fetchVisitsDraft()
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    await fetchVisits();
    await fetchVisitsDraft()
    setRefreshing(false);
  };
  const getName = () => {
    if (!profile) return "Loading...";
    switch (i18n.language) {
      case "si":
        return `${profile.firstNameSinhala}`;
      case "ta":
        return `${profile.firstNameTamil}`;
      default:
        return `${profile.firstName}`;
    }
  };
  const getProposeName = (item: VisitsData) => {
    if (!item) return "";

    switch (i18n.language) {
      case "si":
        return item.servicesinhalaName || item.propose || "";
      case "ta":
        return item.servicetamilName || item.propose || "";
      default:
        return item.serviceenglishName || item.propose || "";
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );

  const getTextStyle = () => {
    if (i18n.language === "si") {
      return {
        fontSize: 16,
        lineHeight: 20,
      };
    }
  };
  const fetchVisits = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/officer/officer-visits`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVisitsData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch officer visits:", error);
    } finally {
      setRefreshing(false);
    }
  };

    const fetchVisitsDraft = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/officer/officer-visits-draft`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDraftVisits(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch officer visits:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (showPopup) {
        setShowPopup(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [showPopup]);
  return (
    <ScrollView
      className={`flex-1 bg-white p-3  `}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex flex-row ">
        <TouchableOpacity
          className="flex-row items-center mb-4 p-4"
          onPress={openDrawer}
        >
          <Image
            source={
              profile?.profileImg
                ? { uri: profile.profileImg }
                : require("../../assets/myprofile.webp")
            }
            className="w-16 h-16 rounded-full mr-3"
          />

          <View>
            <Text
              style={[{ fontSize: 16 }, getTextStyle()]}
              className="text-lg font-bold"
            >
              {t("Dashboard.Hello")}, {getName()}
            </Text>
            <Text className="text-[#6E7F96] text-lg">{profile?.empId}</Text>
          </View>
        </TouchableOpacity>
        <View></View>
      </View>

      <View className="p-2 mt-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-bold">
            {t("Dashboard.Today Visits")}{" "}
            <Text className="text-[#4E6393]">
              ({visitsData.length.toString().padStart(2, "0")})
            </Text>
          </Text>
          <TouchableOpacity onPress={()=> navigation.navigate("ViewAllVisits")}>
            <Text className="text-pink-500 font-semibold">
              {t("Dashboard.View All")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {visitsData.length > 0 ? (
        <View className="flex-row items-center">
          <TouchableOpacity
            disabled={!visitsData || currentIndex <= 0}
            onPress={() => scrollToIndex(currentIndex - 1)}
            className="p-1"
          >
            <AntDesign
              name="left"
              size={24}
              color={!visitsData || currentIndex <= 0 ? "#ccc" : "#FF1D85"}
            />
          </TouchableOpacity>

          <FlatList
            ref={flatListRef}
            horizontal
            data={visitsData}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="border border-[#FF1D85] rounded-lg p-3 mr-4 w-[304px]"
                activeOpacity={0.8}
                onPress={() => {
                  //requested comes from govilinkjobs , individual comes from farmaudits
                  if (
                    item.propose === "Individual" ||
                    item.propose === "Requested"
                  ) {
                    setSelectedItem(item);
                    setShowPopup(true);
                  } else {
                    console.log("navigate to cluster audit");
                    {
                      /*if cluster need send  clusterID , jobId    */
                    }
                  }
                }}
              >
                <View>
                  <Text className="text-black text-sm font-medium">
                    #{item.jobId}
                  </Text>
                  {item.farmerName ? (
                    <Text className="text-base font-bold mt-1">
                      {item.farmerName}
                    </Text>
                  ) : null}
                  {item.propose ? (
                    <Text className="text-[#4E6393] text-base mt-1">
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
                  {item.englishName || item.sinhalaName || item.tamilName ? (
                    <Text className="text-[#4E6393] text-base mt-1">
                      {getProposeName(item)}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            disabled={!visitsData || currentIndex >= visitsData.length - 1}
            onPress={() => scrollToIndex(currentIndex + 1)}
            className="p-1"
          >
            <AntDesign
              name="right"
              size={24}
              color={
                !visitsData || currentIndex >= visitsData.length - 1
                  ? "#ccc"
                  : "#FF1D85"
              }
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View className=" justify-center items-center mt-4">
          <Image
            source={require("../../assets/no tasks.webp")}
            style={{
              width: 140,
              height: 100,
            }}
            resizeMode="contain"
          />
          <Text className="italic text-[#787878]">
            {t("Dashboard.No Jobs for Today")}
          </Text>
        </View>
      )}

      <View className="p-2 mt-10">
        <Text className="text-base font-bold mb-3">
          {t("Dashboard.Saved Draft")}
        </Text>
      </View>

      <View className="p-8 -mt-10">
     {/* draft done for only individual audit */}
        {draftVisits.length > 0 ? (
    draftVisits.map((item, index) => (
      <TouchableOpacity  key={index}
      onPress={()=> navigation.navigate("CertificateQuesanory", { jobId:item.jobId, certificationpaymentId:item.certificationpaymentId })}
      >
      <View
       
        className="border border-[#FF1D85] rounded-lg p-3 mb-4 w-full flex-row justify-between items-center"
      >
        <View>
          <Text className="text-black text-sm font-medium">#{item.jobId}</Text>
            <Text className="text-base font-bold mt-1">
              {item.farmerName}
            </Text>
          <Text className="text-[#4E6393] text-base mt-1">
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
                        } 
                      })()}
          </Text>
        </View>

        <AnimatedCircularProgress
          size={70}
          width={6}
          fill={item.completionPercentage || 0}
          tintColor="#FF6B6B"
          backgroundColor="#E8DEF8"
        >
          {(fill: number) => (
            <Text className="text-black text-base font-semibold">
              {Math.round(fill)}%
            </Text>
          )}
        </AnimatedCircularProgress>
      </View>
      </TouchableOpacity>
    ))
  ) : (
    <View className="items-center justify-center mt-2">
      <Image
        source={require("../../assets/no tasks.webp")}
        style={{ width: 120, height: 90 }}
        resizeMode="contain"
      />
      <Text className="italic text-[#787878]">
        {t("Dashboard.No Drafts Saved")}
      </Text>
    </View>
  )}

      </View>

      

      <Modal transparent visible={showPopup} animationType="slide">
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

                        <TouchableOpacity className="flex ">
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
    if (selectedItem?.farmerId) {
      navigation.navigate("QRScanner", { farmerId: selectedItem.farmerId, jobId: selectedItem.jobId , certificationpaymentId: selectedItem.certificationpaymentId });
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
    </ScrollView>
  );
};

export default Dashboard;
