import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, BackHandler } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute , useFocusEffect} from "@react-navigation/native";
import { RootStackParamList } from "./types";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { CameraScreen } from "@/Items/CameraScreen";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
type CertificateQuesanoryNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CertificateQuesanory"
>;

type GapCertificationRouteProp = RouteProp<
  RootStackParamList,
  "CertificateQuesanory"
>;

interface CertificateQuesanoryProps {
  navigation: CertificateQuesanoryNavigationProp;
}
interface Question {
  id: number;
  qEnglish: string;
  qSinhala: string;
  qTamil: string;
  type: string;
  officerTickResult: number;
  officerUploadImage: string | null;
}
interface CertificateData {
  logo: string;
  createdAt:Date;
  srtName: string
  slavequestionnaireId:number
}

const LoadingSkeleton = () => {
  const rectWidth = wp("38%");
  const gapBetweenRects = wp("8%");
  const totalWidth = 2 * rectWidth + gapBetweenRects;
  const startX = (wp("100%") - totalWidth) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingVertical: hp("2%") }}>
      <ContentLoader
        speed={1}
        width="100%"
        height={hp("100%")}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
                  <Rect x={wp("18%")} y={hp("2%")} rx="10" ry="10" width={wp("20%")} height={hp("10%")} />
   <Rect x={wp('50%')} y={hp('5%')} rx="4" ry="4" width={wp('30%')} height={hp('1.5%')} />
      <Rect x={wp('50%')} y={hp('8%')} rx="4" ry="4" width={wp('30%')} height={hp('1.5%')} />

          <Rect x={wp("7%")} y={hp("15%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />
                    <Rect x={wp("7%")} y={hp("28%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />
                                        <Rect x={wp("7%")} y={hp("41%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />
                                        <Rect x={wp("7%")} y={hp("54%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />
                                        <Rect x={wp("7%")} y={hp("67%")} rx="10" ry="10" width={wp("86%")} height={hp("10%")} />

      </ContentLoader>
    </View>
  );
};

const CertificateQuesanory: React.FC<CertificateQuesanoryProps> = ({ navigation }) => {
  const route = useRoute<GapCertificationRouteProp>();
  const { jobId, certificationpaymentId,farmerMobile, clusterId, farmId, isClusterAudit,auditId, screenName} = route.params; 
  const {t,  i18n} = useTranslation();
    const [questions, setQuestions] = useState<Question[]>([]);
const [CertificateData, setCertificateData] = useState< CertificateData | null>(null);
const [loadingQuestionId, setLoadingQuestionId] = useState<number | null>(null);
const [loaingCertificate, setloaingCertificate] = useState(true)
const allChecked = questions.length > 0 && questions.every(q => q.officerTickResult === 1 || q.officerUploadImage != null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [showCameraScreen, setShowCameraScreen] = useState(false);
const [capturedImage, setCapturedImage] = useState<string | null>(null);
const [countdown, setCountdown] = useState(3);
const [isButtonEnabled, setIsButtonEnabled] = useState(false);

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
    console.log("Farmer ID from QR:", certificationpaymentId, farmId,clusterId);
   const fetchQuestions = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setloaingCertificate(true)
        const response = await axios.get(
          `${environment.API_BASE_URL}api/officer/individual-audits-questions/${certificationpaymentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
                      params: {
             clusterId: clusterId ?? null,// your clusterId variable
            farmId: farmId,       // your farmId variable
          },
          }
        );
             setQuestions(response.data.data.questions);
         
                setCertificateData(response.data.data.certificate);
                setloaingCertificate(false)
               
      }
    } catch (error) {
      console.error("Failed to certificate questio:", error);
    } finally {
          setloaingCertificate(false)
    }
  };
  fetchQuestions()
  }, [certificationpaymentId]);

    const getLocalizedQuestion = (q: Question) => {
    switch (i18n.language) {
      case "si":
        return q.qSinhala;
      case "ta":
        return q.qTamil;
      default:
        return q.qEnglish;
    }
  };

// const handleCheck = async (q: Question) => {
//   console.log("Toggle check for question:", q.id);

//   try {
//     if (q.type === "Photo Proof") {
//         setSelectedQuestion(q);
//       setShowCameraModal(true);
//       return;
//     }

//     const token = await AsyncStorage.getItem("token");
//     if (!token) {
//       Alert.alert("Error", "Authentication token missing. Please log in again.");
//       return;
//     }
// setLoadingQuestionId(q.id);
//     // Toggle value: if it's 1, set to 0; if 0, set to 1
//     const newTickResult = q.tickResult === 1 ? 0 : 1;

//     const response = await axios.put(
//       `${environment.API_BASE_URL}api/officer/check-question/${q.id}`,
//       { tickResult: newTickResult }, // send new state
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     if (response.data?.success || response.status === 200) {
//       setQuestions((prev) =>
//         prev.map((item) =>
//           item.id === q.id ? { ...item, tickResult: newTickResult } : item
//         )
//       );
//       console.log("✅ Question tick toggled:", q.id, "→", newTickResult);
//     } else {
//       Alert.alert("Error", response.data?.message || "Failed to update question status.");
//     }
//   } catch (err: any) {
//     console.error("❌ Error updating tickResult:", err);
//     Alert.alert("Error", "Something went wrong while updating question.");
//   }finally{
//     setLoadingQuestionId(null);
//   }
// };
const handleCheck = async (q: Question) => {
  console.log("Toggle check for question:", q.id);

  try {
    const token = await AsyncStorage.getItem("token");
      if (!token) {
           Alert.alert(
          t("Error.Sorry"),
          t("Error.Your login session has expired. Please log in again to continue."),
            [{ text: t("MAIN.OK") }]
        );
        return;
      }

    if (q.type === "Photo Proof") {
      if (q.officerUploadImage) {
        Alert.alert(
          t("CertificateQuesanory.Confirm Untick"),
  t("CertificateQuesanory.This will remove the uploaded photo for this task. Are you sure you want to continue?"),
          [
            { text: t("CertificateQuesanory.Cancel"), style: "cancel" },
            {
              text: t("CertificateQuesanory.OK"),
              onPress: async () => {
                setLoadingQuestionId(q.id);
                await axios.delete(
                  `${environment.API_BASE_URL}api/officer/remove-photo-proof/${q.id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setQuestions((prev) =>
                  prev.map((item) =>
                    item.id === q.id ? { ...item, officerTickResult: 0, officerUploadImage: null } : item
                  )
                );
                setLoadingQuestionId(null);
              },
            },
          ]
        );
        return;
      }
      setSelectedQuestion(q);
      setShowCameraModal(true);
      return;
    }

    setLoadingQuestionId(q.id);
    const newTickResult = q.officerTickResult === 1 ? 0 : 1;
    if (newTickResult === 0) {
  Alert.alert(
    t("CertificateQuesanory.Confirm Untick"),
    t("CertificateQuesanory.Are you sure you want to mark this task as incomplete?"),
    [
      { text: t("CertificateQuesanory.Cancel"), style: "cancel" },
      {
        text: t("CertificateQuesanory.OK"),
        onPress: async () => {
          setLoadingQuestionId(q.id)
          await updateTickResult(q, newTickResult, token);
        },
      },
    ]
  );
  setLoadingQuestionId(null);
  return;
}

await updateTickResult(q, newTickResult, token);

    // const response = await axios.put(
    //   `${environment.API_BASE_URL}api/officer/check-question/${q.id}`,
    //   { officerTickResult: newTickResult },
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );

    // if (response.data?.success || response.status === 200) {
    //   setQuestions((prev) =>
    //     prev.map((item) =>
    //       item.id === q.id ? { ...item, officerTickResult: newTickResult } : item
    //     )
    //   );
    // }

  } catch (err) {
    console.error("❌ Error updating tickResult:", err);
    Alert.alert(t("Error.error"), t("CertificateQuesanory.Something went wrong while updating question."),[{ text: t("MAIN.OK") }]);
  } finally {
    setLoadingQuestionId(null);
  }
};

const updateTickResult = async (q: Question, newValue: number, token: string) => {
  try {
    const response = await axios.put(
      `${environment.API_BASE_URL}api/officer/check-question/${q.id}`,
      { officerTickResult: newValue },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data?.success || response.status === 200) {
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, officerTickResult: newValue } : item
        )
      );

      // Success alert only when ticking
      if (newValue === 1) {
        Alert.alert(
          t("CertificateQuesanory.Success"),
          t("CertificateQuesanory.Task complete successfully!"),
          [{ text: t("MAIN.OK") }]
        );
      }
    }
  } catch (err) {
    console.error("❌ Error updating tickResult:", err);
    Alert.alert(t("Error.error"), t("CertificateQuesanory.Something went wrong while updating question."), [{ text: t("MAIN.OK") }]);
  } finally {
    setLoadingQuestionId(null);
  }
};

