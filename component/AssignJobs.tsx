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
  ActivityIndicator,
  Alert,
  BackHandler,
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
  propose: string;
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
  latitude?: number;
  longitude?: number;
  city?: string;
  plotNo?: string;
  street?: string;
  auditType: "feildaudits" | "govilinkjobs";
  certificateId?: number;
}

const AssignJobs: React.FC<AssignJobsProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isOverdueSelected, setIsOverdueSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VisitItem | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  const fetchVisits = async () => {
    console.log("Fetching visits for date:", "Overdue:", isOverdueSelected);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/assign-jobs/visits/${selectedDate}`,
          {
            params: { isOverdueSelected: isOverdueSelected },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("VISIT:", response.data.data);
        setVisits(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch officer visits:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVisits();
      setSelectedJobs([]);
    }, [selectedDate, isOverdueSelected])
  );

  // Handle back button when modal is open
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (showPopup) {
          setShowPopup(false);
          setSelectedItem(null);
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [showPopup])
  );

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs((prev) => {
      if (prev.includes(jobId)) {
        return prev.filter((id) => id !== jobId);
      } else {
        // Only allow one job to be selected at a time
        return [jobId];
      }
    });
  };

  const handleCardPress = (item: VisitItem) => {
    // Only select the job, don't show modal or navigate immediately
    toggleJobSelection(item.jobId);
  };

  const handleStartJob = () => {
    if (selectedJobs.length === 0) {
      Alert.alert(
        "No Job Selected",
        "Please select at least one job to start."
      );
      return;
    }

    // Get the selected job details
    const selectedJob = visits.find((item) =>
      selectedJobs.includes(item.jobId)
    );

    if (!selectedJob) {
      Alert.alert(
        "Error",
        "Could not find selected job details. Please try again."
      );
      return;
    }

    // If propose is Individual or Requested, show modal
    if (
      selectedJob.propose === "Individual" ||
      selectedJob.propose === "Requested"
    ) {
      setSelectedItem(selectedJob);
      setShowPopup(true);
    } else {
      // For other propose types (like Cluster), navigate directly
      navigation.navigate("ViewFarmsCluster", {
        jobId: selectedJob.jobId,
        feildauditId: selectedJob.id,
        farmName: selectedJob.farmerName ?? "",
        screenName: "AssignJobs",
      });
    }
  };

  const handleStartJobFromModal = () => {
    if (!selectedItem) return;

    // Handle navigation based on propose type when Start is pressed in modal
    if (selectedItem.propose === "Individual") {
      console.log("hit assign jobs");
      navigation.navigate("QRScanner", {
        farmerId: selectedItem.farmerId,
        jobId: selectedItem.jobId,
        certificationpaymentId: selectedItem.certificationpaymentId,
        farmerMobile: selectedItem.farmerMobile,
        farmId: selectedItem.farmId,
        clusterId: selectedItem.clusterId,
        isClusterAudit: false,
        auditId: selectedItem.id,
        screenName: "AssignJobs",
      });
    } else if (selectedItem.propose === "Requested") {
      navigation.navigate("QRScaneerRequstAudit", {
        farmerId: selectedItem.farmerId,
        govilinkjobid: selectedItem.id,
        jobId: selectedItem.jobId,
        farmerMobile: selectedItem.farmerMobile,
        screenName: "AssignJobs",
      });
    }

    setShowPopup(false);
    setSelectedItem(null);
    setSelectedJobs([]); // Clear selection after starting
  };

  const handleAssignJobs = () => {
    if (selectedJobs.length === 0) {
      Alert.alert(
        "No Jobs Selected",
        "Please select at least one job to assign."
      );
      return;
    }

    const firstSelectedJob = visits.find((item) =>
      selectedJobs.includes(item.jobId)
    );

    if (firstSelectedJob) {
      // Prepare the IDs based on auditType
      const fieldAuditIds: number[] = [];
      const govilinkJobIds: number[] = [];

      // Get all selected jobs
      const selectedJobItems = visits.filter((item) =>
        selectedJobs.includes(item.jobId)
      );

      // Separate IDs based on auditType
      selectedJobItems.forEach((job) => {
        if (job.auditType === "feildaudits") {
          // For feildaudits, use the id as fieldAuditId
          fieldAuditIds.push(job.id);
        } else if (job.auditType === "govilinkjobs") {
          // For govilinkjobs, use the id as govilinkJobId
          govilinkJobIds.push(job.id);
        }
      });

      // Only one type of jobs should be selected at a time
      // (as per your single selection logic)
      if (fieldAuditIds.length > 0 && govilinkJobIds.length > 0) {
        Alert.alert(
          "Mixed Job Types",
          "Cannot assign mixed job types at once. Please select jobs of the same type."
        );
        return;
      }

      // Determine which ID to send based on the first selected job
      let paramsToSend;

      if (firstSelectedJob.auditType === "feildaudits") {
        paramsToSend = {
          selectedJobIds: selectedJobs,
          selectedDate: selectedDate,
          isOverdueSelected: isOverdueSelected,
          propose: firstSelectedJob.propose,
          fieldAuditIds: fieldAuditIds,
          auditType: firstSelectedJob.auditType,
        };
      } else {
        // For govilinkjobs type
        paramsToSend = {
          selectedJobIds: selectedJobs,
          selectedDate: selectedDate,
          isOverdueSelected: isOverdueSelected,
          propose: firstSelectedJob.propose,
          govilinkJobIds: govilinkJobIds,
          auditType: firstSelectedJob.auditType,
        };
      }

      console.log("Navigating with params:", paramsToSend);
      navigation.navigate("AssignJobOfficerList", paramsToSend);
    } else {
      Alert.alert(
        "Error",
        "Could not find selected job details. Please try again."
      );
      return;
    }
  };

  const handleDial = (farmerMobile: number) => {
    const phoneUrl = `tel:${farmerMobile}`;
    Linking.openURL(phoneUrl).catch((err) =>
      console.error("Failed to open dial pad:", err)
    );
  };

  const getServiceName = (item: VisitItem) => {
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
  };

  // Calculate counts based on visits data with leading zeros
  const getOverdueCount = () => {
    if (!isOverdueSelected) return "00";
    return visits.length.toString().padStart(2, "0");
  };

  const getTodayCount = () => {
    if (isOverdueSelected) return "00";
    return visits.length.toString().padStart(2, "0");
  };

  return (
    <View className="flex-1 bg-white pt-4">
      <View className="flex-row p-2 justify-center items-center gap-x-6 border-b border-gray-200">
        <TouchableOpacity
          className="mb-2"
          onPress={() => {
            setIsOverdueSelected(true);
            setSelectedJobs([]);
          }}
        >
          <LinearGradient
            colors={
              isOverdueSelected ? ["#F2561D", "#FF1D85"] : ["#FFF", "#FFF"]
            }
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
              {isOverdueSelected && (
                <View className="bg-white rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-[#F83B4F] font-bold text-xs">
                    {getOverdueCount()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-2"
          onPress={() => {
            setIsOverdueSelected(false);
            setSelectedJobs([]);
          }}
        >
          <LinearGradient
            colors={
              !isOverdueSelected ? ["#F2561D", "#FF1D85"] : ["#FFF", "#FFF"]
            }
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
              {!isOverdueSelected && (
                <View className="bg-white rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-[#F83B4F] font-bold text-xs">
                    {getTodayCount()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Action Buttons - Only show when at least one job is selected */}
      {selectedJobs.length > 0 && (
        <View className="flex-row p-4 justify-between items-center space-x-6">
          <View className="flex-1"></View>
          <View className="flex-1 items-center">
            <TouchableOpacity onPress={handleStartJob}>
              <LinearGradient
                colors={["#F2561D", "#FF1D85"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
className="flex-row p-3 rounded-full items-center justify-center min-w-[120px]"
              >
                <Text className="text-white font-bold text-lg">{t("AssignJobOfficerList.Start")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View className="flex-1 pr-6">
            <TouchableOpacity
              onPress={handleAssignJobs}
              className=" bg-black px-auto p-3 min-w-[120px] rounded-3xl items-center justify-center"
            >
              <Text className="font-bold text-white text-lg">{t("AssignJobOfficerList.AssignButton")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View className="flex-1 justify-center items-center mt-6 px-4 bg-white rounded-t-3xl">
          <ActivityIndicator size="large" color="#FF1D85" />
        </View>
      ) : visits.length > 0 ? (
        <ScrollView className="flex-1 mt-4 px-4 bg-white rounded-t-3xl mb-20">
          {visits.map((item) => (
            <TouchableOpacity
              key={item.jobId}
              onPress={() => handleCardPress(item)}
            >
              <View
                className="border border-[#FF1D85] bg-white p-4 mb-4 rounded-lg"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="flex-row justify-between items-start">
                  {/* Checkbox on Left Side */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleJobSelection(item.jobId);
                    }}
                    className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center mr-3 my-auto ${
                      selectedJobs.includes(item.jobId)
                        ? "bg-black border-black"
                        : "bg-white border-gray-400"
                    }`}
                  >
                    {selectedJobs.includes(item.jobId) && (
                      <AntDesign name="check" size={14} color="white" />
                    )}
                  </TouchableOpacity>

                  {/* Card Content */}
                  <View className="flex-1">
                    <Text className="text-sm font-medium">#{item.jobId}</Text>
                    <Text className="text-[16px] font-bold text-[#000] mt-1">
                      {getServiceName(item)}
                    </Text>
                    <Text className="text-[12px] font-medium text-[#4E6393] mt-1">
                      {t(`Districts.${item.district}`)}{" "}
                      {t("VisitPopup.District")}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View className=" items-center justify-center mt-32">
          <LottieView
            source={require("../assets/json/NoData.json")}
            style={{ width: 200, height: 200 }}
            autoPlay
            loop
          />
          <Text className="text-center text-gray-600 mt-2">
            {t("Visits.No Jobs Available")}
          </Text>
        </View>
      )}

      {/* Modal Popup */}
      <Modal
        transparent
        visible={showPopup}
        animationType="slide"
        onRequestClose={() => {
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
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-t-3xl p-5 w-full">
                <View className="items-center mt-4">
                  {/* Draggable Handle */}
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
                        {getServiceName(selectedItem)}
                      </Text>

                      <Text className="text-sm font-medium text-[#4E6393] mt-1">
                        {t(`Districts.${selectedItem.district}`)}{" "}
                        {t("VisitPopup.District")}
                      </Text>

                      <View className="flex flex-row justify-center gap-x-2 mb-4 mt-6 px-4">
                        {/* Location Button */}
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

                        {/* Call Button */}
                        <TouchableOpacity
                          className="flex"
                          onPress={() => handleDial(selectedItem.farmerMobile)}
                        >
                          <View className="flex-row items-center justify-center border border-[#F83B4F] rounded-full px-6 py-2">
                            <Ionicons name="call" size={20} color="#F83B4F" />
                            <Text className="text-base font-semibold ml-2">
                              {t("VisitPopup.Get Call")}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* Address Section */}
                      {(selectedItem.city ||
                        selectedItem.plotNo ||
                        selectedItem.street) && (
                        <View className="flex text-center justify-center items-center">
                          <Text className="text-sm font-semibold text-[#4E6393] mb-2">
                            {t("VisitPopup.Address")}
                          </Text>
                          <Text className="text-base font-medium text-[#434343]">
                            {selectedItem.plotNo}, {selectedItem.street},
                          </Text>
                          <Text className="text-base font-medium text-[#434343]">
                            {selectedItem.city}
                          </Text>
                        </View>
                      )}
                    </>
                  )}

                  {/* Action Buttons in Modal */}
                  <View className="flex-row justify-between w-full mt-6 px-4 gap-x-4">
                    {/* Start Button */}
                    <TouchableOpacity
                      className="flex-1"
                      onPress={handleStartJobFromModal}
                    >
                      <LinearGradient
                        colors={["#F2561D", "#FF1D85"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="py-3 items-center justify-center rounded-full"
                      >
                        <Text className="text-white text-lg font-semibold">
                          {t("VisitPopup.Start")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default AssignJobs;
