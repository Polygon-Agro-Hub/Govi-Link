import axios from "axios";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";

export const sendOTP = async (
  formattedPhonenumber: string,
  navigation: any
) => {
  try {
    const apiUrl = `${environment.API_BASE_URL}api/otp/send`;

    const body = {
      message: "Your code is {{code}}",
      destination: formattedPhonenumber,
    };

    const response = await axios.post(apiUrl, body);

    await AsyncStorage.setItem("referenceId", response.data.referenceId);

    navigation.navigate("OTPEOLDUSER", {
      mobileNumber: formattedPhonenumber,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    Alert.alert("Error", "Failed to send OTP. Please try again.");
  }
};