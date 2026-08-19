import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { CameraScreen } from "@/Items/CameraScreen";
import ContentLoader, { Rect } from "react-content-loader/native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import CustomHeader from "../commons/CustomHeader";
import FormFooterButton from "../inspection-forms/FormFooterButton";

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
  createdAt: Date;
  srtName: string;
  slavequestionnaireId: number;
}

const LoadingSkeleton = () => {
  const rectWidth = wp("38%");
  const gapBetweenRects = wp("8%");
  const totalWidth = 2 * rectWidth + gapBetweenRects;
  const startX = (wp("100%") - totalWidth) / 2;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#fff", paddingVertical: hp("2%") }}
    >
      <ContentLoader
        speed={1}
        width="100%"
        height={hp("100%")}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <Rect
          x={wp("18%")}
          y={hp("2%")}
          rx="10"
          ry="10"
          width={wp("20%")}
          height={hp("10%")}
        />
        <Rect
          x={wp("50%")}
          y={hp("5%")}
          rx="4"
          ry="4"
          width={wp("30%")}
          height={hp("1.5%")}
        />
        <Rect
          x={wp("50%")}
          y={hp("8%")}
          rx="4"
          ry="4"
          width={wp("30%")}
          height={hp("1.5%")}
        />

        <Rect
          x={wp("7%")}
          y={hp("15%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("10%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("28%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("10%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("41%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("10%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("54%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("10%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("67%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("10%")}
        />
      </ContentLoader>
    </View>
  );
};

const CertificateQuesanory: React.FC<CertificateQuesanoryProps> = ({
  navigation,
}) => {
  const route = useRoute<GapCertificationRouteProp>();
  const {
    jobId,
    certificationpaymentId,
    farmerMobile,
    clusterId,
    farmId,
    isClusterAudit,
    auditId,
    screenName,
  } = route.params;
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [CertificateData, setCertificateData] =
    useState<CertificateData | null>(null);
  const [loadingQuestionId, setLoadingQuestionId] = useState<number | null>(
    null,
  );
  const [loaingCertificate, setloaingCertificate] = useState(true);

  const noneChecked =
    questions.length > 0 &&
    questions.every(
      (q) => q.officerTickResult === 0 && q.officerUploadImage == null,
    );

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

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
    const fetchQuestions = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          setloaingCertificate(true);
          const response = await axios.get(
            `${environment.API_BASE_URL}api/officer/individual-audits-questions/${certificationpaymentId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                clusterId: clusterId ?? null,
                farmId: farmId,
              },
            },
          );
          setQuestions(response.data.data.questions);
          setCertificateData(response.data.data.certificate);
          setloaingCertificate(false);
        }
      } catch (error) {
        console.error("Failed to certificate questio:", error);
      } finally {
        setloaingCertificate(false);
      }
    };
    fetchQuestions();
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

  const handleCheck = async (q: Question) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t("Error.YourLoginSessionHasExpiredPleaseLogInAgainToContinue"),
          [{ text: t("Main.OK") }],
        );
        return;
      }

      if (q.type === "Photo Proof") {
        if (q.officerUploadImage) {
          Alert.alert(
            t("CertificateQuesanory.ConfirmUntick"),
            t(
              "CertificateQuesanory.ThisWillRemoveTheUploadedPhotoForThisTaskAreYouSureYouWantToContinue",
            ),
            [
              { text: t("CertificateQuesanory.Cancel"), style: "cancel" },
              {
                text: t("CertificateQuesanory.OK"),
                onPress: async () => {
                  setLoadingQuestionId(q.id);
                  await axios.delete(
                    `${environment.API_BASE_URL}api/officer/remove-photo-proof/${q.id}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                  );
                  setQuestions((prev) =>
                    prev.map((item) =>
                      item.id === q.id
                        ? {
                            ...item,
                            officerTickResult: 0,
                            officerUploadImage: null,
                          }
                        : item,
                    ),
                  );
                  setLoadingQuestionId(null);
                },
              },
            ],
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
          t("CertificateQuesanory.ConfirmUntick"),
          t("CertificateQuesanory.AreYouSureYouWantToMarkThisTaskAsIncomplete"),
          [
            { text: t("CertificateQuesanory.Cancel"), style: "cancel" },
            {
              text: t("CertificateQuesanory.OK"),
              onPress: async () => {
                setLoadingQuestionId(q.id);
                await updateTickResult(q, newTickResult, token);
              },
            },
          ],
        );
        setLoadingQuestionId(null);
        return;
      }

      await updateTickResult(q, newTickResult, token);
    } catch (err) {
      console.error(" Error updating tickResult:", err);
      Alert.alert(
        t("Error.Sorry"),
        t("CertificateQuesanory.SomethingWentWrongWhileUpdatingQuestion"),
        [{ text: t("Main.OK") }],
      );
    } finally {
      setLoadingQuestionId(null);
    }
  };

  const updateTickResult = async (
    q: Question,
    newValue: number,
    token: string,
  ) => {
    try {
      const response = await axios.put(
        `${environment.API_BASE_URL}api/officer/check-question/${q.id}`,
        { officerTickResult: newValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data?.success || response.status === 200) {
        setQuestions((prev) =>
          prev.map((item) =>
            item.id === q.id ? { ...item, officerTickResult: newValue } : item,
          ),
        );

        if (newValue === 1) {
          Alert.alert(
            t("CertificateQuesanory.Success"),
            t("CertificateQuesanory.TaskCompleteSuccessfully"),
            [{ text: t("Main.OK") }],
          );
        }
      }
    } catch (err) {
      console.error(" Error updating tickResult:", err);
      Alert.alert(
        t("Error.Sorry"),
        t("CertificateQuesanory.SomethingWentWrongWhileUpdatingQuestion"),
        [{ text: t("Main.OK") }],
      );
    } finally {
      setLoadingQuestionId(null);
    }
  };

  const handleSubmitPhoto = async (q: Question) => {
    if (!capturedImage || !selectedQuestion) return;

    try {
      setLoadingQuestionId(selectedQuestion.id);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t("Error.YourLoginSessionHasExpiredPleaseLogInAgainToContinue"),
          [{ text: t("Main.OK") }],
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
      formData.append(
        "certificationpaymentId",
        certificationpaymentId.toString(),
      );

      const response = await axios.post(
        `${environment.API_BASE_URL}api/officer/upload-proof-photo/${selectedQuestion.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.success || response.status === 200) {
        Alert.alert(
          t("CertificateQuesanory.Success"),
          t("CertificateQuesanory.TaskCompleteSuccessfully"),
          [{ text: t("Main.OK") }],
        );
        setQuestions((prev) =>
          prev.map((item) =>
            item.id === selectedQuestion.id
              ? {
                  ...item,
                  officerTickResult: 1,
                  officerUploadImage: capturedImage,
                }
              : item,
          ),
        );
        setShowCameraModal(false);
        setCapturedImage(null);
        setSelectedQuestion(null);
      } else {
        Alert.alert(
          t("Error.Sorry"),
          t("CertificateQuesanory.FailedToCompleteTaskPleaseTryAgain"),
          [{ text: t("Main.OK") }],
        );
      }
    } catch (err) {
      console.error("Upload photo failed:", err);
      Alert.alert(
        t("Error.Sorry"),
        t("CertificateQuesanory.FailedToCompleteTaskPleaseTryAgain"),
        [{ text: t("Main.OK") }],
      );
    } finally {
      setLoadingQuestionId(null);
    }
  };

  const handleCameraClose = (imageUri: string | null) => {
    setShowCamera(false);
    setShowCameraModal(true);
    if (imageUri) {
      setCapturedImage(imageUri);
    }
  };

  const handleExit = () => {
    navigation.navigate("Main", {
      screen: "MainTabs",
      params: {
        screen: screenName,
      },
    });
  };

  const handleNextButtonPress = () => {
    if (noneChecked) {
      setShowConfirmationModal(true);
    } else {
      navigateToNextPage();
    }
  };

  const navigateToNextPage = () => {
    navigation.navigate("CertificateSuggestions", {
      jobId,
      certificationpaymentId,
      slavequestionnaireId: CertificateData!.slavequestionnaireId,
      farmerMobile,
      isClusterAudit,
      farmId,
      auditId,
    });
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

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title={`#${jobId}`}
        navigation={navigation}
        showBackButton={true}
        onBackPress={handleExit}
      />
      <View className="shadow-sm border-b border-[#E5E5E5]" />

      {loaingCertificate ? (
        <LoadingSkeleton />
      ) : (
        <>
          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            <View className="mb-10">
              <View className="w-full items-center mb-8">
                <View className="flex-row items-center justify-center max-w-[240px]">
                  <Image
                    source={require("../../assets/images/public/staraward.webp")}
                    style={{ width: 40, height: 100 }}
                    resizeMode="contain"
                  />

                  <View className="ml-4">
                    <Text className="text-lg font-semibold text-left">
                      {CertificateData?.srtName}
                    </Text>

                    <Text className="text-[#555555] text-left mt-1">
                      {t("CertificateQuesanory.StartedOn")} :{" "}
                      {CertificateData?.createdAt
                        ? new Date(
                            CertificateData.createdAt,
                          ).toLocaleDateString("en-US", {
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
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: 24,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    position: "relative",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      borderWidth: 1,
                      borderColor: "#000000",
                      padding: 4,
                      borderRadius: 9999,
                      backgroundColor:
                        q.officerTickResult === 1 ||
                        q.officerUploadImage != null
                          ? "#000000"
                          : "#FFFFFF",
                    }}
                    onPress={() => handleCheck(q)}
                    disabled={loadingQuestionId === q.id}
                  >
                    {loadingQuestionId === q.id ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          q.officerTickResult === 1 ||
                          q.officerUploadImage != null
                            ? "#fff"
                            : "#555"
                        }
                      />
                    ) : (
                      <AntDesign
                        name="check"
                        size={16}
                        color={
                          q.officerTickResult === 1 ||
                          q.officerUploadImage != null
                            ? "#fff"
                            : "#555"
                        }
                      />
                    )}
                  </TouchableOpacity>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginRight: 20,
                    }}
                  >
                    <Text style={{ flex: 1 }}>{getLocalizedQuestion(q)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* Form Footer Button with same design */}
      <FormFooterButton
        exitText={t("CertificateQuesanory.Exit")}
        nextText={t("CertificateQuesanory.Next")}
        isNextEnabled={true}
        onExit={handleExit}
        onNext={handleNextButtonPress}
      />

      <Modal
        visible={showConfirmationModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-8 items-center w-full max-w-sm">
            {/* Warning Icon */}
            <View className="p-3 bg-gray-50 rounded-2xl mb-4">
              <Ionicons name="warning" size={30} color="#969696" />
            </View>

            <Text className="text-md text-black text-center mb-1">
              {t("CertificateQuesanory.AreYouSureYouWantToContinue")}
            </Text>

            <Text className="text-md text-black text-center mb-6">
              {t("CertificateQuesanory.YouHaventMarkedAnyTasksAsCompleted")}
            </Text>

            <View className="flex-row justify-between w-full gap-4">
              <TouchableOpacity
                onPress={() => setShowConfirmationModal(false)}
                className=" bg-[#444444]"
                 style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent:'center',
                    paddingHorizontal: 28,
                    paddingVertical: 12,
                    borderRadius: 9999,
                    marginLeft: 10,
                    overflow: "hidden",
                    width:120
                  }}
              >
                <Text className="text-white font-semibold text-base">
                  {t("CertificateQuesanory.Cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowConfirmationModal(false);
                  navigateToNextPage();
                }}
              >
                <LinearGradient
                  colors={["#F35125", "#FF1D85"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 28,
                    paddingVertical: 12,
                    borderRadius: 9999,
                    marginRight: 8,
                    overflow: "hidden",
                    width:120,
                    justifyContent:'center'
                  }}
                >
                  <Text className="text-white font-semibold text-base">
                    {t("CertificateQuesanory.Continue")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Camera Modal */}
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
              {t("CertificateQuesanory.ClickAPhoto")}
            </Text>

            {!capturedImage ? (
              <>
                <Text className="text-gray-500 text-center mt-2 mb-6">
                  {t(
                    "CertificateQuesanory.PleaseTakeAPhotoOfTheCompletedWorkInTheField",
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCameraModal(false);
                    setShowCamera(true);
                  }}
                  className="bg-black rounded-3xl w-full py-3 items-center justify-center"
                >
                  <Text className="text-white font-semibold text-base">
                    {t("CertificateQuesanory.OpenCamera")}
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
                      {t("CertificateQuesanory.ReadyToSubmit")}
                    </Text>
                  ) : (
                    <Text className="text-gray-600 text-center mb-2">
                      {countdown} {t("CertificateQuesanory.Seconds")}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setShowCameraModal(false);
                      setShowCamera(true);
                    }}
                    className="border border-black rounded-3xl py-3 items-center"
                  >
                    <Text className="text-black font-semibold text-base">
                      {t("CertificateQuesanory.RetakePreviousPhoto")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (selectedQuestion) handleSubmitPhoto(selectedQuestion);
                    }}
                    className="bg-[#353535] rounded-3xl py-3 items-center mt-4"
                    disabled={
                      loadingQuestionId === selectedQuestion?.id ||
                      !isButtonEnabled
                    }
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
              <Text className="text-[#434343] underline text-sm">
                {t("CertificateQuesanory.Cancel")}
              </Text>
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
