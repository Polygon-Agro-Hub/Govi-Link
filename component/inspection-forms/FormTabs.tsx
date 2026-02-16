import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Entypo } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inspection.db");

type FormTabsProps = {
  activeKey: string;
  onTabPress?: (key: string) => void;
  navigation: StackNavigationProp<any>;
  requestId?: number;
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

const tableNames = [
  "inspectionpersonal",
  "inspectionidproof",
  "inspectionfinance",
  "inspectionland",
  "inspectioncultivation",
  "inspectioninvestment",
  "inspectioncropping",
  "inspectionprofit",
  "inspectioneconomical",
  "inspectionlabour",
  "inspectionharvest",
];

const FormTabs: React.FC<FormTabsProps> = ({
  activeKey,
  onTabPress,
  navigation,
  requestId,
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [maxAccessibleIndex, setMaxAccessibleIndex] = useState<number>(0);

  useEffect(() => {
    const checkCompletedForms = () => {
      if (!requestId) {
        setMaxAccessibleIndex(0);
        return;
      }

      try {
        let lastCompletedIndex = -1;
        
        // Check each table in order
        for (let i = 0; i < tableNames.length; i++) {
          const tableName = tableNames[i];
          
          // Check if record exists in this table
          const result = db.getFirstSync<{ requestId: number }>(
            `SELECT requestId FROM ${tableName} WHERE requestId = ?`,
            [requestId]
          );
          
          if (result) {
            lastCompletedIndex = i;
          } else {
            // Stop at first missing table
            break;
          }
        }
        
        // Set max accessible index to last completed form
        // This only allows navigation to forms that have been completed
        setMaxAccessibleIndex(lastCompletedIndex);
        
      } catch (error) {
        console.error("Error checking completed forms:", error);
        setMaxAccessibleIndex(0);
      }
    };

    checkCompletedForms();
  }, [requestId]);

  useEffect(() => {
    const x = positions[activeKey];
    if (x !== undefined) {
      scrollRef.current?.scrollTo({
        x: Math.max(x - 40, 0),
        animated: true,
      });
    }
  }, [activeKey, positions]);

  const currentIndex = tabs.indexOf(activeKey);

  const isTabAccessible = (index: number): boolean => {
    // Only allow forms that have been completed (have data in database)
    // Current form is always accessible
    return index === currentIndex || index <= maxAccessibleIndex;
  };

  const handleTabClick = (key: string, index: number) => {
    if (!isTabAccessible(index)) return;
    
    if (onTabPress) {
      onTabPress(key);
    }
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between px-4 py-3 bg-[#F6F6F6]">
        <View style={{ width: wp(15) }}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Main", {
                screen: "MainTabs",
                params: {
                  screen: "CapitalRequests",
                },
              })
            }
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

        <View className="flex-1 items-center">
          <Text className="text-xl font-semibold text-black text-center">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        <View style={{ width: wp(15) }} />
      </View>

      <View className="px-4 mt-4">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map((key, index) => {
            const isAccessible = isTabAccessible(index);
            const isCompleted = index <= maxAccessibleIndex;
            const isCurrent = key === activeKey;

            // Determine text color based on status
            let textColor = "text-[#A8A8A8]"; // Default: not clickable (gray)
            
            if (isCurrent) {
              textColor = "text-[#FA345A]"; // Current form (orange/pink)
            } else if (isCompleted && index < currentIndex) {
              textColor = "text-[#5D5D5D]"; // Completed before current (dark gray)
            } else if (isCompleted && index > currentIndex) {
              textColor = "text-[#5D5D5D]"; // Completed after current (dark gray)
            } else if (isAccessible && index < currentIndex) {
              textColor = "text-[#5D5D5D]"; // Accessible before current (dark gray)
            }

            // Determine indicator color
            let indicatorColor = "bg-[#A8A8A8]"; // Default: not clickable
            if (isCurrent) {
              indicatorColor = "bg-[#FA345A]"; // Current form
            } else if (isCompleted) {
              indicatorColor = "bg-[#5D5D5D]"; // Completed forms
            }

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={isAccessible ? 0.7 : 1}
                disabled={!isAccessible}
                onPress={() => handleTabClick(key, index)}
                onLayout={(e) => {
                  const x = e.nativeEvent.layout.x;
                  setPositions((prev) => ({ ...prev, [key]: x }));
                }}
              >
                <View className="mr-4">
                  <Text className={`text-sm pb-1 ${textColor}`}>
                    {t(`InspectionForm.${key}`)}
                  </Text>

                  <View className={`h-1.5 rounded-full ${indicatorColor}`} />
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