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
    { name: "AddNewFarmFirst", icon: "add-circle-outline", focusedIcon: "add-circle" },
    { name: "MyCultivation", icon: "leaf-outline", focusedIcon: "leaf" },
  ];

  let currentTabName = state.routes[state.index]?.name || "Dashboard";
  if (currentTabName === "CropCalander") currentTabName = "MyCrop";
  else if (["AddFarmList", "AddNewFarmBasicDetails"].includes(currentTabName))
    currentTabName = "AddNewFarmFirst";

  // Save active tab
  useEffect(() => {
    const loadActiveTab = async () => {
      const storedTab = await AsyncStorage.getItem("activeTab");
      const currentRoute = navigation.getState().routes[navigation.getState().index].name;
      if (!storedTab || storedTab !== currentRoute) {
        setActiveTab(currentRoute);
        await AsyncStorage.setItem("activeTab", currentRoute);
      } else {
        setActiveTab(storedTab);
      }
    };
    loadActiveTab();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const updateTab = async () => {
        const currentRoute = navigation.getState().routes[navigation.getState().index].name;
        setActiveTab(currentRoute);
        await AsyncStorage.setItem("activeTab", currentRoute);
      };
      updateTab();
    }, [])
  );

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
    <View className="absolute bottom-0 flex-row justify-between items-center bg-[#21202B] py-2 px-6 rounded-t-3xl w-full">
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
            <TouchableOpacity
              onPress={() => handleTabPress(tab.name, index)}
              style={{
                backgroundColor: isFocused ? "#2AAD7A" : "transparent",
                padding: 8,
                borderRadius: 50,
                borderWidth: isFocused ? 2 : 0,
                borderColor: "#1A1920",
                shadowColor: isFocused ? "#000" : "transparent",
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: isFocused ? 5 : 0,
              }}
            >
             <Ionicons
  name={isFocused ? (tab.focusedIcon as keyof typeof Ionicons.glyphMap) : (tab.icon as keyof typeof Ionicons.glyphMap)}
  size={28}
  color={isFocused ? "#fff" : "#aaa"}
/>

            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default NavigationBar;
