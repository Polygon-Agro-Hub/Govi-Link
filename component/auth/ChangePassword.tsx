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
  Dimensions,
} from "react-native";
import React, { useCallback, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import { ScrollView } from "react-native-gesture-handler";
import environment from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import CustomHeader from "../commons/CustomHeader";

type ChangePasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChangePassword"
>;

interface ChangePasswordProps {
  navigation: ChangePasswordNavigationProp;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ChangePassword: React.FC<ChangePasswordProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "ChangePassword">>();
  const { passwordUpdate } = route.params;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureCurrent, setSecureCurrent] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const { t } = useTranslation();

  const validatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("Error.Sorry"), t("Error.AllFieldsAreRequired"), [
        { text: t("Main.OK") },
      ]);
      return false;
    }

    if (newPassword === currentPassword) {
      Alert.alert(
        t("Error.Sorry"),
        t("Error.NewPasswordMustBeDifferentFromCurrentPassword"),
        [{ text: t("Main.OK") }],
      );
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        t("Error.Sorry"),
        t(
          "Error.YourPasswordMustContainAMinimumOf8CharactersWith1UppercaseNumbersSpecialCharacters",
        ),
        [{ text: t("Main.OK") }],
      );
      return false;
    }

    if (!/[A-Z]/.test(newPassword)) {
      Alert.alert(
        t("Error.Sorry"),
        t(
          "Error.YourPasswordMustContainAMinimumOf8CharactersWith1UppercaseNumbersSpecialCharacters",
        ),
        [{ text: t("Main.OK") }],
      );
      return false;
    }

    if (!/[0-9]/.test(newPassword)) {
      Alert.alert(
        t("Error.Sorry"),
        t(
          "Error.YourPasswordMustContainAMinimumOf8CharactersWith1UppercaseNumbersSpecialCharacters",
        ),
        [{ text: t("Main.OK") }],
      );
      return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      Alert.alert(
        t("Error.Sorry"),
        t(
          "Error.YourPasswordMustContainAMinimumOf8CharactersWith1UppercaseNumbersSpecialCharacters",
        ),
        [{ text: t("Main.OK") }],
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        t("Error.Sorry"),
        t("Error.NewPasswordAndConfirmPasswordDoNotMatch"),
        [{ text: t("Main.OK") }],
      );
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
      const token = await AsyncStorage.getItem("token");
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
        },
      );

      Alert.alert(
        t("Main.Success"),
        t("ChangePassword.PasswordUpdatedSuccessfully"),
        [{ text: t("Main.OK") }],
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      navigation.navigate("Login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          Alert.alert(
            t("Error.Sorry"),
            t("ChangePassword.InvalidCurrentPassword"),
            [{ text: t("Main.OK") }],
          );
        } else {
          Alert.alert(
            t("Error.Sorry"),
            t("ChangePassword.FailedToUpdatePassword"),
            [{ text: t("Main.OK") }],
          );
        }
      } else {
        Alert.alert(
          t("Error.Sorry"),
          t("Main.SomethingWentWrongPleaseTryAgainLater"),
          [{ text: t("Main.OK") }],
        );
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (passwordUpdate === 0) {
          return true;
        }

        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [passwordUpdate]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <CustomHeader
        title={""}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "white" }}
      >
        <ScrollView
          className="flex-1 bg-white"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ paddingHorizontal: wp(6), backgroundColor: "#FFFFFF" }}
          contentContainerStyle={{
            paddingBottom: hp(10),
            flexGrow: 1,
          }}
        >
          <View
            className={`flex-row items-center justify-center gap-[-30%] ml-[5%]`}
          >
            <Image
              source={require("@/assets/images/public/logo.webp")}
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
            <Text className="font-normal pb-2 self-start">
              {t("ChangePassword.CurrentPassword")}
            </Text>
            <View className="flex-row items-center bg-[#F4F4F4] border border-[#F4F4F4] rounded-3xl mb-8 px-3">
              <TextInput
                className="flex-1 h-[50px] bg-[#F4F4F4]"
                secureTextEntry={secureCurrent}
                onChangeText={setCurrentPassword}
                value={currentPassword}
              />
              <TouchableOpacity
                onPress={() => setSecureCurrent(!secureCurrent)}
              >
                <MaterialCommunityIcons
                  name={secureCurrent ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#000000"
                />
              </TouchableOpacity>
            </View>

            <Text className="font-normal pb-2 items-start self-start">
              {t("ChangePassword.NewPassword")}
            </Text>
            <View className="flex-row items-center bg-[#F4F4F4] border border-[#F4F4F4] rounded-3xl mb-8 px-3">
              <TextInput
                className="flex-1 h-[50px] "
                secureTextEntry={secureNew}
                value={newPassword}
                onChangeText={(text) => {
                  const cleanText = text.replace(/\s/g, "");
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

            <Text className="font-normal pb-2 self-start">
              {t("ChangePassword.ConfirmNewPassword")}
            </Text>
            <View className="flex-row items-center bg-[#F4F4F4] border border-[#F4F4F4] rounded-3xl mb-8 px-3">
              <TextInput
                className="flex-1 h-[50px] bg-[#F4F4F4]"
                secureTextEntry={secureConfirm}
                onChangeText={(text) => {
                  const cleanText = text.replace(/\s/g, "");
                  setConfirmPassword(cleanText);
                }}
                value={confirmPassword}
              />
              <TouchableOpacity
                onPress={() => setSecureConfirm(!secureConfirm)}
              >
                <MaterialCommunityIcons
                  name={secureConfirm ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#000000"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              width: "100%",
              alignItems: "center",
              marginTop: 28,
              marginBottom: 40,
            }}
          >
            <View
              style={{
                width: "100%",
                borderRadius: 999,
                shadowColor: "#FF1D85",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 12,
                elevation: 12,
              }}
            >
              <TouchableOpacity
                onPress={handleChangePassword}
                activeOpacity={0.8}
                style={{ width: "100%", borderRadius: 999 }}
              >
                <LinearGradient
                  colors={["#F2561D", "#FF1D85"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 999,
                    paddingVertical: 16,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: SCREEN_HEIGHT > 900 ? 20 : 18,
                      fontWeight: "700",
                    }}
                  >
                    {t("ChangePassword.Next")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChangePassword;
