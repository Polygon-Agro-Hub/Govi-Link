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
import { RootStackParamList } from "../types/types";
import { Entypo, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import ContentLoader, { Rect } from "react-content-loader/native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import CustomHeader from "../commons/CustomHeader";
import FormFooterButton from "../inspection-forms/FormFooterButton";

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
        <Rect
          x={wp("7%")}
          y={hp("2%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("8%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("12%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("8%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("22%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("8%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("32%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("8%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("42%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("8%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("52%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("8%")}
        />
        <Rect
          x={wp("7%")}
          y={hp("62%")}
          rx="10"
          ry="10"
          width={wp("86%")}
          height={hp("8%")}
        />
      </ContentLoader>
    </View>
  );
};

const CertificateSuggestions: React.FC<CertificateSuggestionsProps> = ({
  navigation,
}) => {
  const route = useRoute<CertificateSuggestionsRouteProp>();
  const {
    jobId,
    slavequestionnaireId,
    farmerMobile,
    isClusterAudit,
    farmId,
    auditId,
  } = route.params;

  const { t, i18n } = useTranslation();
  const [problems, setProblems] = useState<ProblemItem[]>([
    { id: Date.now(), problem: "", solution: "", saved: false },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [OtpSendLoading, setOtpSendLoading] = useState(false);

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
    value: string,
  ) => {
    value = value.replace(/^\s+/, "");
    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    setProblems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleSaveProblem = async (item: ProblemItem) => {
    if (!item.problem.trim() || !item.solution.trim()) {
      Alert.alert(
        t("Error.Sorry"),
        t("CertificateSuggestions.BothProblemAndSolutionMustBeFilled"),
        [{ text: t("Main.OK") }],
      );
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Error.YourLoginSessionHasExpiredPleaseLogInAgainToContinue",
          ),
          [{ text: t("Main.OK") }],
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
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        response = await axios.post(
          `${environment.API_BASE_URL}api/officer/save-problem`,
          {
            problem: item.problem,
            solution: item.solution,
            slavequestionnaireId,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      if (response.data.success) {
        setProblems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, saved: true, id: response.data.id } : p,
          ),
        );
        setEditingId(null);
      } else {
        Alert.alert(
          t("Error.Sorry"),
          t("CertificateSuggestions.FailedToSaveProblem"),
          [{ text: t("Main.OK") }],
        );
      }
    } catch (err) {
      console.error("Error saving/updating problem:", err);
      Alert.alert(t("Error.Sorry"), t("Main.SomethingWentWrongPleaseTryAgainLater"), [
        { text: t("Main.OK") },
      ]);
    } finally {
      setLoading(false);
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
          t(
            "Error.YourLoginSessionHasExpiredPleaseLogInAgainToContinue",
          ),
          [{ text: t("Main.OK") }],
        );
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/officer/get-problems/${slavequestionnaireId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const fetchedProblems = response.data.data.map((p: any) => ({
          id: p.id,
          problem: p.problem,
          solution: p.solution,
          saved: true,
        }));

        if (fetchedProblems.length === 0) {
          setProblems([
            { id: Date.now(), problem: "", solution: "", saved: false },
          ]);
        } else {
          setProblems(fetchedProblems);
        }
      }
    } catch (err) {
      console.error(" Error fetching problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = (id: number) => {
    fetchProblems();
    setEditingId(null);
  };

  const handleNext = async () => {
    setOtpSendLoading(true);
    try {
      const apiUrl = "https://api.getshoutout.com/otpservice/send";

      const headers = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };

      let otpMessage = "";
      if (i18n.language === "en") {
        otpMessage = `Your GoviLink OTP is {{code}}`;
      } else if (i18n.language === "si") {
        otpMessage = `ඔබේ GoviLink OTP මුරපදය {{code}} වේ.`;
      } else if (i18n.language === "ta") {
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

      await AsyncStorage.setItem("referenceId", otpResponse.data.referenceId);

      navigation.navigate("Otpverification", {
        farmerMobile: farmerMobile,
        jobId: jobId,
        farmId,
        auditId,
        isClusterAudit,
      });
      setIsButtonDisabled(false);
      setOtpSendLoading(false);
    } catch (error) {
      Alert.alert(t("Main.Sorry"), t("SignupForum.otpSendFailed"), [
        {
          text: t("Main.OK"),
        },
      ]);
      setOtpSendLoading(false);
    } finally {
      setOtpSendLoading(false);
    }
  };


  const handleExit = () => {
    const hasUnsaved = problems.some(
      (p) =>
        !p.saved &&
        (p.problem.trim() !== "" || p.solution.trim() !== "")
    );

    if (hasUnsaved) {
      Alert.alert(
        t("CertificateSuggestions.UnsavedProblem"),
        t(
          "CertificateSuggestions.You have unsaved problems. Do you want to go back without saving?",
        ),
        [
          {
            text: t("CertificateQuesanory.Cancel"),
            style: "cancel",
          },
          {
            text: t("CertificateSuggestions.Go Back"),
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <CustomHeader
        title={`#${jobId}`}
        navigation={navigation}
        showBackButton={true}
        onBackPress={handleExit}
      />
      <View className="shadow-sm border-b border-[#E5E5E5]" />

      <View className="px-6 mt-6">
        <Text className="text-center text-[#3B424C]">
          {t(
            "CertificateSuggestions.PleaseMentionIdentifiedProblemsAndSuggestionsYouMadeBelow",
          )}
        </Text>
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <ScrollView
          className="p-6 flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {problems.map((item, index) => (
            <View key={item.id} className="mb-6">
              {item.saved && editingId !== item.id ? (
                <View className="flex-row justify-between items-center border border-[#9DB2CE] p-4 rounded-md">
                  <Text className="text-base font-semibold">
                    {t("CertificateSuggestions.Problem")} :{" "}
                    {(index + 1).toString().padStart(2, "0")}
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
                    {t("CertificateSuggestions.Problem")} :{" "}
                    {(index + 1).toString().padStart(2, "0")}
                  </Text>

                  <View className="border border-[#9DB2CE] p-4 rounded-md">
                    <Text className="text-base font-semibold mb-2 mt-1">
                      {t("CertificateSuggestions.IdentifiedProblem")}
                    </Text>
                    <TextInput
                      className="border border-[#9DB2CE] rounded-lg p-2 mb-4"
                      multiline
                      placeholder={t("CertificateSuggestions.TypeHere...")}
                      textAlignVertical="top"
                      value={item.problem}
                      onChangeText={(text) =>
                        handleChangeProblem(item.id, "problem", text)
                      }
                      style={{ minHeight: 100 }}
                    />

                    <Text className="text-base font-semibold mb-2">
                      {t("CertificateSuggestions.SuggestedSolution")}
                    </Text>
                    <TextInput
                      className="border border-[#9DB2CE] rounded-lg p-2 mb-4"
                      multiline
                      placeholder={t("CertificateSuggestions.TypeHere...")}
                      textAlignVertical="top"
                      value={item.solution}
                      onChangeText={(text) =>
                        handleChangeProblem(item.id, "solution", text)
                      }
                      style={{ minHeight: 100 }}
                    />

                    <TouchableOpacity
                      className="bg-[#1A1A1A] rounded-3xl w-full flex justify-center items-center h-[50px] mb-1"
                      onPress={() => handleSaveProblem(item)}
                    >
                      <Text className="text-white text-center font-semibold text-base">
                        {item.saved
                          ? t("CertificateSuggestions.Update")
                          : t("CertificateSuggestions.SaveProblem")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-[#C4C4C4] rounded-3xl w-full justify-center items-center h-[50px] mt-2"
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

          <View className="items-center mt-2 mb-4">
            <TouchableOpacity
              className={`bg-[#1A1A1A] h-[50px] w-2/3 flex-row rounded-3xl flex justify-center items-center ${editingId !== null || problems.some((p) => !p.saved)
                ? "opacity-50"
                : ""
                }`}
              onPress={handleAddProblem}
              disabled={editingId !== null || problems.some((p) => !p.saved)}
            >
              <Entypo name="plus" size={25} color="white" />
              <Text className="text-white text-center font-semibold text-lg ml-2">
                {t("CertificateSuggestions.AddMore")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Form Footer Button with same design as reference */}
      <FormFooterButton
        exitText={t("CertificateQuesanory.Back")}
        nextText={t("CertificateQuesanory.Next")}
        isNextEnabled={!OtpSendLoading}
        onExit={handleExit}
        onNext={() => {
          const hasUnsaved = problems.some(
            (p) =>
              !p.saved &&
              (p.problem.trim() !== "" || p.solution.trim() !== "")
          );

          if (hasUnsaved) {
            Alert.alert(
              t("CertificateSuggestions.UnsavedProblem"),
              t(
                "CertificateSuggestions.YouHaveUnsavedProblemsDoYouWantToContinueWithoutSaving",
              ),
              [
                {
                  text: t("CertificateQuesanory.Cancel"),
                  style: "cancel",
                },
                {
                  text: t("CertificateSuggestions.Continue"),
                  onPress: () => handleNext(),
                },
              ],
            );
          } else {
            handleNext();
          }
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default CertificateSuggestions;