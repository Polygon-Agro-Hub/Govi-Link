import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Image
} from "react-native";
import { Feather, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "../CapitalRequest/FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { environment } from "@/environment/environment";
import Checkbox from "expo-checkbox";
import { AntDesign } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import * as ImagePicker from "expo-image-picker";
import { CameraScreen } from "@/Items/CameraScreen";

type StoredFormData = {
  fields: Record<string, any>;
  files: Record<
    string,
    {
      uri: string;
      name: string;
      type: string;
    }
  >;
};

type IDProofProps = {
  navigation: any;
};

const UploadButton = ({
  title,
  onPress,
  image,
  onClear,
}: {
  title: string;
  onPress: () => void;
  image?: string | null;
  onClear?: () => void;
}) => (
  <View className="mb-8">
    <TouchableOpacity
      className="bg-[#1A1A1A] rounded-3xl px-6 py-4 flex-row justify-center items-center"
      onPress={onPress}
    >
      {image ? (
        <Feather name="rotate-ccw" size={22} color="#fff" /> 
      ) : (
        <FontAwesome6 name="camera" size={22} color="#fff" />
      )}      <Text className="text-base text-white ml-3">{title}</Text>
    </TouchableOpacity>

    {image && (
      <View className="mt-4 relative">
        <Image
          source={{ uri: image }}
          className="w-full h-48 rounded-2xl"
          resizeMode="cover"
        />

        <TouchableOpacity
          onPress={onClear}
          className="absolute top-2 right-2 bg-[#f21d1d] p-2 rounded-full"
        >
          <AntDesign name="close" size={16} color="white" />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

  
const IDProof: React.FC<IDProofProps> = ({ navigation }) => {
    const route = useRoute<RouteProp<RootStackParamList, "IDProof">>();
  const prevFormData = route.params?.formData;
    const {requestNumber } = route.params;
      let jobId = requestNumber;
  const [formData, setFormData] = useState(prevFormData);
      console.log("job id re", formData)

  const [selectedIdProof, setSelectedIdProof] = useState<string | null>(prevFormData?.idProof?.pType || null);
  const [nic, setNic] = useState<string>(prevFormData?.idProof?.pNumber || "");
  const [FrontImage, setFrontImage] = useState<string | null>(prevFormData?.idProof?.frontImg?.uri || null);
  const [BackImage, setBackImage] = useState<string | null>(prevFormData?.idProof?.backImg?.uri || null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraSide, setCameraSide] = useState<"front" | "back" | null>(null);
  const [showIdProofDropdown, setShowIdProofDropdown] = useState(false);
  const { t, i18n } = useTranslation();

useEffect(() => {
  if (FrontImage && BackImage && nic.trim().length >= 10) {
    setIsNextEnabled(true);
  } else {
    setIsNextEnabled(false);
  }
}, [FrontImage, BackImage, nic]);
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const stored = await AsyncStorage.getItem(`${requestNumber}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setFormData(parsed);

            const idProof = parsed.idProof || {};
            setSelectedIdProof(idProof.pType|| null);
            setNic(idProof.pNumber || "");
            setFrontImage(idProof.frontImg?.uri || null);
            setBackImage(idProof.backImg?.uri || null);
          }
        } catch (e) {
          console.error("Failed to load formData from storage", e);
        }
      };
      loadData();
    }, [requestNumber])
  );

const openCamera = (side: "front" | "back") => {
  setCameraSide(side);
  setShowCamera(true);
};

const handleCameraClose = async (uri: string | null) => {
  setShowCamera(false);

  if (!uri || !cameraSide) return;

  const fileName = `${cameraSide}_id_${Date.now()}.jpg`;
  const fileObj = await convertImageToFormData(uri, cameraSide);

  if (!fileObj) return;

  let updatedFormData = { ...formData };

 if (cameraSide === "front") {
  setFrontImage(uri);
  updatedFormData = {
    ...formData,
    idProof: {
      ...formData.idProof,
      frontImg: fileObj,
      pType: selectedIdProof || "",
    },
  };
} else {
  setBackImage(uri);
  updatedFormData = {
    ...formData,
    idProof: {
      ...formData.idProof,
      backImg: fileObj,
      pType: selectedIdProof || "",
    },
  };
}


  // Update formData state
  setFormData(updatedFormData);

  // Save updated formData to AsyncStorage
  try {
    await AsyncStorage.setItem(
      `${jobId}`,
      JSON.stringify(updatedFormData)
    );
    console.log("Form data saved!");
  } catch (error) {
    console.error("Failed to save form data:", error);
  }

  setCameraSide(null);

  // Enable Next button if both images are captured
  if (
    (cameraSide === "front" && updatedFormData.idProof.backImg) ||
    (cameraSide === "back" && updatedFormData.idProof.frontImg)
  ) {
    setIsNextEnabled(true);
  }
};


const handleNext = () => {
  console.log(requestNumber)
    navigation.navigate("FinanceInfo", { formData , requestNumber});

  if (!selectedIdProof) {
    setErrors(prev => ({ ...prev, nic: t("Error.ID Proof Type is required") }));
       Alert.alert(t("Error.Validation Error"),"• "+ t("Error.ID Proof Type is required"), [
      { text: t("MAIN.OK") },
    ]);  
    return;
  }

  if (!nic.trim()) {
    setErrors(prev => ({
      ...prev,
      nic: t(`Error.${selectedIdProof} is required`),
    }));
   Alert.alert(t("Error.Validation Error"),"• "+ t(`Error.${selectedIdProof} is required`), [
      { text: t("MAIN.OK") },
    ]);    
    return;
  }

  if (errors.nic) {
    Alert.alert(
      t("Validation Error"),
      errors.nic
    );
    return;
  }

  if (!formData.idProof?.frontImg || !formData.idProof?.backImg) {
    Alert.alert(
      t("Error.Validation Error"),
      t("Error.Both ID images are required"),[
       { text: t("MAIN.OK") }
    ]);
    return;
  }

  // ✅ Everything valid → go next
  // navigation.navigate("FinanceInfo", { formData , requestNumber});
};


const idProofOptions = [
  { key: "NIC Number", label: t("InspectionForm.NIC Number") },
  { key: "Driving License ID", label: t("InspectionForm.Driving License") },
];

const convertImageToFormData = async (
  imageUri: string,
  fieldName: string
) => {
  try {
    const extension = imageUri.split(".").pop() || "jpg";
    const fileName = `${fieldName}_${Date.now()}.${extension}`;

    return {
      uri: imageUri,
      name: fileName,
      type: `image/${extension === "jpg" ? "jpeg" : extension}`,
    };
  } catch (error) {
    console.error(`Error converting ${fieldName} image:`, error);
    return null;
  }
};

  const validateNicNumber = (input: string) =>
    /^[0-9]{9}V$|^[0-9]{12}$/.test(input);

const validateDrivingLicense = (input: string) =>
  /^(?:[A-Z]{1,2}[0-9]{8,9}|[0-9]{10})$/.test(input);


const handleIdNumberChange = async (input: string) => {
  if (!selectedIdProof) return;

  const rules =
    selectedIdProof === "NIC Number"
      ? { required: true, type: "NIC Number" }
      : { required: true, type: "Driving License ID" };

  let value = input.toUpperCase();

  if (selectedIdProof === "NIC Number") {
    value = value.replace(/[^0-9V]/g, "");
  } else {
    value = value.replace(/[^A-Z0-9]/g, "");
  }

  setNic(value);

  let error = "";

  if (rules.required && value.trim().length === 0) {
    error = t(`Error.${rules.type} is required`);
  } else if (
    selectedIdProof === "NIC Number" &&
    !validateNicNumber(value)
  ) {
    error = t("Error.NIC Number must be 9 digits followed by 'V' or 12 digits.");
  } else if (
    selectedIdProof === "Driving License ID" &&
    !validateDrivingLicense(value)
  ) {
    error = t("Error.Invalid Driving License number");
  }

  setErrors(prev => ({ ...prev, nic: error }));

  // ✅ Update formData
  const updatedFormData = {
    ...formData,
    idProof: {
      ...formData.idProof,
      pNumber: value,
      pType: selectedIdProof,
      frontImg: formData.idProof?.frontImg || null,
      backImg: formData.idProof?.backImg || null,
    },
  };

  setFormData(updatedFormData);

  // ✅ Save to AsyncStorage
  try {
    await AsyncStorage.setItem(
      `${jobId}`,
      JSON.stringify(updatedFormData)
    );
  } catch (e) {
    console.error("Failed to save ID number", e);
  }
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="flex-row items-center justify-center py-4 mt-2">
          <TouchableOpacity className="absolute left-4 bg-[#E0E0E080] rounded-full p-4" onPress={()=> navigation.goBack()}>
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="ID Proof" onTabPress={()=>navigation.goBack()} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
         

          <View className="relative mb-4">
            <Text className="text-sm text-[#070707] mb-2">
              <Text className="text-black">
                 {t("InspectionForm.ID Proof Type")} *
              </Text>
            </Text>
<TouchableOpacity
  onPress={() => setShowIdProofDropdown(true)}
  activeOpacity={0.8}
>
  <View className="bg-[#F6F6F6] rounded-full px-5 py-4 flex-row items-center justify-between">
    <Text
      className={`text-base ${
        selectedIdProof ? "text-black" : "text-[#838B8C]"
      }`}
    >
      {selectedIdProof
        ? t(`InspectionForm.${selectedIdProof}`)
        : t("InspectionForm.-- Select ID Proof --")}
    </Text>
    <AntDesign name="down" size={20} color="#838B8C" />
  </View>
</TouchableOpacity>


              <View className="mt-4">
                            <Text className="text-sm text-[#070707] mb-2">
              <Text className="text-black">
                 {
                  selectedIdProof==="NIC Number" ? (
                 t("InspectionForm.NIC Number")

                  ) :(t("InspectionForm.Driving License ID"))
                 } * 
              </Text>
            </Text>
                <View
                  className={`bg-[#F6F6F6] rounded-full flex-row items-center ${
                    errors.nic ? "border border-red-500" : ""
                  }`}
                >
              <TextInput
                placeholder='----'
                placeholderTextColor="#7D7D7D"
                 className="flex-1 px-2 py-4 text-base text-black ml-4"
value={nic || ""}
                onChangeText={handleIdNumberChange}

                // onBlur={handleNICBlur}
                underlineColorAndroid="transparent"
                maxLength={selectedIdProof==="NIC Number" ?12:10}
                autoCapitalize="characters"
              />
              </View>
              {errors.nic  && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.nic}
                </Text>
              )}
            </View>

          </View>
{selectedIdProof && (
  <View className="mt-6">
<UploadButton
  title={ selectedIdProof=="NIC Number" ? t("InspectionForm.NIC Front Photo") : t("InspectionForm.Driving License Front Photo") }
  onPress={() => openCamera("front")}
  image={FrontImage}
  onClear={async () => {
                  setFrontImage(null);
                    const updatedFormData = { ...formData, idProof: { ...formData.idProof, frontImg: null } };
                    setFormData(updatedFormData);
    try {
      await AsyncStorage.setItem(
        `${jobId}`,
        JSON.stringify(updatedFormData)
      );
      console.log("Front image cleared!");
    } catch (e) {
      console.error("Failed to clear front image in storage", e);
    }
    setIsNextEnabled(updatedFormData.frontImg && updatedFormData.backImg ? true : false);
  }}
/>


    <UploadButton
      title={selectedIdProof=="NIC Number" ? t("InspectionForm.NIC Back Photo") : t("InspectionForm.Driving License Back Photo") }
      onPress={() => openCamera("back")}
  image={BackImage}
  onClear={async () => {
    setBackImage(null);
                    const updatedFormData = { ...formData, idProof: { ...formData.idProof, backImg: null } };
                    setFormData(updatedFormData);

    try {
      await AsyncStorage.setItem(
        `${jobId}`,
        JSON.stringify(updatedFormData)
      );
      console.log("Back image cleared!");
    } catch (e) {
      console.error("Failed to clear back image in storage", e);
    }
    setIsNextEnabled(updatedFormData.frontImg && updatedFormData.backImg? true : false);
  }}
   />
  </View>
)}

             
        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity className="flex-1 bg-[#444444] rounded-full py-4 items-center"  onPress={() =>
    navigation.navigate("Main", {
      screen: "MainTabs",
      params: {
        screen: "CapitalRequests",
      },
    })
  }>
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Exit")}</Text>
          </TouchableOpacity>
           {isNextEnabled == false ? (
              <View className="flex-1">
          <TouchableOpacity
            className="flex-1 "
            onPress={handleNext}
          >
              <LinearGradient
                          colors={["#F35125", "#FF1D85"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          className=" rounded-full py-4 items-center"
                          style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.25,
                            shadowRadius: 5,
                            elevation: 6,
                          }}
                        >
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Next")}</Text>
            </LinearGradient>
          </TouchableOpacity>
          </View>

): (
  <View className="flex-1 bg-gray-300 rounded-full py-4 items-center">
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Next")}</Text>
          </View>
)}

        </View>
      </View>
<Modal
  visible={showIdProofDropdown}
  transparent
  animationType="none">
  <TouchableOpacity
    className="flex-1 bg-black/40 justify-center px-6"
    activeOpacity={1}
    onPress={() => setShowIdProofDropdown(false)}
  >
    <View className="bg-white rounded-2xl p-4">
      {idProofOptions.map(option => (
        <TouchableOpacity
          key={option.key}
          className="py-4 border-b border-gray-200"
 onPress={async () => {
    setSelectedIdProof(option.key);
    setShowIdProofDropdown(false);

                  setNic("");
                  setFrontImage(null);
                  setBackImage(null);
                  setErrors({});
                  const updatedFormData = { ...formData, idProof: { pType: option.key, pNumber: "", frontImg: null, backImg: null } };
                  setFormData(updatedFormData);

    // Save cleared state to AsyncStorage
    try {
      await AsyncStorage.setItem(
        `${jobId}`,
        JSON.stringify(updatedFormData)
      );
      console.log("Cleared ID proof data due to type change!");
    } catch (e) {
      console.error("Failed to clear ID proof data in storage", e);
    }

    // Disable Next button
    setIsNextEnabled(false);
  }}
        >
          <Text className="text-base text-black">
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </TouchableOpacity>
</Modal>
<Modal visible={showCamera} animationType="slide">
  <CameraScreen onClose={handleCameraClose} />
</Modal>

    </KeyboardAvoidingView>
  );
};

export default IDProof;
