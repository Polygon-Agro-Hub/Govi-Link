import React, { useState, useEffect, useCallback } from "react";
import { Animated, TouchableOpacity, View, Keyboard } from "react-native";
import { useTranslation } from "react-i18next";
import { AntDesign, MaterialIcons, Ionicons, Octicons,Entypo,FontAwesome6 } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../services/store";
interface UserData {
  farmCount: number;
  membership: string;
  paymentActiveStatus: string | null;
  role: string;
}

const NavigationBar = ({ navigation, state }: { navigation: any; state: any }) => {
  const { t } = useTranslation();
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [scales] = useState(() => new Array(4).fill(0).map(() => new Animated.Value(1)));
 
   const userRole = useSelector(
    (state: RootState) => state.auth.jobRole
  );
console.log('user rolllllllll', userRole)
   const tabs = [
    { name: "Dashboard", icon: <FontAwesome6 name="house" size={24} color="#000" /> },
    { name: "Tasks", icon: <MaterialIcons name="task" size={24} color="#000" /> },
    { name: "AddAssignment", icon: <Entypo name="add-user" size={24} color="#000" /> },
    { name: "Users", icon: <Entypo name="users" size={24} color="#000" /> },
  ];

  let currentTabName = state.routes[state.index]?.name ;
  console.log(currentTabName)

  
  const handleTabPress = async (tabName: string, index: number) => {
    Animated.spring(scales[index], {
      toValue: 1.1,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scales[index], {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
    navigation.navigate(tabName);
  };

   if (isKeyboardVisible || userRole==="Field Officer") return null;

  return (
    <View className="absolute bottom-0 flex-row justify-between items-center bg-[#ffffff] py-2 px-6 rounded-t-3xl w-full shadow-md"
      style={{
                shadowColor: "#000" ,
                shadowOpacity: 2,
                shadowRadius: 4,
                elevation: 20 
              }}
    >
      {tabs.map((tab, index) => {
  const isFocused = currentTabName === tab.name;
  return (
    <View
      key={index}
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        height: 40,
      }}
    >
      <View
        className={`px-8 absolute top-0 -mt-2 py-0.5 rounded-b-full ${
          isFocused ? "bg-[#F35125]" : "bg-transparent"
        }`}
      />
      <TouchableOpacity onPress={() => handleTabPress(tab.name, index)}>
        <Animated.View style={{ transform: [{ scale: scales[index] }] }}>
          {React.cloneElement(tab.icon, {
            color: isFocused ? "#F35125" : "#9DB2CE",
          })}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
})}

    </View>
  );
};

export default NavigationBar;
