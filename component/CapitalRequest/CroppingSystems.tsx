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
  Image
} from "react-native";
import { AntDesign, Feather, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { CameraScreen } from "@/Items/CameraScreen";



type CroppingSystemsData = {
  AnOpportunityToGoFor?: string[];
  otherAnOpportunityToGoFor?: string;
  DoestheFarmerHasTheKnowledgeOnCropping?: "Yes" | "No";
  WhatisYourPreviousExperiences?: string;
  WhatistheGeneralOpinionofYourFriends?: string;
};

type FormData = {
  CroppingSystems?: CroppingSystemsData;
};

const YesNoSelect = ({
  label,
  value,
  visible,
  onOpen,
  onClose,
  onSelect,
  required = false,
}: {
  label: string;
  value: "Yes" | "No" | null;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (value: "Yes" | "No") => void;
  required?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Modal transparent visible={visible} animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={onClose}
        >
          <View className="bg-white w-80 rounded-2xl overflow-hidden">
            {["Yes", "No"].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4"
                  onPress={() => {
                    onSelect(item as "Yes" | "No");
                    onClose();
                  }}
                >
                  <Text className="text-center text-base text-black">
                    {t(`InspectionForm.${item}`)}
                  </Text>
                </TouchableOpacity>

                {index !== arr.length - 1 && (
                  <View className="h-px bg-gray-300 mx-4" />
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Field */}
      <View className="mt-4">
        <Text className="text-sm text-[#070707] mb-2">
          {label} {required && <Text className="text-black">*</Text>}
        </Text>

        <TouchableOpacity
          className="bg-[#F6F6F6] rounded-full px-4 py-4 flex-row items-center justify-between"
          onPress={onOpen}
          activeOpacity={0.7}
        >
          {value ? (
            <Text className="text-black">{t(`InspectionForm.${value}`)}</Text>
          ) : (
            <Text className="text-[#838B8C]">
              {t("InspectionForm.--Select From Here--")}
            </Text>
          )}

          {!value && <AntDesign name="down" size={20} color="#838B8C" />}
        </TouchableOpacity>
      </View>
    </>
  );
};


type CroppingSystemsProps = {
  navigation: any;
};

const CroppingSystems: React.FC<CroppingSystemsProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "CroppingSystems">>();
  const { requestNumber } = route.params;
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);
  const [overallSoilFertilityVisible, setOverallSoilFertilityVisible] =
    useState(false);
  console.log("finance", formData);


useEffect(() => {
  const cs = formData?.CroppingSystems ?? {};

  const isOpportunityValid =
    cs.AnOpportunityToGoFor?.length > 0 &&
    (!cs.AnOpportunityToGoFor.includes("Other") ||
      cs.otherAnOpportunityToGoFor?.trim());

  const isKnowledgeValid =
    cs.DoestheFarmerHasTheKnowledgeOnCropping === "Yes" ||
    cs.DoestheFarmerHasTheKnowledgeOnCropping === "No";

  const isExperienceValid = !!cs.WhatisYourPreviousExperiences;

  const isOpinionValid =
    !!cs.WhatistheGeneralOpinionofYourFriends?.trim();

  const hasErrors = Object.values(errors).some(Boolean);

  setIsNextEnabled(
      isOpportunityValid &&
      isKnowledgeValid &&
      isExperienceValid &&
      isOpinionValid &&
      !hasErrors
  );
}, [formData, errors]);


  let jobId = requestNumber;
  console.log("jobid", jobId);

  const updateFormData = async (updates: Partial<CroppingSystemsData>) => {
    try {
      const updatedFormData = {
        ...formData,
        CroppingSystems: {
          ...formData.CroppingSystems,
          ...updates,
        },
      };

      setFormData(updatedFormData);
      await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          const savedData = await AsyncStorage.getItem(`${jobId}`);
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setFormData(parsedData);
          }
        } catch (e) {
          console.log("Failed to load form data", e);
        }
      };

      loadFormData();
    }, [])
  );


  const handleNext = () => {
    const validationErrors: Record<string, string> = {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));

      const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
      Alert.alert(t("Error.Validation Error"), errorMessage, [
        { text: t("MAIN.OK") },
      ]);
      return;
    }

    navigation.navigate("CroppingSystems", { formData, requestNumber });
  };

  
  const handleyesNOFieldChange = async (key: string, value: "Yes" | "No") => {
    const updatedFormData = {
      ...formData,
      CroppingSystems: {
        ...formData.CroppingSystems,
        [key]: value,
      },
    };

    setFormData(updatedFormData);

    try {
      await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        <View className="flex-row items-center justify-center py-4 mt-2">
          <TouchableOpacity
            className="absolute left-4 bg-[#E0E0E080] rounded-full p-4"
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="Cropping Systems" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
         
   
       
<View className="mt-2">
  <Text className="text-sm text-[#070707] mb-4">
    {t("InspectionForm.An opportunity to go for")} <Text className="text-red-500">*</Text>
  </Text>

  {["Inter cropping","Mixed cropping", "Multistoreyed cropping","Relay Cropping","Crop Rotation", "Other"].map((option) => {
    const selected =
      formData.CroppingSystems?.AnOpportunityToGoFor?.includes(option) || false;

    return (
      <View key={option} className="flex-row items-center mb-4">
        <Checkbox
          value={selected}
            onValueChange={async () => {
            let updatedOptions = formData.CroppingSystems?.AnOpportunityToGoFor || [];

            if (selected) {
              updatedOptions = updatedOptions.filter((o: any) => o !== option);
            } else {
              updatedOptions = [...updatedOptions, option];
            }

            const updatedFormData = {
              ...formData,
              CroppingSystems: {
                ...formData.CroppingSystems,
                AnOpportunityToGoFor: updatedOptions,
                otherAnOpportunityToGoFor:
                  option === "Other" && !updatedOptions.includes("Other")
                    ? ""
                    : formData.CroppingSystems?.otherAnOpportunityToGoFor,
              },
            };

            setFormData(updatedFormData);

let errorMsg = "";

const opportunity = updatedFormData.CroppingSystems.AnOpportunityToGoFor || [];

// Filter out "Other" to see if at least one real option is selected
const validopportunity = opportunity.filter((source: string) => source !== "Other");

if (validopportunity.length === 0) {
  // No real water source selected
  errorMsg = t("Error.Please select at least one opportunity to go for");
} else if (
  opportunity.includes("Other") && 
  !updatedFormData.CroppingSystems.otherAnOpportunityToGoFor?.trim()
) {
  // "Other" is selected but not specified
  errorMsg = t("Error.Please specify the other opportunity to go for");
}

setErrors((prev) => ({
  ...prev,
  AnOpportunityToGoFor: errorMsg,
}));


            try {
              await AsyncStorage.setItem(
                `${jobId}`,
                JSON.stringify(updatedFormData)
              );
            } catch (e) {
              console.log("AsyncStorage save failed", e);
            }
          }}
          color={selected ? "#000" : undefined}
        />
        <Text className="ml-2">{t(`InspectionForm.${option}`)}</Text>
      </View>
    );
  })}


  {formData.CroppingSystems?.AnOpportunityToGoFor?.includes("Other") && (
    <TextInput
      placeholder={t("InspectionForm.--Mention Other--")}
      placeholderTextColor="#838B8C"
      className="bg-[#F6F6F6] px-4 py-4 rounded-full text-black mb-2"
      value={formData.CroppingSystems?.otherAnOpportunityToGoFor || ""}
      onChangeText={async (text) => {
        const updatedFormData = {
          ...formData,
          CroppingSystems: {
            ...formData.CroppingSystems,
             otherAnOpportunityToGoFor: text,
          },
        };
        setFormData(updatedFormData);
   let errorMsg = "";
  const opportunity = updatedFormData.CroppingSystems.AnOpportunityToGoFor || [];
  const validopportunity= opportunity.filter(
    (source: string) => source !== "Other"
  );

  if (validopportunity.length === 0) {
    errorMsg = t("Error.Please select at least one opportunity to go for");
  } else if (opportunity.includes("Other") && !text.trim()) {
    errorMsg = t("Error.Please specify the other opportunity to go for");
  }

  setErrors((prev) => ({ ...prev, AnOpportunityToGoFor: errorMsg }));

        try {
          await AsyncStorage.setItem(
            `${jobId}`,
            JSON.stringify(updatedFormData)
          );
        } catch (e) {
          console.log("AsyncStorage save failed", e);
        }
      }}
    />
  )}

    {errors.AnOpportunityToGoFor ? (
    <Text className="text-red-500 text-sm mt-1">{errors.AnOpportunityToGoFor}</Text>
  ) : null}

</View>

       <YesNoSelect
            label={t(
              "InspectionForm.Does the farmer has the knowledge on cropping systems management"
            )}
            required
            value={
              formData.CroppingSystems?.DoestheFarmerHasTheKnowledgeOnCropping || null
            }
            visible={
              yesNoModalVisible &&
              activeYesNoField === "DoestheFarmerHasTheKnowledgeOnCropping"
            }
            onOpen={() => {
              setActiveYesNoField("DoestheFarmerHasTheKnowledgeOnCropping");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("DoestheFarmerHasTheKnowledgeOnCropping", value)
            }
          />

            <View className="mt-2">
                      <Text className="text-sm text-[#070707] mb-2">
                        {t("InspectionForm.What is your previous experiences with regard to the crop/cropping systems that the farmer is planning to choose")}{" "}
                        <Text className="text-red-500">*</Text>
                      </Text>
          
                      <TouchableOpacity
                        className="bg-[#F6F6F6] px-4 py-4 flex-row items-center justify-between rounded-full"
                        onPress={() =>{
                          setOverallSoilFertilityVisible(true)
                          setFormData({
                            ...formData,
                            CroppingSystems: {
                              ...formData.CroppingSystems
                            },
                          })
                        }
                        }
                      >
                        <Text
                          className={
                            formData.CroppingSystems?.WhatisYourPreviousExperiences
                              ? "text-black"
                              : "text-[#A3A3A3]"
                          }
                        >
                          {formData.CroppingSystems?.WhatisYourPreviousExperiences
                            ? t(
                                `InspectionForm.${formData.CroppingSystems.WhatisYourPreviousExperiences}`
                              )
                            : t("InspectionForm.--Select From Here--")}
                        </Text>
          
                        {!formData.CroppingSystems?.WhatisYourPreviousExperiences && (
                          <AntDesign name="down" size={20} color="#838B8C" />
                        )}
                      </TouchableOpacity>
                    </View>


              <View className="mt-4">
                      <Text className="text-sm text-[#070707] mb-2">
                        {t(
                          "InspectionForm.What is the general opinion of your friends, neighborhood farmers on proposed crop / cropping systems"
                        )}{" "}
                        *
                      </Text>
                      <View
                        className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                          errors.debts ? "border border-red-500" : ""
                        }`}
                      >
                        <TextInput
                          placeholder={t("InspectionForm.Type here...")}
                          value={formData.CroppingSystems?.WhatistheGeneralOpinionofYourFriends || ""}
                          onChangeText={(text) => {
                            let formattedText = text.replace(/^\s+/, "");
          
                            if (formattedText.length > 0) {
                              formattedText =
                                formattedText.charAt(0).toUpperCase() +
                                formattedText.slice(1);
                            }
          
                            setFormData((prev: FormData) => ({
                              ...prev,
                              CroppingSystems: {
                                ...prev.CroppingSystems,
                                WhatistheGeneralOpinionofYourFriends: formattedText,
                              },
                            }));
          
                            let error = "";
                            if (!formattedText || formattedText.trim() === "") {
                              error = t("Error.General opinion of your friends is required");
                            }
                            setErrors((prev) => ({
                              ...prev,
                              WhatistheGeneralOpinionofYourFriends: error,
                            }));
          
                     
             updateFormData({
  WhatistheGeneralOpinionofYourFriends: formattedText,
});

                          }}
                          keyboardType="default"
                          multiline={true}
                          textAlignVertical="top"
                        />
                      </View>
                      {errors.WhatistheGeneralOpinionofYourFriends && (
                        <Text className="text-red-500 text-sm mt-1 ml-2">
                          {errors.WhatistheGeneralOpinionofYourFriends}
                        </Text>
                      )}
                    </View>

        </ScrollView>

        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity
            className="flex-1 bg-[#444444] rounded-full py-4 items-center"
            onPress={() =>
              navigation.navigate("Main", {
                screen: "MainTabs",
                params: {
                  screen: "CapitalRequests",
                },
              })
            }
          >
            <Text className="text-white text-base font-semibold">
              {t("InspectionForm.Exit")}
            </Text>
          </TouchableOpacity>
          {isNextEnabled == true ? (
            <View className="flex-1"> 
              <TouchableOpacity className="flex-1 " onPress={handleNext}>
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
                  <Text className="text-white text-base font-semibold">
                    {t("InspectionForm.Next")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1 bg-gray-300 rounded-full py-4 items-center">
              <Text className="text-white text-base font-semibold">
                {t("InspectionForm.Next")}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Modal
        transparent
        animationType="fade"
        visible={overallSoilFertilityVisible}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          activeOpacity={1}
          onPress={()=>{setOverallSoilFertilityVisible(false)}}
        >
          <View className="bg-white w-80 rounded-2xl overflow-hidden">
            {[
              "No previous experience",
              "Have grown this crop once or twice",
              "Have grown this crop multiple seasons",
              "Have been cultivating this crop for many years",
            ].map((item, index, arr) => (
              <View key={item}>
                <TouchableOpacity
                  className="py-4"
                  onPress={async () => {
                    const updatedFormData = {
                      ...formData,
                      CroppingSystems: {
                        ...formData.CroppingSystems,
                        WhatisYourPreviousExperiences: item,
                      },
                    };

                    setFormData(updatedFormData);

                    try {
                      await AsyncStorage.setItem(
                        `${jobId}`,
                        JSON.stringify(updatedFormData)
                      );
                    } catch (e) {
                      console.log("AsyncStorage save failed", e);
                    }
                    setOverallSoilFertilityVisible(false);
                  }}
                >
                  <Text className="text-center text-base text-black">
                    {t(`InspectionForm.${item}`)}
                  </Text>
                </TouchableOpacity>

                {index !== arr.length - 1 && (
                  <View className="h-px bg-gray-300 mx-4" />
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CroppingSystems;
