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

type IDProofInfo = {
  pType: string;
  pNumber: string;
  frontImg: string | null;
  backImg: string | null;
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
  const { requestNumber,requestId } = route.params;
  let jobId = requestNumber;
  const [formData, setFormData] = useState(prevFormData);
  console.log("job id re", formData)

  const [selectedIdProof, setSelectedIdProof] = useState<string | null>(prevFormData?.inspectionidproof?.pType || null);
  const [nic, setNic] = useState<string>(prevFormData?.inspectionidproof?.pNumber || "");
  const [FrontImage, setFrontImage] = useState<string | null>(prevFormData?.inspectionidproof?.frontImg?.uri || null);
  const [BackImage, setBackImage] = useState<string | null>(prevFormData?.inspectionidproof?.backImg?.uri || null);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraSide, setCameraSide] = useState<"front" | "back" | null>(null);
  const [showIdProofDropdown, setShowIdProofDropdown] = useState(false);
  const { t, i18n } = useTranslation();
  const [isExistingData, setIsExistingData] = useState(false);
  const idProofOptions = [
  { key: "NIC Number", label: "NIC Number" },
  { key: "Driving License ID", label: "Driving License" },
];

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: any,
    isUpdate: boolean
  ): Promise<boolean> => {
    try {
      console.log(`💾 Saving to backend (${isUpdate ? 'UPDATE' : 'INSERT'}):`, tableName);
      console.log(`📝 reqId being sent:`, reqId);

      // Transform data to match backend schema
      const transformedData = transformIDProofForBackend(data);

      console.log(`📦 Original data:`, data);
      console.log(`📦 Transformed data:`, transformedData);

      // Prepare FormData for multipart upload
      const formData = new FormData();
      formData.append('reqId', reqId.toString());
      formData.append('tableName', tableName);

      // Add non-file fields
      formData.append('pType', transformedData.pType);
      formData.append('pNumber', transformedData.pNumber);

      // Add front image if exists and is local URI
      if (data.frontImg?.uri && data.frontImg.uri.startsWith('file://')) {
        formData.append('frontImg', {
          uri: data.frontImg.uri,
          name: data.frontImg.name,
          type: data.frontImg.type,
        } as any);
      } else if (data.frontImg) {
        // Image already uploaded (S3 URL)
        formData.append('frontImgUrl', data.frontImg);
      }

      // Add back image if exists and is local URI
      if (data.backImg?.uri && data.backImg.uri.startsWith('file://')) {
        formData.append('backImg', {
          uri: data.backImg.uri,
          name: data.backImg.name,
          type: data.backImg.type,
        } as any);
      } else if (data.backImg) {
        // Image already uploaded (S3 URL)
        formData.append('backImgUrl', data.backImg);
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        console.log(`✅ ${tableName} ${response.data.operation}d successfully`);

        // Update local state with S3 URLs
        if (response.data.data.frontImg) {
          setFrontImage(response.data.data.frontImg);
        }
        if (response.data.data.backImg) {
          setBackImage(response.data.data.backImg);
        }

        return true;
      } else {
        console.error(`❌ ${tableName} save failed:`, response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Error saving ${tableName}:`, error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return false;
    }
  };

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
          const saved = await AsyncStorage.getItem(`${requestNumber}`);
          console.log("📦 Loading from AsyncStorage:", saved ? "Data found" : "No data");

          if (saved) {
            const parsed = JSON.parse(saved);

            // Set flag that this is existing data (will trigger UPDATE operations)
            setIsExistingData(true);

            // Set the full formData object correctly
            setFormData(parsed);

            const idproof = parsed.inspectionidproof || {};

            setSelectedIdProof(idproof.pType || null);
            setNic(idproof.pNumber || "");

            // Handle both local URIs and S3 URLs
            setFrontImage(idproof.frontImg?.uri || idproof.frontImg || null);
            setBackImage(idproof.backImg?.uri || idproof.backImg || null);
          } else {
            // No AsyncStorage data means this is a new entry (INSERT)
            setIsExistingData(false);
            console.log("📝 New entry - will INSERT on save");
          }
        } catch (error) {
          console.error("Failed to load saved data", error);
          setIsExistingData(false);
        }
      };

      loadData();
    }, [requestNumber])
  );

  const transformIDProofForBackend = (data: any) => {
    return {
      pType: data.pType === "NIC Number" ? "NIC" : "License",
      pNumber: data.pNumber,
      frontImg: data.frontImg,
      backImg: data.backImg,
    };
  };

  const openCamera = (side: "front" | "back") => {
    setCameraSide(side);
    setShowCamera(true);
  };

 const handleCameraClose = async (uri: string | null) => {
  setShowCamera(false);

  if (!uri || !cameraSide) return;

  const fileName = `${cameraSide}_id_${Date.now()}.jpg`;
  const fileObj = {
    uri: uri,
    name: fileName,
    type: 'image/jpeg',
  };

  let updatedFormData = { ...formData };

  if (cameraSide === "front") {
    setFrontImage(uri);
    updatedFormData = {
      ...formData,
      inspectionidproof: {
        ...formData.inspectionidproof,
        frontImg: fileObj,
        pType: selectedIdProof || "",
        pNumber: nic,
      },
    };
  } else {
    setBackImage(uri);
    updatedFormData = {
      ...formData,
      inspectionidproof: {
        ...formData.inspectionidproof,
        backImg: fileObj,
        pType: selectedIdProof || "",
        pNumber: nic,
      },
    };
  }

  // Update formData state
  setFormData(updatedFormData);

  // Save updated formData to AsyncStorage
  try {
    await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
    console.log("Form data saved!");
  } catch (error) {
    console.error("Failed to save form data:", error);
  }

  setCameraSide(null);

  // Enable Next button if both images are captured
  if (
    (cameraSide === "front" && updatedFormData.inspectionidproof.backImg) ||
    (cameraSide === "back" && updatedFormData.inspectionidproof.frontImg)
  ) {
    setIsNextEnabled(true);
  }
};

  const handleNext = async () => {
  if (!selectedIdProof) {
    setErrors(prev => ({ ...prev, nic: t("Error.ID Proof Type is required") }));
    Alert.alert(t("Error.Validation Error"), "• " + t("Error.ID Proof Type is required"), [
      { text: t("MAIN.OK") },
    ]);
    return;
  }

  if (!nic.trim()) {
    setErrors(prev => ({
      ...prev,
      nic: t(`Error.${selectedIdProof} is required`),
    }));
    Alert.alert(t("Error.Validation Error"), "• " + t(`Error.${selectedIdProof} is required`), [
      { text: t("MAIN.OK") },
    ]);
    return;
  }

  if (errors.nic) {
    Alert.alert(t("Validation Error"), errors.nic);
    return;
  }

  if (!formData.inspectionidproof?.frontImg || !formData.inspectionidproof?.backImg) {
    Alert.alert(
      t("Error.Validation Error"),
      t("Error.Both ID images are required"),
      [{ text: t("MAIN.OK") }]
    );
    return;
  }

  // ✅ Validate requestId exists
  if (!route.params?.requestId) {
    console.error("❌ requestId is missing!");
    Alert.alert(
      t("Error.Error"),
      "Request ID is missing. Please go back and try again.",
      [{ text: t("MAIN.OK") }]
    );
    return;
  }

  const reqId = Number(route.params.requestId);

  console.log("🚀 Preparing to save ID Proof for requestId:", reqId);

  // ✅ Validate it's a valid number
  if (isNaN(reqId) || reqId <= 0) {
    console.error("❌ Invalid requestId:", route.params.requestId);
    Alert.alert(
      t("Error.Error"),
      "Invalid request ID. Please go back and try again.",
      [{ text: t("MAIN.OK") }]
    );
    return;
  }

  console.log("✅ Using requestId:", reqId);

  // Show loading indicator
  Alert.alert(
    t("InspectionForm.Saving"),
    t("InspectionForm.Please wait..."),
    [],
    { cancelable: false }
  );

  // Save to backend
  try {
    console.log(
      `🚀 Saving to backend (${isExistingData ? "UPDATE" : "INSERT"})`
    );

    const saved = await saveToBackend(
      reqId,
      "inspectionidproof",
      formData.inspectionidproof,
      isExistingData
    );

    if (saved) {
      console.log("✅ ID Proof saved successfully to backend");
      setIsExistingData(true);

      Alert.alert(
        t("MAIN.Success"),
        t("InspectionForm.Data saved successfully"),
        [
          {
            text: t("MAIN.OK"),
            onPress: () => {
              navigation.navigate("FinanceInfo", { 
                formData, 
                requestNumber, 
                requestId: route.params.requestId 
              });
            },
          },
        ]
      );
    } else {
      console.log("⚠️ Backend save failed, but continuing with local data");
      Alert.alert(
        t("MAIN.Warning"),
        t("InspectionForm.Could not save to server. Data saved locally."),
        [
          {
            text: t("MAIN.Continue"),
            onPress: () => {
              navigation.navigate("FinanceInfo", { 
                formData, 
                requestNumber, 
                requestId: route.params.requestId 
              });
            },
          },
        ]
      );
    }
  } catch (error) {
    console.error("Error during final save:", error);
    Alert.alert(
      t("MAIN.Warning"),
      t("InspectionForm.Could not save to server. Data saved locally."),
      [
        {
          text: t("MAIN.Continue"),
          onPress: () => {
            navigation.navigate("FinanceInfo", { 
              formData, 
              requestNumber, 
              requestId: route.params.requestId 
            });
          },
        },
      ]
    );
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
      inspectionidproof: {
        ...formData.inspectionidproof,
        pNumber: value,
        pType: selectedIdProof,
        frontImg: formData.inspectionidproof?.frontImg || null,
        backImg: formData.inspectionidproof?.backImg || null,
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
          <TouchableOpacity className="absolute left-4 bg-[#E0E0E080] rounded-full p-4" onPress={() => navigation.goBack()}>
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="ID Proof" onTabPress={() => navigation.goBack()} />

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
                  className={`text-base ${selectedIdProof ? "text-black" : "text-[#838B8C]"
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
                    selectedIdProof === "NIC Number" ? (
                      t("InspectionForm.NIC Number")

                    ) : (t("InspectionForm.Driving License ID"))
                  } *
                </Text>
              </Text>
              <View
                className={`bg-[#F6F6F6] rounded-full flex-row items-center ${errors.nic ? "border border-red-500" : ""
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
                  maxLength={selectedIdProof === "NIC Number" ? 12 : 10}
                  autoCapitalize="characters"
                />
              </View>
              {errors.nic && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.nic}
                </Text>
              )}
            </View>

          </View>
          {selectedIdProof && (
            <View className="mt-6">
              <UploadButton
                title={selectedIdProof == "NIC Number" ? t("InspectionForm.NIC Front Photo") : t("InspectionForm.Driving License Front Photo")}
                onPress={() => openCamera("front")}
                image={FrontImage}
                onClear={async () => {
                  setFrontImage(null);
                  const updatedFormData = { ...formData, inspectionidproof: { ...formData.inspectionidproof, frontImg: null } };
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
                title={selectedIdProof == "NIC Number" ? t("InspectionForm.NIC Back Photo") : t("InspectionForm.Driving License Back Photo")}
                onPress={() => openCamera("back")}
                image={BackImage}
                onClear={async () => {
                  setBackImage(null);
                  const updatedFormData = { ...formData, inspectionidproof: { ...formData.inspectionidproof, backImg: null } };
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
                  setIsNextEnabled(updatedFormData.frontImg && updatedFormData.backImg ? true : false);
                }}
              />
            </View>
          )}


        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity className="flex-1 bg-[#444444] rounded-full py-4 items-center" onPress={() =>
            navigation.navigate("Main", {
              screen: "MainTabs",
              params: {
                screen: "CapitalRequests",
              },
            })
          }>
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Exit")}</Text>
          </TouchableOpacity>
          {isNextEnabled ? (
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

          ) : (
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
                  const updatedFormData = { ...formData, inspectionidproof: { pType: option.key, pNumber: "", frontImg: null, backImg: null } };
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
