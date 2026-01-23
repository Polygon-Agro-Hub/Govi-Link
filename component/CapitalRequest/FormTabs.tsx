import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { AntDesign } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";

type FormTabsProps = {
  activeKey: string;
  onTabPress?: (key: string) => void;
  navigation: StackNavigationProp<any>;
};

const tabs = [
  "Personal Info",
  "ID Proof",
  "Finance Info",
  "Land Info",
  "Investment Info",
  "Cultivation Info",
  "Cropping Systems",
  "Profit & Risk",
  "Economical",
  "Labour",
  "Harvest Storage",
];

const FormTabs: React.FC<FormTabsProps> = ({
  activeKey,
  onTabPress,
  navigation,
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});

  const activeIndex = tabs.indexOf(activeKey);

  useEffect(() => {
    const x = positions[activeKey];
    if (x !== undefined) {
      scrollRef.current?.scrollTo({
        x: Math.max(x - 40, 0),
        animated: true,
      });
    }
  }, [activeKey, positions]);

  return (
    <View className=" mb-6">
      {/* Header */}
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
      <View className="px-4 mt-4">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map((key, index) => {
            const isActive = index <= activeIndex;

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.7}
                onPress={() => onTabPress?.(key)}
                onLayout={(e) => {
                  const x = e.nativeEvent.layout.x; // ✅ FIX
                  setPositions((prev) => ({ ...prev, [key]: x }));
                }}
              >
                <View className="mr-4">
                  <Text
                    className={`text-sm pb-1 ${
                      isActive ? "text-[#FA345A]" : "text-[#CACACA]"
                    }`}
                  >
                    {t(`InspectionForm.${key}`)}
                  </Text>

                  <View
                    className={`h-1.5 rounded-full ${
                      isActive ? "bg-[#FA345A]" : "bg-[#CACACA]"
                    }`}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default FormTabs;