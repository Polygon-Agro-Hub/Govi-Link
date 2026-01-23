import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { StatusBar, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { AntDesign } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { useSelector } from "react-redux";
import { selectUserPersonal } from "@/store/authSlice";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { t } from "i18next";

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

// Component to handle truncated text with See More/See Less
const ExpandableText: React.FC<{ text: string; maxLength?: number }> = ({
  text,
  maxLength = 150, // Default max length before truncating
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText = expanded || !shouldTruncate ? text : `${text.substring(0, maxLength)}...`;

  return (
    <Text className="self-start mb-4">
      {displayText}
      {shouldTruncate && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text className="text-blue-500 font-semibold ml-1 mb-[-4]">
            {expanded ? t("ComplainHistory.See less"): t("ComplainHistory.See more")}
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
  const [selectedComplain, setSelectedComplain] = useState<complainItem | null>(null);
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const userPersonalData = useSelector(selectUserPersonal);
  console.log(userPersonalData);

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
    }, [userPersonalData])
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
        }
      );
      setComplains(res.data);
      console.log("responted data......", res.data);
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
    const hour12 = hours % 12 || 12; // Convert 0 to 12
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
      Alert.alert(t("Main.Sorry"), t("ComplainHistory.No Reply"), [{ text: t("Main.ok") }])
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1, backgroundColor: "#F9F9FA" }}
    >
      <View className="flex-1 bg-white">
        <View
          className="flex-row items-center justify-between"
          style={{ paddingHorizontal: wp(4), paddingVertical: hp(2) }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign
              name="left"
              size={24}
              color="#000502"
              style={{
                paddingHorizontal: wp(3),
                paddingVertical: hp(1.5),
                backgroundColor: "#F6F6F680",
                borderRadius: 50,
              }}
            />
          </TouchableOpacity>
          <Text className="font-bold text-lg">
            {t("ComplainHistory.Complaint History")}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF1D85" />
          </View>
        ) : complains.length === 0 ? (
          <View className="flex-1 items-center justify-center -mt-[70%]">
            <LottieView
              source={require("../assets/json/NoData.json")}
              style={{ width: wp(50), height: hp(50) }}
              autoPlay
              loop
            />
            <Text className="text-center text-gray-600 -mt-[30%]">
              {t("ComplainHistory.No Data")}
            </Text>
          </View>
        ) : (
          <ScrollView
            className="p-4 flex-1"
            contentContainerStyle={{ paddingBottom: hp(4) }}
          >
            {complains.map((complain) => (
              <View
                key={complain.id}
                className="bg-white p-6 my-2 rounded-xl shadow-md border border-[#dfdfdfcc]"
              >
                <Text className="self-start mb-4 font-semibold">
                  {t("ComplainHistory.RefNo")} : {complain.refNo || "N/A"}
                </Text>
                <Text className="self-start mb-4 text-[#6E6E6E]">
                  {t("ComplainHistory.Sent")} {formatDateTime(complain.createdAt)}
                </Text>

                {/* Use ExpandableText component here */}
                <ExpandableText text={complain.complain || ""} />

                <View className="flex-row justify-between items-center">
                  {complain.status === "Closed" && (
                    <TouchableOpacity
                      className="bg-black px-3 py-2 rounded"
                      onPress={() => handleViewReply(complain)}
                    >
                      <Text className="text-white text-xs">
                        {t("ComplainHistory.View Response")}
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
            style={{
              paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
            }}
          >
            <ScrollView
              className="bg-white rounded-lg shadow-lg w-full max-w-md"
              contentContainerStyle={{ padding: 24, paddingBottom: 70 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Close Button */}
              <TouchableOpacity
                className="absolute top-1 right-4 bg-gray-200 p-2 rounded-full"
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name="close" size={18} color="gray" />
              </TouchableOpacity>

              <View className="mt-4">
                <Text className="text-gray-800 text-base leading-relaxed text-left">
                  {i18n.language === "si"
                    ? `හිතවත් ${profile?.firstNameSinhala || ""} ${profile?.lastNameSinhala || ""},\n\nඔබගේ පැමිණිල්ල විසඳා ඇති බව අපි ඔබට සතුටින් දැනුම් දෙමු.\n\n${complainReply || "Loading..."}\n\nඔබට තවත් ගැටළු හෝ ප්‍රශ්න තිබේ නම්, අප හා සම්බන්ධ වන්න. ඔබගේ ඉවසීම සහ අවබෝධය සඳහා ස්තූතියි.\n\nමෙයට,\nPolygon පාරිභෝගික සහාය කණ්ඩායම`
                    : i18n.language === "ta"
                    ? `நம்பிக்கை  ${profile?.firstNameTamil || ""} ${profile?.lastNameTamil || ""},\n\nஉங்களால் தீர்க்கப்பட்டதாக நாங்கள் உங்களுக்கு மகிழ்ச்சியுடன் தெரிவிக்கிறோம்.\n\n${complainReply || "Loading..."}\n\nஉங்களுக்கு மேலும் சிக்கல்கள் அல்லது பிரச்சனைகள் இருந்தால், நீங்கள் தொடர்பு கொள்ள வேண்டும். உங்கள் பொறுமை மற்றும் புரிதலுக்கு நன்றி.\n\nஇதற்கு,\nஇதற்கு, பாலிகோன் ஆதரவு குழு`
                    : `Dear ${profile?.firstName || ""} ${profile?.lastName || ""},\n\nWe are pleased to inform you that your complaint has been resolved.\n\n${complainReply || "Loading..."}\n\nIf you have any further concerns or questions, feel free to reach out.\nThank you for your patience and understanding.\n\nSincerely,\nPolygon Agro Customer Support Team`}
                </Text>
                {selectedComplain?.replyTime && (
                  <Text className="mb-3 mt-1">{formatDate(selectedComplain.replyTime)}</Text>
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