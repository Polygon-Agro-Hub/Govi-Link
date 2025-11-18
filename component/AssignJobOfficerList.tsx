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

type AssignJobOfficerListNavigationProps = StackNavigationProp<
  RootStackParamList,
  "AssignJobOfficerList"
>;

interface AssignJobOfficerListProps {
  navigation: AssignJobOfficerListNavigationProps;
}

interface Officer {
  id: string;
  name: string;
  officerId: string;
  assignedJobs: number;
  contactNumber: string;
}

const AssignJobOfficerList: React.FC<AssignJobOfficerListProps> = ({
  navigation,
}) => {
  const route =
    useRoute<RouteProp<RootStackParamList, "AssignJobOfficerList">>();
  const { selectedJobIds, selectedDate, isOverdueSelected } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30 seconds countdown

  // Animated values for smooth progress
  const progressAnim = useRef(new Animated.Value(100)).current;
  const countdownAnim = useRef(new Animated.Value(30)).current;

  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Format date to "On October 12" format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
    };
    return `On ${date.toLocaleDateString("en-US", options)}`;
  };

  // Mock data for officers - replace with actual API call
  const mockOfficers: Officer[] = [
    {
      id: "1",
      name: "Ajith Gunasekara",
      officerId: "FIO00001",
      assignedJobs: 0,
      contactNumber: "+94 77 123 4567",
    },
    {
      id: "2",
      name: "Kamal Perera",
      officerId: "FIO00002",
      assignedJobs: 2,
      contactNumber: "+94 77 234 5678",
    },
    {
      id: "3",
      name: "Nimal Fernando",
      officerId: "FIO00003",
      assignedJobs: 1,
      contactNumber: "+94 77 345 6789",
    },
    {
      id: "4",
      name: "Sunil Rathnayake",
      officerId: "FIO00004",
      assignedJobs: 3,
      contactNumber: "+94 77 456 7890",
    },
  ];

  useEffect(() => {
    fetchOfficers();
  }, []);

  // Start smooth countdown animation
  const startCountdownAnimation = () => {
    // Reset animated values
    progressAnim.setValue(100);
    countdownAnim.setValue(30);
    
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Create parallel animations for progress and countdown
    animationRef.current = Animated.parallel([
      // Progress animation from 100 to 0 over 30 seconds
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 30000, // 30 seconds
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      // Countdown animation from 30 to 0 over 30 seconds
      Animated.timing(countdownAnim, {
        toValue: 0,
        duration: 30000, // 30 seconds
        easing: Easing.linear,
        useNativeDriver: false,
      })
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
      // Clean up animations when modal closes
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOfficers(mockOfficers);
    } catch (error) {
      console.error("Failed to fetch officers:", error);
      Alert.alert(
        t("Common.Error"),
        t("AssignJobOfficerList.FailedToLoadOfficers")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToOfficer = (officer: Officer) => {
    setSelectedOfficer(officer);
    setShowConfirmationModal(true);
  };

  const handleUndo = () => {
    // Stop animations
    if (animationRef.current) {
      animationRef.current.stop();
    }
    setShowConfirmationModal(false);
    setSelectedOfficer(null);
  };

  const handleConfirmAndLeave = () => {
    // Stop animations
    if (animationRef.current) {
      animationRef.current.stop();
    }
    setShowConfirmationModal(false);
    // Handle final assignment logic here
    console.log(
      `Assigning jobs: ${selectedJobIds.join(", ")} to officer: ${
        selectedOfficer?.id
      }`
    );
    Alert.alert(
      t("Common.Success"),
      t("AssignJobOfficerList.AssignSuccess")
    );
    // You can navigate back or show success message
  };

  const handleAutoAssign = () => {
    setShowConfirmationModal(false);
    // Handle auto assignment logic here
    console.log(
      `Auto assigning jobs: ${selectedJobIds.join(", ")} to officer: ${
        selectedOfficer?.id
      }`
    );
    Alert.alert(
      t("AssignJobOfficerList.AutoAssigned"),
      t("AssignJobOfficerList.AutoAssignedSuccess")
    );
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
            #{selectedJobIds.join(", ")}
          </Text>
          <Text className="text-sm text-black mt-1">
            {selectedDate ? formatDate(selectedDate) : t("AssignJobOfficerList.HeaderOn")}
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
            className="flex-1 bg-white"
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
                        {officer.name}
                      </Text>

                      <Text className="text-sm font-medium text-[#4E6393] mt-1">
                        {officer.officerId}
                      </Text>

                      <Text className="text-sm font-medium text-[#000000]">
                        {t("AssignJobOfficerList.OfficerAssignedJobs")}: {officer.assignedJobs}
                      </Text>
                    </View>

                    {/* Assign Button */}
                    <TouchableOpacity
                      onPress={() => handleAssignToOfficer(officer)}
                      className="bg-black px-5 py-3 rounded-3xl items-center mt-auto ml-3"
                    >
                      <Text className="text-white text-[14px] font-semibold">
                        {t("AssignJobOfficerList.AssignButton")}
                      </Text>
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
                  {/* Background Circle */}
                  <Circle
                    cx="75"
                    cy="75"
                    r={radius}
                    stroke="#FFF0FA"
                    strokeWidth={8}
                    fill="transparent"
                  />
                  {/* Animated Progress Circle */}
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
                      outputRange: [circumference, 0]
                    })}
                    strokeLinecap="round"
                  />
                </G>

                {/* Use regular SvgText with the actual countdown state */}
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
                      {selectedOfficer.name}
                    </Text>
                    <Text className="text-sm font-medium text-[#4E6393] mt-1">
                      {selectedOfficer.officerId}
                    </Text>
                    <Text className="text-sm font-medium text-[#000000]">
                      {t("AssignJobOfficerList.OfficerAssignedJobs")}: {selectedOfficer.assignedJobs}
                    </Text>
                  </View>

                  {/* Undo Button */}
                  <TouchableOpacity
                    onPress={handleUndo}
                    className="bg-black px-5 py-3 rounded-3xl items-center ml-3 mt-auto"
                  >
                    <Text className="text-white text-md font-semibold">
                      {t("AssignJobOfficerList.UndoButton")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Confirm & Leave Button */}
          <View className="px-12 pb-8 mt-auto mb-14">
            <TouchableOpacity
              onPress={handleConfirmAndLeave}
              className="w-full"
            >
              <LinearGradient
                colors={["#F2561D", "#FF1D85"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-3xl px-6 py-4 items-center"
              >
                <Text className="text-white text-lg font-semibold">
                  {t("AssignJobOfficerList.ConfirmLeaveButton")}
                </Text>
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