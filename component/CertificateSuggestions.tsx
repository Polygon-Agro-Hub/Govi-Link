// import React, { useState } from "react";
// import { 
//   View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform 
// } from "react-native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RouteProp, useRoute } from "@react-navigation/native";
// import { RootStackParamList } from "./types";
// import { AntDesign } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useTranslation } from "react-i18next";

// type CertificateSuggestionsNavigationProp = StackNavigationProp<
//   RootStackParamList,
//   "CertificateSuggestions"
// >;

// type CertificateSuggestionsRouteProp = RouteProp<
//   RootStackParamList,
//   "CertificateSuggestions"
// >;

// interface CertificateSuggestionsProps {
//   navigation: CertificateSuggestionsNavigationProp;
// }

// const CertificateSuggestions: React.FC<CertificateSuggestionsProps> = ({ navigation }) => {
//   const route = useRoute<CertificateSuggestionsRouteProp>();
//   const { jobId } = route.params;
//   const {t,  i18n} = useTranslation();

//   const [problemText, setProblemText] = useState("");
//   const [solutionText, setSolutionText] = useState("");
//   const [problemHeight, setProblemHeight] = useState(100);
//   const [solutionHeight, setSolutionHeight] = useState(100);
//   return (
//     <KeyboardAvoidingView
//       className="flex-1 bg-white"
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
    //   <View className="flex-row items-center px-4 py-4 bg-white shadow-sm border-b border-[#E5E5E5]">
    //     <TouchableOpacity
    //       className="bg-[#F6F6F680] rounded-full p-2 justify-center w-10 z-20"
    //       onPress={() => navigation.goBack()}
    //     >
    //       <AntDesign name="left" size={22} color="#000" />
    //     </TouchableOpacity>

    //     <View className="flex-1">
    //       <Text className="text-base font-semibold text-center">
    //         #{jobId}
    //       </Text>
    //     </View>
    //   </View>

    //   <View className="px-6 mt-6">
    //     <Text className="text-center text-[#3B424C]">
    //       Please mention identified problems and suggestions you made below.
    //     </Text>
    //   </View>

//       <ScrollView
//         className="p-6 flex-1"
//         contentContainerStyle={{ paddingBottom: 80 }}
//         keyboardShouldPersistTaps="handled"
//       >
//         <View className="mb-6">
//           <Text className="text-center text-base font-semibold mb-2">
//             Problem : 01
//           </Text>

//           <View className="border border-[#9DB2CE] p-4 rounded-md">
//             <Text className="text-base font-semibold mb-2">Identified Problem</Text>
//             <TextInput
//               className="border border-[#9DB2CE] rounded-md p-2 "
//               multiline
//               placeholder="Describe the problem..."
//               value={problemText}
//               onChangeText={setProblemText}
//                 textAlign="left"
//   textAlignVertical="top"

//         style={{ height: Math.max(100, problemHeight) }}
//             />

//             <Text className="text-base font-semibold mt-6 mb-2">Suggested Solution</Text>
//             <TextInput
//               className="border border-[#9DB2CE] rounded-md p-2 "
//               multiline
//               placeholder="Describe the solution..."
//               value={solutionText}
//               onChangeText={setSolutionText}
//                textAlign="left"
//   textAlignVertical="top"
//         style={{ height: Math.max(100, solutionHeight) }}
//             />

//               <View className="items-center mt-8 mb-4">
//             <TouchableOpacity className="bg-[#1A1A1A] p-4 rounded-3xl w-full flex justify-center items-center">
//               <Text className="text-white text-center font-semibold text-base">
//                 Save Problem
//               </Text>
//             </TouchableOpacity>
//           </View>
//           </View>

        
//         </View>

//         <View className="items-center ">
//           <TouchableOpacity className="bg-[#1A1A1A] p-4 rounded-3xl w-[50%] flex justify-center items-center">
//             <Text className="text-white text-center font-semibold text-base">
//               Add more
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>

