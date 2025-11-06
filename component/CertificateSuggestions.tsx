import React, { useState } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform 
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "./types";
import { AntDesign } from "@expo/vector-icons";
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

const CertificateSuggestions: React.FC<CertificateSuggestionsProps> = ({ navigation }) => {
  const route = useRoute<CertificateSuggestionsRouteProp>();
  const { jobId } = route.params;
  const {t,  i18n} = useTranslation();

  const [problemText, setProblemText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [problemHeight, setProblemHeight] = useState(100);
  const [solutionHeight, setSolutionHeight] = useState(100);
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
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6">
          <Text className="text-center text-base font-semibold mb-2">
            Problem : 01
          </Text>

          <View className="border border-[#9DB2CE] p-4 rounded-md">
            <Text className="text-base font-semibold mb-2">Identified Problem</Text>
            <TextInput
              className="border border-[#9DB2CE] rounded-md p-2 "
              multiline
              placeholder="Describe the problem..."
              value={problemText}
              onChangeText={setProblemText}
                textAlign="left"
  textAlignVertical="top"

        style={{ height: Math.max(100, problemHeight) }}
            />

            <Text className="text-base font-semibold mt-6 mb-2">Suggested Solution</Text>
            <TextInput
              className="border border-[#9DB2CE] rounded-md p-2 "
              multiline
              placeholder="Describe the solution..."
              value={solutionText}
              onChangeText={setSolutionText}
               textAlign="left"
  textAlignVertical="top"
        style={{ height: Math.max(100, solutionHeight) }}
            />

              <View className="items-center mt-8 mb-4">
            <TouchableOpacity className="bg-[#1A1A1A] p-4 rounded-3xl w-full flex justify-center items-center">
              <Text className="text-white text-center font-semibold text-base">
                Save Problem
              </Text>
            </TouchableOpacity>
          </View>
          </View>

        
        </View>

        <View className="items-center ">
          <TouchableOpacity className="bg-[#1A1A1A] p-4 rounded-3xl w-[50%] flex justify-center items-center">
            <Text className="text-white text-center font-semibold text-base">
              Add more
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

         <View className="flex-row justify-between p-4 border-t border-gray-200">
              <TouchableOpacity className="flex-row items-center bg-[#444444] px-12 py-3 rounded-full ml-2">
                <AntDesign name="arrow-left" size={20} color="#fff" />
                <Text className="ml-4 text-white font-semibold text-base">{t("CertificateQuesanory.Exit")}</Text>
              </TouchableOpacity>
      
      

        <TouchableOpacity
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
