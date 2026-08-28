import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useRoute, useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../commons/CustomHeader";

type AddOfficerStep3NavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep3"
>;

interface AddOfficerStep3Props {
  navigation: AddOfficerStep3NavigationProp;
}

interface RouteParams {
  formData: any;
  isnewthirdstep?: boolean;
}

const AddOfficerStep3: React.FC<AddOfficerStep3Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, "AddOfficerStep3">>();
  const { formData, isnewthirdstep } = route.params as RouteParams;
  const [nicFrontImage, setNicFrontImage] = useState<string | null>(null);
  const [nicBackImage, setNicBackImage] = useState<string | null>(null);
  const [passbookImage, setPassbookImage] = useState<string | null>(null);
  const [contractImage, setContractImage] = useState<string | null>(null);
  const [nicFrontFileName, setNicFrontFileName] = useState<string | null>(null);
  const [nicBackFileName, setNicBackFileName] = useState<string | null>(null);
  const [passbookFileName, setPassbookFileName] = useState<string | null>(null);
  const [contractFileName, setContractFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useFocusEffect(
    React.useCallback(() => {
      if (isnewthirdstep === true) {
        setNicFrontImage(null);
        setNicBackImage(null);
        setPassbookImage(null);
        setContractImage(null);
        setNicFrontFileName(null);
        setNicBackFileName(null);
        setPassbookFileName(null);
        setContractFileName(null);
      }
    }, [isnewthirdstep]),
  );

  // FIXED: Updated to use new MediaType syntax
  const pickImage = async (type: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("AddOfficer.PermissionRequired"),
        t("AddOfficer.SorryWeNeedCameraRollPermissionsToMakeThisWork"),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;

      switch (type) {
        case "nicFront":
          setNicFrontImage(asset.uri);
          setNicFrontFileName(fileName);
          clearFieldError("nicFront");
          break;
        case "nicBack":
          setNicBackImage(asset.uri);
          setNicBackFileName(fileName);
          clearFieldError("nicBack");
          break;
        case "passbook":
          setPassbookImage(asset.uri);
          setPassbookFileName(fileName);
          clearFieldError("passbook");
          break;
        case "contract":
          setContractImage(asset.uri);
          setContractFileName(fileName);
          clearFieldError("contract");
          break;
      }
    }
  };

  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const clearAllFormData = () => {
    setNicFrontImage(null);
    setNicBackImage(null);
    setPassbookImage(null);
    setContractImage(null);
    setNicFrontFileName(null);
    setNicBackFileName(null);
    setPassbookFileName(null);
    setContractFileName(null);
    setErrors({});
    setLoading(false);
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    if (!nicFrontImage)
      newErrors.nicFront = t("Error.NicFrontImageIsRequired");
    if (!nicBackImage)
      newErrors.nicBack = t("Error.NicBackImageIsRequired");
    if (!passbookImage)
      newErrors.passbook = t("Error.PassbookImageIsRequired");
    if (!contractImage)
      newErrors.contract = t("Error.ContractImageIsRequired");
    setErrors(newErrors);
    return newErrors;
  };

  const convertImageToFormData = async (
    imageUri: string,
    fieldName: string,
  ) => {
    try {
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const fileName = `${fieldName}_${Date.now()}.${fileExtension}`;

      return {
        uri: imageUri,
        type: "image/jpeg",
        name: fileName,
      };
    } catch (error) {
      console.error(`Error converting ${fieldName} image:`, error);
      return null;
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateStep3();
    if (Object.keys(validationErrors).length > 0) {
      const errorMessage = Object.values(validationErrors).join("\n• ");

      Alert.alert(t("Error.ValidationError"), `• ${errorMessage}`, [
        { text: t("Main.OK") },
      ]);
      return;
    }
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t("Error.Your login session has expired"),
          [{ text: t("Main.OK") }],
        );
        navigation.navigate("Login");
        return;
      }

      const submitFormData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "assignDistrict" && Array.isArray(formData[key])) {
          submitFormData.append(key, JSON.stringify(formData[key]));
        } else if (key === "languages" && typeof formData[key] === "object") {
          submitFormData.append(key, JSON.stringify(formData[key]));
        } else if (key === "profileImage") {
          return;
        } else {
          submitFormData.append(key, formData[key]?.toString() || "");
        }
      });

      if (formData.profileImage) {
        const profileFile = await convertImageToFormData(
          formData.profileImage,
          "profile",
        );
        if (profileFile) {
          submitFormData.append("profile", profileFile as any);
        }
      }

      if (nicFrontImage) {
        const nicFrontFile = await convertImageToFormData(
          nicFrontImage,
          "frontNic",
        );
        if (nicFrontFile) {
          submitFormData.append("frontNic", nicFrontFile as any);
        }
      }

      if (nicBackImage) {
        const nicBackFile = await convertImageToFormData(
          nicBackImage,
          "backNic",
        );
        if (nicBackFile) {
          submitFormData.append("backNic", nicBackFile as any);
        }
      }

      if (passbookImage) {
        const passbookFile = await convertImageToFormData(
          passbookImage,
          "backPassbook",
        );
        if (passbookFile) {
          submitFormData.append("backPassbook", passbookFile as any);
        }
      }

      if (contractImage) {
        const contractFile = await convertImageToFormData(
          contractImage,
          "contract",
        );
        if (contractFile) {
          submitFormData.append("contract", contractFile as any);
        }
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/officer/create-field-officer`,
        submitFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        },
      );

      if (response.data.status === "success" || response.data.id) {
        Alert.alert(
          t("AddOfficer.Success"),
          t("AddOfficer.OfficerAddedSuccessfully"),
          [{ text: t("Main.OK") }],
        );

        clearAllFormData();

        navigation.reset({
          index: 0,
          routes: [{ name: "ManageOfficers" }],
        });
      } else {
        throw new Error(response.data.message || "Failed to create officer");
      }
    } catch (error: any) {
      console.error("Error submitting officer:", error);
      let errorMessage = t("Error.FailedToCreateOfficer");

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === "ECONNABORTED") {
        errorMessage = t("Error.RequestTimeout");
      }

      Alert.alert(t("Error.Error"), t("Error.SomethingWentWrongPleaseTryAgainLater"), [
        { text: t("Main.OK") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const UploadButton = ({
    title,
    type,
    image,
    fileName,
    error,
  }: {
    title: string;
    type: string;
    image: string | null;
    fileName: string | null;
    error?: string;
  }) => (
    <View className="mb-10">
      <TouchableOpacity
        className={`bg-[#D9D9D9] rounded-3xl items-center justify-center h-[50px] flex-row  ${
          error ? "border border-red-500" : ""
        }`}
        onPress={() => pickImage(type)}
        disabled={loading}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="file-upload" size={24} color="#534E4E" />
          <Text className="text-lg text-[#534E4E] ml-4">{title}</Text>
        </View>
      </TouchableOpacity>

      {fileName && (
        <View className="mt-2 flex-row items-center">
          <Text className="text-sm text-black font-semibold mr-2">
            {t("AddOfficer.Attached")}:
          </Text>
          <Text className="text-sm text-[#415CFF] font-medium w-[70%]">
            {fileName}
          </Text>
        </View>
      )}

      {error && <Text className="text-red-500 text-sm mt-1 ml-2">{error}</Text>}
    </View>
  );

  const handleGoBack = () => {
    navigation.navigate("AddOfficerStep2", {
      formData,
      isnewsecondstep: false,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <CustomHeader
        title={t("AddOfficer.AddOfficer")}
        navigation={navigation}
        showBackButton={true}
        onBackPress={handleGoBack}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          <View className="mt-4">
            <UploadButton
              title={t("AddOfficer.NICFrontImage")}
              type="nicFront"
              image={nicFrontImage}
              fileName={nicFrontFileName}
              error={errors.nicFront}
            />

            <UploadButton
              title={t("AddOfficer.NICBackImage")}
              type="nicBack"
              image={nicBackImage}
              fileName={nicBackFileName}
              error={errors.nicBack}
            />

            <UploadButton
              title={t("AddOfficer.PassbookImage")}
              type="passbook"
              image={passbookImage}
              fileName={passbookFileName}
              error={errors.passbook}
            />

            <UploadButton
              title={t("AddOfficer.ContractImage")}
              type="contract"
              image={contractImage}
              fileName={contractFileName}
              error={errors.contract}
            />
          </View>

          {/* Buttons */}
          <View className="flex-col w-full gap-4 mt-4">
            <TouchableOpacity
              className="bg-[#D9D9D9] rounded-3xl justify-center h-[50px] w-full items-center"
              onPress={handleGoBack}
              disabled={loading}
            >
              <Text className="text-[#686868] font-semibold text-lg">
                {t("AddOfficer.GoBack")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black rounded-3xl justify-center h-[50px] w-full items-center"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  {t("AddOfficer.Submit")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep3;
