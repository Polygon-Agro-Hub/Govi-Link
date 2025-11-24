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
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import { AxiosError } from "axios";
import { AntDesign } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

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
  console.log(formData);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
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
      setToken(storedToken);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/my-profile`,
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );

      setFormData(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const handleUpdate = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!token) {
        Alert.alert("Error", "You are not authenticated");
        return;
      }

      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        //    phoneNumber1: formData.phoneNumber1,
        houseNumber: formData.house,
        streetName: formData.street,
        city: formData.city,
        nic: formData.nic,
      };

      const response = await axios.put(
        `${environment.API_BASE_URL}api/auth/user-updateUser`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        // Handle specific validation errors with user-friendly messages
        const errorData = error.response.data;

        // Check if there are validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Process each error to make it user-friendly
          const userFriendlyErrors = errorData.errors.map((err: string) => {
            // Check for NIC pattern error
            if (err.includes('"NIC"') && err.includes("pattern")) {
              return "NIC must be either 12 digits or 9 digits followed by 'V'";
            }
            // Check for phone number format
            else if (err.includes('"phoneNumber')) {
              return "Phone number must be in the correct format";
            }
            // Check for email format
            else if (err.includes('"email"')) {
              return "Please enter a valid email address";
            }
            // For other fields, extract the field name from the error message
            else {
              // Extract field name from error like "\"firstName\" is required"
              const fieldMatch = err.match(/"([^"]+)"/);
              const fieldName = fieldMatch ? fieldMatch[1] : "field";

              // Make field name more readable (camelCase to Title Case with spaces)
              const readableFieldName = fieldName.replace(/([A-Z])/g, " $1");

              return err.includes("required")
                ? `${readableFieldName} is required`
                : `There's an issue with ${readableFieldName.toLowerCase()}`;
            }
          });

          // Show alert with all user-friendly errors
          Alert.alert("Validation Error", userFriendlyErrors.join("\n"), [
            { text: "OK" },
          ]);
        } else {
          // Generic error message
          Alert.alert("Error", errorData.message || "Failed to update profile");
        }
        console.error("Update error details:", errorData);
      } else {
        Alert.alert(
          "Error",
          "Failed to update profile. Please try again later."
        );
        console.error("Update error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocalizedName = () => {
    if (!formData) return "";

    let firstName = formData.firstName || "";
    let lastName = formData.lastName || "";

    switch (i18n.language) {
      case "si": // Sinhala
        firstName = formData.firstNameSinhala || formData.firstName || "";
        lastName = formData.lastNameSinhala || formData.lastName || "";
        break;
      case "ta": // Tamil
        firstName = formData.firstNameTamil || formData.firstName || "";
        lastName = formData.lastNameTamil || formData.lastName || "";
        break;
      default: // English
        firstName = formData.firstName || "";
        lastName = formData.lastName || "";
        break;
    }

    return `${firstName} ${lastName}`.trim();
  };

  // Show loading screen while data is being fetched
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        {/* <LottieView
          source={require("../assets/images/loading.json")}
          autoPlay
          loop
          style={{ width: wp(25), height: hp(12) }}
        /> */}
        <ActivityIndicator></ActivityIndicator>
        <Text className="text-[#6839CF]  font-semibold mt-4">
          Loading Profile...
        </Text>
      </View>
    );
  }

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
            <View className="">
              <View className="relative">
                <ImageBackground
                  source={require("../assets/profilebg.webp")}
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
              <View className="ml-3">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ position: "absolute", top: hp(2), left: wp(4) }}
                >
                  <AntDesign
                    name="left"
                    size={22}
                    color="black"
                    style={{
                      backgroundColor: "#F6F6F680",
                      borderRadius: 50,
                      padding: wp(3),
                    }}
                  />
                </TouchableOpacity>
              </View>

              <View
                className="bg-white rounded-t-3xl pt-6"
                style={{ marginTop: hp(25), paddingHorizontal: wp(6) }}
              >
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
                          console.log("Image load error:", e.nativeEvent.error)
                        }
                        defaultSource={require("../assets/myprofile.webp")}
                      />
                    ) : (
                      <Image
                        source={require("../assets/myprofile.webp")}
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

              <View className="bg-white px-4">
                <View className="px-5 mb-8">
                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Employee ID")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
                      {formData.empId}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.First Name")}
                    </Text>
                    {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange("firstName", text)}
                  placeholder="Enter First Name"
                /> */}
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
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
                    {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange("lastName", text)}
                  placeholder="Enter Last Name"
                /> */}
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
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
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
                      {formData.phoneNumber1}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Phone Number - 2")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
                      {formData.phoneNumber2 || "---"}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.NIC Number")}
                    </Text>
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
                      {formData.nic}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Email Address")}
                    </Text>

                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
                      {formData.email}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Building / House No")}
                    </Text>
                    {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.houseNumber}
                  onChangeText={(text) => handleInputChange("houseNumber", text)}
                  placeholder="Enter Building Number"
                /> */}
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
                      {formData.house}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-black mb-1">
                      {t("Profile.Street Name")}
                    </Text>
                    {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.streetName}
                  onChangeText={(text) => handleInputChange("streetName", text)}
                  placeholder="Enter Street Name"
                /> */}
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
                      {formData.street}
                    </Text>
                  </View>

                  <View className="mb-14">
                    <Text className="text-black mb-1">{t("Profile.City")}</Text>
                    {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.city}
                  onChangeText={(text) => handleInputChange("city", text)}
                  placeholder="Enter City"
                /> */}
                    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-3 text-[#8492A3]">
                      {formData.city}
                    </Text>
                  </View>
                </View>
                {/* <View className="">
              <TouchableOpacity  onPress={handleUpdate} >

                 <LinearGradient colors={["#F2561D", "#FF1D85"]}   
                 start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }} className="py-3   items-center  mb-[40%] mr-[6%] ml-[6%] rounded-3xl ">
                   {isSubmitting || loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                              
                                  <Text className="text-center text-white text-lg font-bold">{t("Profile.Update")}</Text>
                      )}
                              </LinearGradient>
                              </TouchableOpacity>

            
              </View> */}
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileScreen;
