import React, { useState, useEffect , useCallback} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  BackHandler,
  ActivityIndicator
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "./types";
import { AntDesign, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { environment } from "@/environment/environment";
import { CameraScreen } from "@/Items/CameraScreen";
import { Icon } from "react-native-paper";

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
  const { govilinkjobid, jobId, farmerId, farmerMobile, screenName } = route.params;
  console.log("RequestProblem Params:", govilinkjobid, jobId, screenName);
  const { t } = useTranslation();

  const [farmerFeedback, setFarmerFeedback] = useState("");
  const [advice, setAdvice] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  console.log("Captured Image:", capturedImage);
  const [countdown, setCountdown] = useState(3);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
const [existingProblem, setExistingProblem] = useState<{
  id: string;
  farmerFeedback: string;
  advice: string;
  image?: string;
} | null>(null);
const [existingProblemId, setExistingProblemId] = useState<string | null>(null);

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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.data) {
        const saved = response.data.data;
        console.log("Fetched Problem", saved);
        setFarmerFeedback(saved.farmerFeedback);
        setAdvice(saved.advice);
        setExistingProblem(saved);
        setExistingProblemId(saved.id); // Save ID for update
        if (saved.image) setCapturedImage(saved.image);
      }
    } catch (err) {
      console.error("❌ Error fetching problem:", err);
    } finally {
      setLoading(false);
    }
  };

    const handleNext = async () => {
  if (!farmerFeedback.trim() || !advice.trim()) {
    Alert.alert(
      t("Error.Sorry"),
      t("CertificateSuggestions.Both problem and solution must be filled.")
    );
    return;
  }

  const farmerFeedbackChanged = !existingProblem || farmerFeedback !== existingProblem.farmerFeedback;
  const adviceChanged = !existingProblem || advice !== existingProblem.advice;
const imageChanged =
  (capturedImage && !existingProblem?.image) ||
  (capturedImage && existingProblem?.image && capturedImage !== existingProblem.image); 


  if (!farmerFeedbackChanged && !adviceChanged && !imageChanged) {
               navigation.navigate("RequestSuggestions", { jobId, farmerId, govilinkjobid, farmerMobile  });
    return;
  }

  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert(
        t("Error.Sorry"),
        t("Main.Your login session has expired. Please log in again to continue.")
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
      // Update existing
      response = await axios.put(
        `${environment.API_BASE_URL}api/request-audit/update-problem/${existingProblemId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } else {
      // Save new
      response = await axios.post(
        `${environment.API_BASE_URL}api/request-audit/save-problem/${govilinkjobid}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
    }

    if (response.data.success) {
      Alert.alert(
        t("Success"),
        existingProblemId
          ? t("RequestProblem.Problem updated successfully.")
          : t("RequestProblem.Problem saved successfully.")
      );

      // Update existingProblem state after successful update
      setExistingProblem({
        id: existingProblemId || response.data.id,
        farmerFeedback,
        advice,
        image: capturedImage || undefined,
      });
      setExistingProblemId(existingProblemId || response.data.id);
            navigation.navigate("RequestSuggestions", { jobId, farmerId, govilinkjobid, farmerMobile  });

    } else {
      Alert.alert(
        t("Error.Sorry"),
        t("RequestProblem.Failed to save problem. Please try again.")
      );
    }
  } catch (err) {
    console.error("❌ Error saving/updating problem:", err);
    Alert.alert(t("Error.Sorry"), t("Main.somethingWentWrong"));
  } finally {
    setLoading(false);
  }
};

  const handleCameraClose = (imageUri: string | null) => {
  setShowCamera(false);
  if (imageUri) {
    console.log("Captured Image URI:", imageUri);
    setCapturedImage(imageUri);
    setShowCameraModal(true);
  }
};