//          <View className="flex-row justify-between p-4 border-t border-gray-200">
//               <TouchableOpacity className="flex-row items-center bg-[#444444] px-12 py-3 rounded-full ml-2">
//                 <AntDesign name="arrow-left" size={20} color="#fff" />
//                 <Text className="ml-4 text-white font-semibold text-base">{t("CertificateQuesanory.Exit")}</Text>
//               </TouchableOpacity>
      
      

//         <TouchableOpacity
//           onPress={() => {
//           }}
//           className="rounded-full overflow-hidden"
//         >
//           <LinearGradient
//             colors={["#F35125", "#FF1D85"]} 
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             className="flex-row items-center px-12 py-3 rounded-full"
//           >
//             <Text className="mr-4 text-white font-semibold text-base">{t("CertificateQuesanory.Next")}</Text>
//             <AntDesign name="arrow-right" size={20} color="#fff" />
//           </LinearGradient>
//         </TouchableOpacity>
// {/* 
//         <View className="flex-row items-center px-12 py-3 rounded-full bg-[#C4C4C4] mr-2">
//           <Text className="mr-2 text-white font-semibold text-base">{t("CertificateQuesanory.Next")}</Text>
//           <AntDesign name="arrow-right" size={20} color="#fff" />
//         </View> */}

//             </View>
//     </KeyboardAvoidingView>
//   );
// };

// export default CertificateSuggestions;

import React, { useState } from "react";
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
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
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

