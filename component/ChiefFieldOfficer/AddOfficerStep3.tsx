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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";

type AddOfficerStep3NavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep3"
>;

interface AddOfficerStep3Props {
  navigation: AddOfficerStep3NavigationProp;
}

const AddOfficerStep3: React.FC<AddOfficerStep3Props> = ({ navigation }) => {
  const { t } = useTranslation();

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
          break;
        case "nicBack":
          setNicBackImage(asset.uri);
          setNicBackFileName(fileName);
          break;
        case "passbook":
          setPassbookImage(asset.uri);
          setPassbookFileName(fileName);
          break;
        case "contract":
          setContractImage(asset.uri);
          setContractFileName(fileName);
          break;
      }
    }
  };

  const handleSubmit = () => {
    // Validate that all required images are uploaded
    if (!nicFrontImage || !nicBackImage || !passbookImage || !contractImage) {
      Alert.alert(
        t("AddOfficer.Incomplete"),
        t("AddOfficer.UploadAllDocuments")
      );
      return;
    }

    // Submit logic here
    Alert.alert(t("AddOfficer.Success"), t("AddOfficer.OfficerAddedSuccess"));
    navigation.navigate("ManageOfficers");
  };

  const UploadButton = ({
    title,
    type,
    image,
    fileName,
  }: {
    title: string;
    type: string;
    image: string | null;
    fileName: string | null;
  }) => (
    <View className="mb-10">
      <TouchableOpacity
        className="bg-[#D9D9D9] rounded-3xl px-6 py-4 flex-row justify-center items-center"
        onPress={() => pickImage(type)}
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
    </View>
  );

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
            onPress={() => navigation.navigate("AddOfficerStep2")}
            className="bg-[#F6F6F680] rounded-full py-4 px-3"
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
            />

            <UploadButton
              title={t("AddOfficer.NICBackImage")}
              type="nicBack"
              image={nicBackImage}
              fileName={nicBackFileName}
            />

            <UploadButton
              title={t("AddOfficer.PassbookImage")}
              type="passbook"
              image={passbookImage}
              fileName={passbookFileName}
            />

            <UploadButton
              title={t("AddOfficer.ContractImage")}
              type="contract"
              image={contractImage}
              fileName={contractFileName}
            />
          </View>

          {/* Buttons */}
          <View className="px-6 mt-8 flex-row w-full justify-between">
            <TouchableOpacity
              className="bg-[#D9D9D9] rounded-3xl px-6 py-4 w-[48%] items-center"
              onPress={() => navigation.navigate("AddOfficerStep2")}
            >
              <Text className="text-[#686868] font-semibold">
                {t("AddOfficer.GoBack")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black rounded-3xl px-6 py-4 w-[48%] items-center ml-3"
              onPress={handleSubmit}
            >
              <Text className="text-white font-semibold">
                {t("AddOfficer.Submit")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep3;
