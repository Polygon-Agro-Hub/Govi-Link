import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import axios from "axios";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { AntDesign } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { selectUserPersonal } from "@/store/authSlice";
import { useFocusEffect } from "@react-navigation/native";
import { t } from "i18next";
import CustomHeader from "../commons/CustomHeader";
import LoadingPage from "../commons/LoadingPage";
import NoDataComponent from "../commons/NoDataComponent";

interface complainItem {
  id: number;
  createdAt: string;
  complain: string;
  language: string;
  complainCategory: string;
  status: "Opened" | "Closed";
  reply?: string;
  replyTime?: string;
  refNo: string;
}

type ComplainHistoryNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ComplainHistory"
>;

interface ComplainHistoryProps {
  navigation: ComplainHistoryNavigationProp;
}

const ExpandableText: React.FC<{ text: string; maxLength?: number }> = ({
  text,
  maxLength = 150,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText =
    expanded || !shouldTruncate ? text : `${text.substring(0, maxLength)}...`;

  return (
    <Text className="self-start mb-4">
      {displayText}
      {shouldTruncate && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text className="text-blue-500 font-semibold ml-1 mb-[-4]">
            {expanded
              ? t("ComplainHistory.SeeLess...")
              : t("ComplainHistory.SeeMore...")}
          </Text>
        </TouchableOpacity>
      )}
    </Text>
  );
};

const ComplainHistory: React.FC<ComplainHistoryProps> = ({ navigation }) => {
  const [complains, setComplains] = useState<complainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [complainReply, setComplainReply] = useState<string | null>(null);
  const [selectedComplain, setSelectedComplain] = useState<complainItem | null>(
    null,
  );
  const { t, i18n } = useTranslation();
  const userPersonalData = useSelector(selectUserPersonal);

  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    firstNameSinhala: string;
    firstNameTamil: string;
    lastNameSinhala: string;
    lastNameTamil: string;
  } | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (userPersonalData) {
        setProfile({
          firstName: userPersonalData.firstName || "",
          lastName: userPersonalData.lastName || "",
          firstNameSinhala: userPersonalData.firstNameSinhala || "",
          lastNameSinhala: userPersonalData.lastNameSinhala || "",
          firstNameTamil: userPersonalData.firstNameTamil || "",
          lastNameTamil: userPersonalData.lastNameTamil || "",
        });
      }
    }, [userPersonalData]),
  );

  const fetchOngoingCultivations = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.get<complainItem[]>(
        `${environment.API_BASE_URL}api/complaint/get-complains`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setComplains(res.data);
    } catch (err) {
      console.error("Error fetching complains:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOngoingCultivations();
  }, []);

  const formatDateTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, "0");
    const timeStr = `${hour12}.${minuteStr}${ampm}`;
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${timeStr},${day} ${month} ${year}`;
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const handleViewReply = (complain: complainItem) => {
    if (complain.reply) {
      setComplainReply(complain.reply);
      setSelectedComplain(complain);
      setModalVisible(true);
    } else {
      Alert.alert(t("Main.Sorry"), t("ComplainHistory.NoReply"), [
        { text: t("Main.OK") },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1, backgroundColor: "#F9F9FA" }}
    >
      <CustomHeader
        title={t("ComplainHistory.ComplaintHistory")}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      <View className="flex-1 bg-white">
        {loading ? (
          <LoadingPage
            message={t("ComplainHistory.LoadingComplaints...")}
            fullScreen={true}
          />
        ) : complains.length === 0 ? (
          <View className="flex-1 items-center justify-center -mt-[10%]">
             <NoDataComponent message={t("ComplainHistory.NoComplainstHere")} />
          </View>
        ) : (
          <ScrollView
            className="px-6 flex-1 pb-20"
          >
            {complains.map((complain) => (
              <View
                key={complain.id}
                className="bg-white p-4 my-2 rounded-xl shadow-md border border-[#dfdfdfcc]"
              >
                <Text className="self-start mb-2 font-semibold">
                  {t("ComplainHistory.RefNo")} : {complain.refNo || "N/A"}
                </Text>
                <Text className="self-start mb-2 text-[#6E6E6E]">
                  {t("ComplainHistory.Sent")}{" "}
                  {formatDateTime(complain.createdAt)}
                </Text>

                <ExpandableText text={complain.complain || ""} />

                <View className="flex-row justify-between items-center">
                  {complain.status === "Closed" && (
                    <TouchableOpacity
                      className="bg-black px-3 py-2 rounded"
                      onPress={() => handleViewReply(complain)}
                    >
                      <Text className="text-white text-xs">
                        {t("ComplainHistory.ViewResponse")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text
                      className={`text-s px-4 py-1 rounded ${
                        complain.status === "Opened"
                          ? "bg-[#FFE2F1] text-[#FF0075]"
                          : "bg-[#FFF0EC] text-[#F35125]"
                      }`}
                    >
                      {complain.status === "Opened"
                        ? t("ComplainHistory.Opened")
                        : t("ComplainHistory.Closed")}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          statusBarTranslucent={false}
        >
          <View
            className="flex-1 items-center bg-white bg-opacity-50"
          >
            <ScrollView
              className="bg-white rounded-lg shadow-lg w-full mt-10"
              contentContainerStyle={{ padding: 24, paddingBottom: 70 }}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                className="absolute top-0 right-4 bg-gray-400 p-2 rounded-full"
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name="close" size={18} color="white" />
              </TouchableOpacity>

              <View className="mt-8">
                <Text className="text-gray-800 text-base leading-relaxed text-left">
                  {i18n.language === "si"
                    ? `හිතවත් ${profile?.firstNameSinhala || ""} ${profile?.lastNameSinhala || ""},\n\nඔබගේ පැමිණිල්ල විසඳා ඇති බව අපි ඔබට සතුටින් දැනුම් දෙමු.\n\n${complainReply || "Loading..."}\n\nඔබට තවත් ගැටළු හෝ ප්‍රශ්න තිබේ නම්, අප හා සම්බන්ධ වන්න. ඔබගේ ඉවසීම සහ අවබෝධය සඳහා ස්තූතියි.\n\nමෙයට,\nPolygon පාරිභෝගික සහාය කණ්ඩායම`
                    : i18n.language === "ta"
                      ? `நம்பிக்கை  ${profile?.firstNameTamil || ""} ${profile?.lastNameTamil || ""},\n\nஉங்களால் தீர்க்கப்பட்டதாக நாங்கள் உங்களுக்கு மகிழ்ச்சியுடன் தெரிவிக்கிறோம்.\n\n${complainReply || "Loading..."}\n\nஉங்களுக்கு மேலும் சிக்கல்கள் அல்லது பிரச்சனைகள் இருந்தால், நீங்கள் தொடர்பு கொள்ள வேண்டும். உங்கள் பொறுமை மற்றும் புரிதலுக்கு நன்றி.\n\nஇதற்கு,\nஇதற்கு, பாலிகோன் ஆதரவு குழு`
                      : `Dear ${profile?.firstName || ""} ${profile?.lastName || ""},\n\nWe are pleased to inform you that your complaint has been resolved.\n\n${complainReply || "Loading..."}\n\nIf you have any further concerns or questions, feel free to reach out.\nThank you for your patience and understanding.\n\nSincerely,\nPolygon Agro Customer Support Team`}
                </Text>
                {selectedComplain?.replyTime && (
                  <Text className="mb-3 mt-1">
                    {formatDate(selectedComplain.replyTime)}
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ComplainHistory;
