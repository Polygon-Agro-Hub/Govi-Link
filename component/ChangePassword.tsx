import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  Keyboard,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "./types";
import axios from "axios";
import { ScrollView } from "react-native-gesture-handler";
import { environment } from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import {AntDesign, MaterialCommunityIcons} from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";


type ChangePasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChangePassword"
>;

interface ChangePasswordProps {
  navigation: ChangePasswordNavigationProp;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({
  navigation,
}) => {
  const route = useRoute<RouteProp<RootStackParamList, "ChangePassword">>();
  const { passwordUpdate } = route.params;
  console.log(passwordUpdate)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureCurrent, setSecureCurrent] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
   console.log(passwordUpdate)
  const { t } = useTranslation();

  const validatePassword = () => {
    // Check if all fields are filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("Error.error"), t("Error.All fields are required"));
      return false;
    }

    // Check if new password meets format requirements
    if (newPassword.length < 8) {
      Alert.alert(t("Error.error"), t("Error.Your password must contain"));
      return false;
    }

    // Check for at least 1 uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      Alert.alert(t("Error.error"), t("Error.Your password must contain a minimum"));
      return false;
    }

    // Check for at least 1 number
    if (!/[0-9]/.test(newPassword)) {
      Alert.alert(t("Error.error"), t("Error.Your password must contain"));
      return false;
    }

    // Check for at least 1 special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
       Alert.alert(t("Error.error"), t("Error.Your password must contain a minimum"));
      return false;
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      Alert.alert(t("Error.error"), t('Error.New password and confirm password do not match'));
      return false;
    }

    return true;
  };



  const handleChangePassword = async () => {
    
        Keyboard.dismiss();
    if (!validatePassword()) {
      return;
    }

     const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
    return; 
  }

    try {
         const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `${environment.API_BASE_URL}api/auth/change-password`,
    {
      currentPassword,
      newPassword,
    }, 
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } 
  );

      Alert.alert(t("Error.Success"), t("ChangePassword.Password updated successfully"));
      navigation.navigate("Login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          Alert.alert(t("Error.error"), t("ChangePassword.Invalid current password"));
        } else {
          Alert.alert(t("Error.error"), t("ChangePassword.Failed to update password"));
        }
      } else {
        Alert.alert(t("Error.error"), t("Main.somethingWentWrong"));
      }
    }
  };

      useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If passwordUpdate is 0, prevent back navigation
        if (passwordUpdate === 0) {
          console.log("hitt")
          return true; // Prevent back navigation
          
        }
        // If passwordUpdate is 1, allow back navigation
        return false; // Allow back navigation
      };
      
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [passwordUpdate]) // Added passwordUpdate as dependency
  );


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1}}
    >
      <ScrollView
        className="flex-1 bg-white"
        style={{ paddingHorizontal: wp(6), paddingVertical: hp(2) }}
        keyboardShouldPersistTaps="handled"
      >
       {passwordUpdate === 1 && (
        <TouchableOpacity  onPress={() => navigation.goBack()} className="bg-[#f3f3f380] rounded-full p-2 justify-center w-10" >
                         <AntDesign name="left" size={24} color="#000502" />
                       </TouchableOpacity>
       )}
        <View className={`flex-row items-center justify-center ${
    passwordUpdate === 1 ? "-mt-[4%]" : "mt-[4%]"
  }  space-x-[-30%] ml-[5%]`}>
         <Image
            source={require("../assets/mainSplash.webp")}
            resizeMode="contain"
            className="w-36 h-32"
          /> 
         
        </View>

        <View className="items-center pt-[5%]">
          <Text className="font-semibold text-2xl">
            {t("ChangePassword.ChoosePassword")}
          </Text>
          <Text className="w-[53%] text-center font-light pt-3">
            {t("ChangePassword.Changepassword")}
          </Text>
        </View>

        <View className="items-center pt-[12%]">
          <Text className="font-normal pb-2 self-start ml-4">
            {t("ChangePassword.CurrentPassword")}
          </Text>
          <View className="flex-row items-center bg-[#F4F4F4] border border-[#F4F4F4] rounded-3xl w-[95%] h-[53px] mb-8 px-3">
          <TextInput
            className="flex-1 h-[40px] bg-[#F4F4F4]"
          //  placeholder={t("ChangePassword.CurrentPassword")}
            secureTextEntry={secureCurrent}
            onChangeText={setCurrentPassword}
            value={currentPassword}
          />
            <TouchableOpacity onPress={() => setSecureCurrent(!secureCurrent)}>
              <MaterialCommunityIcons
                name={secureCurrent ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#0000000"
              />
            </TouchableOpacity>
          </View>

          <Text className="font-normal pb-2 items-start self-start ml-4 ">
            {t("ChangePassword.NewPassword")}
          </Text>
             <View className="flex-row items-center bg-[#F4F4F4] border border-[#F4F4F4] rounded-3xl w-[95%] h-[53px] mb-8 px-3">
            <TextInput
              className="flex-1 h-[40px] "

              secureTextEntry={secureNew}
              // onChangeText={setNewPassword}
              value={newPassword}
                 onChangeText={(text) => {
  
      const cleanText = text.replace(/\s/g, '');
      setNewPassword(cleanText);
    }}
            />
            <TouchableOpacity onPress={() => setSecureNew(!secureNew)}>
              <MaterialCommunityIcons
                name={secureNew ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#000000"
              />
            </TouchableOpacity>
          </View>

          <Text className="font-normal pb-2 self-start ml-4">
            {t("ChangePassword.ConfirmNewPassword")}
          </Text>
           <View className="flex-row items-center bg-[#F4F4F4] border border-[#F4F4F4] rounded-3xl w-[95%] h-[53px] mb-8 px-3">
            <TextInput
              className="flex-1 h-[40px] bg-[#F4F4F4]"
          
              secureTextEntry={secureConfirm}
              // onChangeText={setConfirmPassword}
                        onChangeText={(text) => {
   
      const cleanText = text.replace(/\s/g, '');
      setConfirmPassword(cleanText);
    }}
              value={confirmPassword}
            />
            <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
              <MaterialCommunityIcons
                name={secureConfirm ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#000000"
              />
            </TouchableOpacity>
          </View>
        </View>

     
        <View className="items-center justify-center pt-7 gap-y-5 mb-20">
  <TouchableOpacity
    className="w-full p-3 rounded-full items-center justify-center"
    onPress={handleChangePassword}
  >
<LinearGradient colors={ ["#F2561D", "#FF1D85"] }
              start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                 className="w-full p-3 rounded-full items-center justify-center">
    <Text className="text-xl font-semibold text-white">
      {t("ChangePassword.Next")}
    </Text>
  </LinearGradient>
  </TouchableOpacity>
</View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;