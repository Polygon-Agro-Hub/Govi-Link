import React, { useEffect, useRef, useState } from "react";
import { View, Image, Text, Animated } from "react-native";
import * as Progress from "react-native-progress";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/authSlice";

const llogo = require("../assets/mainSplash.webp");

type SplashNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const Splash: React.FC = () => {
  const navigation = useNavigation<SplashNavigationProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
   const dispatch = useDispatch();
  // useEffect(() => {
  //   const listenerId = progressAnim.addListener(({ value }) => {
  //     setProgress(value);
  //   });

  //   // Animate progress from 0 → 1 smoothly in 5 seconds
  //   Animated.timing(progressAnim, {
  //     toValue: 1,
  //     duration: 5000,
  //     useNativeDriver: false,
  //   }).start(() => {
  //     // Navigate after progress completes
  //     // navigation.navigate("Main", { screen: "Dashboard" });
  //     navigation.navigate("Language" as any)
  //   });

  //   return () => {
  //     progressAnim.removeListener(listenerId);
  //   };
  // }, [navigation, progressAnim]);

  useEffect(() => {
  const listenerId = progressAnim.addListener(({ value }) => {
    setProgress(value);
  });

  const animation = Animated.timing(progressAnim, {
    toValue: 1,
    duration: 5000,
    useNativeDriver: false,
  });

  // Start animation
  animation.start(async () => {
    // After progress completes, check token
    await handleTokenCheck();
  });

  // Cleanup
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
          console.log("Token is valid, fetching user profile.");
          await fetchUserProfile(userToken);
        } else {
          console.log("Token expired, clearing storage.");
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
      const response = await axios.get(`${environment.API_BASE_URL}api/auth/user-profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success") {
        const user = response.data.data;
        console.log("User profile data:",response.data);

        // Dispatch user data to the store
    dispatch(setUser({ token, role: user.role, empId: user.empId.toString() }));

        if (response.data.data.role === "Chief Field Officer") {
          navigation.navigate("Main", { screen: "Dashboard" as any });
        } else if (response.data.data.role === "Field Officer") {
          navigation.navigate("Main", { screen: "FieldOfficerDashboard" as any });
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
    <View className="bg-white flex-1 justify-center items-center">
      <Image source={llogo} className="w-full h-48" resizeMode="contain" />
      <Text className="mt-4 text-gray-700">POWERED BY POLYGON</Text>

      <View className=" mt-6">
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
    </View>
  );
};

export default Splash;
