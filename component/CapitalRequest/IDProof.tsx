import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import FormTabs from "../CapitalRequest/FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { environment } from "@/environment/environment";
import Checkbox from "expo-checkbox";
import { AntDesign } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";

type FormData = {
  firstName: string;
};


type ValidationRule = {
  required?: boolean;
  type?:"firstName"
  minLength?: number;
  uniqueWith?: (keyof FormData)[];
};



const validateAndFormat = (
  text: string,
  rules: ValidationRule,
  t: any,
  formData: any,
  currentKey: keyof typeof formData
) => {
  let value = text;
  let error = "";

  console.log("Validating:", value, rules);

  return { value, error };
}

type IDProofProps = {
  navigation: any;
};

const IDProof: React.FC<IDProofProps> = ({ navigation }) => {
    const route = useRoute<RouteProp<RootStackParamList, "PersonalInfo">>();
    const {requestNumber } = route.params;

  const [displayProvince, setDisplayProvince] = useState("");
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Sri Lanka");
  const [displayCountry, setDisplayCountry] = useState(
    t("InspectionForm.Sri Lanka")
  );
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
 const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    otherNames: "",
    callName: "",
    mobile1: "",
    mobile2: "",
    familyPhone: "",
    landPhoneHome: "",
    landPhoneWork: "",
    email1: "",
    email2: "",
    houseNumber: "",
    streetName: "",
    cityName: "",

  });




  const STORAGE_KEY = "INSPECTION_FORM_1";

  let jobId = requestNumber;
  console.log("jobid", jobId)

  const updateFormData = async (updates: Partial<typeof formData>) => {
    const updatedData = {
      ...formData,
      ...updates,
    };

    setFormData(updatedData);

    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${jobId}`,
        JSON.stringify(updatedData)
      );
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };

  const handleFieldChange = (
  key: keyof typeof formData,
  text: string,
  rules: ValidationRule
) => {
  // Validate and format field
  const { value, error } = validateAndFormat(text, rules, t, formData, key);

  // Update local state for the field
  setFormData((prev) => ({
    ...prev,
    [key]: value,
  }));

  // Update errors object
  setErrors((prev) => {
    const newErrors = { ...prev };

    if (error) {
      newErrors[key] = error; // mark error
    } else {
      delete newErrors[key]; // remove error if fixed
    }

    // Re-validate uniqueWith fields if applicable
    if (rules.uniqueWith) {
      rules.uniqueWith.forEach((relatedKey) => {
        const relatedValue = formData[relatedKey];
        if (!relatedValue) {
          delete newErrors[relatedKey];
          return;
        }

        const { error: relatedError } = validateAndFormat(
          relatedValue,
          {
            type: rules.type,
            uniqueWith: rules.uniqueWith,
          },
          t,
          {
            ...formData,
            [key]: value,
          },
          relatedKey
        );

        if (relatedError) newErrors[relatedKey] = relatedError;
        else delete newErrors[relatedKey];
      });
    }

    return newErrors;
  });

  // ✅ Save only if this field has NO error
  if (!error) {
    updateFormData({ [key]: value });
  }
};

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const saved = await AsyncStorage.getItem(`${STORAGE_KEY}_${jobId}`);
        console.log("saved", saved);

        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(parsed);

        }
      };

      loadData();
    }, [i18n.language])
  );

 

  const handleNext = () => {
  const requiredFields: (keyof FormData)[] = [
    "firstName",
  ];


  navigation.navigate("NextPage", { formData });
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="flex-row items-center justify-center py-4">
          <TouchableOpacity className="absolute left-4 bg-[#F3F3F3] rounded-full p-2" onPress={()=> navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="Personal Info" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
         

          <View className="relative mb-4">
            <Text className="text-sm text-[#070707] mb-1">
              <Text className="text-black">
                {t("InspectionForm.Country")} *
              </Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCountryDropdown(true)}
              activeOpacity={0.8}
            >
              <View className="bg-[#F6F6F6] rounded-full px-5 py-4 flex-row items-center justify-between">
                <Text
                  className={`text-base ${
                    selectedCountry ? "text-black" : "text-[#838B8C]"
                  }`}
                >
                  {displayCountry || t("InspectionForm.-- Select Country --")}
                </Text>
                <AntDesign name="down" size={20} color="#838B8C" />
              </View>
            </TouchableOpacity>
          </View>
       
             
        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity className="flex-1 bg-[#444444] rounded-full py-4 items-center"  onPress={() =>
    navigation.navigate("Main", {
      screen: "MainTabs",
      params: {
        screen: "CapitalRequests",
      },
    })
  }>
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Exit")}</Text>
          </TouchableOpacity>
           {isNextEnabled == true ? (
              <View className="flex-1">
          <TouchableOpacity
            className="flex-1 "
            onPress={handleNext}
          >
              <LinearGradient
                          colors={["#F35125", "#FF1D85"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          className=" rounded-full py-4 items-center"
                          style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.25,
                            shadowRadius: 5,
                            elevation: 6,
                          }}
                        >
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Next")}</Text>
            </LinearGradient>
          </TouchableOpacity>
          </View>

): (
  <View className="flex-1 bg-gray-300 rounded-full py-4 items-center">
            <Text className="text-white text-base font-semibold">{t("InspectionForm.Next")}</Text>
          </View>
)}

        </View>
      </View>

    </KeyboardAvoidingView>
  );
};

export default IDProof;
