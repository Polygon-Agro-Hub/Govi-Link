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
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "./FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
type FormData = {
  HarvestStorage?: HarvestStorageData;
};
type HarvestStorageData = {

};
type HarvestStorageProps = {
  navigation: any;
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
const HarvestStorage: React.FC<HarvestStorageProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "HarvestStorage">>();
  const { requestNumber } = route.params;
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yesNoModalVisible, setYesNoModalVisible] = useState(false);
  const [activeYesNoField, setActiveYesNoField] = useState<string | null>(null);

  const [isNextEnabled, setIsNextEnabled] = useState(false);


  console.log("finance", formData);

useEffect(() => {
  const hs = formData?.inspectionharveststorage ?? {};

  const hasOwnStorageValid =
    hs.hasOwnStorage === "Yes" || hs.hasOwnStorage === "No";

  let facilityAccessValid = true;

  if (hs.hasOwnStorage === "No") {
    facilityAccessValid =
      hs.ifNotHasFacilityAccess === "Yes" ||
      hs.ifNotHasFacilityAccess === "No";
  }

  const primaryProcessingValid =
    hs.hasPrimaryProcessingAccess === "Yes" ||
    hs.hasPrimaryProcessingAccess === "No";

  const valueAdditionTechValid =
    hs.knowsValueAdditionTech === "Yes" ||
    hs.knowsValueAdditionTech === "No";

  const marketLinkageValid =
    hs.hasValueAddedMarketLinkage === "Yes" ||
    hs.hasValueAddedMarketLinkage === "No";

  const qualityStandardsValid =
    hs.awareOfQualityStandards === "Yes" ||
    hs.awareOfQualityStandards === "No";

  const hasErrors = Object.values(errors).some(Boolean);

  setIsNextEnabled(
    hasOwnStorageValid &&
      facilityAccessValid &&
      primaryProcessingValid &&
      valueAdditionTechValid &&
      marketLinkageValid &&
      qualityStandardsValid &&
      !hasErrors
  );
}, [formData, errors]);




  let jobId = requestNumber;
  console.log("jobid", jobId);

const updateFormData = async (updates: Partial<HarvestStorageData>) => {
  try {
    const updatedFormData = {
      ...formData,
      inspectionharveststorage: {
        ...formData.inspectionharveststorage,
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
          const savedData = await AsyncStorage.getItem(
            `${jobId}`
          );
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

    navigation.navigate("CultivationInfo", { formData, requestNumber });
  };


const handleyesNOFieldChange = async (key: string, value: "Yes" | "No") => {
  let updatedData = {
    ...formData.inspectionharveststorage,
    [key]: value,
  };

  if (key === "hasOwnStorage" && value === "Yes") {
    delete updatedData.ifNotHasFacilityAccess;
  }

  const updatedFormData = {
    ...formData,
    inspectionharveststorage: updatedData,
  };

  setFormData(updatedFormData);
  await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
};



  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="flex-row items-center justify-center py-4 mt-2">
          <TouchableOpacity
            className="absolute left-4 bg-[#F3F3F3] rounded-full p-4"
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="Labour" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
         <YesNoSelect
            label={t("InspectionForm.Does the farmer own storage facility")}
            required
            value={formData.inspectionharveststorage?.hasOwnStorage|| null}
            visible={
              yesNoModalVisible && activeYesNoField === "hasOwnStorage"
            }
            onOpen={() => {
              setActiveYesNoField("hasOwnStorage");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("hasOwnStorage", value)
            }
          />

{formData.inspectionharveststorage?.hasOwnStorage === "No" && (
  <YesNoSelect
    label={t(
      "InspectionForm.If not, does the farmer have access to such facility"
    )}
    required
    value={formData.inspectionharveststorage?.ifNotHasFacilityAccess || null}
    visible={
      yesNoModalVisible &&
      activeYesNoField === "ifNotHasFacilityAccess"
    }
    onOpen={() => {
      setActiveYesNoField("ifNotHasFacilityAccess");
      setYesNoModalVisible(true);
    }}
    onClose={() => {
      setYesNoModalVisible(false);
      setActiveYesNoField(null);
    }}
    onSelect={(value) =>
      handleyesNOFieldChange("ifNotHasFacilityAccess", value)
    }
  />
)}

  <YesNoSelect
            label={t("InspectionForm.Does the farmer has access to primary processing facility")}
            required
            value={formData.inspectionharveststorage?.hasPrimaryProcessingAccess|| null}
            visible={
              yesNoModalVisible && activeYesNoField === "hasPrimaryProcessingAccess"
            }
            onOpen={() => {
              setActiveYesNoField("hasPrimaryProcessingAccess");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("hasPrimaryProcessingAccess", value)
            }
          />
            <YesNoSelect
            label={t("InspectionForm.Does the farmer knows technologies for value addition of your crop")}
            required
            value={formData.inspectionharveststorage?.knowsValueAdditionTech || null}
            visible={
              yesNoModalVisible && activeYesNoField === "knowsValueAdditionTech"
            }
            onOpen={() => {
              setActiveYesNoField("knowsValueAdditionTech");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("knowsValueAdditionTech", value)
            }
          />

                      <YesNoSelect
            label={t("InspectionForm.Does the farmer has market linkage for value added products")}
            required
            value={formData.inspectionharveststorage?.hasValueAddedMarketLinkage || null}
            visible={
              yesNoModalVisible && activeYesNoField === "hasValueAddedMarketLinkage"
            }
            onOpen={() => {
              setActiveYesNoField("hasValueAddedMarketLinkage");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("hasValueAddedMarketLinkage", value)
            }
          />

                                <YesNoSelect
            label={t("InspectionForm.Is farmer aware about required quality standards of value added products of proposed crops")}
            required
            value={formData.inspectionharveststorage?.awareOfQualityStandards || null}
            visible={
              yesNoModalVisible && activeYesNoField === "awareOfQualityStandards"
            }
            onOpen={() => {
              setActiveYesNoField("awareOfQualityStandards");
              setYesNoModalVisible(true);
            }}
            onClose={() => {
              setYesNoModalVisible(false);
              setActiveYesNoField(null);
            }}
            onSelect={(value) =>
              handleyesNOFieldChange("awareOfQualityStandards", value)
            }
          />
        </ScrollView>
      
        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity
            className="flex-1 bg-[#444444] rounded-full py-4 items-center"
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text className="text-white text-base font-semibold">
              {t("InspectionForm.Back")}
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
    </KeyboardAvoidingView>
  );
};

export default HarvestStorage;
