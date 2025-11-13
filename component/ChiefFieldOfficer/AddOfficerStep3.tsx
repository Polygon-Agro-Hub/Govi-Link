import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

const AddOfficerStep3 = () => {
  const navigation = useNavigation();

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
        "Permission required",
        "Sorry, we need camera roll permissions to make this work!"
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

  const removeImage = (type: string) => {
    switch (type) {
      case "nicFront":
        setNicFrontImage(null);
        setNicFrontFileName(null);
        break;
      case "nicBack":
        setNicBackImage(null);
        setNicBackFileName(null);
        break;
      case "passbook":
        setPassbookImage(null);
        setPassbookFileName(null);
        break;
      case "contract":
        setContractImage(null);
        setContractFileName(null);
        break;
    }
  };

  const handleSubmit = () => {
    // Validate that all required images are uploaded
    if (!nicFrontImage || !nicBackImage || !passbookImage || !contractImage) {
      Alert.alert(
        "Incomplete",
        "Please upload all required documents before submitting."
      );
      return;
    }

    // Submit logic here
    Alert.alert("Success", "Officer added successfully!");
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
          <MaterialIcons name="file-upload" size={24} />
          <Text className="text-base text-[#534E4E] ml-4">{title}</Text>
        </View>
      </TouchableOpacity>

      {/* Show file name when uploaded */}
      {fileName && (
        <View className="mt-2 flex-row items-center">
          <Text className="text-sm text-black font-semibold mr-2">
            Attached:
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
          <Text className="text-2xl font-bold text-black text-center flex-1">
            Add Officer
          </Text>
          <View style={{ width: 55 }} />
        </View>

        {/* Document Upload Section */}
        <View className="px-6 mt-4">
          <UploadButton
            title="NIC Front Image"
            type="nicFront"
            image={nicFrontImage}
            fileName={nicFrontFileName}
          />

          <UploadButton
            title="NIC Back Image"
            type="nicBack"
            image={nicBackImage}
            fileName={nicBackFileName}
          />

          <UploadButton
            title="Passbook Image"
            type="passbook"
            image={passbookImage}
            fileName={passbookFileName}
          />

          <UploadButton
            title="Contract Image"
            type="contract"
            image={contractImage}
            fileName={contractFileName}
          />
        </View>

        {/* Buttons */}
        <View className="px-6 mt-8 flex-row w-full justify-between">
          <TouchableOpacity
            className="bg-[#D9D9D9] rounded-2xl px-6 py-4 w-[48%] items-center"
            onPress={() => navigation.navigate("AddOfficerStep2")}
          >
            <Text className="text-[#686868] font-semibold">Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-black rounded-2xl px-6 py-4 w-[48%] items-center ml-3"
            onPress={handleSubmit}
          >
            <Text className="text-white font-semibold">Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep3;
