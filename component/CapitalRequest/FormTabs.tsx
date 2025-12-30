// import React from "react";
// import { View, Text, TouchableOpacity , ScrollView, StyleSheet} from "react-native";
// import { useTranslation } from "react-i18next";

// type FormTabsProps = {
//   activeKey: "Personal Info" | "ID Proof" | "Finance Info" | "Land Info" | "Investment Info" | "Cultivation Info" | "Cropping Systems" | "Profit & Risk" | "Economical" | "Labour" | "Harvest Storage";
//   onTabPress?: (key: string) => void;
// };

// const FormTabs: React.FC<FormTabsProps> = ({ activeKey, onTabPress }) => {
//   const { t } = useTranslation();

//   const tabs = [
//     { key: "Personal Info", label: "Personal Info" },
//     { key: "ID Proof", label: "ID Proof" },
//     { key: "Finance Info", label: "Finance Info" },
//     { key: "Land Info", label: "Land Info" },
//     { key: "Investment Info", label: "Investment Info" },
//     { key: "Cultivation Info", label: "Cultivation Info" },
//     { key: "Cropping Systems", label: "Cropping Systems" },
//     { key: "Profit & Risk", label: "Profit & Risk" },
//     { key: "Economical", label: "Economical" },
//     { key: "Labour", label: "Labour" },
//     { key: "Harvest Storage", label: "Harvest Storage" },
//   ];

//   const activeIndex = tabs.findIndex(tab => tab.key === activeKey);

//   return (
//     <View className="flex-row justify-between px-6 mb-6 mt-6">
//       <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//         {tabs.map((tab, index) => {
//           const isActive = index <= activeIndex; // ⭐ MAIN LOGIC

//           return (
//             <TouchableOpacity
//               key={tab.key}
//               activeOpacity={0.7}
//               onPress={() => onTabPress?.(tab.key)}
//             >
//               <View className="mr-3">
//                 <Text
//                   className={`text-sm pb-1 ${
//                     isActive ? "text-[#FA345A]" : "text-[#CACACA]"
//                   }`}
//                 >
//                   {t(`InspectionForm.${tab.label}`)}
//                 </Text>

//                 <View
//                   className={`mt-1 h-1.5 w-full rounded-full ${
//                     isActive ? "bg-[#FA345A]" : "bg-[#CACACA]"
//                   }`}
//                 />
//               </View>
//             </TouchableOpacity>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );
// };


// export default FormTabs;


import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

type FormTabsProps = {
  activeKey: string;
  onTabPress?: (key: string) => void;
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

const FormTabs: React.FC<FormTabsProps> = ({ activeKey, onTabPress }) => {
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
    <View className="px-6 mt-6 mb-6">
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
  );
};

export default FormTabs;
