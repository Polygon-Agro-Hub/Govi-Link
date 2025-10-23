
// import React, { useEffect, useState } from "react";
// import { View, ImageBackground, Image, Text } from "react-native";
// import * as Progress from "react-native-progress";
// import { useNavigation } from "@react-navigation/native";
// import { NativeStackNavigationProp } from "@react-navigation/native-stack";
// import { RootStackParamList } from "./types";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { environment } from "@/environment/environment";
// import axios from "axios";
// import { useDispatch } from "react-redux";

// const llogo = require("../assets/mainSplash.webp");

// type SplashNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   "Splash"
// >;

// const Splash: React.FC = () => {
//   const navigation = useNavigation<SplashNavigationProp>();
//   const [progress, setProgress] = useState(0);
 
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       // Only navigate after token check and progress bar completion
//      navigation.navigate("Main", { screen: "Dashboard" });

//     }, 5000);

//     const progressInterval = setInterval(() => {
//       setProgress((prev) => {
//         if (prev < 1) {
//           return prev + 0.1;
//         }
//         clearInterval(progressInterval);
//         return prev;
//       });
//     }, 500);

//     return () => {
//       clearTimeout(timer);
//       clearInterval(progressInterval);
//     };
//   }, [navigation]);
 
//   return (
//     <View className="bg-white" style={{ flex: 1 }}>
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <Image
//           source={llogo}
//          className="w-full h-48"
//            resizeMode="contain"
//         />
//         <Text
//          className=""
//         >
//           POWERED BY POLYGON
//         </Text>
//         <View style={{ width: "80%", height:'auto', marginTop: 20 }}>
//           <Progress.Bar
//             progress={progress}
//             width={null}
//             color="#000"
//             style={{ height: 10 }}
//           />
//         </View>
//       </View>
//     </View>
//   );
// };

// export default Splash;


import React, { useEffect, useRef, useState } from "react";
import { View, Image, Text, Animated } from "react-native";
import * as Progress from "react-native-progress";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";

const llogo = require("../assets/mainSplash.webp");

type SplashNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const Splash: React.FC = () => {
  const navigation = useNavigation<SplashNavigationProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listen for smooth updates
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgress(value);
    });

    // Animate progress from 0 → 1 smoothly in 5 seconds
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(() => {
      // Navigate after progress completes
      navigation.navigate("Main", { screen: "Dashboard" });
    });

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [navigation, progressAnim]);

  return (
    <View className="bg-white flex-1 justify-center items-center">
      <Image source={llogo} className="w-full h-48" resizeMode="contain" />
      <Text className="mt-4 text-gray-700">POWERED BY POLYGON</Text>

      <View className="w-[80%] mt-6">
        <Progress.Bar
          progress={progress}
          animated={false}
          color="#000"
          unfilledColor="#E5E5E5"
          borderWidth={0}
          height={10}
        />
      </View>
    </View>
  );
};

export default Splash;
