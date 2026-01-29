import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Entypo } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

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

  // Auto-scroll to active tab
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
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-[#F6F6F6]">
        {/* Back button */}
        <View style={{ width: wp(15) }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="items-start"
          >
            <Entypo
              name="chevron-left"
              size={25}
              color="black"
              style={{
                backgroundColor: "#E0E0E080",
                borderRadius: 50,
                padding: wp(2.5),
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="flex-1 items-center">
          <Text className="text-xl font-semibold text-black text-center">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Right spacer (to keep title centered) */}
        <View style={{ width: wp(15) }} />
      </View>

      {/* Tabs */}
      <View className="px-4 mt-4">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map((key, index) => {
            const isCompletedOrCurrent = index <= activeIndex;
            const isClickable = index <= activeIndex;

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={isClickable ? 0.7 : 1}
                disabled={!isClickable}
                onPress={() => {
                  if (isClickable) {
                    onTabPress?.(key);
                  }
                }}
                onLayout={(e) => {
                  const x = e.nativeEvent.layout.x;
                  setPositions((prev) => ({ ...prev, [key]: x }));
                }}
              >
                <View className="mr-4">
                  <Text
                    className={`text-sm pb-1 ${
                      index < activeIndex
                        ? "text-[#FA345A]" // completed
                        : index === activeIndex
                          ? "text-[#FA345A]" // current
                          : "text-[#CACACA]" // future (disabled)
                    }`}
                  >
                    {t(`InspectionForm.${key}`)}
                  </Text>

                  <View
                    className={`h-1.5 rounded-full ${
                      isCompletedOrCurrent ? "bg-[#FA345A]" : "bg-[#CACACA]"
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
