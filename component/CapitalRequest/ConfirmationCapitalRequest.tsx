import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState, useRef, useEffect } from "react";
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
import { environment } from "@/environment/environment";
import axios from "axios";

type ConfirmationCapitalRequestNavigationProps = StackNavigationProp<
  RootStackParamList,
  "ConfirmationCapitalRequest"
>;

interface ConfirmationCapitalRequestProps {
  navigation: ConfirmationCapitalRequestNavigationProps;
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
  assigned: number;
}

const ConfirmationCapitalRequest: React.FC<ConfirmationCapitalRequestProps> = ({
  navigation,
}) => {
  const route =
    useRoute<RouteProp<RootStackParamList, "ConfirmationCapitalRequest">>();
  const { formData, requestNumber, requestId } = route.params;

  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(true); // Set to true to show countdown immediately
  const [countdown, setCountdown] = useState(120); // Set to 2 minutes (120 seconds)

  // Animated values for smooth progress
  const progressAnim = useRef(new Animated.Value(100)).current;
  const countdownAnim = useRef(new Animated.Value(120)).current;

  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Start smooth countdown animation when component mounts
  useEffect(() => {
    startCountdownAnimation();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  // Start smooth countdown animation
  const startCountdownAnimation = () => {
    progressAnim.setValue(100);
    countdownAnim.setValue(120);

    if (animationRef.current) {
      animationRef.current.stop();
    }

    animationRef.current = Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 120000, // 2 minutes in milliseconds
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(countdownAnim, {
        toValue: 0,
        duration: 120000, // 2 minutes in milliseconds
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

  const handleUndo = async () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Show loading
    setAssigning(true);

    try {
      console.log(`🗑️ Deleting all inspection data for requestId: ${requestId}`);

      const response = await axios.delete(
        `${environment.API_BASE_URL}api/capital-request/inspection/delete/${requestId}`
      );

      if (response.data.success) {
        console.log('✅ All inspection data deleted successfully');
        console.log(`📊 Deleted from ${response.data.deletedTables.length} tables`);

        setAssigning(false);
        setShowConfirmationModal(false);

        Alert.alert(
          t("Main.Success"),
          t("ConfirmationCapitalRequest.UndoSuccess"),
          [
            {
              text: t("Main.ok"),
              onPress: () => navigation.navigate("Main", { screen: "CapitalRequests" }),
            },
          ]
        );
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error: any) {
      console.error('❌ Error deleting inspection data:', error);
      setAssigning(false);

      Alert.alert(
        t("Main.Error"),
        error.response?.data?.message || t("ConfirmationCapitalRequest.UndoFailed"),
        [{ text: t("Main.ok") }]
      );
    }
  };

  const handleConfirmAndLeave = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    setShowConfirmationModal(false);

    // Mock assignment - UI only
    setAssigning(true);
    setTimeout(() => {
      setAssigning(false);
      Alert.alert(
        t("Main.Success"),
        t("ConfirmationCapitalRequest.ConfirmSuccess"),
        [
          {
            text: t("Main.ok"),
            onPress: () => navigation.navigate("CapitalRequests"),
          },
        ]
      );
    }, 1500);
  };

  const handleAutoAssign = () => {
    setShowConfirmationModal(false);

    // Mock auto assignment - UI only
    setAssigning(true);
    setTimeout(() => {
      setAssigning(false);
      Alert.alert(
        t("Main.Success"),
        t("ConfirmationCapitalRequest.AutoAssignSuccess"),
        [
          {
            text: t("Main.ok"),
            onPress: () => navigation.navigate("CapitalRequests"),
          },
        ]
      );
    }, 1500);
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
              navigation.navigate("CapitalRequests");
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
            {requestNumber ? `#${requestNumber}` : "Capital Request"}
          </Text>
        </View>

        <View style={{ width: 55 }} />
      </View>

      {/* Show only confirmation modal content (no officer list) */}
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
            {t("ConfirmationCapitalRequest.CountdownInstruction1")}{" "}
            <Text className="underline font-semibold text-black">
              {formatTime(countdown)}
            </Text>{" "}
            {t("ConfirmationCapitalRequest.CountdownInstruction2")}
          </Text>
          <Text className="text-md text-center text-[#4E6393] mb-8 leading-6">
            {t("ConfirmationCapitalRequest.CountdownInstruction3")}
          </Text>

          {/* Request Information Box */}
          <View className="w-full bg-[#ADADAD1A] p-4 rounded-xl mb-8">
            <View className="flex-row justify-center items-center">
              <View className="flex-1">
                <Text className="text-xl font-medium text-black">
                  #{requestNumber}
                </Text>
              </View>

              {/* Undo Button */}
              <TouchableOpacity
                onPress={handleUndo}
                disabled={assigning}
                className={`px-10 py-3 rounded-3xl items-center ml-3 mt-auto ${assigning ? "bg-gray-400" : "bg-black"
                  }`}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-md font-semibold">
                    {t("ConfirmationCapitalRequest.UndoButton")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
                  {t("ConfirmationCapitalRequest.ConfirmLeaveButton")}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default ConfirmationCapitalRequest;
