import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { RootStackParamList } from "@/component/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { RouteProp, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";

type AssignJobOfficerListNavigationProps = StackNavigationProp<
  RootStackParamList,
  "AssignJobOfficerList"
>;

interface AssignJobOfficerListProps {
  navigation: AssignJobOfficerListNavigationProps;
}

interface Officer {
  id: number;
  firstName: string;
  firstNameSinhala: string;
  firstNameTamil: string;
  lastName: string;
  lastNameSinhala: string;
  lastNameTamil: string;
  empId: string;
  irmId: number | null;
  status: string;
  assigned: number;
}

const AssignJobOfficerList: React.FC<AssignJobOfficerListProps> = ({
  navigation,
}) => {
  const route =
    useRoute<RouteProp<RootStackParamList, "AssignJobOfficerList">>();
  const {
    selectedJobIds,
    selectedDate,
    isOverdueSelected,
    propose,
    fieldAuditIds,
    govilinkJobIds,
    auditType,
  } = route.params;
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Animated values for smooth progress
  const progressAnim = useRef(new Animated.Value(100)).current;
  const countdownAnim = useRef(new Animated.Value(30)).current;

  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Get the single jobId (not array)
  const singleJobId = Array.isArray(selectedJobIds)
    ? selectedJobIds[0]
    : selectedJobIds;

  // Load user info on component mount
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem("userInfo");
        if (userInfoStr) {
          setUserInfo(JSON.parse(userInfoStr));
        }
      } catch (error) {
        console.error("Failed to load user info:", error);
      }
    };
    loadUserInfo();
  }, []);

  // Get officer name based on current language
  const getOfficerName = (officer: Officer) => {
    const currentLanguage = i18n.language;

    switch (currentLanguage) {
      case "si":
        return `${officer.firstNameSinhala || officer.firstName} ${
          officer.lastNameSinhala || officer.lastName
        }`;
      case "ta":
        return `${officer.firstNameTamil || officer.firstName} ${
          officer.lastNameTamil || officer.lastName
        }`;
      default:
        return `${officer.firstName} ${officer.lastName}`;
    }
  };

  // Format date to "On October 12" format
  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   const options: Intl.DateTimeFormatOptions = {
  //     month: "long",
  //     day: "numeric",
  //   };
  //   return `On ${date.toLocaleDateString("en-US", options)}`;
  // };

const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
  };

  if( i18n.language === "si"){
    return `${date.toLocaleDateString("si-LK", options)}`;
  }
  else if( i18n.language === "ta"){
    return `${date.toLocaleDateString("ta-LK", options)}`;
  }else{
    return `On ${date.toLocaleDateString("en-US", options)}`;
  }
};


  // Start smooth countdown animation
  const startCountdownAnimation = () => {
    progressAnim.setValue(100);
    countdownAnim.setValue(30);

    if (animationRef.current) {
      animationRef.current.stop();
    }

    animationRef.current = Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(countdownAnim, {
        toValue: 0,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ]);

    animationRef.current.start(({ finished }) => {
      if (finished) {
        handleAutoAssign();
      }
    });
  };

  // Countdown timer effect
  useEffect(() => {
    if (showConfirmationModal) {
      startCountdownAnimation();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [showConfirmationModal]);

  // Update countdown value based on animation
  useEffect(() => {
    const countdownListener = countdownAnim.addListener(({ value }) => {
      const roundedValue = Math.ceil(value);
      setCountdown(roundedValue > 0 ? roundedValue : 0);
    });

    return () => {
      countdownAnim.removeListener(countdownListener);
    };
  }, []);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(t("Error.Error"), t("Error.AuthTokenNotFound"), [{ text: t("MAIN.OK") }]);
        return;
      }

      // Use the single jobId instead of array
      if (!singleJobId) {
        Alert.alert(t("Error.Error"), t("AssignJobOfficerList.NoJobIdFound"));
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/assign-jobs/get-assign-officer-list/${singleJobId}/${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("IRM Users API Response:", response.data);

      if (response.data.status === "success") {
        setOfficers(response.data.data);
      } else {
        Alert.alert(
          t("Error.Error"),
          t("AssignJobOfficerList.FailedToFetchOfficers"),
          [{ text: t("MAIN.OK") }]
        );
      }
    } catch (error) {
      console.error("Failed to fetch officers:", error);
      Alert.alert(
        t("Error.Error"),
        t("AssignJobOfficerList.FailedToLoadOfficers"),
        [{ text: t("MAIN.OK") }]
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOfficers();
    }, [])
  );

  const handleAssignToOfficer = (officer: Officer) => {
    setSelectedOfficer(officer);
    setShowConfirmationModal(true);
  };

  const handleUndo = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    setShowConfirmationModal(false);
    setSelectedOfficer(null);
  };

  const handleConfirmAndLeave = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    setShowConfirmationModal(false);
    assignJobsToOfficer();
  };

  const assignJobsToOfficer = async () => {
    if (!selectedOfficer) return;

    setAssigning(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(t("Error.Error"), t("Error.AuthTokenNotFound"), [{ text: t("MAIN.OK") }]);
        return;
      }

      console.log("Sending assignment request with:", {
        officerId: selectedOfficer.id,
        date: selectedDate,
        propose: propose,
        fieldAuditIds: fieldAuditIds || [],
        govilinkJobIds: govilinkJobIds || [],
        auditType: auditType,
      });

      // IMPORTANT: Use the correct endpoint URL based on your backend
      // The endpoint should match what's defined in your backend routes
      const response = await axios.post(
        `${environment.API_BASE_URL}api/assign-jobs/assign-officer-to-field-audits`,
        {
          officerId: selectedOfficer.id,
          date: selectedDate,
          propose: propose,
          fieldAuditIds: fieldAuditIds || [],
          govilinkJobIds: govilinkJobIds || [],
          auditType: auditType,
          // The backend should get assignedBy from req.user.id automatically
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Assignment API Response:", response.data);

      if (response.data.status === "success") {
        Alert.alert(
          t("Main.Success"),
          t("AssignJobOfficerList.AssignSuccess", {
            name: getOfficerName(selectedOfficer),
          }),
          [
            {
               text: t("MAIN.OK") ,
              onPress: () => navigation.navigate("AssignJobs"),
            },
          ]
        );
      } else {
        Alert.alert(
          t("Main.Error"),
           t("AssignJobOfficerList.FailedToAssignJobs"),
           [{ text: t("MAIN.OK") }]
        );
      }
    } catch (error: any) {
      console.error("Failed to assign jobs:", error);

      let errorMessage = t("AssignJobOfficerList.FailedToAssignJobs");

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);

        errorMessage =
          error.response.data?.message ||
          `Server Error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
        errorMessage =
          "No response from server. Please check your internet connection.";
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        errorMessage = error.message || "An unexpected error occurred";
      }

Alert.alert(
          t("Main.Error"),
           t("AssignJobOfficerList.FailedToAssignJobs"),
           [{ text: t("MAIN.OK") }]
        );
          } finally {
      setAssigning(false);
    }
  };

  const handleAutoAssign = () => {
    setShowConfirmationModal(false);
    if (selectedOfficer) {
      assignJobsToOfficer();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Circle parameters
  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  // Determine which IDs to display based on auditType
  const getAssignedJobInfo = () => {
    if (
      auditType === "feildaudits" &&
      fieldAuditIds &&
      fieldAuditIds.length > 0
    ) {
      return `Field Audit ID(s): ${fieldAuditIds.join(", ")}`;
    } else if (
      auditType === "govilinkjobs" &&
      govilinkJobIds &&
      govilinkJobIds.length > 0
    ) {
      return `Govilink Job ID(s): ${govilinkJobIds.join(", ")}`;
    } else if (singleJobId) {
      return `Job ID: ${singleJobId}`;
    }
    return "Job Assignment";
  };

  return (
    <View className="flex-1 bg-white">
      {/* Single Header - Always visible */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => {
            if (showConfirmationModal) {
              handleUndo();
            } else {
              navigation.navigate("AssignJobs");
            }
          }}
          className="bg-[#F6F6F680] rounded-full py-4 px-3"
        >
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color="black"
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-black">
            {singleJobId ? `#${singleJobId}` : getAssignedJobInfo()}
          </Text>
          <Text className="text-sm text-black mt-1">
            {selectedDate
              ? formatDate(selectedDate)
              : t("AssignJobOfficerList.HeaderOn")}
          </Text>
        </View>

        <View style={{ width: 55 }} />
      </View>

      {/* Main Content */}
      {!showConfirmationModal ? (
        loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF1D85" />
            <Text className="mt-4 text-[#565559]">
              {t("AssignJobOfficerList.LoadingOfficers")}
            </Text>
          </View>
        ) : officers.length > 0 ? (
          <ScrollView
            className="flex-1 bg-white mb-10"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="px-6 py-4">
              {officers.map((officer) => (
                <View
                  key={officer.id}
                  className="border border-[#9DB2CE] bg-white p-4 mb-4 rounded-lg"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      {/* Officer Name - Language Specific */}
                      <Text className="text-md font-bold text-[#212121]">
                        {getOfficerName(officer)}
                      </Text>

                      <Text className="text-sm font-medium text-[#4E6393] mt-1">
                        {officer.empId}
                      </Text>

                      <Text className="text-sm font-medium text-[#000000]">
                        {t("AssignJobOfficerList.OfficerAssignedJobs")}:{" "}
                        {officer.assigned}
                      </Text>
                    </View>

                    {/* Assign Button */}
                    <TouchableOpacity
                      onPress={() => handleAssignToOfficer(officer)}
                      disabled={assigning}
                      className={`px-5 py-3 rounded-3xl items-center mt-auto ml-3 ${
                        assigning ? "bg-gray-400" : "bg-black"
                      }`}
                    >
                      {assigning ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white text-[14px] font-semibold">
                          {t("AssignJobOfficerList.AssignButton")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-lg">
              {t("AssignJobOfficerList.NoOfficersAvailable")}
            </Text>
          </View>
        )
      ) : (
        /* Confirmation Modal Content */
        <View className="flex-1 bg-white">
          {/* Countdown Section */}
          <View className="flex justify-center items-center px-6 mt-6">
            {/* Circular Countdown */}
            <View className="items-center mb-8">
              <Svg width={150} height={150}>
                <G rotation="-90" origin="75, 75">
                  <Circle
                    cx="75"
                    cy="75"
                    r={radius}
                    stroke="#FFF0FA"
                    strokeWidth={8}
                    fill="transparent"
                  />
                  <AnimatedCircle
                    cx="75"
                    cy="75"
                    r={radius}
                    stroke="#FF1D85"
                    strokeWidth={8}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: [circumference, 0],
                    })}
                    strokeLinecap="round"
                  />
                </G>
                <SvgText
                  fontSize="26"
                  fontWeight="bold"
                  fill="black"
                  textAnchor="middle"
                  x="75"
                  y="85"
                >
                  {formatTime(countdown)}
                </SvgText>
              </Svg>
            </View>

            {/* Instruction Text */}
            <Text className="text-md text-center text-[#4E6393] mb-1 leading-6">
              {t("AssignJobOfficerList.CountdownInstruction1")}{" "}
              <Text className="underline font-semibold text-black">
                {formatTime(countdown)}
              </Text>{" "}
              {t("AssignJobOfficerList.CountdownInstruction2")}
            </Text>
            <Text className="text-md text-center text-[#4E6393] mb-8 leading-6">
              {t("AssignJobOfficerList.CountdownInstruction3")}
            </Text>

            {/* Selected Officer Card */}
            {selectedOfficer && (
              <View className="w-full border border-[#9DB2CE] bg-white p-4 rounded-lg mb-8">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-md font-bold text-[#212121]">
                      {getOfficerName(selectedOfficer)}
                    </Text>
                    <Text className="text-sm font-medium text-[#4E6393] mt-1">
                      {selectedOfficer.empId}
                    </Text>
                    <Text className="text-sm font-medium text-[#000000]">
                      {t("AssignJobOfficerList.OfficerAssignedJobs")}:{" "}
                      {selectedOfficer.assigned}
                    </Text>
                  </View>

                  {/* Undo Button */}
                  <TouchableOpacity
                    onPress={handleUndo}
                    disabled={assigning}
                    className={`px-5 py-3 rounded-3xl items-center ml-3 mt-auto ${
                      assigning ? "bg-gray-400" : "bg-black"
                    }`}
                  >
                    {assigning ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-md font-semibold">
                        {t("AssignJobOfficerList.UndoButton")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Confirm & Leave Button */}
          <View className="px-12 pb-8 mt-auto mb-14">
            <TouchableOpacity
              onPress={handleConfirmAndLeave}
              disabled={assigning}
              className="w-full"
            >
              <LinearGradient
                colors={
                  assigning ? ["#CCCCCC", "#CCCCCC"] : ["#F2561D", "#FF1D85"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-3xl px-6 py-4 items-center"
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-lg font-semibold">
                    {t("AssignJobOfficerList.ConfirmLeaveButton")}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default AssignJobOfficerList;
