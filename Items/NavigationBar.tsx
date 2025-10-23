import React, { useState, useEffect, useCallback } from "react";
import { Animated, TouchableOpacity, View, Keyboard } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons"; // ✅ Icon import

interface UserData {
  farmCount: number;
  membership: string;
  paymentActiveStatus: string | null;
  role: string;
}

const NavigationBar = ({ navigation, state }: { navigation: any; state: any }) => {
  const { t } = useTranslation();
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [scales] = useState(() => new Array(3).fill(0).map(() => new Animated.Value(1)));

  // ✅ Define tabs with Ionicons names
  const tabs = [
    { name: "Dashboard", icon: "home-outline", focusedIcon: "home" },
    { name: "Dashboard", icon: "add-circle-outline", focusedIcon: "add-circle" },
    { name: "Dashboard", icon: "leaf-outline", focusedIcon: "leaf" },
  ];

  let currentTabName = state.routes[state.index]?.name ;
  console.log(currentTabName)
  // if (currentTabName === "CropCalander") currentTabName = "MyCrop";
  // else if (["AddFarmList", "AddNewFarmBasicDetails"].includes(currentTabName))
  //   currentTabName = "AddNewFarmFirst";

  // Save active tab
  // useEffect(() => {
  //   const loadActiveTab = async () => {
  //     const storedTab = await AsyncStorage.getItem("activeTab");
  //     const currentRoute = navigation.getState().routes[navigation.getState().index].name;
  //     if (!storedTab || storedTab !== currentRoute) {
  //       setActiveTab(currentRoute);
  //       await AsyncStorage.setItem("activeTab", currentRoute);
  //     } else {
  //       setActiveTab(storedTab);
  //     }
  //   };
  //   loadActiveTab();
  // }, []);

  // useFocusEffect(
  //   useCallback(() => {
  //     const updateTab = async () => {
  //       const currentRoute = navigation.getState().routes[navigation.getState().index].name;
  //       setActiveTab(currentRoute);
  //       await AsyncStorage.setItem("activeTab", currentRoute);
  //     };
  //     updateTab();
  //   }, [])
  // );

  // Animation + Navigation handler
  const handleTabPress = async (tabName: string, index: number) => {
    Animated.spring(scales[index], {
      toValue: 1.1,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scales[index], {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
    navigation.navigate(tabName);
  };

  if (isKeyboardVisible) return null;

  return (
    <View className="absolute bottom-0 flex-row justify-between items-center bg-[#ffffff] py-2 px-6 rounded-t-3xl w-full shadow-md"
      style={{
                shadowColor: "#000" ,
                shadowOpacity: 2,
                shadowRadius: 4,
                elevation: 20 
              }}
    >
      {tabs.map((tab, index) => {
        const isFocused = currentTabName === tab.name;
        return (
          <Animated.View
            key={index}
            style={{
              transform: [{ scale: scales[index] }],
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 40,
            }}
          >
            <View  className={`px-8 absolute top-0  -mt-2 py-0.5 rounded-b-full bg-[#F35125] ${isFocused ? "bg-[#F35125]" : "bg-transparent"}`}/>
            <TouchableOpacity
              onPress={() => handleTabPress(tab.name, index)}

            >
             <Ionicons
  name={isFocused ? (tab.focusedIcon as keyof typeof Ionicons.glyphMap) : (tab.icon as keyof typeof Ionicons.glyphMap)}
  size={28}
  color={isFocused ? "#F35125" : "#F35125"}
/>

            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default NavigationBar;
