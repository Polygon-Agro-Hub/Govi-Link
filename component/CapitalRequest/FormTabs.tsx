import React from "react";
import { View, Text, TouchableOpacity , ScrollView, StyleSheet} from "react-native";
import { useTranslation } from "react-i18next";

type FormTabsProps = {
  activeKey: "Personal Info" | "ID Proof" | "Finance Info" | "Land Info" | "Investment Info" | "Cultivation Info" | "Cropping Systems" | "Profit & Risk" | "Economical" | "Labour" | "Harvest Storage";
  onTabPress?: (key: string) => void;
};

const FormTabs: React.FC<FormTabsProps> = ({
  activeKey,
  onTabPress,
}) => {
  const {t} = useTranslation();
  const tabs = [
    { key: "Personal Info", label: "Personal Info" },
    { key: "ID Proof", label: "ID Proof" },
    { key: "Finance Info", label: "Finance Info" },
    { key: "Land Info", label: "Land Info" },
    { key: "Investment Info", label: "Investment Info" },
        { key: "Cultivation Info", label: "Cultivation Info" },
    { key: "Cropping Systems", label: "Cropping Systems" },
    { key: "Profit & Risk", label: "Profit & Risk" },
    { key: "Economical", label: "Economical" },
    { key: "Labour", label: "Labour" },
        { key: "Harvest Storage", label: "Harvest Storage" },
  ];

  return (
    <View className="flex-row justify-between px-6 mb-6 mt-6">
      <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
  >

      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onTabPress?.(tab.key)}
          >
            <View className="mr-3">
            <Text
              className={`text-sm pb-1 ${
                isActive
                  ? "text-[#FA345A] "
                  : "text-[#CACACA]"
              }`}
            >
              {t(`InspectionForm.${tab.label}`)}
            </Text>
                {isActive ?
      <View className="mt-1 h-1.5 w-full  bg-[#FA345A] rounded-full" />
:      <View className="mt-1 h-1.5 w-full  bg-[#CACACA] rounded-full" />
      
    }
    </View>
          </TouchableOpacity>

        );
      })}
    </ScrollView>
    </View>
  );
};

export default FormTabs;
