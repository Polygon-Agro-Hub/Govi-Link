import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
  Pressable,
  Modal,
   BackHandler, TouchableWithoutFeedback
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { useTranslation } from "react-i18next";
import { DrawerActions } from '@react-navigation/native';
import i18n from "@/i18n/i18n";
import { useDispatch } from "react-redux";
import { setUserProfile } from "@/store/authSlice";
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign,Ionicons, Feather } from "@expo/vector-icons";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
type DashboardNavigationProps = StackNavigationProp<
  RootStackParamList,
  "Dashboard"
>;

interface DashboardProps {
  navigation: DashboardNavigationProps;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  profileImg: string;
  firstNameSinhala: string;
  lastNameSinhala: string;
  firstNameTamil: string;
  lastNameTamil: string;
  empId: string
}
interface VisitsData {
  farmerName:string;
  jobId: string;
  propose: string;
  englishName: string;
  sinhalaName:string;
  tamilName:string
}
const Dashboard: React.FC<DashboardProps> = ({ navigation }) => {

  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData| null> (null)
  const dispatch = useDispatch();
    const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
const [showPopup, setShowPopup] = useState(false);
const [selectedItem, setSelectedItem] = useState<any>(null);
const[visitsData, setVisitsData] = useState<VisitsData[]>([])
console.log("Officer Visits", visitsData)

      const openDrawer = ()=>{
        navigation.dispatch(DrawerActions.openDrawer())
    }
  

  const scrollToIndex = (index: number) => {
  if (!flatListRef.current || !visitsData || visitsData.length === 0) return;

  // Declare outside the try block so it's always in scope
  const validIndex = Math.max(0, Math.min(index, visitsData.length - 1));

  try {
    flatListRef.current.scrollToIndex({ index: validIndex, animated: true });
    setCurrentIndex(validIndex);
  } catch (error) {
    console.warn("scrollToIndex error:", error);
    flatListRef.current.scrollToOffset({
      offset: validIndex * 320, // use your card width here
      animated: true,
    });
  }
};

     const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/auth/user-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(response.data.data);
         dispatch(setUserProfile(response.data.data));
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }finally{
       setRefreshing(false);
    }
  };

   useEffect(() => {
    fetchUserProfile();
        fetchVisits()
  }, []);

   const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    await fetchVisits()
    setRefreshing(false);
  };
    const getName = () => {
    if (!profile) return "Loading...";
    switch (i18n.language) {
      case "si":
        return `${profile.firstNameSinhala}`;
      case "ta":
        return `${profile.firstNameTamil}`;
      default:
        return `${profile.firstName}`;
    }
  };
