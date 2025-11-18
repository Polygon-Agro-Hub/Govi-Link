import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useRoute } from "@react-navigation/native";

type AddOfficerStep3NavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep3"
>;

interface AddOfficerStep3Props {
  navigation: AddOfficerStep3NavigationProp;
}

interface RouteParams {
  formData: any;
}

const AddOfficerStep3: React.FC<AddOfficerStep3Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, "AddOfficerStep3">>();
  const { formData } = route.params as RouteParams;

  // State for uploaded images
  const [nicFrontImage, setNicFrontImage] = useState<string | null>(null);
  const [nicBackImage, setNicBackImage] = useState<string | null>(null);
  const [passbookImage, setPassbookImage] = useState<string | null>(null);
  const [contractImage, setContractImage] = useState<string | null>(null);

  // State for file names
  const [nicFrontFileName, setNicFrontFileName] = useState<string | null>(null);
  const [nicBackFileName, setNicBackFileName] = useState<string | null>(null);
  const [passbookFileName, setPassbookFileName] = useState<string | null>(null);
  const [contractFileName, setContractFileName] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickImage = async (type: string) => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("AddOfficer.PermissionRequired"),
        t("AddOfficer.PermissionRequiredMessage")
      );
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    // Clear all image states
    setNicFrontImage(null);
    setNicBackImage(null);
    setPassbookImage(null);
    setContractImage(null);

    // Clear all file names
    setNicFrontFileName(null);
    setNicBackFileName(null);
    setPassbookFileName(null);
    setContractFileName(null);

    // Clear errors and loading state
    setErrors({});
    setLoading(false);
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    if (!nicFrontImage)
      newErrors.nicFront = t("Error.NIC front image is required");
    if (!nicBackImage)
      newErrors.nicBack = t("Error.NIC back image is required");
    if (!passbookImage)
      newErrors.passbook = t("Error.Passbook image is required");
    if (!contractImage)
      newErrors.contract = t("Error.Contract image is required");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertImageToFormData = async (
    imageUri: string,
    fieldName: string
  ) => {
    try {
      // Extract file extension from URI or use default
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const fileName = `${fieldName}_${Date.now()}.${fileExtension}`;

      // For React Native FormData, we need to create a file-like object
      return {
        uri: imageUri,
        type: "image/jpeg", // You can make this dynamic based on actual image type
        name: fileName,
      };
    } catch (error) {
      console.error(`Error converting ${fieldName} image:`, error);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Validate that all required images are uploaded
    if (!validateStep3()) {
      Alert.alert(
        t("AddOfficer.Incomplete"),
        t("AddOfficer.UploadAllDocuments")
      );
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t("Error.Your login session has expired")
        );
        navigation.navigate("Login");
        return;
      }

      // Prepare form data
      const submitFormData = new FormData();

      // Add all form data from previous steps
      Object.keys(formData).forEach((key) => {
        if (key === "assignDistrict" && Array.isArray(formData[key])) {
          // Convert array to string for form data
          submitFormData.append(key, JSON.stringify(formData[key]));
        } else if (key === "languages" && typeof formData[key] === "object") {
          // Convert languages object to JSON string
          submitFormData.append(key, JSON.stringify(formData[key]));
        } else if (key === "profileImage") {
          // Skip profileImage here, we'll handle it separately as a file
          return;
        } else {
          submitFormData.append(key, formData[key]?.toString() || "");
        }
      });

      // Add profile image if exists
      if (formData.profileImage) {
        const profileFile = await convertImageToFormData(
          formData.profileImage,
          "profile"
        );
        if (profileFile) {
          submitFormData.append("profile", profileFile as any);
        }
      }

      // Add other images
      if (nicFrontImage) {
        const nicFrontFile = await convertImageToFormData(
          nicFrontImage,
          "frontNic"
        );
        if (nicFrontFile) {
          submitFormData.append("frontNic", nicFrontFile as any);
        }
      }

      if (nicBackImage) {
        const nicBackFile = await convertImageToFormData(
          nicBackImage,
          "backNic"
        );
        if (nicBackFile) {
          submitFormData.append("backNic", nicBackFile as any);
        }
      }

      if (passbookImage) {
        const passbookFile = await convertImageToFormData(
          passbookImage,
          "backPassbook"
        );
        if (passbookFile) {
          submitFormData.append("backPassbook", passbookFile as any);
        }
      }

      if (contractImage) {
        const contractFile = await convertImageToFormData(
          contractImage,
          "contract"
        );
        if (contractFile) {
          submitFormData.append("contract", contractFile as any);
        }
      }

      console.log("Submitting form data with profile image...");

      // Submit to backend
      const response = await axios.post(
        `${environment.API_BASE_URL}api/officer/create-field-officer`,
        submitFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (response.data.status === "success" || response.data.id) {
        Alert.alert(
          t("AddOfficer.Success"),
          t("AddOfficer.OfficerAddedSuccess")
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

      Alert.alert(t("Error.Error"), errorMessage);
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
        className={`bg-[#D9D9D9] rounded-3xl px-6 py-4 flex-row justify-center items-center ${
          error ? "border border-red-500" : ""
        }`}
        onPress={() => pickImage(type)}
        disabled={loading}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="file-upload" size={24} color="#534E4E" />
          <Text className="text-base text-[#534E4E] ml-4">{title}</Text>
        </View>
      </TouchableOpacity>

      {/* Show file name when uploaded */}
      {fileName && (
        <View className="mt-2 flex-row items-center">
          <Text className="text-sm text-black font-semibold mr-2">
            {t("AddOfficer.Attached")}:
          </Text>
          <Text className="text-sm text-[#415CFF] font-medium">{fileName}</Text>
        </View>
      )}

      {/* Show error message */}
      {error && <Text className="text-red-500 text-sm mt-1 ml-2">{error}</Text>}
    </View>
  );

  // Add back button functionality
  const handleGoBack = () => {
    navigation.navigate("AddOfficerStep2", { formData });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={handleGoBack}
            className="bg-[#F6F6F680] rounded-full py-4 px-3"
            disabled={loading}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-black text-center flex-1">
            {t("AddOfficer.AddOfficer")}
          </Text>
          <View style={{ width: 55 }} />
        </View>

        {/* Document Upload Section */}
        <View className="p-4">
          <View className="px-6 mt-4">
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
          <View className="px-6 flex-col w-full gap-4 mt-4">
            <TouchableOpacity
              className="bg-[#D9D9D9] rounded-3xl px-6 py-4 w-full items-center"
              onPress={handleGoBack}
              disabled={loading}
            >
              <Text className="text-[#686868] font-semibold">
                {t("AddOfficer.GoBack")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black rounded-3xl px-6 py-4 w-full items-center"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold">
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
