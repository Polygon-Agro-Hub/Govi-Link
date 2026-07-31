import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import CustomHeader from "../commons/CustomHeader";
import { t } from "i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";

type AddOnboardSupplierOfficerNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddOnboardSupplierOfficer"
>;

interface AddOnboardSupplierOfficerProps {
  navigation: AddOnboardSupplierOfficerNavigationProp;
}

const AddOnboardSupplierOfficer: React.FC<AddOnboardSupplierOfficerProps> = ({
  navigation,
}) => {
  const [supplierName, setSupplierName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [nic, setNic] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const clearError = (field: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const setError = (field: string, message: string) =>
    setErrors((prev) => ({ ...prev, [field]: message }));

  const validatePhoneNumber = (phone: string): boolean =>
    /^07[0-9]{8}$/.test(phone);

  const validateNicNumber = (value: string): boolean =>
    /^[0-9]{9}V$|^[0-9]{12}$/.test(value);

  const validateGmailLocalPart = (localPart: string): boolean => {
    if (!/^[a-zA-Z0-9.+]+$/.test(localPart)) return false;
    if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
    if (localPart.includes("..")) return false;
    if (localPart.length === 0) return false;
    return true;
  };

  const validateDomain = (domain: string): boolean => {
    if (!domain) return false;

    if (domain.startsWith(".") || domain.endsWith(".")) return false;
    if (domain.startsWith("-") || domain.endsWith("-")) return false;
    if (domain.includes("..")) return false;

    const labels = domain.split(".");
    if (labels.length < 2) return false;

    return labels.every((label) => {
      if (label.length === 0) return false;
      if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
      if (label.startsWith("-") || label.endsWith("-")) return false;
      return true;
    });
  };

  const validateEmail = (value: string): boolean => {
    const generalRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!generalRegex.test(value)) return false;

    const emailLower = value.toLowerCase();
    const [localPart, domain] = emailLower.split("@");

    if (!validateDomain(domain)) return false;

    const allowedTLDs = [".com", ".gov", ".lk"];

    if (domain === "gmail.com" || domain === "googlemail.com")
      return validateGmailLocalPart(localPart);
    if (domain === "yahoo.com") return true;

    return allowedTLDs.some((tld) => domain.endsWith(tld));
  };

  const handleContactChange = (input: string) => {
    markTouched("contact");

    const digits = input.replace(/[^0-9]/g, "");
    setContact(digits);

    if (digits.length === 0) {
      clearError("contact");
    } else if (digits.length === 1 && digits !== "0") {
      setError("contact", t("Error.InvalidMobileNumber"));
    } else if (digits.length >= 2 && !digits.startsWith("07")) {
      setError("contact", t("Error.InvalidMobileNumber"));
    } else if (digits.length < 10) {
      setError("contact", t("Error.PhoneNumberMustBe10Digits"));
    } else if (!validatePhoneNumber(digits)) {
      setError("contact", t("Error.InvalidMobileNumber"));
    } else {
      clearError("contact");
    }
  };

  const handleNicChange = (input: string) => {
    markTouched("nic");

    const filtered = input.replace(/[^0-9Vv]/g, "").replace(/[vV]/g, "V");
    setNic(filtered);

    if (filtered.length === 0) {
      clearError("nic");
    } else if (!validateNicNumber(filtered)) {
      setError("nic", t("Error.NicNumberMustBe9DigitsFollowedByVOr12Digits"));
    } else {
      clearError("nic");
    }
  };

  const handleEmailChange = (input: string) => {
    markTouched("email");
    const trimmed = input.trim();
    setEmail(trimmed);

    if (trimmed.length === 0) {
      clearError("email");
      return;
    }

    if (!validateEmail(trimmed)) {
      const domain = trimmed.toLowerCase().split("@")[1];
      if (domain === "gmail.com" || domain === "googlemail.com") {
        setError(
          "email",
          t(
            "Error.InvalidGmailAddressGmailAddressesCannotHaveConsecutiveDotsLeadingTrailingDotsOrSpecialCharacters",
          ),
        );
      } else {
        setError("email", t("Error.InvalidEmailAddress"));
      }
    } else {
      clearError("email");
    }
  };

  const validateAll = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!supplierName.trim())
      newErrors.supplierName = t("OnboardSupplier.SupplierFullNameIsRequired");

    if (!contact.trim()) {
      newErrors.contact = t("Error.MobileNumberIsRequired");
    } else if (contact.length < 10) {
      newErrors.contact = t("Error.PhoneNumberMustBe10Digits");
    } else if (!validatePhoneNumber(contact)) {
      newErrors.contact = t("Error.InvalidMobileNumber");
    }

    if (!nic.trim()) {
      newErrors.nic = t("Error.NicNumberIsRequired");
    } else if (!validateNicNumber(nic)) {
      newErrors.nic = t("Error.NicNumberMustBe9DigitsFollowedByVOr12Digits");
    }

    if (!email.trim()) {
      newErrors.email = t("Error.EmailIsRequired");
    } else if (!validateEmail(email)) {
      newErrors.email = t("Error.InvalidEmailAddress");
    }

    return newErrors;
  };

  const checkAlreadyExist = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t("Error.YourLoginSessionHasExpiredPleaseLogInAgainToContinue"),
        );
        return false;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/onboard-supplier/check-already-exist`,
        {
          params: { contact, email, nic },
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const { contactExists, emailExists, nicExists } = response.data;

      const duplicateErrors: Record<string, string> = {};
      if (contactExists)
        duplicateErrors.contact = t("Error.ThisPhoneNumberIsAlreadyRegistered");
      if (emailExists)
        duplicateErrors.email = t("Error.ThisEmailIsAlreadyRegistered");
      if (nicExists)
        duplicateErrors.nic = t("Error.ThisNicIsAlreadyRegistered");

      if (Object.keys(duplicateErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...duplicateErrors }));
        setTouched({
          supplierName: true,
          contact: true,
          nic: true,
          email: true,
        });
        return false;
      }

      return true;
    } catch (err: any) {
      console.error(
        "Error checking duplicates:",
        err?.response?.data ?? err.message,
      );
      Alert.alert(
        t("Error.Sorry"),
        t("Error.Something went wrong. Please try again."),
      );
      return false;
    }
  };

  const handleNext = async () => {
    setTouched({ supplierName: true, contact: true, nic: true, email: true });

    const validationErrors = validateAll();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const canProceed = await checkAlreadyExist();
    if (!canProceed) return;

    navigation.navigate("OtpverificationOnboardSupplier", {
      supplierName,
      contact,
      email,
      nic,
    });
  };

  const hasErrors = Object.keys(errors).some((k) => touched[k] && errors[k]);

  const isFormFilled =
    supplierName.trim() !== "" &&
    contact.trim() !== "" &&
    email.trim() !== "" &&
    nic.trim() !== "" &&
    !hasErrors;

  const inputCls = (field: string) =>
    `bg-[#F4F4F4] rounded-3xl px-4 h-[50px] text-[15px] text-[#1A1A1A]${
      errors[field] && touched[field] ? " border border-red-500" : ""
    }`;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#FFFFFF]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <CustomHeader
        title={t("OnboardSupplier.OnboardSupplier")}
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-3">
          <View>
            <TextInput
              className={inputCls("supplierName")}
              placeholder={t("OnboardSupplier.SupplierFullName")}
              placeholderTextColor="#7D7D7D"
              value={supplierName}
              onChangeText={(text) => {
                if (text.length > 0 && text[0] === " ") return;

                const filtered = text.replace(/[^a-zA-Z\s]/g, "");

                setSupplierName(filtered);
                markTouched("supplierName");
                if (!filtered.trim()) {
                  setError(
                    "supplierName",
                    t("OnboardSupplier.SupplierFullNameIsRequired"),
                  );
                } else {
                  clearError("supplierName");
                }
              }}
            />
            {errors.supplierName && touched.supplierName && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.supplierName}
              </Text>
            )}
          </View>

          <View>
            <TextInput
              className={inputCls("contact")}
              placeholder={t("OnboardSupplier.Contact")}
              placeholderTextColor="#7D7D7D"
              keyboardType="phone-pad"
              value={contact}
              onChangeText={handleContactChange}
              maxLength={10}
            />
            {errors.contact && touched.contact && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.contact}
              </Text>
            )}
          </View>

          <View>
            <TextInput
              className={inputCls("email")}
              placeholder={t("OnboardSupplier.EmailAddress")}
              placeholderTextColor="#7D7D7D"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={handleEmailChange}
            />
            {errors.email && touched.email && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.email}
              </Text>
            )}
          </View>

          <View>
            <TextInput
              className={inputCls("nic")}
              placeholder={t("OnboardSupplier.NICNumber")}
              placeholderTextColor="#7D7D7D"
              autoCapitalize="characters"
              value={nic}
              onChangeText={handleNicChange}
              maxLength={12}
            />
            {errors.nic && touched.nic && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.nic}
              </Text>
            )}
          </View>

          <View className="bg-[#F4F4F4] rounded-3xl px-4 h-[50px] flex-row items-center justify-between">
            <Text className="text-[15px] text-[#1A1A1A] font-medium">
              Standard Plan
            </Text>
          </View>
        </View>

        <View className="mt-10 gap-y-3">
          <TouchableOpacity
            className="bg-[#D9D9D9] rounded-3xl px-6 h-[50px] w-full items-center justify-center"
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Text className="text-lg text-[#888888] font-medium">
              {t("OnboardSupplier.Cancel")}
            </Text>
          </TouchableOpacity>

          {isFormFilled ? (
            <LinearGradient
              colors={["#F35125", "#FF1D85"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-3xl"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 6,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                className="h-[50px] items-center justify-center"
                onPress={handleNext}
              >
                <Text className="text-lg text-white font-bold tracking-wide">
                  {t("OnboardSupplier.Next")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              className="bg-[#C4C4C4] rounded-3xl h-[50px] items-center justify-center"
              activeOpacity={0.5}
              onPress={handleNext}
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text className="text-lg text-[#FFFFFF] font-semibold">
                {t("OnboardSupplier.Next")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddOnboardSupplierOfficer;
