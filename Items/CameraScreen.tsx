import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

export function CameraScreen({
  onClose,
}: {
  onClose: (imageUri: string | null) => void;
}) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      onClose(photo.uri);
    }
  };

  if (!permission?.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white mb-4">Camera permission is required</Text>
        <TouchableOpacity
          className="bg-white px-4 py-2 rounded-lg"
          onPress={requestPermission}
        >
          <Text>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        ref={cameraRef}
        onCameraReady={() => setIsReady(true)}
      />

      {/* Bottom controls */}
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
