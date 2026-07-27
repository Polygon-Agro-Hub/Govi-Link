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
import { RootStackParamList } from "@/component/types/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
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
  const progressAnim = useRef(new Animated.Value(100)).current;
  const countdownAnim = useRef(new Animated.Value(30)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const singleJobId = Array.isArray(selectedJobIds)
    ? selectedJobIds[0]
    : selectedJobIds;

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
    };

    if (i18n.language === "si") {
      return `${date.toLocaleDateString("si-LK", options)}`;
    } else if (i18n.language === "ta") {
      return `${date.toLocaleDateString("ta-LK", options)}`;
    } else {
      return `On ${date.toLocaleDateString("en-US", options)}`;
    }
  };

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
        Alert.alert(t("Error.Error"), t("Error.AuthTokenNotFoundPleaseLogInAgain"), [
          { text: t("Main.OK") },
        ]);
        return;
      }

      if (!singleJobId) {
        Alert.alert(t("Error.Error"), t("AssignJobOfficerList.NoJobIdFound"));
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/assign-jobs/get-assign-officer-list/${singleJobId}/${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.status === "success") {
        setOfficers(response.data.data);
      } else {
        Alert.alert(
          t("Error.Error"),
          t("AssignJobOfficerList.FailedToFetchOfficers"),
          [{ text: t("Main.OK") }],
        );
      }
    } catch (error) {
      console.error("Failed to fetch officers:", error);
      Alert.alert(
        t("Error.Error"),
        t("AssignJobOfficerList.FailedToLoadOfficers"),
        [{ text: t("Main.OK") }],
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOfficers();
    }, []),
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
        Alert.alert(t("Error.Error"), t("Error.AuthTokenNotFoundPleaseLogInAgain"), [
          { text: t("Main.OK") },
        ]);
        return;
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/assign-jobs/assign-officer-to-field-audits`,
        {
          officerId: selectedOfficer.id,
          date: selectedDate,
          propose: propose,
          fieldAuditIds: fieldAuditIds || [],
          govilinkJobIds: govilinkJobIds || [],
          auditType: auditType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.status === "success") {
        Alert.alert(
          t("Main.Success"),
          t("AssignJobOfficerList.JobsAssignedSuccessfully", {
            name: getOfficerName(selectedOfficer),
          }),
          [
            {
              text: t("Main.OK"),
              onPress: () => navigation.navigate("AssignJobs"),
            },
          ],
        );
      } else {
        Alert.alert(
          t("Main.Sorry"),
          t("AssignJobOfficerList.FailedToAssignJobsPleaseTryAgain"),
          [{ text: t("Main.OK") }],
        );
      }
    } catch (error: any) {
      console.error("Failed to assign jobs:", error);

      let errorMessage = t("AssignJobOfficerList.FailedToAssignJobsPleaseTryAgain");

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);

        errorMessage =
          error.response.data?.message ||
          `Server Error: ${error.response.status}`;
      } else if (error.request) {
        console.error("Error request:", error.request);
        errorMessage =
          "No response from server. Please check your internet connection.";
      } else {
        console.error("Error message:", error.message);
        errorMessage = error.message || "An unexpected error occurred";
      }

      Alert.alert(
        t("Main.Sorry"),
        t("AssignJobOfficerList.FailedToAssignJobsPleaseTryAgain"),
        [{ text: t("Main.OK") }],
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

  const radius = 65;
  const circumference = 2 * Math.PI * radius;

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
      <View className="flex-row items-center px-4 h-[70px] border-b border-gray-200">
        <View className="w-16 items-start">
          <TouchableOpacity
            onPress={() => {
              if (showConfirmationModal) {
                handleUndo();
              } else {
                navigation.navigate("AssignJobs");
              }
            }}
          >
            <Entypo
              name="chevron-left"
              size={25}
              color="black"
              className="rounded-full p-3 bg-[#F6F6F6]/50"
            />
          </TouchableOpacity>
        </View>

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

        <View className="w-16 items-end" />
      </View>

      {!showConfirmationModal ? (
        loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF1D85" />
            <Text className="mt-4 text-[#565559]">
              {t("AssignJobOfficerList.LoadingOfficers...")}
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
                      <Text className="text-md font-bold text-[#212121]">
                        {getOfficerName(officer)}
                      </Text>

                      <Text className="text-sm font-medium text-[#4E6393] mt-1">
                        {officer.empId}
                      </Text>

                      <Text className="text-sm font-normal text-[#000000]">
  {t("AssignJobOfficerList.OfficerAssignedJobs")}:{" "}
  <Text className="font-medium">
    {officer.assigned}
  </Text>
</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleAssignToOfficer(officer)}
                      disabled={assigning}
                      className={`px-5 py-3 rounded-full items-center mt-auto ml-3 ${
                        assigning ? "bg-gray-400" : "bg-black"
                      }`}
                    >
                      {assigning ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white text-[14px] font-semibold">
                          {t("AssignJobOfficerList.Assign")}
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
        <View className="flex-1 bg-white">
          <View className="flex justify-center items-center px-6 mt-6">
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

            <Text className="text-md text-center text-[#4E6393] mb-1 leading-6">
              {t("AssignJobOfficerList.PleaseConfirmWithin")}{" "}
              <Text className="underline font-semibold text-black">
                {formatTime(countdown)}
              </Text>{" "}
              {t("AssignJobOfficerList.Seconds")}
            </Text>
            <Text className="text-md text-center text-[#4E6393] mb-8 leading-6">
              {t("AssignJobOfficerList.YouCanUndoOtherwiseThisOfficerWillBeAssignedAutomatically")}
            </Text>

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
                    <Text className="text-sm font-normal text-[#000000]">
                      {t("AssignJobOfficerList.OfficerAssignedJobs")}:
                      <Text className="font-medium">
                        {selectedOfficer.assigned}
                      </Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleUndo}
                    disabled={assigning}
                    className="ml-3 mt-auto rounded-full overflow-hidden"
                  >
                    <LinearGradient
                      colors={
                        assigning
                          ? ["#CCCCCC", "#CCCCCC"]
                          : ["#2C2C2C", "#000000"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="px-10 rounded-full items-center justify-center h-[50px]"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.25,
                        shadowRadius: 5,
                        elevation: 6,
                      }}
                    >
                      {assigning ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white text-md font-semibold">
                          {t("AssignJobOfficerList.Undo")}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View className="px-12 pb-8 mt-auto mb-14">
            <TouchableOpacity
              onPress={handleConfirmAndLeave}
              disabled={assigning}
              className="w-full rounded-full overflow-hidden"
            >
              <LinearGradient
                colors={
                  assigning ? ["#CCCCCC", "#CCCCCC"] : ["#F2561D", "#FF1D85"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-full px-6 items-center justify-center h-[50px]"
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-lg font-semibold">
                    {t("AssignJobOfficerList.ConfirmAndLeave")}
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default AssignJobOfficerList;