const getProposeName = (item: VisitsData) => {
  if (!item) return "";

  switch (i18n.language) {
    case "si":
      return item.sinhalaName || item.propose || "";
    case "ta":
      return item.tamilName || item.propose || "";
    default:
      return item.englishName || item.propose || "";
  }
};

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
   const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

    const getTextStyle = () => {
    if (i18n.language === "si") {
      return {
        fontSize: 16,
        lineHeight: 20,
      };
    }
  };
     const fetchVisits = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/officer/officer-visits`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVisitsData(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch officer visits:", error);
    }finally{
       setRefreshing(false);
    }
  };


  useEffect(() => {
  const backAction = () => {
    if (showPopup) {
      setShowPopup(false); // Close modal if open
      return true; // Prevent default back action
    }
    return false; // Let default back action happen
  };

  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => backHandler.remove();
}, [showPopup]);
  return (
    <ScrollView
      className ={`flex-1 bg-white p-3  `}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
        <View className="flex flex-row ">
      <TouchableOpacity
        className="flex-row items-center mb-4 p-4"
        onPress={openDrawer}
      >
        <Image
          source={
            profile?.profileImg
              ? {uri: profile.profileImg}
              : require("../../assets/myprofile.webp")
          }
          className="w-16 h-16 rounded-full mr-3"
        />
        
        <View>
               <Text    style={[{ fontSize: 16 }, getTextStyle()]}
            className="text-lg font-bold">
         {t("Dashboard.Hello")}, {getName()}

        </Text>
               <Text
            className="text-[#6E7F96] text-lg"
          >
            {profile?.empId}
          </Text>
          </View>
      </TouchableOpacity>
      <View>
 
      </View>
</View>


   <View className="p-2 mt-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-bold">{t("Dashboard.Today Visits")} <Text className="text-[#4E6393]">({visitsData.length.toString().padStart(2,'0')})</Text></Text>
          <Pressable>
            <Text className="text-pink-500 font-semibold">{t("Dashboard.View All")}</Text>
          </Pressable>
        </View>

      </View>
{visitsData.length > 0 ? (
  <View className="flex-row items-center">
            
        {/* <TouchableOpacity
          disabled={currentIndex === 0}
          onPress={() => scrollToIndex(currentIndex - 1)}
          className="p-1"
        >
          <AntDesign
            name="left"
            size={24}
            color={currentIndex === 0 ? "#ccc" : "#FF1D85"}
          />
        </TouchableOpacity> */}
        <TouchableOpacity
  disabled={!visitsData || currentIndex <= 0}
  onPress={() => scrollToIndex(currentIndex - 1)}
  className="p-1"
>
  <AntDesign
    name="left"
    size={24}
    color={!visitsData || currentIndex <= 0 ? "#ccc" : "#FF1D85"}
  />
</TouchableOpacity>

        <FlatList
          ref={flatListRef}
          horizontal
          data={visitsData}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            // <View className="border border-[#FF1D85] rounded-lg p-3 mr-4 w-[304px]">
            //   <Text className="text-black text-sm font-medium">{item.id}</Text>
            //   <Text className="text-base font-bold mt-1">{item.name}</Text>
            //   <Text className="text-[#4E6393] text-base mt-1">{item.type}</Text>
            // </View>
                <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (item.type === "Consultation") {
          setSelectedItem(item);
          setShowPopup(true);
        }
      }}
    >
      <View className="border border-[#FF1D85] rounded-lg p-3 mr-4 w-[304px]">
        <Text className="text-black text-sm font-medium">#{item.jobId}</Text>
        {item.farmerName? (
                <Text className="text-base font-bold mt-1">{item.farmerName}</Text>
        ): null
        }
        {item.propose? (
        <Text className="text-[#4E6393] text-base mt-1">
  {(() => {
    if (item.propose === "Cluster") {
      switch (i18n.language) {
        case "si":
          return "ගොවි සමූහ විගණනය"; // Sinhala translation
        case "ta":
          return "உழவர் குழு தணிக்கை"; // Tamil translation
        default:
          return "Farm Cluster Audit";
      }
    } else if (item.propose === "Individual") {
      switch (i18n.language) {
        case "si":
          return "තනි ගොවි විගණනය"; // Sinhala translation
        case "ta":
          return "தனிப்பட்ட விவசாயி தணிக்கை"; // Tamil translation
        default:
          return "Individual Farmer Audit";
      }
    } else {
      switch (i18n.language) {
        case "si":
          return item.sinhalaName || "";
        case "ta":
          return item.tamilName || "";
        default:
          return item.englishName || "";
      }
    }
  })()}
</Text>

        ): null}
             {item.englishName || item.sinhalaName || item.tamilName? (
        <Text className="text-[#4E6393] text-base mt-1">{getProposeName(item)}</Text>

        ): null}
      </View>
    </TouchableOpacity>
          )}
        />

<TouchableOpacity
  disabled={!visitsData || currentIndex >= visitsData.length - 1}
  onPress={() => scrollToIndex(currentIndex + 1)}
  className="p-1"
>
  <AntDesign
    name="right"
    size={24}
    color={
      !visitsData || currentIndex >= visitsData.length - 1 ? "#ccc" : "#FF1D85"
    }
  />
</TouchableOpacity>
      </View>
): 
(
  <View className=" justify-center items-center mt-4">
    <Image source={require('../../assets/no tasks.webp')}
           style={{
            width: 140,
            height: 100,
          }}
          resizeMode="contain" />
          <Text className="italic text-[#787878]">{t("Dashboard.No Jobs for Today")}</Text>
  </View>
)
}
        

<View className="p-2 mt-10">
        <Text className="text-base font-bold mb-3">{t("Dashboard.Saved Draft")}</Text>

</View>

      <View className="p-8 -mt-10">
            <View className="border border-[#FF1D85] rounded-lg p-3 mr-4 w-full flex-row justify-between items-center">
              <View>
                <Text className="text-black text-sm font-medium">#20251012001</Text>
                <Text className="text-base font-bold mt-1">Ravin Kaluhennadige</Text>
                <Text className="text-[#4E6393] text-base mt-1">Consultation</Text>
              </View>
             
<AnimatedCircularProgress
  size={70}
  width={6}
  fill={85}
  tintColor="#FF6B6B"
  backgroundColor="#E8DEF8"
  onAnimationComplete={() => console.log('Animation complete')}
>
  {(fill: number) => (
    <Text className="text-black text-base font-semibold">
      {Math.round(fill)}%
    </Text>
  )}
</AnimatedCircularProgress>

            </View>
      </View>
      <TouchableOpacity className="bg-black p-4  w-40 rounded-full"
      onPress={()=>setShowPopup(true)}>
        <Text className="text-white text-center">Popup</Text>
      </TouchableOpacity>

            {/* <Modal transparent visible={showPopup} animationType="slide">
     <View className="absolute bottom-0  flex-1 w-full ">
    <View className="bg-white rounded-t-3xl p-5 w-full ">
      <Text className="text-lg font-bold text-[#434343] mb-2">
        {t("Dashboard.Assigned Target")}
      </Text>

      <Text className="text-sm text-[#555]">
        Target details or progress will appear here.
      </Text>

      <View className="items-center mt-4">

                <View className="flex flex-row justify-center gap-10 mb-6">
          <View className="flex-row items-center border border-[#9DB2CE] rounded-full px-6 py-2">
            <Ionicons name="location-outline" size={20} color="#9DB2CE" />
            <Text className="text-base font-normal text-[#434343] ml-2">
              Location
            </Text>
          </View>

          <View className="flex-row items-center border border-[#F83B4F] rounded-full px-6 py-2">
            <Feather name="phone-call" size={18} color="#F83B4F" />
            <Text className="text-base font-normal text-[#434343] ml-2">
              Get Call
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setShowPopup(false)}>
          <LinearGradient
            colors={["#F2561D", "#FF1D85"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-2 px-[40%] items-center justify-center rounded-full"
          >
            <Text className="text-white text-lg font-semibold">Start</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  </View>
      </Modal> */}
<Modal transparent visible={showPopup} animationType="slide">
  <TouchableWithoutFeedback onPress={() => setShowPopup(false)}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
      
      <TouchableWithoutFeedback>
    <View className="bg-white rounded-t-3xl p-5 w-full ">
      <Text className="text-lg font-bold text-[#434343] mb-2">
        {t("Dashboard.Assigned Target")}
      </Text>

      <Text className="text-sm text-[#555]">
        Target details or progress will appear here.
      </Text>

      <View className="items-center mt-4">

                <View className="flex flex-row justify-center gap-10 mb-6">
          <View className="flex-row items-center border border-[#9DB2CE] rounded-full px-6 py-2">
            <Ionicons name="location-outline" size={20} color="#9DB2CE" />
            <Text className="text-base font-normal text-[#434343] ml-2">
              Location
            </Text>
          </View>

          <View className="flex-row items-center border border-[#F83B4F] rounded-full px-6 py-2">
            <Feather name="phone-call" size={18} color="#F83B4F" />
            <Text className="text-base font-normal text-[#434343] ml-2">
              Get Call
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setShowPopup(false)}>
          <LinearGradient
            colors={["#F2561D", "#FF1D85"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-2 px-[40%] items-center justify-center rounded-full"
          >
            <Text className="text-white text-lg font-semibold">Start</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
      </TouchableWithoutFeedback>

    </View>
  </TouchableWithoutFeedback>
</Modal>
    </ScrollView>
  );
};

export default Dashboard;