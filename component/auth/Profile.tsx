import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import CustomHeader from "../commons/CustomHeader";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Profile"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    firstNameSinhala: "",
    firstNameTamil: "",
    lastName: "",
    lastNameSinhala: "",
    lastNameTamil: "",
    phoneNumber1: "",
    phoneNumber2: "",
    nic: "",
    email: "",
    house: "",
    street: "",
    city: "",
    empId: "",
    image: "",
  });
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      await getUserProfile();
    };
    fetchUserProfile();
  }, []);

  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/my-profile`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );

      setFormData(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getLocalizedName = () => {
    if (!formData) return "";

    let firstName = formData.firstName || "";
    let lastName = formData.lastName || "";

    switch (i18n.language) {
      case "si":
        firstName = formData.firstNameSinhala || formData.firstName || "";
        lastName = formData.lastNameSinhala || formData.lastName || "";
        break;
      case "ta":
        firstName = formData.firstNameTamil || formData.firstName || "";
        lastName = formData.lastNameTamil || formData.lastName || "";
        break;
      default:
        firstName = formData.firstName || "";
        lastName = formData.lastName || "";
        break;
    }

    return `${firstName} ${lastName}`.trim();
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={["#FF1D85", "#F2561D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View>
              <View className="relative">
                <ImageBackground
                  source={require("@/assets/images/auth/profile-bg.webp")}
                  resizeMode="cover"
                  style={{
                    width: "100%",
                    height: hp(50),
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              </View>
              <CustomHeader
                title=""
                showBackButton={true}
                navigation={navigation}
                transparent
              />

              <View className="bg-white rounded-t-3xl pt-4 mt-48">
                <View className="items-center" style={{ marginTop: -hp(12) }}>
                  <TouchableOpacity className="relative">
                    {formData.image ? (
                      <Image
                        source={{ uri: formData.image }}
                        style={{
                          width: wp(35),
                          height: wp(35),
                          borderRadius: wp(35) / 2,
                        }}
                        onError={(e) =>
                          console.log(
                            "Image load error Profile Screen:",
                            e.nativeEvent.error,
                          )
                        }
                        defaultSource={require("@/assets/images/auth/my-profile.webp")}
                      />
                    ) : (
                      <Image
                        source={require("@/assets/images/auth/my-profile.webp")}
                        style={{
                          width: wp(34),
                          height: wp(34),
                          borderRadius: wp(34) / 2,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                  <Text
                    className={`text-black 
                  ${
                    i18n.language === "si"
                      ? "text-xl"
                      : i18n.language === "ta"
                        ? "text-lg"
                        : "text-2xl"
                  } font-bold mb-8`}
                  >
                    {getLocalizedName()}
                  </Text>
                </View>
              </View>

              <View className="bg-white">
                <View className="px-6 mb-8">
                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Employee ID")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {formData.empId}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.First Name")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {i18n.language === "si"
                        ? formData.firstNameSinhala
                        : i18n.language === "ta"
                          ? formData.firstNameTamil
                          : formData.firstName}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Last Name")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {i18n.language === "si"
                        ? formData.lastNameSinhala
                        : i18n.language === "ta"
                          ? formData.lastNameTamil
                          : formData.lastName}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Phone Number - 1")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {formData.phoneNumber1}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Phone Number - 2")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {formData.phoneNumber2 || "---"}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.NIC Number")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {formData.nic}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Email Address")}
                    </Text>

                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {formData.email}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Building / House No")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {formData.house}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Street Name")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {formData.street}
                    </Text>
                  </View>

                  <View className="mb-14">
                    <Text className="text-black mb-1">{t("Profile.City")}</Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-4 py-4 text-[#8492A3] h-[50px]">
                      {formData.city}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileScreen;
