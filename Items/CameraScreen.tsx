import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Text, Linking, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import CameraAccess from "../component/permission/CameraAccess";

export function CameraScreen({
  onClose,
}: {
  onClose: (imageUri: string | null) => void;
}) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      onClose(photo?.uri ?? null);
    }
  };

  if (!permission?.granted) {
    return (
      <CameraAccess
        navigation={null as any}
        onPermissionGranted={requestPermission}
      />
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        ref={cameraRef}
        onCameraReady={() => setIsReady(true)}
      />

      <View className="absolute bottom-12 w-full flex-row justify-center items-center">
        <TouchableOpacity
          className="bg-white/70 p-4 rounded-full mx-5"
          onPress={() => onClose(null)}
        >
          <Ionicons name="close" size={32} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white p-5 rounded-full"
          disabled={!isReady}
          onPress={takePhoto}
        >
          <Ionicons name="camera" size={40} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
