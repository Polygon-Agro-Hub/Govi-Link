import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "./types";
import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
type CertificateSuggestionsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CertificateSuggestions"
>;

type CertificateSuggestionsRouteProp = RouteProp<
  RootStackParamList,
  "CertificateSuggestions"
>;

interface CertificateSuggestionsProps {
  navigation: CertificateSuggestionsNavigationProp;
}

interface ProblemItem {
  id: number;
  problem: string;
  solution: string;
  saved: boolean;
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
          <Rect x={wp("7%")} y={hp("2%")} rx="10" ry="10" width={wp("86%")} height={hp("8%")} />
          <Rect x={wp("7%")} y={hp("12%")} rx="10" ry="10" width={wp("86%")} height={hp("8%")} />
          <Rect x={wp("7%")} y={hp("22%")} rx="10" ry="10" width={wp("86%")} height={hp("8%")} />
          <Rect x={wp("7%")} y={hp("32%")} rx="10" ry="10" width={wp("86%")} height={hp("8%")} />
          <Rect x={wp("7%")} y={hp("42%")} rx="10" ry="10" width={wp("86%")} height={hp("8%")} />
          <Rect x={wp("7%")} y={hp("52%")} rx="10" ry="10" width={wp("86%")} height={hp("8%")} />
          <Rect x={wp("7%")} y={hp("62%")} rx="10" ry="10" width={wp("86%")} height={hp("8%")} />
      </ContentLoader>
    </View>
  );
};
const CertificateSuggestions: React.FC<CertificateSuggestionsProps> = ({
  navigation,
}) => {
  const route = useRoute<CertificateSuggestionsRouteProp>();
  const { jobId, certificationpaymentId, slavequestionnaireId, farmerMobile,isClusterAudit ,farmId, auditId} = route.params;
  console.log(farmerMobile)
  const { t, i18n } = useTranslation();
  const [problems, setProblems] = useState<ProblemItem[]>([
    { id: Date.now(), problem: "", solution: "", saved: false },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true); // Button disabled state
  const [OtpSendLoading, setOtpSendLoading] = useState(false);
  console.log(loading)

  const handleAddProblem = () => {
    setProblems((prev) => [
      ...prev,
      { id: Date.now(), problem: "", solution: "", saved: false },
    ]);
    setEditingId(Date.now());
  };

  const handleEditProblem = (id: number) => {
    setEditingId(id);
  };

  const handleChangeProblem = (
    id: number,
    field: "problem" | "solution",
    value: string
  ) => {
    setProblems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveProblem = async (item: ProblemItem) => {
    if (!item.problem.trim() || !item.solution.trim()) {
      Alert.alert(t("Error.Sorry"), t("CertificateSuggestions.Both problem and solution must be filled."));
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t("Error.Your login session has expired. Please log in again to continue.")
        );
        return;
      }

      let response;
      if (item.saved) {
        response = await axios.put(
          `${environment.API_BASE_URL}api/officer/update-problem/${item.id}`,
          {
            problem: item.problem,
            solution: item.solution,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${environment.API_BASE_URL}api/officer/save-problem`,
          {
            problem: item.problem,
            solution: item.solution,
            slavequestionnaireId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        setProblems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, saved: true, id: response.data.id } : p
          )
        );
        setEditingId(null);
      } else {
        Alert.alert(
          t("Error.Sorry"),
          t("CertificateSuggestions.Failed to save problem.")
        );
      }
    } catch (err) {
      console.error("❌ Error saving/updating problem:", err);
      Alert.alert(t("Error.Sorry"), t("Main.somethingWentWrong"));
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
           Alert.alert(
          t("Error.Sorry"),
          t("Error.Your login session has expired. Please log in again to continue.")
        );
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/officer/get-problems/${slavequestionnaireId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const fetchedProblems = response.data.data.map((p: any) => ({
          id: p.id,
          problem: p.problem,
          solution: p.solution,
          saved: true,
        }));
        setProblems(fetchedProblems);
        console.log("fetch problmes", fetchedProblems);
      } else {

      }
    } catch (err) {
      console.error("❌ Error fetching problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = (id: number) => {
    fetchProblems();
    setEditingId(null);
  };

  const handleNext = async ()=>{
    console.log(farmerMobile)
     setOtpSendLoading(true)
      try {
            const apiUrl = "https://api.getshoutout.com/otpservice/send";

            const headers = {
              Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
              "Content-Type": "application/json",
            };

            let otpMessage = "";
            if(i18n.language === "en"){
              otpMessage = `Your GoviLink OTP is {{code}}`;
            }else if(i18n.language === "si"){
              otpMessage = `ඔබේ GoviLink OTP මුරපදය {{code}} වේ.`;
            }else if(i18n.language === "ta"){
              otpMessage = `உங்கள் GoviLink OTP {{code}} ஆகும்.`;
            }
            
            const body = {
              source: "PolygonAgro",
              transport: "sms",
              content: {
                sms: otpMessage,
              },
              destination: farmerMobile,
            };

            const otpResponse = await axios.post(apiUrl, body, { headers });

            await AsyncStorage.setItem(
              "referenceId",
              otpResponse.data.referenceId
            );

            navigation.navigate("Otpverification", {
              farmerMobile: farmerMobile,
              jobId:jobId,
              farmId,
              auditId,
              isClusterAudit
            });
            setIsButtonDisabled(false);
             setOtpSendLoading(false);
          }  catch (error) {
                      Alert.alert(t("Main.error"), t("SignupForum.otpSendFailed"), [{
                        text: t("PublicForum.OK"),
                      }]);
                      setOtpSendLoading(false);
                    }finally{
                      setOtpSendLoading(false);
                    }
  }
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-row items-center px-4 py-4 bg-white shadow-sm border-b border-[#E5E5E5]">
        <TouchableOpacity
          className="bg-[#F6F6F680] rounded-full p-2 justify-center w-10 z-20"
          onPress={() => navigation.goBack()}
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
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <ScrollView
          className="p-6 flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {problems.map((item, index) => (
            <View key={item.id} className="mb-6">
              {item.saved && editingId !== item.id ? (
                <View className="flex-row justify-between items-center border border-[#9DB2CE] p-4 rounded-md">
                  <Text className="text-base font-semibold">
                    {t("CertificateSuggestions.Problem")} : {(index + 1).toString().padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleEditProblem(item.id)}
                    disabled={editingId !== null}
                  >
                    <FontAwesome5
                      name="edit"
                      size={20}
                      color={`${editingId != null ? "#C4C4C4" : "#0037FF"}`}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text className="text-base font-semibold mb-2 text-center">
                   {t("CertificateSuggestions.Problem")} : {(index + 1).toString().padStart(2, "0")}

                  </Text>

                  <View className="border border-[#9DB2CE] p-4 rounded-md">
                    <Text className="text-base font-semibold mb-2 mt-1">
                      {t("CertificateSuggestions.Identified Problem")}
                    </Text>
                    <TextInput
                      className="border border-[#9DB2CE] rounded-md p-2 mb-4"
                      multiline
                      placeholder={t("CertificateSuggestions.Type here...")}
                      textAlignVertical="top"
                      value={item.problem}
                      onChangeText={(text) =>
                        handleChangeProblem(item.id, "problem", text)
                      }
                      style={{ minHeight: 100 }}
                    />

                    <Text className="text-base font-semibold mb-2">
                      {t("CertificateSuggestions.Suggested Solution")}
                    </Text>
                    <TextInput
                      className="border border-[#9DB2CE] rounded-md p-2 mb-4"
                      multiline
                      placeholder={t("CertificateSuggestions.Type here...")}
                      textAlignVertical="top"
                      value={item.solution}
                      onChangeText={(text) =>
                        handleChangeProblem(item.id, "solution", text)
                      }
                      style={{ minHeight: 100 }}
                    />

                    <TouchableOpacity
                      className="bg-[#1A1A1A] p-4 rounded-3xl w-full flex justify-center items-center mb-1"
                      onPress={() => handleSaveProblem(item)}
                    >
                      <Text className="text-white text-center font-semibold text-base">
                        {item.saved
                          ? t("CertificateSuggestions.Update")
                          : t("CertificateSuggestions.Save Problem")}
                      </Text>
                    </TouchableOpacity>
                    {/* {item.saved && editingId === item.id && (
                      <TouchableOpacity
                        className="bg-[#C4C4C4] p-4 rounded-3xl w-full flex-1 justify-center items-center mt-2"
                        onPress={() => handleCancelEdit(item.id)}
                      >
                        <Text className="text-white text-center font-semibold text-base">
                          {t("CertificateQuesanory.Cancel")}
                        </Text>
                      </TouchableOpacity>
                    )} */}
                      <TouchableOpacity
                        className="bg-[#C4C4C4] p-4 rounded-3xl w-full flex-1 justify-center items-center mt-2"
                        onPress={() => handleCancelEdit(item.id)}
                      >
                        <Text className="text-white text-center font-semibold text-base">
                          {t("CertificateQuesanory.Cancel")}
                        </Text>
                      </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ))}
          <View className="items-center mt-2">
            <TouchableOpacity
              className={`bg-[#1A1A1A] p-4 rounded-3xl w-[50%] flex justify-center items-center ${
                editingId !== null || problems.some((p) => !p.saved)
                  ? "opacity-50"
                  : ""
              }`}
              onPress={handleAddProblem}
              disabled={editingId !== null || problems.some((p) => !p.saved)}
            >
              <Text className="text-white text-center font-semibold text-base">
                {t("CertificateSuggestions.Add more")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      <View className="flex-row justify-between p-4 border-t border-gray-200">
        <TouchableOpacity
          className="flex-row items-center bg-[#444444] px-12 py-3 rounded-full ml-2"
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrow-left" size={20} color="#fff" />
          <Text className="ml-4 text-white font-semibold text-base">
            {t("CertificateQuesanory.Back")}
          </Text>
        </TouchableOpacity>
            {loading ? (
                <View className="flex-row items-center px-12 py-3 rounded-full bg-[#C4C4C4] mr-2">
          <Text className="mr-2 text-white font-semibold text-base">{t("CertificateQuesanory.Next")}</Text>
          <AntDesign name="arrow-right" size={20} color="#fff" />
        </View>
            ): 
            (

        <>
        <TouchableOpacity
        disabled={loading}
          onPress={() => {
            const hasUnsaved = problems.some(
              (p) =>
                !p.saved &&
                (p.problem.trim() !== "" || p.solution.trim() !== "")
            );

            if (hasUnsaved) {
              Alert.alert(
                t("CertificateSuggestions.Unsaved Problem"),
                t(
                  "CertificateSuggestions.You have unsaved problems. Do you want to continue without saving?"
                ),
                [
                  { text: t("CertificateQuesanory.Cancel"), style: "cancel" },
                  {
                    text: t("CertificateSuggestions.Continue"),
                    onPress: () =>  handleNext(),
                  },
                ]
              );
            } else {
              // Safe to navigate
              handleNext()
            }
          }}
          className="rounded-full overflow-hidden"
        >
          <LinearGradient
            colors={["#F35125", "#FF1D85"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center px-12 py-3 rounded-full"
          >

          <Text className="mr-4 text-white font-semibold text-base">
              {t("CertificateQuesanory.Next")}
            </Text>
            <AntDesign name="arrow-right" size={20} color="#fff" />
     

  
          </LinearGradient>
        </TouchableOpacity>
               </>
            )}

      </View>
    </KeyboardAvoidingView>
  );
};

export default CertificateSuggestions;
