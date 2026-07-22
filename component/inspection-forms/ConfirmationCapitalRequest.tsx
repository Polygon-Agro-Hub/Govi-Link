import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  BackHandler,
} from "react-native";
import { RootStackParamList } from "@/component/types/types";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { RouteProp, useRoute } from "@react-navigation/native";
import { environment } from "@/environment/environment";
import axios from "axios";
import ConfirmationModal from "@/Items/ConfirmationModal";

type ConfirmationCapitalRequestNavigationProps = StackNavigationProp<
  RootStackParamList,
  "ConfirmationCapitalRequest"
>;

interface ConfirmationCapitalRequestProps {
  navigation: ConfirmationCapitalRequestNavigationProps;
}

const ConfirmationCapitalRequest: React.FC<ConfirmationCapitalRequestProps> = ({
  navigation,
}) => {
  const route =
    useRoute<RouteProp<RootStackParamList, "ConfirmationCapitalRequest">>();
  const { formData, requestNumber, requestId } = route.params;
  const { t } = useTranslation();
  const [assigning, setAssigning] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(true);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const progressAnim = useRef(new Animated.Value(100)).current;
  const countdownAnim = useRef(new Animated.Value(30)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasNavigatedRef = useRef(false);
  const isAnimationStartedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const navigateToCapitalRequests = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace("Main", {
      screen: "MainTabs",
      params: {
        screen: "CapitalRequests",
      },
    });
  }, [navigation]);

  const handleSuccessClose = useCallback(() => {
    setSuccessModalVisible(false);
    navigateToCapitalRequests();
  }, [navigateToCapitalRequests]);

  const handleAutoAssign = useCallback(() => {
    if (hasNavigatedRef.current) return;
    if (cancelledRef.current) return;

    hasNavigatedRef.current = true;
    setShowConfirmationModal(false);

    navigation.replace("Main", {
      screen: "MainTabs",
      params: {
        screen: "CapitalRequests",
      },
    });
  }, [navigation]);

  const startCountdownAnimation = useCallback(() => {
    if (isAnimationStartedRef.current) return;

    isAnimationStartedRef.current = true;

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
  }, [progressAnim, countdownAnim, handleAutoAssign]);

  useEffect(() => {
    startCountdownAnimation();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      isAnimationStartedRef.current = false;
      hasNavigatedRef.current = false;
    };
  }, [startCountdownAnimation]);

  useEffect(() => {
    const countdownListener = countdownAnim.addListener(({ value }) => {
      const roundedValue = Math.ceil(value);
      setCountdown(roundedValue > 0 ? roundedValue : 0);
    });

    return () => {
      countdownAnim.removeListener(countdownListener);
    };
  }, [countdownAnim]);

  const handleUndo = async () => {
    if (hasNavigatedRef.current) return;

    cancelledRef.current = true;
    hasNavigatedRef.current = true;

    if (animationRef.current) {
      animationRef.current.stop();
    }

    setAssigning(true);
    setAssigning(false);
    setShowConfirmationModal(false);

    Alert.alert(
      t("Main.Success"),
      t("ConfirmationCapitalRequest.UndoSuccess"),
      [
        {
          text: t("Main.OK"),
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const handleConfirmAndLeave = async () => {
    if (hasNavigatedRef.current) return;

    if (animationRef.current) {
      animationRef.current.stop();
    }

    setShowConfirmationModal(false);
    setAssigning(true);

    try {
      const response = await axios.patch(
        `${environment.API_BASE_URL}api/capital-request/confirm-leave/${requestId}`,
      );

      if (cancelledRef.current) return;

      if (response.data.success) {
        setAssigning(false);
        setSuccessModalVisible(true);
      } else {
        throw new Error(response.data.message || "Confirmation failed");
      }
    } catch (error: any) {
      if (cancelledRef.current) return;

      console.error("Error confirming request:", error);
      setAssigning(false);

      Alert.alert(
        t("Main.Sorry"),
        error.response?.data?.message ||
          t("ConfirmationCapitalRequest.ConfirmFailed"),
        [{ text: t("Main.OK") }],
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `00:${secs.toString().padStart(2, "0")}`;
  };

  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  useEffect(() => {
    const handleBackPress = () => {
      cancelledRef.current = true;
      hasNavigatedRef.current = true;

      if (animationRef.current) {
        animationRef.current.stop();
      }

      navigation.navigate("Main", {
        screen: "MainTabs",
        params: { screen: "CapitalRequests" },
      });
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    return () => subscription.remove();
  }, [navigation]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => {
            cancelledRef.current = true;
            hasNavigatedRef.current = true;

            if (animationRef.current) {
              animationRef.current.stop();
            }

            navigation.navigate("Main", {
              screen: "MainTabs",
              params: { screen: "CapitalRequests" },
            });
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
            {t("ConfirmationCapitalRequest.CountdownInstruction1")}{" "}
            <Text className="underline font-semibold text-black">
              {formatTime(countdown)}
            </Text>{" "}
            {t("ConfirmationCapitalRequest.CountdownInstruction2")}
          </Text>
          <Text className="text-md text-center text-[#4E6393] mb-8 leading-6">
            {t("ConfirmationCapitalRequest.CountdownInstruction3")}
          </Text>

          <View className="w-full bg-[#ADADAD1A] p-4 rounded-xl mb-8">
            <View className="flex-row justify-center items-center">
              <View className="flex-1">
                <Text className="text-xl font-medium text-black">
                  #{requestNumber}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleUndo}
                disabled={assigning || hasNavigatedRef.current}
                className="ml-3 mt-auto"
              >
                <LinearGradient
                  colors={
                    assigning || hasNavigatedRef.current
                      ? ["#CCCCCC", "#CCCCCC"]
                      : ["#2C2C2C", "#000000"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="px-10 py-3 rounded-3xl items-center"
                  
                  style={{
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 6,
                    overflow: "hidden"
                  }}
                >
                  {assigning ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white text-md font-semibold">
                      {t("ConfirmationCapitalRequest.UndoButton")}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-12 pb-8 mt-auto mb-14">
          <TouchableOpacity
            onPress={handleConfirmAndLeave}
            disabled={assigning || hasNavigatedRef.current}
            className="w-full"
          >
            <LinearGradient
              colors={
                assigning || hasNavigatedRef.current
                  ? ["#CCCCCC", "#CCCCCC"]
                  : ["#F2561D", "#FF1D85"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-3xl px-6 h-[50px] items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 6,
                overflow: "hidden" 
              }}
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

      <ConfirmationModal
        visible={successModalVisible}
        type="success"
        onClose={handleSuccessClose}
      />
    </View>
  );
};

export default ConfirmationCapitalRequest;
