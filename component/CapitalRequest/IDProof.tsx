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
  Image,
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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/services/store";
import {
  initializeIDProof,
  updateIDProof,
  setIDProof,
  markAsExisting,
  loadIDProofFromStorage, // ✅ Use the correct export name
  resetIDProofData,
  IDProofInfo,
} from "@/store/IDproofSlice";
import FormFooterButton from "./FormFooterButton";

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
      )}{" "}
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
  const prevFormData = route.params?.formData;
  const { requestNumber, requestId } = route.params;
  let jobId = requestNumber;
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraSide, setCameraSide] = useState<"front" | "back" | null>(null);
  const [showIdProofDropdown, setShowIdProofDropdown] = useState(false);
  const { t, i18n } = useTranslation();
  const idProofOptions = [
    { key: "NIC Number", label: "NIC Number" },
    { key: "Driving License ID", label: "Driving License" },
  ];

  const dispatch = useDispatch();

  const formData = useSelector(
    (state: RootState) =>
      state.inspectionidproof.data[requestId] || {
        pType: "",
        pNumber: "",
        frontImg: null,
        backImg: null,
      },
  );

  const isExistingData = useSelector(
    (state: RootState) =>
      state.inspectionidproof.isExisting[requestId] || false,
  );

  const saveToBackend = async (
    reqId: number,
    tableName: string,
    data: IDProofInfo,
    isUpdate: boolean,
  ): Promise<boolean> => {
    try {
      const formDataPayload = new FormData();
      formDataPayload.append("reqId", reqId.toString());
      formDataPayload.append("tableName", tableName);
      formDataPayload.append(
        "pType",
        data.pType === "NIC Number" ? "NIC" : "License",
      );
      formDataPayload.append("pNumber", data.pNumber);

      // ✅ Handle front image
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
        } else {
          // S3 URL - send as frontImg field (not frontImgUrl)
          formDataPayload.append("frontImg", data.frontImg);
        }
      }

      // ✅ Handle back image
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
        } else {
          // S3 URL - send as backImg field (not backImgUrl)
          formDataPayload.append("backImg", data.backImg);
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
        // ✅ Update Redux with S3 URLs if returned
        if (response.data.data.frontImg || response.data.data.backImg) {
          const updates: Partial<IDProofInfo> = {};
          if (response.data.data.frontImg)
            updates.frontImg = response.data.data.frontImg;
          if (response.data.data.backImg)
            updates.backImg = response.data.data.backImg;

          dispatch(updateIDProof({ requestId, updates }));

          // Update AsyncStorage
          const updatedData = { ...formData, ...updates };
          await AsyncStorage.setItem(
            `idproof_${requestId}`,
            JSON.stringify(updatedData),
          );
        }

        return true;
      }

      return false;
    } catch (error: any) {
      console.error(`❌ Error saving:`, error);
      return false;
    }
  };

  // Clear image
  const handleClearImage = async (side: "front" | "back") => {
    const updates = {
      [side === "front" ? "frontImg" : "backImg"]: null,
    };

    dispatch(updateIDProof({ requestId, updates }));

    // Update AsyncStorage
    const updatedData = { ...formData, ...updates };
    await AsyncStorage.setItem(
      `idproof_${requestId}`,
      JSON.stringify(updatedData),
    );
  };

  // ✅ Add fetchIDProofData function here
  const fetchIDProofData = async (
    reqId: number,
  ): Promise<IDProofInfo | null> => {
    try {
      console.log(`🔍 Fetching ID proof data for reqId: ${reqId}`);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/capital-request/inspection/get`,
        {
          params: {
            reqId,
            tableName: "inspectionidproof",
          },
        },
      );

      if (response.data.success && response.data.data) {
        console.log(`✅ Fetched existing ID proof data:`, response.data.data);
        const data = response.data.data;

        return {
          pType: data.pType === "NIC" ? "NIC Number" : "Driving License ID",
          pNumber: data.pNumber || "",
          frontImg: data.frontImg || null,
          backImg: data.backImg || null,
        };
      }

      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching ID proof data:`, error);
      if (error.response?.status === 404) {
        console.log(`📝 No existing record - will create new`);
      }
      return null;
    }
  };

  // Update isNextEnabled check
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

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          dispatch(initializeIDProof({ requestId }));

          if (requestId) {
            const reqId = Number(requestId);
            if (!isNaN(reqId) && reqId > 0) {
              const backendData = await fetchIDProofData(reqId);

              if (backendData) {
                console.log(`✅ Loaded ID proof data from backend`);
                dispatch(
                  setIDProof({
                    requestId,
                    data: backendData,
                    isExisting: true,
                  }),
                );

                // Also save to AsyncStorage as backup
                await AsyncStorage.setItem(
                  `idproof_${requestId}`,
                  JSON.stringify(backendData),
                );
                return;
              }
            }
          }

          // Fallback to AsyncStorage
          const stored = await AsyncStorage.getItem(`idproof_${requestId}`);
          if (stored) {
            const parsedData = JSON.parse(stored);
            dispatch(loadIDProofFromStorage({ requestId, data: parsedData }));
            console.log(`✅ Loaded ID proof from AsyncStorage`);
          } else {
            console.log("📝 No existing ID proof data - new entry");
          }
        } catch (error) {
          console.error("Failed to load ID proof data", error);
        }
      };

      loadData();
    }, [requestId, dispatch]),
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

    // ✅ Store URI directly in Redux
    const updates = {
      [cameraSide === "front" ? "frontImg" : "backImg"]: uri,
    };

    dispatch(
      updateIDProof({
        requestId,
        updates,
      }),
    );

    // ✅ Also persist to AsyncStorage
    const updatedData = { ...formData, ...updates };
    await AsyncStorage.setItem(
      `idproof_${requestId}`,
      JSON.stringify(updatedData),
    );

    console.log(`✅ ${cameraSide} image URI saved`);
    setCameraSide(null);
  };

  const handleNext = async () => {
    if (!formData.pType) {
      // ✅ Use formData.pType
      setErrors((prev) => ({
        ...prev,
        nic: t("Error.ID Proof Type is required"),
      }));
      Alert.alert(
        t("Error.Validation Error"),
        "• " + t("Error.ID Proof Type is required"),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    if (!formData.pNumber.trim()) {
      // ✅ Use formData.pNumber
      setErrors((prev) => ({
        ...prev,
        nic: t(`Error.${formData.pType} is required`),
      }));
      Alert.alert(
        t("Error.Validation Error"),
        "• " + t(`Error.${formData.pType} is required`),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    if (errors.nic) {
      Alert.alert(t("Validation Error"), errors.nic);
      return;
    }

    if (!formData?.frontImg || !formData?.backImg) {
      Alert.alert(
        t("Error.Validation Error"),
        t("Error.Both ID images are required"),
        [{ text: t("Main.ok") }],
      );
      return;
    }

    // ✅ Validate requestId exists
    if (!route.params?.requestId) {
      console.error("❌ requestId is missing!");
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.ok") }],
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
        [{ text: t("Main.ok") }],
      );
      return;
    }

    console.log("✅ Using requestId:", reqId);

    // Show loading indicator
    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.Please wait..."),
      [],
      { cancelable: false },
    );

    // Save to backend
    try {
      console.log(
        `🚀 Saving to backend (${isExistingData ? "UPDATE" : "INSERT"})`,
      );

      const saved = await saveToBackend(
        reqId,
        "inspectionidproof",
        formData,
        isExistingData,
      );

      if (saved) {
        console.log("✅ ID Proof saved successfully to backend");
        dispatch(markAsExisting({ requestId }));

        Alert.alert(
          t("Main.Success"),
          t("InspectionForm.Data saved successfully"),
          [
            {
              text: t("Main.ok"),
              onPress: () => {
                navigation.navigate("FinanceInfo", {
                  formData,
                  requestNumber,
                  requestId: route.params.requestId,
                });
              },
            },
          ],
        );
      } else {
        console.log("⚠️ Backend save failed, but continuing with local data");
        Alert.alert(
          t("Main.Warning"),
          t("InspectionForm.Could not save to server. Data saved locally."),
          [
            {
              text: t("Main.Continue"),
              onPress: () => {
                navigation.navigate("FinanceInfo", {
                  formData,
                  requestNumber,
                  requestId: route.params.requestId,
                });
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error during final save:", error);
      Alert.alert(
        t("Main.Warning"),
        t("InspectionForm.Could not save to server. Data saved locally."),
        [
          {
            text: t("Main.Continue"),
            onPress: () => {
              navigation.navigate("FinanceInfo", {
                formData,
                requestNumber,
                requestId: route.params.requestId,
              });
            },
          },
        ],
      );
    }
  };

  const validateNicNumber = (input: string) =>
    /^[0-9]{9}V$|^[0-9]{12}$/.test(input);

  const validateDrivingLicense = (input: string) =>
    /^(?:[A-Z]{1,2}[0-9]{8,9}|[0-9]{10})$/.test(input);

  const handleIdNumberChange = async (input: string) => {
    if (!formData.pType) return; // ✅ Use formData.pType instead of selectedIdProof

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
      error = t(
        "Error.NIC Number must be 9 digits followed by 'V' or 12 digits.",
      );
    } else if (
      formData.pType === "Driving License ID" &&
      !validateDrivingLicense(value)
    ) {
      error = t("Error.Invalid Driving License number");
    }

    setErrors((prev) => ({ ...prev, nic: error }));

    // ✅ Update Redux
    dispatch(
      updateIDProof({
        requestId,
        updates: { pNumber: value },
      }),
    );

    // ✅ Save to AsyncStorage
    try {
      const updatedData = { ...formData, pNumber: value };
      await AsyncStorage.setItem(
        `idproof_${requestId}`,
        JSON.stringify(updatedData),
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

        <FormTabs activeKey="ID Proof" navigation={navigation} />

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
                  value={formData.pNumber} // ✅ Use formData.pNumber
                  onChangeText={handleIdNumberChange}
                  underlineColorAndroid="transparent"
                  maxLength={formData.pType === "NIC Number" ? 12 : 10}
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

          {formData.pType && ( // ✅ Use formData.pType
            <View className="mt-6">
              <UploadButton
                title={
                  formData.pType === "NIC Number"
                    ? t("InspectionForm.NIC Front Photo")
                    : t("InspectionForm.Driving License Front Photo")
                }
                onPress={() => openCamera("front")}
                image={formData.frontImg} // ✅ Use formData.frontImg
                onClear={async () => {
                  await handleClearImage("front");
                }}
              />

              <UploadButton
                title={
                  formData.pType === "NIC Number"
                    ? t("InspectionForm.NIC Back Photo")
                    : t("InspectionForm.Driving License Back Photo")
                }
                onPress={() => openCamera("back")}
                image={formData.backImg} // ✅ Use formData.backImg
                onClear={async () => {
                  await handleClearImage("back");
                }}
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
                onPress={async () => {
                  setShowIdProofDropdown(false);
                  setErrors({});

                  const updatedFormData = {
                    pType: option.key,
                    pNumber: "",
                    frontImg: null,
                    backImg: null,
                  };

                  dispatch(
                    setIDProof({
                      requestId,
                      data: updatedFormData,
                      isExisting: false,
                    }),
                  );

                  // Save to AsyncStorage
                  try {
                    await AsyncStorage.setItem(
                      `idproof_${requestId}`,
                      JSON.stringify(updatedFormData),
                    );
                    console.log("Cleared ID proof data due to type change!");
                  } catch (e) {
                    console.error(
                      "Failed to clear ID proof data in storage",
                      e,
                    );
                  }
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