useFocusEffect(
  useCallback(() => {
    const onBackPress = () => {
      // Navigate to screenName with params
      // navigation.navigate("Main", {screen:screenName})
                  navigation.navigate("Main", {
        screen: "MainTabs",
        params: {
          screen: screenName
        }})
      return true; // prevent default back behavior
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    // Cleanup
    return () => subscription.remove();
  }, [ screenName])
);

const handleFarmerFeedbackChange = (text: string) => {
  // Block leading spaces
  // if (text.length === 1 && text[0] === ' ') return;
  // // Capitalize first letter if first char is lowercase
  // if (text.length > 0 && text[0] === text[0].toLowerCase()) {
  //   text = text.charAt(0).toUpperCase() + text.slice(1);
  // }
    text = text.replace(/^\s+/, "");
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  setFarmerFeedback(text);
};

const handleAdviceChange = (text: string) => {
  // if (text.length === 1 && text[0] === ' ') return;
  // if (text.length > 0 && text[0] === text[0].toLowerCase()) {
  //   text = text.charAt(0).toUpperCase() + text.slice(1);
  // }
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
      <View className="flex-row items-center px-4 py-4 bg-white shadow-sm border-b border-[#E5E5E5]">
        <TouchableOpacity
          className="bg-[#F6F6F680] rounded-full p-2 justify-center w-10 z-20"
          // onPress={() => navigation.navigate("Main", {screen:screenName})}
                onPress={() =>             
                      navigation.navigate("Main", {
        screen: "MainTabs",
        params: {
          screen: screenName
        }
      }) }
        >
          <AntDesign name="left" size={22} color="#000" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-base font-semibold text-center">#{jobId}</Text>
        </View>
      </View>

      <View className="px-6 mt-6">
        <Text className="text-center text-[#3B424C]">
          {t(
            "CertificateSuggestions.Please mention identified problems and suggestions you made below."
          )}
        </Text>
      </View>

      {/* Body */}
      <ScrollView
        className="p-6 flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
               <Text className="text-base font-semibold mb-2 mt-1">
                      {t("RequestProblem.FarmerSay")}
                    </Text>
        <TextInput
          className="border border-[#9DB2CE] rounded-md p-2 mb-4"
          multiline
          placeholder={t("CertificateSuggestions.Type here...")}
          textAlignVertical="top"
          value={farmerFeedback}
          // onChangeText={setFarmerFeedback}
           onChangeText={handleFarmerFeedbackChange}
          style={{ minHeight: 130 }}
        />

        <Text className="text-base font-semibold mb-2">
          {t("RequestProblem.Advice Given")}
        </Text>

        <TextInput
          className="border border-[#9DB2CE] rounded-md p-2 mb-6"
          multiline
          placeholder={t("CertificateSuggestions.Type here...")}
          textAlignVertical="top"
          value={advice}
          // onChangeText={setAdvice}
            onChangeText={handleAdviceChange}
          style={{ minHeight: 130 }}
        />

        {/* Image Upload */}
        {/* <TouchableOpacity
          // onPress={handlePickImage}
          className="bg-[#1A1A1A] p-4 rounded-full w-[60%] self-center mt-4"
        >
          <Text className="text-white text-center font-semibold">
            {t("CertificateSuggestions.Photo")}
          </Text>
        </TouchableOpacity> */}
          <TouchableOpacity
            onPress={() => setShowCamera(true)}
            className="bg-black rounded-3xl w-[50%] self-center py-3 items-center justify-center flex-row space-x-4"
          >
 <FontAwesome6 name="camera" size={24} color="white" />
             <Text className="text-white font-semibold text-sm">
              {t("RequestProblem.Photo")}
            </Text>
          </TouchableOpacity>
        {capturedImage && (
          <Text className="text-center text-[#415CFF]">
            {t("RequestProblem.Image Uploaded")}
          </Text>
        )}
      </ScrollView>

      {/* Footer */}
      <View className="flex-row justify-between p-4 border-t border-gray-200 ">
        <TouchableOpacity
          className="flex-row items-center bg-[#444444] px-12 py-3 rounded-full "
          onPress={() =>   navigation.navigate("Main", {screen:screenName})}
        >
          <AntDesign name="arrow-left" size={20} color="#fff" />
          <Text className="ml-4 text-white font-semibold text-base">
            {t("CertificateQuesanory.Exit")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={loading}
          onPress={handleNext}
          className="rounded-full overflow-hidden"
        >
          <LinearGradient
            colors={["#F35125", "#FF1D85"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center px-12 py-3 rounded-full"
          >
            {loading ?
            <ActivityIndicator  size="small" color="#fff" style={{ marginRight: 8 }} />
            : 
                    <Text className="mr-4 text-white font-semibold text-base">
                {t("CertificateQuesanory.Next")}
            </Text>
            }
    
            <AntDesign name="arrow-right" size={20} color="#fff" />
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