const CertificateSuggestions: React.FC<CertificateSuggestionsProps> = ({ navigation }) => {
  const route = useRoute<CertificateSuggestionsRouteProp>();
  const { jobId, certificationpaymentId } = route.params;
const {t,  i18n} = useTranslation();
  const [problems, setProblems] = useState<ProblemItem[]>([
    { id: Date.now(), problem: "", solution: "", saved: false },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAddProblem = () => {
    setProblems(prev => [...prev, { id: Date.now(), problem: "", solution: "", saved: false }]);
    setEditingId(Date.now());
  };

  const handleEditProblem = (id: number) => {
    setEditingId(id);
  };

  const handleChangeProblem = (id: number, field: "problem" | "solution", value: string) => {
    setProblems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveProblem = async (item: ProblemItem) => {
            setProblems(prev =>
          prev.map(p => (p.id === item.id ? { ...p, saved: true } : p))
        );
        setEditingId(null);
    // if (!item.problem.trim() || !item.solution.trim()) {
    //   Alert.alert("Error", "Both problem and solution must be filled.");
    //   return;
    // }

    // try {
    //   const token = await AsyncStorage.getItem("token");
    //   if (!token) {
    //     Alert.alert("Error", "Authentication token missing. Please login again.");
    //     return;
    //   }

    //   // Example API call
    //   const response = await axios.post(
    //     `${environment.API_BASE_URL}api/officer/save-problem`,
    //     {
    //       jobId,
    //       certificationpaymentId,
    //       problem: item.problem,
    //       solution: item.solution,
    //       problemId: item.id,
    //     },
    //     { headers: { Authorization: `Bearer ${token}` } }
    //   );

    //   if (response.data.success) {
    //     setProblems(prev =>
    //       prev.map(p => (p.id === item.id ? { ...p, saved: true } : p))
    //     );
    //     setEditingId(null);
    //   } else {
    //     Alert.alert("Error", response.data.message || "Failed to save problem.");
    //   }
    // } catch (err) {
    //   console.error("❌ Error saving problem:", err);
    //   Alert.alert("Error", "Something went wrong while saving.");
    // }
  };

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
          <Text className="text-base font-semibold text-center">
            #{jobId}
          </Text>
        </View>
      </View>

      <View className="px-6 mt-6">
        <Text className="text-center text-[#3B424C]">
          Please mention identified problems and suggestions you made below.
        </Text>
      </View>

      <ScrollView
        className="p-6 flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {problems.map((item, index) => (
          <View key={item.id} className="mb-6">
            {item.saved && editingId !== item.id ? (
              // Display saved problem with edit icon
              <View className="flex-row justify-between items-center border border-[#9DB2CE] p-4 rounded-md">
                <Text className="text-base font-semibold">Problem : {index + 1}</Text>
                <TouchableOpacity onPress={() => handleEditProblem(item.id)}  disabled={editingId !== null}  >
                  <AntDesign name="edit" size={20} color="#1A1A1A" />
                </TouchableOpacity>
              </View>
            ) : (
              // Editable inputs
              <View className="border border-[#9DB2CE] p-4 rounded-md">
                <Text className="text-base font-semibold mb-2">Problem : {index + 1}</Text>

                <Text className="text-base font-semibold mb-2">Identified Problem</Text>
                <TextInput
                  className="border border-[#9DB2CE] rounded-md p-2 mb-4"
                  multiline
                  placeholder="Describe the problem..."
                  textAlignVertical="top"
                  value={item.problem}
                  onChangeText={(text) => handleChangeProblem(item.id, "problem", text)}
                  style={{ minHeight: 100 }}
                />

                <Text className="text-base font-semibold mb-2">Suggested Solution</Text>
                <TextInput
                  className="border border-[#9DB2CE] rounded-md p-2 mb-4"
                  multiline
                  placeholder="Describe the solution..."
                  textAlignVertical="top"
                  value={item.solution}
                  onChangeText={(text) => handleChangeProblem(item.id, "solution", text)}
                  style={{ minHeight: 100 }}
                />

                <TouchableOpacity
                  className="bg-[#1A1A1A] p-4 rounded-3xl w-full flex justify-center items-center"
                  onPress={() => handleSaveProblem(item)}
                >
                  <Text className="text-white text-center font-semibold text-base">
                    {item.saved ? "Update Problem" : "Save Problem"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
<View className="items-center mt-2">
  <TouchableOpacity
    className={`bg-[#1A1A1A] p-4 rounded-3xl w-[50%] flex justify-center items-center ${
      editingId !== null || problems.some(p => !p.saved) ? "opacity-50" : ""
    }`}
    onPress={handleAddProblem}
    disabled={editingId !== null || problems.some(p => !p.saved)}
  >
    <Text className="text-white text-center font-semibold text-base">
      Add More
    </Text>
  </TouchableOpacity>
</View>
      </ScrollView>

               <View className="flex-row justify-between p-4 border-t border-gray-200">
              <TouchableOpacity className="flex-row items-center bg-[#444444] px-12 py-3 rounded-full ml-2">
                <AntDesign name="arrow-left" size={20} color="#fff" />
                <Text className="ml-4 text-white font-semibold text-base">{t("CertificateQuesanory.Back")}</Text>
              </TouchableOpacity>
      
      

        {/* <TouchableOpacity
          onPress={() => {
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
        </TouchableOpacity> */}
        <TouchableOpacity
  onPress={() => {
    // Check if any unsaved problem has text typed
    const hasUnsaved = problems.some(
      p => !p.saved && (p.problem.trim() !== "" || p.solution.trim() !== "")
    );

    if (hasUnsaved) {
      Alert.alert(
        "Unsaved Problem",
        "You have unsaved problems. Do you want to continue without saving?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => console.log("Navigate Next") },
        ]
      );
    } else {
      // Safe to navigate
      console.log("Navigate Next");
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
    <Text className="mr-4 text-white font-semibold text-base">{t("CertificateQuesanory.Next")}</Text>
    <AntDesign name="arrow-right" size={20} color="#fff" />
  </LinearGradient>
</TouchableOpacity>

{/* 
        <View className="flex-row items-center px-12 py-3 rounded-full bg-[#C4C4C4] mr-2">
          <Text className="mr-2 text-white font-semibold text-base">{t("CertificateQuesanory.Next")}</Text>
          <AntDesign name="arrow-right" size={20} color="#fff" />
        </View> */}

            </View>
    </KeyboardAvoidingView>
  );
};

export default CertificateSuggestions;
