import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type ModalType = "confirmation" | "success" | "error";

interface ConfirmationModalProps {
  visible: boolean;
  type: ModalType;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  type,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case "confirmation":
        return (
          <View className="w-16 h-16 bg-gray-400 rounded-full items-center justify-center mb-6">
            <MaterialIcons name="info-outline" size={32} color="white" />
          </View>
        );
      case "success":
        return (
          <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-6">
            <MaterialIcons name="check" size={32} color="white" />
          </View>
        );
      case "error":
        return (
          <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center mb-6">
            <MaterialIcons name="close" size={32} color="white" />
          </View>
        );
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "confirmation":
        return t("InspectionForm.Submit Confirmation");
      case "success":
        return t("InspectionForm.Success");
      case "error":
        return t("InspectionForm.Error");
    }
  };

  const getMessage = () => {
    if (message) return message;
    switch (type) {
      case "confirmation":
        return t(
          "InspectionForm.You have filled out all the forms. If you need to make any changes, you can go back. Otherwise, continuing will take you to the confirmation step."
        );
      case "success":
        return t("InspectionForm.Inspection form completed successfully!");
      case "error":
        return t("InspectionForm.Could not save to server. Please try again.");
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-white rounded-3xl w-full max-w-md p-8 items-center">
          {getIcon()}

          <Text className="text-2xl font-bold text-black text-center mb-4">
            {getTitle()}
          </Text>

          <Text className="text-base text-gray-600 text-center mb-8 leading-6">
            {getMessage()}
          </Text>

          <View className="w-full gap-3">
            {type === "confirmation" && (
              <>
                <TouchableOpacity
                  className="bg-white border-2 border-gray-300 rounded-full py-4 items-center"
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text className="text-black text-base font-semibold">
                    {t("InspectionForm.Go Back")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-[#1A1A1A] rounded-full py-4 items-center mt-6"
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text className="text-white text-base font-semibold">
                    {t("InspectionForm.Continue")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {(type === "success" || type === "error") && (
              <TouchableOpacity
                className="bg-[#1A1A1A] rounded-full py-4 items-center"
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text className="text-white text-base font-semibold">
                  {t("MAIN.OK")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;