const handleSubmitPhoto = async (q: Question) => {
  console.log("image upload",q)
  if (!capturedImage || !selectedQuestion) return;

  try {
    setLoadingQuestionId(selectedQuestion.id);
    const token = await AsyncStorage.getItem("token");
      if (!token) {
           Alert.alert(
          t("Error.Sorry"),
          t("Error.Your login session has expired. Please log in again to continue."),
          [{ text: t("MAIN.OK") }]
        );
        return;
      }

    const fileName = capturedImage.split("/").pop();
    const fileType = fileName?.split(".").pop()
      ? `image/${fileName.split(".").pop()}`
      : "image/jpeg";

    const formData = new FormData();
    formData.append("taskphotoProof", {
      uri: capturedImage,
      name: fileName,
      type: fileType,
    } as any);
    formData.append("questionId", selectedQuestion.id.toString());
    formData.append("certificationpaymentId", certificationpaymentId.toString());

    const response = await axios.post(
      `${environment.API_BASE_URL}api/officer/upload-proof-photo/${selectedQuestion.id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data?.success || response.status === 200) {
      Alert.alert(t("CertificateQuesanory.Success"), t("CertificateQuesanory.Task complete successfully!"), [{ text: t("MAIN.OK") }]);
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === selectedQuestion.id
            ? { ...item, officerTickResult: 1, officerUploadImage: capturedImage }
            : item
        )
      );
      setShowCameraModal(false);
      setCapturedImage(null);
      setSelectedQuestion(null);
    } else {
      Alert.alert(t("Error.error"), t("CertificateQuesanory.Failed to complete task, Please try again"), [{ text: t("MAIN.OK") }]);
    }
  } catch (err) {
    console.error("❌ Upload photo failed:", err);
    Alert.alert(t("Error.error"), t("CertificateQuesanory.Failed to complete task, Please try again"),[{ text: t("MAIN.OK") }]);
  } finally {
    setLoadingQuestionId(null);
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
      navigation.navigate("Main", {
        screen: "MainTabs",
        params: {
          screen: screenName
        }
      });     
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

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-4 bg-white shadow-sm border-b border-[#E5E5E5]">
        <TouchableOpacity
          className="bg-[#F6F6F680] rounded-full p-2 justify-center w-10 z-20"
          // onPress={() =>  navigation.navigate("Main", {screen:screenName})}
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
          <Text className="text-base font-semibold text-center">
           #{jobId}
          </Text>

        </View>
      </View>
{loaingCertificate ? (
  <LoadingSkeleton/>
):(
  <>
  <ScrollView className="p-6">
        <View className="mb-10 ">
  <View className="w-full items-center mb-8">
      {/* Inner row: logo + text */}
      <View className="flex-row items-center justify-center max-w-[240px]">
        {/* {CertificateData?.logo && (
          <Image
            source={{ uri: CertificateData.logo }}
            style={{ width: 100, height: 100 }}
            resizeMode="contain"
          />
        )} */}

        <Image 
          source={require("../assets/staraward.png")}
          style={{ width: 40, height: 100 }}
          resizeMode="contain"
        />

        <View className="ml-4 ">
          <Text className="text-lg font-semibold text-left">
            {CertificateData?.srtName} 
          </Text>

          <Text className="text-[#555555] text-left mt-1">
            {t("CertificateQuesanory.Started on")} :{" "}
            {CertificateData?.createdAt
              ? new Date(CertificateData.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : ""}
          </Text>
        </View>
      </View>
    </View>

        {questions.map((q, i) => (
<View
  key={i}
  style={{
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  }}
  className="bg-white rounded-xl p-6 mb-6 border border-gray-200 relative"
>
   
<TouchableOpacity
  className={`absolute top-4  right-4 border border-black p-1 rounded-full ${
    q.officerTickResult === 1 || q.officerUploadImage != null? "bg-black" : "bg-white"
  }`}
  onPress={() => handleCheck(q)}
  disabled={loadingQuestionId === q.id}
>
  {loadingQuestionId === q.id ? (
    <ActivityIndicator size="small" color={q.officerTickResult === 1 || q.officerUploadImage != null ? "#fff" : "#555"} />
  ) : (
    <AntDesign
      name="check"
      size={16}
      color={q.officerTickResult === 1 || q.officerUploadImage != null ? "#fff" : "#555"}
    />
  )}
</TouchableOpacity>

  <View className="flex-row justify-between items-center mr-4">
    <Text className="flex-1  ">{getLocalizedQuestion(q)}</Text>
  </View>
</View>

        ))}
        
        </View>
      </ScrollView>
  </>
)}
      

      <View className="flex-row justify-between p-4 border-t border-gray-200">
        <TouchableOpacity className="flex-row items-center bg-[#444444] px-12 py-3 rounded-full"
onPress={() => {
navigation.navigate("Main", {screen: screenName})
}}
        >
          <AntDesign name="arrow-left" size={20} color="#fff" />
          <Text className="ml-4 text-white font-semibold text-base">{t("CertificateQuesanory.Exit")}</Text>
        </TouchableOpacity>


{allChecked ? (
  <TouchableOpacity
    onPress={() => {
 navigation.navigate("CertificateSuggestions", { jobId, certificationpaymentId,  slavequestionnaireId: CertificateData!.slavequestionnaireId,farmerMobile , isClusterAudit, farmId , auditId})
    }}
    className="rounded-full overflow-hidden"
  >
    <LinearGradient
      colors={["#F35125", "#FF1D85"]} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="flex-row items-center px-12 py-3 rounded-full"
    >
      <Text className="mr-4 text-white font-semibold text-base">{t("CertificateQuesanory.Next")}</Text>
      <AntDesign name="arrow-right" size={20} color="#fff" />
    </LinearGradient>
  </TouchableOpacity>
) : (
  <View className="flex-row items-center px-12 py-3 rounded-full bg-[#C4C4C4] ">
    <Text className="mr-2 text-white font-semibold text-base">{t("CertificateQuesanory.Next")}</Text>
    <AntDesign name="arrow-right" size={20} color="#fff" />
  </View>
)}

      </View>
    
<Modal
  visible={showCameraModal}
  animationType="fade"
  transparent
  onRequestClose={() => setShowCameraModal(false)}
>
  <View className="flex-1 bg-black/50 justify-center items-center px-6">
    <View className="bg-white rounded-2xl p-8 items-center w-full">
      <View className="p-2 bg-[#F6F6F6] rounded-xl">
        <Ionicons name="camera" size={45} color="#000" />
      </View>

      <Text className="text-lg font-semibold mt-2 text-center">
        {t("CertificateQuesanory.Click a Photo")}
      </Text>

      {!capturedImage ? (
        <>
          <Text className="text-gray-500 text-center mt-2 mb-6">
            {t("CertificateQuesanory.Please take a photo of the completed work in the field.")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowCamera(true)}
            className="bg-black rounded-3xl w-full py-3 items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">
              {t("CertificateQuesanory.Open Camera")}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
        <Image
          source={{ uri: capturedImage }}
          style={{ width: 250, height: 250, marginBottom: 20 }}
                     resizeMode="contain"
                     className="mt-2"
        />
          <View className="flex justify-center w-full -mt-2">
               {isButtonEnabled ? (
            <Text className="text-center font-semibold mb-2">
              {t("CertificateQuesanory.Ready To Submit")}
            </Text>
          ) : (
            <Text className="text-gray-600 text-center mb-2">
              {countdown} {t("CertificateQuesanory.Seconds")}
            </Text>
          )}
            <TouchableOpacity
              onPress={() => setShowCamera(true)}
              className=" border border-black rounded-3xl  py-3 items-center "
            >
              <Text className="text-black font-semibold text-base">{t("Retake Previous Photo")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
          onPress={() => {
    if (selectedQuestion) handleSubmitPhoto(selectedQuestion);
  }}
              className="bg-[#353535] rounded-3xl  py-3 items-center mt-4"
              disabled={loadingQuestionId === selectedQuestion?.id || !isButtonEnabled}
            >
              {loadingQuestionId === selectedQuestion?.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  {t("CertificateQuesanory.Submit")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        onPress={() => {
          setShowCameraModal(false);
          setCapturedImage(null);
        }}
        className="mt-4"
      >
        <Text className="text-gray-400 text-sm">{("Cancel")}</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
<Modal visible={showCamera} animationType="slide" transparent={false}>
  <CameraScreen
    onClose={(imageUri) => {
      handleCameraClose(imageUri);
    }}
  />
</Modal>

    </View>
  );
};

export default CertificateQuesanory;
