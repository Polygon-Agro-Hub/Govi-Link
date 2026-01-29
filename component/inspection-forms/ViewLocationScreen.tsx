import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { AntDesign } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RootStackParamList } from "../types";
import { useTranslation } from "react-i18next";

type ViewLocationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewLocationScreen"
>;

type ViewLocationScreenRouteProp = RouteProp<
  RootStackParamList,
  "ViewLocationScreen"
>;

interface ViewLocationScreenProps {
  navigation: ViewLocationScreenNavigationProp;
  route: ViewLocationScreenRouteProp;
}

const ViewLocationScreen: React.FC<ViewLocationScreenProps> = ({
  navigation,
  route,
}) => {
  const webViewRef = useRef<WebView>(null);

  const { latitude, longitude } = route.params;

  const lat = latitude || 7.2008;
  const lng = longitude || 79.8358;
  const { t } = useTranslation();
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${lat}, ${lng}], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        var redIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        var marker = L.marker([${lat}, ${lng}], { icon: redIcon }).addTo(map);

        marker.bindPopup(
          '<div style="font-size:14px; font-weight:600; color:#828282;">${t("InspectionForm.Attached")}</div>'
        ).openPopup();

        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (map.tap) map.tap.disable();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View className="flex-row items-center justify-center py-4 mt-2">
        <TouchableOpacity
          className="absolute left-4 bg-[#F3F3F3] rounded-full p-4"
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="left" size={20} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-black">
          {t("InspectionForm.View Geo Location")}
        </Text>
      </View>

      {/* Map */}
      <View
        style={{
          flex: 1,
          marginHorizontal: wp(4),
          marginVertical: hp(2),
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: leafletHTML }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

export default ViewLocationScreen;
