import React, { useContext, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity,   BackHandler} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { LanguageContext } from "@/context/LanguageContext";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';

const lg = require("../assets/language.webp");
type LanuageScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Lanuage"
>;

interface LanuageProps {
  navigation: LanuageScreenNavigationProp;
}

interface NewsItem {
  title: string;
  description: string;
}

const Lanuage: React.FC<LanuageProps> = ({ navigation }) => {
  const { changeLanguage } = useContext(LanguageContext);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  console.log("selle l", selectedLanguage)

  const [news, setNews] = useState<NewsItem[]>([]);
  const screenWidth = wp(100); 

  useEffect(() => {
    const checkLanguagePreference = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem("user_language");
                  console.log("st l",storedLanguage)

              if (storedLanguage) {
          setSelectedLanguage(storedLanguage);
        }
      } catch (error) {
        console.error("Failed to retrieve language preference:", error);
      }
    };

    checkLanguagePreference();
  }, []); 

  const handleLanguageSelect = async (language: string) => {
    try {
      await AsyncStorage.setItem("user_language", language);
      changeLanguage(language);
      navigation.navigate("Login" as any); 
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  };

  const dynamicStyles = {
    imageHeight: screenWidth < 400 ? wp(35) : wp(38), 
    fontSize: screenWidth < 400 ? wp(4) : wp(5),
    paddingTopForLngBtns: screenWidth < 400 ? wp(5) : wp(0),
  };

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        return true; 
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [])
  );

    const languages = [
    { code: "en", label: "ENGLISH" },
    { code: "si", label: "සිංහල" },
    { code: "ta", label: "தமிழ்" },
  ];

 return (
  <View className="flex-1 bg-white">
    <View className="flex-1 justify-center items-center px-5">
      {/* Image */}
      <Image
        source={lg}
        resizeMode="contain"
        className="w-full"
        style={{ height: dynamicStyles.imageHeight }}
      />

      {/* Text Section */}
      <View className="mt-10 items-center">
        <Text className="text-3xl font-semibold">Language</Text>
        <Text className="text-lg pt-2 font-extralight">
          மொழியைத் தேர்ந்தெடுக்கவும்
        </Text>
        <Text className="text-lg pt-2 font-extralight">
          කරුණාකර භාෂාව තෝරන්න
        </Text>
      </View>

         <View className="w-72 mt-16">
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              activeOpacity={0.8}
              onPress={() => handleLanguageSelect(lang.code)}
              className="w-full rounded-3xl mb-5 overflow-hidden"
            >
              <LinearGradient
                colors={
                  selectedLanguage === lang.code
                    ? ["#F2561D", "#FF1D85"] // Selected
                    : ["#000000", "#000000"] // Unselected
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-5 items-center justify-center"
              >
                <Text className="text-white text-base font-semibold tracking-wide">
                  {lang.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
    </View>
  </View>
);

};

export default Lanuage;
