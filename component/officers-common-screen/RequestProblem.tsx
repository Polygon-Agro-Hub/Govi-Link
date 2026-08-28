import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { AntDesign, FontAwesome6, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import environment from "@/environment/environment";
import { CameraScreen } from "@/Items/CameraScreen";
import CustomHeader from "../commons/CustomHeader";

type RequestProblemNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RequestProblem"
>;
type RequestProblemRouteProp = RouteProp<RootStackParamList, "RequestProblem">;

interface RequestProblemProps {
  navigation: RequestProblemNavigationProp;
}

const RequestProblem: React.FC<RequestProblemProps> = ({ navigation }) => {
  const route = useRoute<RequestProblemRouteProp>();
  const { govilinkjobid, jobId, farmerId, farmerMobile, screenName } =
    route.params;
  const { t } = useTranslation();
  const [farmerFeedback, setFarmerFeedback] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [existingProblem, setExistingProblem] = useState<{
    id: string;
    farmerFeedback: string;
    advice: string;
    image?: string;
  } | null>(null);
  const [existingProblemId, setExistingProblemId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (capturedImage) {
      setIsButtonEnabled(false);
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsButtonEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [capturedImage]);

  useEffect(() => {
    fetchProblem();
  }, []);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${environment.API_BASE_URL}api/request-audit/get-problem/${govilinkjobid}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success && response.data.data) {
        const saved = response.data.data;

        setFarmerFeedback(saved.farmerFeedback);
        setAdvice(saved.advice);
        setExistingProblem(saved);
        setExistingProblemId(saved.id);
        if (saved.image) setCapturedImage(saved.image);
      }
    } catch (err) {
      console.error(" Error fetching problem:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!farmerFeedback.trim() || !advice.trim()) {
      Alert.alert(
        t("Error.Sorry"),
        t("CertificateSuggestions.BothProblemAndSolutionMustBeFilled"),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    const farmerFeedbackChanged =
      !existingProblem || farmerFeedback !== existingProblem.farmerFeedback;
    const adviceChanged = !existingProblem || advice !== existingProblem.advice;
    const imageChanged =
      (capturedImage && !existingProblem?.image) ||
      (capturedImage &&
        existingProblem?.image &&
        capturedImage !== existingProblem.image);

    if (!farmerFeedbackChanged && !adviceChanged && !imageChanged) {
      navigation.navigate("RequestSuggestions", {
        jobId,
        farmerId,
        govilinkjobid,
        farmerMobile,
      });
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t("Main.YourLoginSessionHasExpiredPleaseLogInAgainToContinue"),
          [{ text: t("Main.OK") }],
        );
        return;
      }

      const formData = new FormData();
      formData.append("farmerFeedback", farmerFeedback);
      formData.append("advice", advice);

      if (imageChanged && capturedImage) {
        const filename = capturedImage.split("/").pop() || "upload.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append("image", {
          uri: capturedImage,
          name: filename,
          type,
        } as any);
      }

      let response;

      if (existingProblemId) {
        response = await axios.put(
          `${environment.API_BASE_URL}api/request-audit/update-problem/${existingProblemId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );
      } else {
        response = await axios.post(
          `${environment.API_BASE_URL}api/request-audit/save-problem/${govilinkjobid}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      if (response.data.success) {
        Alert.alert(
          t("Success"),
          existingProblemId
            ? t("RequestProblem.ProblemUpdatedSuccessfully")
            : t("RequestProblem.ProblemSavedSuccessfully"),
        );

        setExistingProblem({
          id: existingProblemId || response.data.id,
          farmerFeedback,
          advice,
          image: capturedImage || undefined,
        });
        setExistingProblemId(existingProblemId || response.data.id);
        navigation.navigate("RequestSuggestions", {
          jobId,
          farmerId,
          govilinkjobid,
          farmerMobile,
        });
      } else {
        Alert.alert(
          t("Error.Sorry"),
          t("RequestProblem.FailedToSaveProblemPleaseTryAgain"),
          [{ text: t("Main.OK") }],
        );
      }
    } catch (err) {
      console.error(" Error saving/updating problem:", err);
      Alert.alert(
        t("Error.Sorry"),
        t("Main.SomethingWentWrongPleaseTryAgainLater"),
        [{ text: t("Main.OK") }],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCameraClose = (imageUri: string | null) => {
    setShowCamera(false);
    if (imageUri) {
      setCapturedImage(imageUri);
      setShowCameraModal(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Main", {
          screen: "MainTabs",
          params: {
            screen: screenName,
          },
        });
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [screenName]),
  );

  const handleFarmerFeedbackChange = (text: string) => {
    text = text.replace(/^\s+/, "");
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    setFarmerFeedback(text);
  };

  const handleAdviceChange = (text: string) => {
    text = text.replace(/^\s+/, "");
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    setAdvice(text);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <CustomHeader
        title={`#${jobId}`}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() =>
          navigation.navigate("Main", {
            screen: "MainTabs",
            params: {
              screen: screenName,
            },
          })
        }
      />

      <View className="px-6 mt-6">
        <Text className="text-center text-[#3B424C]">
          {t(
            "CertificateSuggestions.PleaseMentionIdentifiedProblemsAndSuggestionsYouMadeBelow",
          )}
        </Text>
      </View>

      <ScrollView
        className="p-6 flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="text-base font-semibold mb-2 mt-1">
          {t("RequestProblem.FarmersSay")}
        </Text>
        <TextInput
          className="border border-[#9DB2CE] rounded-lg p-2 mb-4"
          multiline
          placeholder={t("CertificateSuggestions.TypeHere...")}
          textAlignVertical="top"
          value={farmerFeedback}
          onChangeText={handleFarmerFeedbackChange}
          style={{ minHeight: 130 }}
        />

        <Text className="text-base font-semibold mb-2">
          {t("RequestProblem.AdviceGiven")}
        </Text>

        <TextInput
          className="border border-[#9DB2CE] rounded-lg p-2 mb-6"
          multiline
          placeholder={t("CertificateSuggestions.TypeHere...")}
          textAlignVertical="top"
          value={advice}
          onChangeText={handleAdviceChange}
          style={{ minHeight: 130 }}
        />
        <TouchableOpacity
          onPress={() => setShowCamera(true)}
          className="bg-black rounded-3xl w-2/3 self-center h-[50px] items-center justify-center flex-row gap-4"
        >
          <FontAwesome6 name="camera" size={24} color="white" />
          <Text className="text-white font-semibold text-sm">
            {t("RequestProblem.Photo")}
          </Text>
        </TouchableOpacity>
        {capturedImage && (
          <Text className="text-center text-[#415CFF] mt-3">
            {t("RequestProblem.ImageUploaded")}
          </Text>
        )}
      </ScrollView>

      <View
        className="flex-row px-6 py-3 gap-4 bg-white border-t border-gray-200 w-full"
        style={{
          paddingBottom: Platform.OS === "android" ? 8 : 12,
        }}
      >
        <TouchableOpacity
          className="flex-1 bg-[#444444] rounded-full h-[50px] flex-row items-center justify-center"
          activeOpacity={0.8}
          style={{
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 6,
          }}
          onPress={() =>
            navigation.navigate("Main", {
              screen: "MainTabs",
              params: {
                screen: screenName,
              },
            })
          }
        >
          <Ionicons name="arrow-back" size={25} color="#fff" />
          <Text className="text-white text-base font-semibold ml-2">
            {t("CertificateQuesanory.Exit")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={loading}
          className="flex-1"
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#F35125", "#FF1D85"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 9999,
              height: 50,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 5,
              elevation: 6,
              overflow: "hidden",
            }}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginRight: 8 }}
              />
            ) : (
              <Text className="text-white text-base font-semibold mr-2">
                {t("CertificateQuesanory.Next")}
              </Text>
            )}
            <Ionicons name="arrow-forward" size={25} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showCamera} animationType="slide" transparent={false}>
        <CameraScreen
          onClose={(imageUri) => {
            handleCameraClose(imageUri);
          }}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default RequestProblem;
