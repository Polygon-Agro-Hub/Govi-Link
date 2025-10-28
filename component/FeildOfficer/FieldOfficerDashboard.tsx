import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  BackHandler,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
  FlatList,
  Pressable,
  Modal
} from "react-native";
import CircularProgress from 'react-native-circular-progress-indicator';
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
import { AntDesign,Ionicons, Feather } from "@expo/vector-icons";
import { Circle } from "react-native-progress";
import { LinearGradient } from 'expo-linear-gradient';


type FieldOfficerDashboardNavigationProps = StackNavigationProp<
  RootStackParamList,
  "FieldOfficerDashboard"
>;

interface FieldOfficerDashboardProps {
  navigation: FieldOfficerDashboardNavigationProps;
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
const FieldOfficerDashboard: React.FC<FieldOfficerDashboardProps> = ({ navigation }) => {

  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData| null> (null)
  const dispatch = useDispatch();
    const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
const [showPopup, setShowPopup] = useState(false);
const [selectedItem, setSelectedItem] = useState<any>(null);

  const scrollToIndex = (index: number) => {
    if (flatListRef.current && index >= 0 && index < dashboardData.todayVisits.length) {
      flatListRef.current.scrollToIndex({ index, animated: true });
      setCurrentIndex(index);
    }
  };

      const openDrawer = ()=>{
        navigation.dispatch(DrawerActions.openDrawer())
    }
  


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
    }
  };

   useEffect(() => {
    fetchUserProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
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

  const dashboardData = {
  profile: {
    name: "Kusal",
    empId: "CFO00001",
    avatar: "https://i.pravatar.cc/150?img=12", // replace with real avatar
  },
  todayVisits: [
    { id: "#20251012001", name: "Kelum Athukorala", type: "Consultation" },
    { id: "#20251012002", name: "Another Visit", type: "Consultation" },
  ],
  savedDrafts: [
    { id: "#20251012001", name: "Ravin Kaluhennadi", type: "Consultation", progress: 0.2 },
  ],
};

const screenWidth = Dimensions.get("window").width;

     const fetchVisits = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/officer/user-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(response.data.data);
         dispatch(setUserProfile(response.data.data));
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  return (
    <ScrollView
      className ={`flex-1 bg-white p-3 ${showPopup? "bg-black/20" : "bg-white"} `}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
        <View className="flex flex-row ">
      <TouchableOpacity
        className="flex-row items-center mb-4 p-4"
        onPress={openDrawer}
      >
        {/* <View
          className="w-16 h-16 rounded-full mr-3 bg-black"
        /> */}
        <Image
          source={
            profile?.profileImg
              ? {uri: profile.profileImg}
              : require("../../assets/mprofile.webp")
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
          <Text className="text-base font-bold">{t("Dashboard.Today Visits")} <Text className="text-[#4E6393]">({dashboardData.todayVisits.length.toString().padStart(2,'0')})</Text></Text>
          <Pressable>
            <Text className="text-pink-500 font-semibold">{t("Dashboard.View All")}</Text>
          </Pressable>
        </View>

      </View>

          <View className="flex-row items-center">
            
        {/* Left Arrow */}
        <TouchableOpacity
          disabled={currentIndex === 0}
          onPress={() => scrollToIndex(currentIndex - 1)}
          className="p-1"
        >
          <AntDesign
            name="left"
            size={24}
            color={currentIndex === 0 ? "#ccc" : "#FF1D85"}
          />
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          horizontal
          data={dashboardData.todayVisits}
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
        <Text className="text-black text-sm font-medium">{item.id}</Text>
        <Text className="text-base font-bold mt-1">{item.name}</Text>
        <Text className="text-[#4E6393] text-base mt-1">{item.type}</Text>
      </View>
    </TouchableOpacity>
          )}
        />

        {/* Right Arrow */}
        <TouchableOpacity
          disabled={currentIndex === dashboardData.todayVisits.length - 1}
          onPress={() => scrollToIndex(currentIndex + 1)}
          className="p-1"
        >
          <AntDesign
            name="right"
            size={24}
            color={currentIndex === dashboardData.todayVisits.length - 1 ? "#ccc" : "#FF1D85"}
          />
        </TouchableOpacity>
      </View>

<View className="p-2 mt-10">
        <Text className="text-base font-bold mb-3">{t("Dashboard.Saved Draft")}</Text>

</View>

      {/* Saved Drafts Section */}
      <View className="p-8 -mt-10">
            <View className="border border-[#FF1D85] rounded-lg p-3 mr-4 w-full flex-row justify-between items-center">
              <View>
                <Text className="text-black text-sm font-medium">#20251012001</Text>
                <Text className="text-base font-bold mt-1">Ravin Kaluhennadige</Text>
                <Text className="text-[#4E6393] text-base mt-1">Consultation</Text>
              </View>
             
              <CircularProgress 
               value={85}
  inActiveStrokeColor={'#E8DEF8'}
  inActiveStrokeOpacity={1}
  progressValueColor={'#000'}
  valueSuffix={'%'}
      activeStrokeColor={'#FF6B6B'}
            radius={40}
            valueSuffixStyle={{fontStyle:"normal"}}
  progressValueStyle={{ fontWeight: '500' }}

               />

            </View>
      </View>

        <View className="p-8  -mt-4">
          <TouchableOpacity
          className="bg-[#FFE5D6] rounded-lg p-3 h-28 mr-4 w-full flex-row justify-between items-center"
              style={{
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  }}>
         
              <Text className="text-base font-bold text-[#434343]">
                {t("Dashboard.Assigned Target")}
              </Text>
        <Image
          source={require("../../assets/AssignedTarget.webp")}
          style={{
            width: 100,
            height: 100,
            position: "absolute",
            bottom:0,
            right: 10,
          }}
          resizeMode="contain"
        />

            </TouchableOpacity>
      </View>

            <Modal transparent visible={showPopup} animationType="slide">
     <View className="absolute bottom-0  flex-1 w-full ">
    <View className="bg-white rounded-t-3xl p-5 w-full ">
      <Text className="text-lg font-bold text-[#434343] mb-2">
        {t("Dashboard.Assigned Target")}
      </Text>

      <Text className="text-sm text-[#555]">
        Target details or progress will appear here.
      </Text>

      <View className="items-center mt-4">
        {/* <View className="flex flex-row gap-10">
        <Text className="rounded-full text-base border font-normal border-[#9DB2CE] px-10 py-1">
          Location
        </Text>
          <Text className="rounded-full text-base border font-normal border-[#F83B4F] px-10 py-1">
          Get Call
        </Text>
        </View> */}
                <View className="flex flex-row justify-center gap-10 mb-6">
          {/* Location Button */}
          <View className="flex-row items-center border border-[#9DB2CE] rounded-full px-6 py-2">
            <Ionicons name="location-outline" size={20} color="#9DB2CE" />
            <Text className="text-base font-normal text-[#434343] ml-2">
              Location
            </Text>
          </View>

          {/* Call Button */}
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
      </Modal>

    </ScrollView>
  );
};

export default FieldOfficerDashboard;