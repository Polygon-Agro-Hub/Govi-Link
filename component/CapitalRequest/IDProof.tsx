// IDProof.tsx - ID Proof with SQLite
import React, { useState, useEffect, useCallback } from "react";
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
  Image,
} from "react-native";
import { Feather, FontAwesome6, AntDesign } from "@expo/vector-icons";
import FormTabs from "../CapitalRequest/FormTabs";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { environment } from "@/environment/environment";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { CameraScreen } from "@/Items/CameraScreen";
import FormFooterButton from "./FormFooterButton";
import { saveIDProof, getIDProof, IDProofInfo } from  "@/database/inspectionidproof";

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
      )}
      <Text className="text-base text-white ml-3">{title}</Text>
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
  const { requestNumber, requestId } = route.params;
  const { t } = useTranslation();

  // Local state for form data
  const [formData, setFormData] = useState<IDProofInfo>({
    pType: "",
    pNumber: "",
    frontImg: null,
    backImg: null,
  });

  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraSide, setCameraSide] = useState<"front" | "back" | null>(null);
  const [showIdProofDropdown, setShowIdProofDropdown] = useState(false);
  const [isExistingData, setIsExistingData] = useState(false);

  const idProofOptions = [
    { key: "NIC Number", label: "NIC Number" },
    { key: "Driving License ID", label: "Driving License" },
  ];

  // Auto-save to SQLite whenever formData changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          await saveIDProof(Number(requestId), formData);
          console.log('💾 Auto-saved ID proof to SQLite');
        } catch (err) {
          console.error('Error auto-saving ID proof:', err);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData, requestId]);

  // Load data from SQLite when component mounts
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;

        try {
          const reqId = Number(requestId);
          const localData = await getIDProof(reqId);

          if (localData) {
            console.log('✅ Loaded ID proof from SQLite');
            setFormData(localData);
            setIsExistingData(true);
          } else {
            console.log('📝 No local ID proof data - new entry');
            setIsExistingData(false);
          }
        } catch (error) {
          console.error('Failed to load ID proof from SQLite:', error);
        }
      };

      loadData();
    }, [requestId])
  );

  // Validate form completion
  useEffect(() => {
    if (
      formData.frontImg &&
      formData.backImg &&
      formData.pNumber.trim().length >= 10 &&
      !errors.nic
    ) {
      setIsNextEnabled(true);
    } else {
      setIsNextEnabled(false);
    }
  }, [formData.frontImg, formData.backImg, formData.pNumber, errors.nic]);

  // Update form data
  const updateFormData = (updates: Partial<IDProofInfo>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle camera
  const openCamera = (side: "front" | "back") => {
    setCameraSide(side);
    setShowCamera(true);
  };

  const handleCameraClose = (uri: string | null) => {
    setShowCamera(false);

    if (!uri || !cameraSide) return;

    const updates = {
      [cameraSide === "front" ? "frontImg" : "backImg"]: uri,
    };

    updateFormData(updates);

    console.log(`✅ ${cameraSide} image URI saved`);
    setCameraSide(null);
  };

  // Clear image
  const handleClearImage = (side: "front" | "back") => {
    const updates = {
      [side === "front" ? "frontImg" : "backImg"]: null,
    };
    updateFormData(updates);
  };

  // Validate NIC
  const validateNicNumber = (input: string) =>
    /^[0-9]{9}V$|^[0-9]{12}$/.test(input);

  // Validate Driving License
  const validateDrivingLicense = (input: string) =>
    /^(?:[A-Z]{1,2}[0-9]{8,9}|[0-9]{10})$/.test(input);

  // Handle ID number change
  const handleIdNumberChange = (input: string) => {
    if (!formData.pType) return;

    const rules =
      formData.pType === "NIC Number"
        ? { required: true, type: "NIC Number" }
        : { required: true, type: "Driving License ID" };

    let value = input.toUpperCase();

    if (formData.pType === "NIC Number") {
      value = value.replace(/[^0-9V]/g, "");
    } else {
      value = value.replace(/[^A-Z0-9]/g, "");
    }

    let error = "";

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    } else if (formData.pType === "NIC Number" && !validateNicNumber(value)) {
      error = t("Error.NIC Number must be 9 digits followed by 'V' or 12 digits.");
    } else if (
      formData.pType === "Driving License ID" &&
      !validateDrivingLicense(value)
    ) {
      error = t("Error.Invalid Driving License number");
    }

    setErrors((prev) => ({ ...prev, nic: error }));
    updateFormData({ pNumber: value });
  };

  // Save to backend (only called on Next button)
  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: IDProofInfo,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      console.log(`💾 Saving to backend (${isUpdate ? "UPDATE" : "INSERT"}):`, tableName);

      const formDataPayload = new FormData();
      formDataPayload.append("reqId", reqId.toString());
      formDataPayload.append("tableName", tableName);
      formDataPayload.append("pType", data.pType === "NIC Number" ? "NIC" : "License");
      formDataPayload.append("pNumber", data.pNumber);

      // Handle front image
      if (data.frontImg) {
        if (
          data.frontImg.startsWith("file://") ||
          data.frontImg.startsWith("content://")
        ) {
          // Local image - upload as file
          formDataPayload.append("frontImg", {
            uri: data.frontImg,
            name: `front_${Date.now()}.jpg`,
            type: "image/jpeg",
          } as any);
          console.log(`📤 Uploading new front image`);
        } else if (
          data.frontImg.startsWith("http://") ||
          data.frontImg.startsWith("https://")
        ) {
          // S3 URL - send directly
          formDataPayload.append("frontImg", data.frontImg);
          console.log(`🔗 Keeping existing front image URL`);
        }
      }

      // Handle back image
      if (data.backImg) {
        if (
          data.backImg.startsWith("file://") ||
          data.backImg.startsWith("content://")
        ) {
          // Local image - upload as file
          formDataPayload.append("backImg", {
            uri: data.backImg,
            name: `back_${Date.now()}.jpg`,
            type: "image/jpeg",
          } as any);
          console.log(`📤 Uploading new back image`);
        } else if (
          data.backImg.startsWith("http://") ||
          data.backImg.startsWith("https://")
        ) {
          // S3 URL - send directly
          formDataPayload.append("backImg", data.backImg);
          console.log(`🔗 Keeping existing back image URL`);
        }
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        formDataPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        console.log(`✅ ID proof saved successfully`);

        // Update local state with S3 URLs if returned
        if (response.data.data.frontImg || response.data.data.backImg) {
          const updates: Partial<IDProofInfo> = {};
          if (response.data.data.frontImg) updates.frontImg = response.data.data.frontImg;
          if (response.data.data.backImg) updates.backImg = response.data.data.backImg;

          updateFormData(updates);
        }

        return true;
      }

      return false;
    } catch (error: any) {
      console.error(`❌ Error saving ID proof:`, error);
      return false;
    }
  };

  // Handle next button
  const handleNext = async () => {
    if (!formData.pType) {
      setErrors((prev) => ({
        ...prev,
        nic: t("Error.ID Proof Type is required"),
      }));
      Alert.alert(
        t("Error.Validation Error"),
        "• " + t("Error.ID Proof Type is required"),
        [{ text: t("Main.ok") }]
      );
      return;
    }

    if (!formData.pNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        nic: t(`Error.${formData.pType} is required`),
      }));
      Alert.alert(
        t("Error.Validation Error"),
        "• " + t(`Error.${formData.pType} is required`),
        [{ text: t("Main.ok") }]
      );
      return;
    }

    if (errors.nic) {
      Alert.alert(t("Validation Error"), errors.nic);
      return;
    }

    if (!formData.frontImg || !formData.backImg) {
      Alert.alert(
        t("Error.Validation Error"),
        t("Error.Both ID images are required"),
        [{ text: t("Main.ok") }]
      );
      return;
    }

    if (!requestId) {
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }]
      );
      return;
    }

    const reqId = Number(requestId);

    if (isNaN(reqId) || reqId <= 0) {
      Alert.alert(
        t("Error.Error"),
        "Invalid request ID. Please go back and try again.",
        [{ text: t("Main.ok") }]
      );
      return;
    }

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false }
    );

    // Save to backend
    const saved = await saveToBackend(reqId, "inspectionidproof", formData, isExistingData);

    if (saved) {
      console.log("✅ ID Proof saved successfully to backend");
      setIsExistingData(true);

      Alert.alert(
        t("Main.Success"),
        t("InspectionForm.Data saved successfully"),
        [
          {
            text: t("Main.ok"),
            onPress: () => {
              navigation.navigate("FinanceInfo", {
                requestNumber,
                requestId,
              });
            },
          },
        ]
      );
    } else {
      Alert.alert(
        t("Main.Warning"),
        t("InspectionForm.Could not save to server. Data saved locally."),
        [
          {
            text: t("Main.Continue"),
            onPress: () => {
              navigation.navigate("FinanceInfo", {
                requestNumber,
                requestId,
              });
            },
          },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <StatusBar barStyle="dark-content" />
        <FormTabs activeKey="ID Proof" navigation={navigation} />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          <View className="relative mb-4">
            <Text className="text-sm text-[#070707] mb-2">
              <Text className="text-black">{t("InspectionForm.ID Proof Type")} *</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowIdProofDropdown(true)}
              activeOpacity={0.8}
            >
              <View className="bg-[#F6F6F6] rounded-full px-5 py-4 flex-row items-center justify-between">
                <Text
                  className={`text-base ${formData.pType ? "text-black" : "text-[#838B8C]"}`}
                >
                  {formData.pType
                    ? t(`InspectionForm.${formData.pType}`)
                    : t("InspectionForm.-- Select ID Proof --")}
                </Text>
                <AntDesign name="down" size={20} color="#838B8C" />
              </View>
            </TouchableOpacity>

            <View className="mt-4">
              <Text className="text-sm text-[#070707] mb-2">
                <Text className="text-black">
                  {formData.pType === "NIC Number"
                    ? t("InspectionForm.NIC Number")
                    : t("InspectionForm.Driving License ID")}{" "}
                  *
                </Text>
              </Text>
              <View
                className={`bg-[#F6F6F6] rounded-full flex-row items-center ${
                  errors.nic ? "border border-red-500" : ""
                }`}
              >
                <TextInput
                  placeholder="----"
                  placeholderTextColor="#7D7D7D"
                  className="flex-1 px-2 py-4 text-base text-black ml-4"
                  value={formData.pNumber}
                  onChangeText={handleIdNumberChange}
                  underlineColorAndroid="transparent"
                  maxLength={formData.pType === "NIC Number" ? 12 : 10}
                  autoCapitalize="characters"
                />
              </View>
              {errors.nic && (
                <Text className="text-red-500 text-sm mt-1 ml-2">{errors.nic}</Text>
              )}
            </View>
          </View>

          {formData.pType && (
            <View className="mt-6">
              <UploadButton
                title={
                  formData.pType === "NIC Number"
                    ? t("InspectionForm.NIC Front Photo")
                    : t("InspectionForm.Driving License Front Photo")
                }
                onPress={() => openCamera("front")}
                image={formData.frontImg}
                onClear={() => handleClearImage("front")}
              />

              <UploadButton
                title={
                  formData.pType === "NIC Number"
                    ? t("InspectionForm.NIC Back Photo")
                    : t("InspectionForm.Driving License Back Photo")
                }
                onPress={() => openCamera("back")}
                image={formData.backImg}
                onClear={() => handleClearImage("back")}
              />
            </View>
          )}
        </ScrollView>

        <FormFooterButton
          exitText={t("InspectionForm.Back")}
          nextText={t("InspectionForm.Next")}
          isNextEnabled={isNextEnabled}
          onExit={() => navigation.goBack()}
          onNext={handleNext}
        />
      </View>

      {/* Modal for ID Proof selection */}
      <Modal visible={showIdProofDropdown} transparent animationType="none">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center px-6"
          activeOpacity={1}
          onPress={() => setShowIdProofDropdown(false)}
        >
          <View className="bg-white rounded-2xl p-4">
            {idProofOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                className="py-4 border-b border-gray-200"
                onPress={() => {
                  setShowIdProofDropdown(false);
                  setErrors({});

                  // Reset form when changing ID type
                  setFormData({
                    pType: option.key,
                    pNumber: "",
                    frontImg: null,
                    backImg: null,
                  });

                  console.log("Cleared ID proof data due to type change!");
                }}
              >
                <Text className="text-base text-black">{option.label}</Text>
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