import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  BackHandler,
} from "react-native";
import {
  Feather,
  FontAwesome6,
  AntDesign,
  FontAwesome,
  MaterialIcons,
} from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { environment } from "@/environment/environment";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { CameraScreen } from "@/Items/CameraScreen";
import FormFooterButton from "./FormFooterButton";
import {
  saveIDProof,
  getIDProof,
  IDProofInfo,
} from "@/database/inspectionidproof";
import { updateLastScreen } from "@/database/inspectionprogress";
import { Camera } from "expo-camera";
import CameraAccess from "../permission/CameraAccess";

type IDProofProps = {
  navigation: any;
};

type IdProofTypeConfig = { label: string; requiredError: string };

const idProofTypeConfig: Record<string, IdProofTypeConfig> = {
  "NIC Number": {
    label: "InspectionForm.NICNumber",
    requiredError: "Error.NicNumberIsRequired",
  },
  "Driving License ID": {
    label: "InspectionForm.DrivingLicenseID",
    requiredError: "Error.DrivingLicenseIdIsRequired",
  },
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
      className="bg-[#1A1A1A] rounded-3xl px-6 h-[50px] flex-row justify-center items-center"
      onPress={onPress}
    >
      {image ? (
        <Feather name="rotate-ccw" size={22} color="#fff" />
      ) : (
        <FontAwesome6 name="camera" size={22} color="#fff" />
      )}
      <Text className="text-lg text-white ml-3">{title}</Text>
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
  const [showCameraAccess, setShowCameraAccess] = useState(false);
  const [pendingCameraSide, setPendingCameraSide] = useState<
    "front" | "back" | null
  >(null);

  const idProofOptions = [
    { key: "NIC Number", label: "NIC Number" },
    { key: "Driving License ID", label: "Driving License" },
  ];

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (requestId) {
        try {
          await saveIDProof(Number(requestId), formData);
        } catch (err) {
          console.error("Error auto-saving ID proof:", err);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, requestId]);

  useFocusEffect(
    useCallback(() => {
      updateLastScreen(requestId, "IDProof");
    }, [requestId]),
  );

const validateIdNumber = (pType: string, pNumber: string): string => {
  if (!pType) return "";
  if (!pNumber.trim()) {
    return t(idProofTypeConfig[pType]?.requiredError ?? "Error.SomethingWentWrongPleaseTryAgainLater");
  }
  if (pType === "NIC Number" && !validateNicNumber(pNumber)) {
    return t("Error.NicNumberMustBe9DigitsFollowedByVOr12Digits");
  }
  if (pType === "Driving License ID" && !validateDrivingLicense(pNumber)) {
    return t(
      "Error.PleaseEnterAValidLicenseIdNumber1CapitalLetter7DigitsOr1012Digits",
    );
  }
  return "";
};

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!requestId) return;
        try {
          const reqId = Number(requestId);
          const localData = await getIDProof(reqId);

          if (localData) {
            setFormData(localData);
            setIsExistingData(true);
            const nicError = validateIdNumber(
              localData.pType,
              localData.pNumber,
            );
            setErrors(nicError ? { nic: nicError } : {});
          } else {
            setIsExistingData(false);
          }
        } catch (error) {
          console.error("Failed to load ID proof from SQLite:", error);
        }
      };

      loadData();
    }, [requestId]),
  );

  useEffect(() => {
    if (
      formData.frontImg &&
      formData.backImg &&
      formData.pNumber.trim().length >= 8 &&
      !errors.nic
    ) {
      setIsNextEnabled(true);
    } else {
      setIsNextEnabled(false);
    }
  }, [formData.frontImg, formData.backImg, formData.pNumber, errors.nic]);

  const updateFormData = (updates: Partial<IDProofInfo>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const openCamera = async (side: "front" | "back") => {
    const { status } = await Camera.getCameraPermissionsAsync();
    if (status === "granted") {
      setCameraSide(side);
      setShowCamera(true);
    } else {
      setPendingCameraSide(side);
      setShowCameraAccess(true);
    }
  };

  const handleCameraPermissionGranted = () => {
    setShowCameraAccess(false);
    if (pendingCameraSide) {
      setCameraSide(pendingCameraSide);
      setShowCamera(true);
      setPendingCameraSide(null);
    }
  };

  const handleCameraClose = (uri: string | null) => {
    setShowCamera(false);
    if (!uri || !cameraSide) return;
    updateFormData({
      [cameraSide === "front" ? "frontImg" : "backImg"]: uri,
    });
    setCameraSide(null);
  };

  const handleClearImage = (side: "front" | "back") => {
    updateFormData({
      [side === "front" ? "frontImg" : "backImg"]: null,
    });
  };

  const validateNicNumber = (input: string) =>
    /^[0-9]{9}V$|^[0-9]{12}$/.test(input);

  const validateDrivingLicense = (input: string) =>
    /^(?:[A-Z][0-9]{7}|[0-9]{10,12})$/.test(input);

const handleIdNumberChange = (input: string) => {
  if (!formData.pType) return;

  const rules =
    formData.pType === "NIC Number"
      ? { required: true, type: "NIC Number" }
      : { required: true, type: "Driving License ID" };

  let value = input.toUpperCase();

  if (formData.pType === "NIC Number") {
    value = value.replace(/[^0-9V]/g, "");
    const vIndex = value.indexOf("V");
    if (vIndex !== -1) {
      value = value.slice(0, vIndex + 1);
    }
  } else {
    const hasLetter = /^[A-Z]/.test(value);
    if (hasLetter) {
      value = value.replace(/[^A-Z0-9]/g, "");
      value = value[0] + value.slice(1).replace(/[A-Z]/g, "");
    } else {
      value = value.replace(/[^0-9]/g, "");
    }
  }

  let error = "";
  if (rules.required && value.trim().length === 0) {
    error = t(idProofTypeConfig[rules.type]?.requiredError ?? "Error.SomethingWentWrongPleaseTryAgainLater");
  } else if (formData.pType === "NIC Number" && !validateNicNumber(value)) {
    error = t("Error.NicNumberMustBe9DigitsFollowedByVOr12Digits");
  } else if (
    formData.pType === "Driving License ID" &&
    !validateDrivingLicense(value)
  ) {
    error = t(
      "Error.PleaseEnterAValidLicenseIdNumber1CapitalLetter7DigitsOr1012Digits",
    );
  }

  setErrors((prev) => ({ ...prev, nic: error }));
  updateFormData({ pNumber: value });
};

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate("Main", {
        screen: "MainTabs",
        params: { screen: "CapitalRequests" },
      });
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );
    return () => subscription.remove();
  }, [navigation]);

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

      if (data.frontImg) {
        if (
          data.frontImg.startsWith("file://") ||
          data.frontImg.startsWith("content://")
        ) {
          formDataPayload.append("frontImg", {
            uri: data.frontImg,
            name: `front_${Date.now()}.jpg`,
            type: "image/jpeg",
          } as any);
        } else if (
          data.frontImg.startsWith("http://") ||
          data.frontImg.startsWith("https://")
        ) {
          formDataPayload.append("frontImg", data.frontImg);
        }
      }

      if (data.backImg) {
        if (
          data.backImg.startsWith("file://") ||
          data.backImg.startsWith("content://")
        ) {
          formDataPayload.append("backImg", {
            uri: data.backImg,
            name: `back_${Date.now()}.jpg`,
            type: "image/jpeg",
          } as any);
        } else if (
          data.backImg.startsWith("http://") ||
          data.backImg.startsWith("https://")
        ) {
          formDataPayload.append("backImg", data.backImg);
        }
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/capital-request/inspection/save`,
        formDataPayload,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data.success) {
        if (response.data.data.frontImg || response.data.data.backImg) {
          const updates: Partial<IDProofInfo> = {};
          if (response.data.data.frontImg)
            updates.frontImg = response.data.data.frontImg;
          if (response.data.data.backImg)
            updates.backImg = response.data.data.backImg;
          updateFormData(updates);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(`Error saving ID proof:`, error);
      return false;
    }
  };

  

  const handleNext = async () => {
    if (!formData.pType) {
      setErrors((prev) => ({
        ...prev,
        nic: t("Error.IdProofTypeIsRequired"),
      }));
      Alert.alert(
        t("Error.ValidationError"),
        "• " + t("Error.IdProofTypeIsRequired"),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    if (!formData.pNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        nic: t(`Error.${formData.pType} is required`),
      }));
      Alert.alert(
        t("Error.ValidationError"),
        "• " + t(`Error.${formData.pType} is required`),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    if (errors.nic) {
      Alert.alert(t("Validation Error"), errors.nic);
      return;
    }

    if (!formData.frontImg || !formData.backImg) {
      Alert.alert(
        t("Error.ValidationError"),
        t("Error.BothIdImagesAreRequired"),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    if (!requestId) {
      Alert.alert(
        t("Error.Error"),
        "Request ID is missing. Please go back and try again.",
        [{ text: t("Main.OK") }],
      );
      return;
    }

    const reqId = Number(requestId);
    if (isNaN(reqId) || reqId <= 0) {
      Alert.alert(
        t("Error.Error"),
        "Invalid request ID. Please go back and try again.",
        [{ text: t("Main.OK") }],
      );
      return;
    }

    Alert.alert(
      t("InspectionForm.Saving"),
      t("InspectionForm.PleaseWait..."),
      [],
      {
        cancelable: false,
      },
    );

    const saved = await saveToBackend(
      reqId,
      "inspectionidproof",
      formData,
      isExistingData,
    );

    if (saved) {
      setIsExistingData(true);
      Alert.alert(
        t("Main.Success"),
        t("InspectionForm.DataSavedSuccessfully"),
        [
          {
            text: t("Main.OK"),
            onPress: () => {
              navigation.navigate("FinanceInfo", { requestNumber, requestId });
            },
          },
        ],
      );
    } else {
      Alert.alert(
        t("Main.Warning"),
        t("InspectionForm.CouldNotSaveToServerDataSavedLocally"),
        [{ text: t("Main.OK") }],
      );
    }
  };
  

  const handleTabPress = (tabKey: string) => {
    const routeMap: Record<string, string> = {
      "Personal Info": "PersonalInfo",
      "ID Proof": "IDProof",
      "Finance Info": "FinanceInfo",
      "Land Info": "LandInfo",
      "Investment Info": "InvestmentInfo",
      "Cultivation Info": "CultivationInfo",
      "Cropping Systems": "CroppingSystems",
      "Profit & Risk": "ProfitRisk",
      Economical: "Economical",
      Labour: "Labour",
      "Harvest Storage": "HarvestStorage",
    };

    const route = routeMap[tabKey];
    if (route) {
      navigation.navigate(route, { requestId, requestNumber });
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
      keyboardVerticalOffset={Platform.OS === "android" ? -200 : 0}
    >
      <View className="flex-1 bg-[#F3F3F3]">
        <FormTabs
          activeKey="ID Proof"
          navigation={navigation}
          requestId={requestId}
          onTabPress={handleTabPress}
        />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />

          <View className="relative mb-4">
            <Text className="text-sm text-[#070707] mb-2">
              <Text className="text-black">
                {t("InspectionForm.IdProofType")} *
              </Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowIdProofDropdown(true)}
              activeOpacity={0.8}
            >
              <View className="bg-[#F6F6F6] rounded-3xl px-5 h-[50px] flex-row items-center justify-between">
               <Text className={`text-base ${formData.pType ? "text-black" : "text-[#838B8C]"}`}>
  {formData.pType
    ? t(idProofTypeConfig[formData.pType]?.label ?? formData.pType)
    : t("InspectionForm.SelectProofType")}
</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </View>
            </TouchableOpacity>

            {formData.pType && (
              <View className="mt-4">
                <Text className="text-sm text-[#070707] mb-2">
                  <Text className="text-black">
                    {formData.pType === "NIC Number"
                      ? t("InspectionForm.NICNumber")
                      : t("InspectionForm.DrivingLicenseID")}{" "}
                    *
                  </Text>
                </Text>
                <View
                  className={`bg-[#F6F6F6] rounded-3xl flex-row items-center ${
                    errors.nic ? "border border-red-500" : ""
                  }`}
                >
                  <TextInput
                    placeholder="----"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      paddingVertical: 0,
                      fontSize: 16,
                      height: 50,
                    }}
                    placeholderTextColor="#7F7F7F"
                    className="px-2  text-base text-black ml-4"
                    value={formData.pNumber}
                    onChangeText={handleIdNumberChange}
                    underlineColorAndroid="transparent"
                    maxLength={formData.pType === "NIC Number" ? 12 : 13}
                    autoCapitalize="characters"
                  />
                </View>
                {errors.nic && (
                  <View className="flex-row items-center mt-1 ml-2">
                    <FontAwesome
                      name="exclamation-triangle"
                      size={14}
                      color="#EF4444"
                    />
                    <Text className="text-red-500 text-sm ml-1 flex-1">
                      {errors.nic}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {formData.pType && (
            <View className="mt-6">
              <UploadButton
                title={
                  formData.pType === "NIC Number"
                    ? t("InspectionForm.NICFrontPhoto")
                    : t("InspectionForm.DrivingLicenseFrontPhoto")
                }
                onPress={() => openCamera("front")}
                image={formData.frontImg}
                onClear={() => handleClearImage("front")}
              />
              <UploadButton
                title={
                  formData.pType === "NIC Number"
                    ? t("InspectionForm.NICBackPhoto")
                    : t("InspectionForm.DrivingLicenseBackPhoto")
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
          onExit={() =>
            navigation.navigate("PersonalInfo", { requestNumber, requestId })
          }
          onNext={handleNext}
        />
      </View>

      <Modal visible={showIdProofDropdown} transparent animationType="none">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowIdProofDropdown(false)}
        >
          <View className="bg-white rounded-2xl p-4 w-10/12">
            {idProofOptions.map((option, index) => (
              <TouchableOpacity
                key={option.key}
                className={`py-4 ${index < idProofOptions.length - 1 ? "border-b border-gray-200" : ""}`}
                onPress={() => {
                  setShowIdProofDropdown(false);
                  setErrors({});
                  setFormData({
                    pType: option.key,
                    pNumber: "",
                    frontImg: null,
                    backImg: null,
                  });
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
