import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, FlatList ,  TouchableWithoutFeedback, Linking} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "./types";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome6 } from "@expo/vector-icons";

type ViewFarmsClusterNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewFarmsCluster"
>;

type ViewFarmsClusterProp = RouteProp<
  RootStackParamList,
  "ViewFarmsCluster"
>;

interface ViewFarmsClusterProps {
  navigation: ViewFarmsClusterNavigationProp;
}
interface VisitsData {
    id:number
  farmerName: string;
  farmerMobile:number;
  jobId: string;
  propose: string;
  serviceenglishName: string;
  servicesinhalaName: string;
  servicetamilName: string;
  clusterId:number
  farmId:number
  regCode:number
  jobStatus:string
  isCompleted:number
}


const LoadingSkeleton = () => {
  const rectWidth = wp("38%");
  const gapBetweenRects = wp("8%");
  const totalWidth = 2 * rectWidth + gapBetweenRects;
  const startX = (wp("100%") - totalWidth) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingVertical: hp("2%") }}>
      <ContentLoader
        speed={1}
        width="100%"
        height={hp("100%")}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
          <Rect x={wp("7%")} y={hp("4%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />


          <Rect x={wp("7%")} y={hp("15%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />
                    <Rect x={wp("7%")} y={hp("28%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />
                                        <Rect x={wp("7%")} y={hp("41%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />
                                        <Rect x={wp("7%")} y={hp("54%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />
                                        <Rect x={wp("7%")} y={hp("67%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />

      </ContentLoader>
    </View>
  );
};

const ViewFarmsCluster: React.FC<ViewFarmsClusterProps> = ({ navigation }) => {
  const route = useRoute<ViewFarmsClusterProp>();
  const { jobId, farmName, feildauditId} = route.params; 
  console.log(jobId,farmName,feildauditId)
  const {t,  i18n} = useTranslation();
  const [visitsData, setVisitsData] = useState<VisitsData[]>([]);
const [loadingQuestionId, setLoadingQuestionId] = useState<number | null>(null);
const [loaingCertificate, setloaingCertificate] = useState(true)
  const [showPopup, setShowPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchclusteVisits = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
            setloaingCertificate(true)

      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/cluster-audit/cluster-visits/${feildauditId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      console.log(response.data.data)
            setVisitsData(response.data.data);
      setloaingCertificate(false)
      }
    } catch (error) {
      console.error("Failed to fetch officer visit:", error);
    } finally {

    }
  };
  useEffect(() => {
    fetchclusteVisits();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-4 bg-white shadow-sm border-b border-[#E5E5E5]">
        <TouchableOpacity
          className="bg-[#F6F6F680] rounded-full p-2 justify-center w-10 z-20"
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="left" size={22} color="#000" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-base font-semibold text-center">
           #{jobId}
          </Text>

        </View>


      </View>
                      <View className="mt-4">
          <Text className="text-xl font-semibold text-center">
           {farmName}
          </Text>
  {visitsData.length > 0 && (
    <Text className="text-base text-center text-gray-500 mt-1">
      {visitsData.filter(v => v.isCompleted !== 1).length} farms left to finish
    </Text>
  )}
        </View>
{loaingCertificate ? (
  <LoadingSkeleton/>
):(
  <>
  <View className="mt-2 p-2">

<FlatList
  data={visitsData}
  keyExtractor={(item) => item.id.toString()}
  showsVerticalScrollIndicator={false}
  renderItem={({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="bg-white border border-[#9DB2CE] rounded-xl px-5 py-4 mb-3 mx-3 flex-row justify-between items-center"
                      onPress={() => {
                  setSelectedItem(item);
                  setShowPopup(true);
                }}
    >
      {/* Left side — ID */}
      <Text className="text-black text-lg font-semibold">
        ID : {item.regCode}
      </Text>

     {/* Right side — Button / Status */}
{item.isCompleted === 1 ? (
  <View className="bg-[#000] rounded-full p-2">
    <AntDesign
      name="check"
      size={16}
      color="#fff" 
    />
  </View>
) : item.jobStatus === "Opend" ? (
  <TouchableOpacity
  >
    <LinearGradient
      colors={["#FF416C", "#FF4B2B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="rounded-full px-6 py-2"
    >
      <Text className="text-white text-base font-semibold text-center">
        {item.jobStatus}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
) : item.jobStatus === "Start" && (
  <TouchableOpacity
    className="bg-black rounded-full px-6 py-1.5"
  
  >
    <Text className="text-white text-base font-semibold text-center">
      {item.jobStatus}
    </Text>
  </TouchableOpacity>
)}

    </TouchableOpacity>
  )}
/>

    
  </View>

  </>
)}
      
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
      navigation.navigate("QRScanner", { farmerId: selectedItem.farmerId, jobId: selectedItem.jobId , certificationpaymentId: selectedItem.certificationpaymentId, farmerMobile:selectedItem.farmerMobile, farmId:selectedItem.farmId, clusterId:selectedItem.clusterId  });
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

export default ViewFarmsCluster;
