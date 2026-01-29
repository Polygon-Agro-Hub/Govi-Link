import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  showLanguageSelector?: boolean;
  showLogoutButton?: boolean;
  navigation?: StackNavigationProp<any>;
  onBackPress?: () => void;
  onLanguageChange?: (language: string) => void;
  onLogoutPress?: () => void;
  dark?: boolean;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  showBackButton = true,
  showLanguageSelector = false,
  showLogoutButton = false,
  navigation,
  onBackPress,
  onLanguageChange,
  onLogoutPress,
  dark = false,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  const languages = [
    { code: "EN", name: "English" },
    { code: "SI", name: "සිංහල" },
    { code: "TA", name: "தமிழ்" },
  ];

  const getLanguageButtonText = (langCode: string): string => {
    switch (langCode) {
      case "EN":
        return "En";
      case "SI":
        return "සිං";
      case "TA":
        return "தமி";
      default:
        return "En";
    }
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setDropdownVisible(false);
    onLanguageChange?.(languageCode);
  };

  const handleLogoutPress = () => {
    if (onLogoutPress) {
      onLogoutPress();
    }
  };

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 relative ${
        dark ? "bg-black" : "bg-white"
      }`}
    >
      <View style={{ width: wp(15) }}>
        {showBackButton && navigation && (
          <TouchableOpacity
            onPress={onBackPress ?? (() => navigation.goBack())}
            className="items-start"
          >
            <Entypo
              name="chevron-left"
              size={25}
              color={dark ? "white" : "black"}
              style={{
                backgroundColor: dark ? "#1F1F1F" : "#F7FAFF",
                borderRadius: 50,
                padding: wp(2.5),
              }}
            />
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-1 items-center">
        <Text
          className={`text-xl font-semibold text-center ${
            dark ? "text-white" : "text-black"
          }`}
        >
          {title}
        </Text>
      </View>

      <View style={{ width: wp(15) }} className="items-end">
        {showLanguageSelector && (
          <View className="relative">
            <TouchableOpacity
              onPress={() => setDropdownVisible(!dropdownVisible)}
              className={`flex-row items-center px-3 py-2 rounded-md ${
                dark ? "bg-[#333]" : "bg-[#F6CA20]"
              }`}
            >
              <Text
                className={`font-medium text-sm ${
                  dark ? "text-white" : "text-black"
                }`}
              >
                {getLanguageButtonText(selectedLanguage)}
              </Text>
              <AntDesign
                name={dropdownVisible ? "up" : "down"}
                size={12}
                color={dark ? "#fff" : "#666"}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            {dropdownVisible && (
              <>
                <TouchableWithoutFeedback
                  onPress={() => setDropdownVisible(false)}
                >
                  <View className="absolute top-full right-0 left-0 bottom-[-1000px] z-10" />
                </TouchableWithoutFeedback>

                <View className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg z-20 min-w-[130px] border border-gray-200">
                  {languages.map((lang, index) => (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => handleLanguageSelect(lang.code)}
                      className={`flex-row items-center px-4 py-3 ${
                        index !== languages.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                      ${
                        selectedLanguage === lang.code
                          ? "bg-blue-50"
                          : "bg-white"
                      }
                      `}
                    >
                      <Text className="flex-1 text-base">{lang.name}</Text>
                      {selectedLanguage === lang.code && (
                        <AntDesign name="check" size={16} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {showLogoutButton && (
          <TouchableOpacity onPress={handleLogoutPress}>
            <MaterialIcons name="logout" size={24} color="#FF0000" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CustomHeader;
