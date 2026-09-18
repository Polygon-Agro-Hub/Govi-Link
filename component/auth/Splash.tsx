import React, { useEffect, useRef, useState } from "react";
import { View, Image, Text, Animated, StyleSheet } from "react-native";
import * as Progress from "react-native-progress";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/authSlice";

const logo = require("@/assets/images/public/logo.webp");

type SplashNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const Splash: React.FC = () => {
  const navigation = useNavigation<SplashNavigationProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgress(value);
    });

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    });

    animation.start(async () => {
      await handleTokenCheck();
    });

    return () => {
      progressAnim.removeListener(listenerId);
      animation.stop();
    };
  }, [navigation, progressAnim]);

  const handleTokenCheck = async () => {
    try {
      const expirationTime = await AsyncStorage.getItem("tokenExpirationTime");
      const userToken = await AsyncStorage.getItem("token");

      if (expirationTime && userToken) {
        const currentTime = new Date();
        const tokenExpiry = new Date(expirationTime);

        if (currentTime < tokenExpiry) {
          await fetchUserProfile(userToken);
        } else {
          await AsyncStorage.multiRemove([
            "token",
            "tokenStoredTime",
            "tokenExpirationTime",
          ]);
          navigation.navigate("Login");
        }
      } else {
        navigation.navigate("Login");
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
      navigation.navigate("Login");
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user-profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.status === "success") {
        const user = response.data.data;

        // passwordUpdated = 0 -> force back to Login
        if (!user.passwordUpdated) {
          navigation.navigate("Login");
          return;
        }

        dispatch(
          setUser({ token, role: user.role, empId: user.empId.toString() }),
        );

        if (user.role === "Chief Field Officer") {
          navigation.navigate("Main", { screen: "Dashboard" as any });
        } else if (user.role === "Field Officer") {
          navigation.navigate("Main", {
            screen: "FieldOfficerDashboard" as any,
          });
        } else {
          navigation.navigate("Login");
        }
      } else {
        navigation.navigate("Login");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      navigation.navigate("Login");
    }
  };

  return (
    <View className="bg-white flex-1 justify-center items-center relative">
      <Image source={logo} className="w-full h-48" resizeMode="contain" />

      <View className="mt-6">
        <Progress.Bar
          progress={progress}
          animated={false}
          color="#000"
          unfilledColor="#E5E5E5"
          borderWidth={0}
          height={10}
          width={200}
        />
      </View>

      <View style={styles.poweredByContainer}>
        <Text style={styles.poweredByText}>POWERED BY POLYGON</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  poweredByContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  poweredByText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "400",
    letterSpacing: 0.3,
    opacity: 0.6,
  },
});

export default Splash;
