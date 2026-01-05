import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, StatusBar, Modal } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RootStackParamList } from "../types";
import LottieView from "lottie-react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";


type AttachGeoLocationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AttachGeoLocationScreen"
>;

type AttachGeoLocationScreenRouteProp = RouteProp<
  RootStackParamList,
  "AttachGeoLocationScreen"
>;

interface AttachGeoLocationScreenProps {
  navigation: AttachGeoLocationScreenNavigationProp;
  route: AttachGeoLocationScreenRouteProp;
}

const AttachGeoLocationScreen: React.FC<AttachGeoLocationScreenProps> = ({
  navigation,
  route,
}) => {
  const webViewRef = useRef<WebView>(null);

  const currentLatitude = route.params?.currentLatitude;
  const currentLongitude = route.params?.currentLongitude;
//   const onLocationSelect = route.params?.onLocationSelect;

  const [markerPosition, setMarkerPosition] = useState({
    latitude: currentLatitude || 7.2008,
    longitude: currentLongitude || 79.8358,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [locationName, setLocationName] = useState("Tap on the map to select a location");
const {t} = useTranslation();
  useEffect(() => {
    if (!currentLatitude || !currentLongitude) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("Error.Permission Denied"),
          t("Error.Location permission is required to use this feature."),
              [{ text: t("MAIN.OK") }]
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newPosition = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setMarkerPosition(newPosition);

      // Update map via WebView
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          updateMarkerPosition(${newPosition.latitude}, ${newPosition.longitude});
          true;
        `);
      }

      await getAddressFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(t("Error.Error"), t("Error.Unable to get your current location"),[{ text: t("MAIN.OK") }] );
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (results.length > 0) {
        const address = results[0];
        const addressString = [
          address.street,
          address.city,
          address.region,
          address.country,
        ]
          .filter(Boolean)
          .join(", ");
        setLocationName(addressString || "Location selected");
      }
    } catch (error) {
      console.error("Error getting address:", error);
      setLocationName("Location selected");
    }
  };

  const handleConfirmLocation = async () => {
    setIsAttaching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (route.params?.onLocationSelect) {
      route.params.onLocationSelect(
        markerPosition.latitude,
        markerPosition.longitude,
        locationName
      );
    }
    
    setIsAttaching(false);
    navigation.goBack();
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        const { lat, lng } = data;
        setMarkerPosition({ latitude: lat, longitude: lng });
        getAddressFromCoordinates(lat, lng);
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

 const leafletHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      body, html {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
      }
      #map {
        height: 100%;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      // Initialize map
      var map = L.map('map').setView([${markerPosition.latitude}, ${markerPosition.longitude}], 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Define red icon
      var redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Add marker with red icon
      var marker = L.marker([${markerPosition.latitude}, ${markerPosition.longitude}], {
        icon: redIcon,
        draggable: false
      }).addTo(map);

      // Handle map clicks
      map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;

        // Update marker position
        marker.setLatLng([lat, lng]);

        // Send coordinates to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapClick',
          lat: lat,
          lng: lng
        }));
      });

      // Function to update marker from React Native
      function updateMarkerPosition(lat, lng) {
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], 13);
      }

      // Disable scroll zoom on mobile for better UX
      if (window.innerWidth < 768) {
        map.scrollWheelZoom.disable();
      }
    </script>
  </body>
  </html>
`;


  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      {/* <View 
        className="bg-white flex-row items-center shadow-lg px-3 py-4 mt-[-10%]"
        style={{
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: wp(2), paddingVertical: hp(1) }}
        >
          <View className="p-4 bg-[#F6F6F680] rounded-full justify-center items-center">
            <AntDesign name="left" size={20} color="black" />
          </View>
        </TouchableOpacity>

        <Text className="flex-1 text-center text-lg font-semibold text-black mr-9">
          Attach Geo Location
        </Text>
      </View> */}
        <View className="flex-row items-center justify-center py-4 mt-2">
          <TouchableOpacity
            className="absolute left-4 bg-[#F3F3F3] rounded-full p-4"
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Attach Geo Location")}
          </Text>
        </View>
      <View className="items-center justify-center mt-[2%]">
        <Text className="text-[#828282]">{t("InspectionForm.Tap on the map to select a location.")}</Text>
      </View>

      {/* Map WebView */}
      <View style={{ flex: 1, marginTop: hp(2), marginHorizontal: wp(4) }}>
        <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: leafletHTML }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            style={{ flex: 1 }}
          />
        </View>

        {/* Use My Location Floating Button */}
        <TouchableOpacity
          onPress={getCurrentLocation}
          disabled={isLoading}
          style={{
            position: "absolute",
            right: wp(4),
            bottom: hp(2),
            backgroundColor: "#fff",
            width: wp(12),
            height: wp(12),
            borderRadius: wp(6),
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="locate" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Buttons */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 flex-row justify-between">
        <TouchableOpacity
          onPress={getCurrentLocation}
          disabled={isLoading || isAttaching}
          className="flex-1 mr-2"
        >
          <View className={`bg-[#444444] rounded-full py-4 px-4 flex-row items-center justify-center`}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text className="text-white font-semibold ml-2 text-sm">
                  
                  {t("InspectionForm.Use My Location")}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirmLocation}
          disabled={isAttaching}
          className="flex-1 "
        >
          {/* <View className={`bg-[#874DDB] rounded-full py-3 px-4 flex-row items-center justify-center shadow-md ${isAttaching ? 'opacity-50' : ''}`}>
            <Ionicons name="checkmark" size={20} color="white" />
            <Text className="text-white font-bold ml-2 text-sm">
              Confirm Now
            </Text>
          </View> */}

                        <LinearGradient
                                    colors={["#F35125", "#FF1D85"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className=" rounded-full py-3 p-3 items-center flex-row gap-x-1"
                                    style={{
                                      shadowColor: "#000",
                                      shadowOffset: { width: 0, height: 3 },
                                      shadowOpacity: 0.25,
                                      shadowRadius: 5,
                                      elevation: 6,
                                    }}
                                  >
                                                    <MaterialIcons name="done" size={24} color="#fff" />

                      <Text className="text-white text-base font-semibold">{t("InspectionForm.Confirm Now")}</Text>
                      </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Loading Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isAttaching}
        onRequestClose={() => {}}
      >
        <View 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View 
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              minWidth: wp(70),
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            {/* <LottieView
              source={require("../assets/images/loading.json")}
              style={{ width: wp(20), height: hp(20) }}
              autoPlay
              loop
            />
             */}
             <ActivityIndicator size="large" color="#FA345A" />
            <Text 
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#000',
                textAlign: 'center',
              }}
              className="mt-4"
            >
              {t("InspectionForm.Attaching your geo location..")}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttachGeoLocationScreen;