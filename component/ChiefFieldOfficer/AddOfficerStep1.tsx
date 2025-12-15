import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RadioButton } from "react-native-paper";
import Checkbox from "expo-checkbox";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import countryData from "@/assets/json/countryflag.json";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, RouteProp, useRoute } from "@react-navigation/native";

type AddOfficerStep1NavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddOfficerStep1"
>;
type AddOfficerStep1RouteProp = RouteProp<RootStackParamList, "AddOfficerStep1">;

interface AddOfficerStep1ScreenProps {
  navigation: AddOfficerStep1NavigationProp;
  // route: { params: { isnew?: boolean } };
}

const AddOfficerStep1: React.FC<AddOfficerStep1ScreenProps> = ({
  navigation}) => {
      const route = useRoute<AddOfficerStep1RouteProp>();
    
  const { isnew } = route.params;
  const { t } = useTranslation();
  const [type, setType] = useState<"Permanent" | "Temporary">("Permanent");
  const [languages, setLanguages] = useState({
    Sinhala: true,
    English: false,
    Tamil: false,
  });

  const [firstNameEN, setFirstNameEN] = useState("");
  const [lastNameEN, setLastNameEN] = useState("");
  const [firstNameSI, setFirstNameSI] = useState("");
  const [lastNameSI, setLastNameSI] = useState("");
  const [firstNameTA, setFirstNameTA] = useState("");
  const [lastNameTA, setLastNameTA] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [loading, setLoading] = useState(false);

  // District dropdown states - MULTI SELECT
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");

  // Country code dropdown states
  const [selectedCountryCode1, setSelectedCountryCode1] = useState("+94");
  const [selectedCountryCode2, setSelectedCountryCode2] = useState("+94");
  const [showCountryCodeDropdown1, setShowCountryCodeDropdown1] =
    useState(false);
  const [showCountryCodeDropdown2, setShowCountryCodeDropdown2] =
    useState(false);
const [cfoDistricts, setCfoDistricts] = useState<string[]>([]);
console.log(cfoDistricts)
  // Sri Lanka districts with translations
  const districts = [
    { en: "Ampara", si: "අම්පාර", ta: "அம்பாறை" },
    { en: "Anuradhapura", si: "අනුරාධපුර", ta: "அனுராதபுரம்" },
    { en: "Badulla", si: "බදුල්ල", ta: "பதுளை" },
    { en: "Batticaloa", si: "මඩකලපුව", ta: "மட்டக்களப்பு" },
    { en: "Colombo", si: "කොළඹ", ta: "கொழும்பு" },
    { en: "Galle", si: "ගාල්ල", ta: "காலி" },
    { en: "Gampaha", si: "ගම්පහ", ta: "கம்பஹா" },
    { en: "Hambantota", si: "හම්බන්තොට", ta: "அம்பாந்தோட்டை" },
    { en: "Jaffna", si: "යාපනය", ta: "யாழ்ப்பாணம்" },
    { en: "Kalutara", si: "කළුතර", ta: "களுத்துறை" },
    { en: "Kandy", si: "මහනුවර", ta: "கண்டி" },
    { en: "Kegalle", si: "කැගල්ල", ta: "கேகாலை" },
    { en: "Kilinochchi", si: "කිලිනොච්චි", ta: "கிளிநொச்சி" },
    { en: "Kurunegala", si: "කුරුණෑගල", ta: "குருநாகல்" },
    { en: "Mannar", si: "මන්නාරම", ta: "மன்னார்" },
    { en: "Matale", si: "මාතලේ", ta: "மாதளை" },
    { en: "Matara", si: "මාතර", ta: "மாத்தறை" },
    { en: "Moneragala", si: "මොනරාගල", ta: "மொனராகலை" },
    { en: "Mullaitivu", si: "මුල්ලයිතීවු", ta: "முல்லைத்தீவு" },
    { en: "Nuwara Eliya", si: "නුවරඑළිය", ta: "நுவரெலியா" },
    { en: "Polonnaruwa", si: "පොලොන්නරුව", ta: "பொலன்னறுவை" },
    { en: "Puttalam", si: "පුත්තලම", ta: "புத்தளம்" },
    { en: "Rathnapura", si: "රත්නපුර", ta: "இரத்தினபுரி" },
    { en: "Trincomalee", si: "ත්‍රිකුණාමලය", ta: "திருகோணமலை" },
    { en: "Vavuniya", si: "වවුනියාව", ta: "வவுனியா" },
  ];

    useFocusEffect(
      React.useCallback(() => {
 fetchCFOdistricts()
 console.log("focus effect step 1", isnew)
      if(isnew===true){
        setFirstNameEN("")
        setLastNameEN("")
        setFirstNameSI("")
        setLastNameSI("")
        setFirstNameTA("")
        setLastNameTA("")
        setPhone1("")
        setPhone2("")
        setNic("")
        setEmail("")
               setSelectedDistricts([])
setProfileImage(null)
      }

      }, [isnew])
    );
  

  const fetchCFOdistricts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          t("Error.Sorry"),
          t(
            "Error.Your login session has expired. Please log in again to continue."
          )
        );
        return;
      }
      if (token) {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/auth/user-districts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
         const districts = response.data?.data;
    //  if (Array.isArray(response.data.data)) {
    //   setCfoDistricts(response.data.data);
        if (Array.isArray(districts)) {
      setCfoDistricts(districts);
      // ✅ If only one district, auto select it
      if (districts.length === 1) {
        setSelectedDistricts(districts);
      }
    } else {
      console.warn("Unexpected districts format:", response.data);
    }

      }
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
    } 
  };


const getFilteredCFODistricts = () => {
  if (!cfoDistricts || cfoDistricts.length === 0) return [];

  let filtered = districts.filter((d) => cfoDistricts.includes(d.en));

  if (districtSearch) {
    const searchTerm = districtSearch.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.en.toLowerCase().includes(searchTerm) ||
        d.si.includes(districtSearch) ||
        d.ta.includes(districtSearch)
    );
  }

  return filtered;
};

  // Mark field as touched
  const markFieldAsTouched = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  // Clear specific field error
  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };
  const validateGmailLocalPart = (localPart: string): boolean => {
    const validCharsRegex = /^[a-zA-Z0-9.+]+$/;
    if (!validCharsRegex.test(localPart)) {
      return false;
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }

    if (localPart.includes('..')) {
      return false;
    }

    if (localPart.length === 0) {
      return false;
    }

    return true;
  };
  // Validation functions
  const validateEmail = (email: string): boolean => {
    const generalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!generalEmailRegex.test(email)) {
      return false;
    }

    const emailLower = email.toLowerCase();
    const [localPart, domain] = emailLower.split('@');

    const allowedSpecificDomains = ['gmail.com', 'googlemail.com', 'yahoo.com'];
    const allowedTLDs = ['.com', '.gov', '.lk'];

    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      return validateGmailLocalPart(localPart);
    }

    if (domain === 'yahoo.com') {
      return true;
    }

    for (const tld of allowedTLDs) {
      if (domain.endsWith(tld)) {
        return true;
      }
    }

    return false;
  };

  const validateNIC = (nic: string): boolean => {
    return /^\d{9}[Vv]?$|^\d{12}$/.test(nic);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    return /^7[0-9]{8}$/.test(phone);
  };

  // Field change handlers with validation on blur
  const handleFirstNameENChange = (text: string) => {
    const filteredText = text.replace(/[^a-zA-Z\s]/g, "");
    const capitalizedText =
      filteredText.charAt(0).toUpperCase() + filteredText.slice(1);
    setFirstNameEN(capitalizedText);
  };

  const handleFirstNameENBlur = () => {
    markFieldAsTouched("firstNameEN");
    if (!firstNameEN.trim()) {
      setErrors((prev) => ({
        ...prev,
        firstNameEN: t("Error.First name is required"),
      }));
    } else {
      clearFieldError("firstNameEN");
    }
  };

  const handleLastNameENChange = (text: string) => {
    const filteredText = text.replace(/[^a-zA-Z\s]/g, "");
    const capitalizedText =
      filteredText.charAt(0).toUpperCase() + filteredText.slice(1);
    setLastNameEN(capitalizedText);
  };

  const handleLastNameENBlur = () => {
    markFieldAsTouched("lastNameEN");
    if (!lastNameEN.trim()) {
      setErrors((prev) => ({
        ...prev,
        lastNameEN: t("Error.Last name is required"),
      }));
    } else {
      clearFieldError("lastNameEN");
    }
  };

  const handlePhone1Change = (input: string) => {
          clearFieldError("phone1");
  markFieldAsTouched("phone1");
    let numbersOnly = input.replace(/[^0-9]/g, "");
    if (numbersOnly.startsWith("0")) {
      numbersOnly = numbersOnly.replace(/^0+/, "");
    }
    setPhone1(numbersOnly);


 if (numbersOnly.length === 0) {
        setErrors((prev) => ({
            ...prev,
            phone1: "",
        }));
    }       else if (numbersOnly && numbersOnly === phone2) {
        setErrors((prev) => ({
            ...prev,
            phone1: t("Error.Phone number cannot be the same"),
        }));
        return;
    }else if (!numbersOnly.startsWith("7")) {
        setErrors((prev) => ({
            ...prev,
            phone1: t("Error.Invalid phone number"),
        }));
    } else if (numbersOnly.length < 9) {
      console.log("hit 4")
        setErrors((prev) => ({
            ...prev,
            phone1: t("Error.Phone number must be 9 digits long"),
        }));
    } else if (!validatePhoneNumber(numbersOnly)) {
        setErrors((prev) => ({
            ...prev,
            phone1: t("Error.Invalid phone number"),
        }));
    } else {
            console.log("hit")

        // Clear errors if valid
        setErrors((prev) => ({
            ...prev,
            phone1: "",
        }));
              checkPhoneExists(selectedCountryCode1, numbersOnly, "phone1");

    }
  };

  // const handlePhone1Blur = () => {
  //   markFieldAsTouched("phone1");
  //   if (!phone1.trim()) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       phone1: t("Error.Phone number is required"),
  //     }));
  //   } else if (!validatePhoneNumber(phone1)) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       phone1: t("Error.Invalid phone number"),
  //     }));
  //   } else {
  //     clearFieldError("phone1");
  //     checkPhoneExists(selectedCountryCode1, phone1, "phone1");
  //   }
  // };

  const handlePhone2Change = (input: string) => {
    let numbersOnly = input.replace(/[^0-9]/g, "");
    if (numbersOnly.startsWith("0")) {
      numbersOnly = numbersOnly.replace(/^0+/, "");
    }
      markFieldAsTouched("phone2");
    setPhone2(numbersOnly);
     if (numbersOnly.length === 0) {
        setErrors((prev) => ({
            ...prev,
            phone2: "",
        }));
    }  else if (numbersOnly && numbersOnly === phone1) {
        setErrors((prev) => ({
            ...prev,
            phone2: t("Error.Phone numbers cannot be the same"),
        }));
        return;
      }
      else if (!numbersOnly.startsWith("7")) {
        setErrors((prev) => ({
            ...prev,
            phone2: t("Error.Invalid phone number"),
        }));
    } else if (numbersOnly.length < 9) {
        setErrors((prev) => ({
            ...prev,
            phone2: t("Error.Phone number must be 9 digits long"),
        }));
    } else if (!validatePhoneNumber(numbersOnly)) {
        setErrors((prev) => ({
            ...prev,
            phone2: t("Error.Invalid phone number"),
        }));
    } else {
        // Clear errors if valid
        setErrors((prev) => ({
            ...prev,
            phone2: "",
        }));
              checkPhoneExists(selectedCountryCode2, numbersOnly, "phone2");

    }
  };

  // const handlePhone2Blur = () => {
  //   markFieldAsTouched("phone2");

  //   if (phone2) {
  //     if (!validatePhoneNumber(phone2)) {
  //       setErrors((prev) => ({
  //         ...prev,
  //         phone2: t("Error.Invalid phone number"),
  //       }));
  //     } else {
  //       clearFieldError("phone2");
  //       // Check if phone2 exists in backend only if it's provided
  //       checkPhoneExists(selectedCountryCode2, phone2, "phone2");
  //     }
  //   } else {
  //     // Phone 2 is optional, so clear any errors if empty
  //     clearFieldError("phone2");
  //   }
  // };

  const validateNicNumber = (input: string) =>
    /^[0-9]{9}V$|^[0-9]{12}$/.test(input);
  const handleNICChange = (input: string) => {
    const filteredInput = input.replace(/[^0-9Vv]/g, "");
    const normalizedInput = filteredInput.replace(/[vV]/g, "V");
    setNic(normalizedInput);
      markFieldAsTouched("nic");
    if (normalizedInput.length === 0) {
        setErrors((prev) => ({
            ...prev,
            nic: "",
        }));
    } else if (!validateNicNumber(normalizedInput)) {
      setErrors((prev) => ({ ...prev, nic: t("Error.NIC Number must be 9 digits followed by 'V' or 12 digits.")}))
    } else {
              setErrors((prev) => ({
            ...prev,
            nic: "",
        }));
      checkNICExists(normalizedInput);
    }
  };

  // const handleNICBlur = () => {
  //   markFieldAsTouched("nic");
  //   if (!nic.trim()) {
  //     setErrors((prev) => ({ ...prev, nic: t("Error.NIC is required") }));
  //   } else if (!validateNIC(nic)) {
  //     setErrors((prev) => ({ ...prev, nic: t("Error.Invalid NIC format") }));
  //   } else {
  //     clearFieldError("nic");
  //     checkNICExists(nic);
  //   }
  // };

  const handleEmailChange = (input: string) => {
        clearFieldError('email');
        markFieldAsTouched("email");
    const trimmedInput = input.trim();
    setEmail(trimmedInput);
        if (!validateEmail(trimmedInput)) {
      const emailLower = trimmedInput.toLowerCase();
      const domain = emailLower.split('@')[1];

      if (domain === 'gmail.com' || domain === 'googlemail.com') {
         setErrors((prev) => ({ ...prev, email: t("Error.Invalid Gmail address")}))
      } else {
       setErrors((prev) => ({ ...prev, email: t("Error.Invalid email address Example")}))

      }
      return;
    }
 checkEmailExists(trimmedInput);
  };

  // const handleEmailBlur = () => {
  //   markFieldAsTouched("email");
  //   if (!email.trim()) {
  //     setErrors((prev) => ({ ...prev, email: t("Error.Email is required") }));
  //   } else if (!validateEmail(email)) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       email: t("Error.Invalid email address"),
  //     }));
  //   } else {
  //     clearFieldError("email");
  //     checkEmailExists(email);
  //   }
  // };

  // Handle blur for other fields
  const handleFirstNameSIBlur = () => {
    markFieldAsTouched("firstNameSI");
    if (!firstNameSI.trim()) {
      setErrors((prev) => ({
        ...prev,
        firstNameSI: t("Error.Sinhala first name is required"),
      }));
    } else {
      clearFieldError("firstNameSI");
    }
  };

  const handleLastNameSIBlur = () => {
    markFieldAsTouched("lastNameSI");
    if (!lastNameSI.trim()) {
      setErrors((prev) => ({
        ...prev,
        lastNameSI: t("Error.Sinhala last name is required"),
      }));
    } else {
      clearFieldError("lastNameSI");
    }
  };

  const handleFirstNameTABlur = () => {
    markFieldAsTouched("firstNameTA");
    if (!firstNameTA.trim()) {
      setErrors((prev) => ({
        ...prev,
        firstNameTA: t("Error.Tamil first name is required"),
      }));
    } else {
      clearFieldError("firstNameTA");
    }
  };

  const handleLastNameTABlur = () => {
    markFieldAsTouched("lastNameTA");
    if (!lastNameTA.trim()) {
      setErrors((prev) => ({
        ...prev,
        lastNameTA: t("Error.Tamil last name is required"),
      }));
    } else {
      clearFieldError("lastNameTA");
    }
  };

  // Profile image picker
  const pickProfileImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("Error.Permission Denied"),
          t("Error.Gallery permission is required")
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("Error.Error"), t("Error.Failed to pick image"));
    }
  };


  const checkNICExists = async (nicNumber: string): Promise<boolean> => {
    console.log(nicNumber)
  try {
    setIsValidating(true);
    const token = await AsyncStorage.getItem("token");
    const response = await axios.get(
      `${environment.API_BASE_URL}api/officer/field-officers/check-nic/${nicNumber}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.exists) {
      setErrors((prev) => ({ ...prev, nic: t("Error.This NIC is already registered in the system.") }));
      return true; // Error found
    }
    return false; // No error
  } catch (error) {
    console.error("Error checking NIC:", error);
    return false;
  } finally {
    setIsValidating(false);
  }
};

const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    setIsValidating(true);
    const token = await AsyncStorage.getItem("token");
    const response = await axios.get(
      `${environment.API_BASE_URL}api/officer/field-officers/check-email/${email}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.exists) {
      setErrors((prev) => ({
        ...prev,
        email: t("Error.Email already exists"),
      }));
      return true; // Error found
    }
    return false; // No error
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  } finally {
    setIsValidating(false);
  }
};

const checkPhoneExists = async (
  phoneCode: string,
  phoneNumber: string,
  field: string
): Promise<boolean> => {
  if (!phoneNumber.trim()) {
    return false;
  }
console.log("hit 2")
  try {
    setIsValidating(true);
    const token = await AsyncStorage.getItem("token");
    const response = await axios.get(
      `${environment.API_BASE_URL}api/officer/field-officers/check-phone/${phoneCode}/${phoneNumber}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.exists) {
      setErrors((prev) => ({
        ...prev,
        [field]:
          field === "phone1"
            ? t("Error.Phone already exists")
            : t("Error.Phone 2 already exists"),
      }));
      return true; // Error found
    } else {
            console.log("hit3")

      clearFieldError(field);
      return false; // No error
    }
  } catch (error) {
    console.error("Error checking phone:", error);
    return false;
  } finally {
    setIsValidating(false);
  }
};

  const toggleLanguage = (lang: keyof typeof languages) => {
    clearFieldError("languages");
    setLanguages((prev) => ({
      ...prev,
      [lang]: !prev[lang],
    }));
  };

  // Get current language
  const getCurrentLanguage = () => {
    return i18n.language || "en";
  };

  // Get translated district name
  const getTranslatedDistrict = (district: {
    en: string;
    si: string;
    ta: string;
  }) => {
    const lang = getCurrentLanguage();
    return district[lang as keyof typeof district] || district.en;
  };

  // Get translated country name
  const getTranslatedCountry = (country: {
    name: { en: string; si: string; ta: string };
  }) => {
    const lang = getCurrentLanguage();
    return country.name[lang as keyof typeof country.name] || country.name.en;
  };

  // Filter districts based on search
  const getFilteredDistricts = () => {
    if (!districtSearch) return districts;

    return districts.filter((district) => {
      const searchTerm = districtSearch.toLowerCase();
      return (
        district.en.toLowerCase().includes(searchTerm) ||
        district.si.includes(districtSearch) ||
        district.ta.includes(districtSearch) ||
        getTranslatedDistrict(district).toLowerCase().includes(searchTerm)
      );
    });
  };

  // Toggle district selection
  const toggleDistrictSelection = (district: {
    en: string;
    si: string;
    ta: string;
  }) => {
    const districtKey = district.en;
    setSelectedDistricts((prev) => {
      if (prev.includes(districtKey)) {
        return prev.filter((d) => d !== districtKey);
      } else {
        return [...prev, districtKey];
      }
    });
  };

  // Clear all selected districts
  const clearAllDistricts = () => {
    setSelectedDistricts([]);
  };

  // Clear search
  const clearSearch = () => {
    setDistrictSearch("");
  };

  // Handle modal close
  const handleDistrictModalClose = () => {
    markFieldAsTouched("districts");
    if (selectedDistricts.length === 0) {
      setErrors((prev) => ({
        ...prev,
        districts: t("Error.At least one district is required"),
      }));
    } else {
      clearFieldError("districts");
    }
    setDistrictSearch("");
    setShowDistrictDropdown(false);
  };

  // Get display text for districts
  const getDistrictDisplayText = () => {
    if (selectedDistricts.length === 0) {
      return t("AddOfficer.AssignedDistrict");
    } else if (selectedDistricts.length === 1) {
      const district = districts.find((d) => d.en === selectedDistricts[0]);
      return district ? getTranslatedDistrict(district) : selectedDistricts[0];
    } else if (selectedDistricts.length === 2) {
      const district1 = districts.find((d) => d.en === selectedDistricts[0]);
      const district2 = districts.find((d) => d.en === selectedDistricts[1]);
      const name1 = district1
        ? getTranslatedDistrict(district1)
        : selectedDistricts[0];
      const name2 = district2
        ? getTranslatedDistrict(district2)
        : selectedDistricts[1];
      return `${name1}, ${name2}`;
    } else {
      const district1 = districts.find((d) => d.en === selectedDistricts[0]);
      const district2 = districts.find((d) => d.en === selectedDistricts[1]);
      const name1 = district1
        ? getTranslatedDistrict(district1)
        : selectedDistricts[0];
      const name2 = district2
        ? getTranslatedDistrict(district2)
        : selectedDistricts[1];
      return `${name1}, ${name2} +${selectedDistricts.length - 2} ${t(
        "AddOfficer.more"
      )}`;
    }
  };

  // Validate all fields before proceeding
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!firstNameEN.trim())
      newErrors.firstNameEN = t("Error.First name is required");
    if (!lastNameEN.trim())
      newErrors.lastNameEN = t("Error.Last name is required");
    if (!firstNameSI.trim())
      newErrors.firstNameSI = t("Error.Sinhala first name is required");
    if (!lastNameSI.trim())
      newErrors.lastNameSI = t("Error.Sinhala last name is required");
    if (!firstNameTA.trim())
      newErrors.firstNameTA = t("Error.Tamil first name is required");
    if (!lastNameTA.trim())
      newErrors.lastNameTA = t("Error.Tamil last name is required");
    if (!phone1.trim()) newErrors.phone1 = t("Error.Phone number is required");
    if (!nic.trim()) newErrors.nic = t("Error.NIC is required");
    if (!email.trim()) newErrors.email = t("Error.Email is required");
    if (selectedDistricts.length === 0)
      newErrors.districts = t("Error.At least one district is required");
    if (Object.values(languages).every((val) => !val))
      newErrors.languages = t("Error.At least one language is required");

    if (phone1 && !validatePhoneNumber(phone1))
      newErrors.phone1 = t("Error.Invalid phone number");
    if (phone2 && !validatePhoneNumber(phone2))
      newErrors.phone2 = t("Error.Invalid phone number");
    if (nic && !validateNIC(nic)) newErrors.nic = t("Error.Invalid NIC format");
    if (email && !validateEmail(email))
      newErrors.email = t("Error.Invalid email address");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear all form data function
  const clearFormData = () => {
    // Reset all form fields
    setType("Permanent");
    setLanguages({
      Sinhala: true,
      English: false,
      Tamil: false,
    });
    setFirstNameEN("");
    setLastNameEN("");
    setFirstNameSI("");
    setLastNameSI("");
    setFirstNameTA("");
    setLastNameTA("");
    setPhone1("");
    setPhone2("");
    setNic("");
    setEmail("");
    setProfileImage(null);
    setSelectedDistricts([]);
    setSelectedCountryCode1("+94");
    setSelectedCountryCode2("+94");

    // Clear errors and touched states
    setErrors({});
    setTouched({});
  };

  // Updated cancel button handler
  const handleCancel = () => {
    clearFormData();
    navigation.navigate("ManageOfficers");
  };

const handleNext = async () => {
  Keyboard.dismiss()
  const allFields = [
    "firstNameEN",
    "lastNameEN",
    "firstNameSI",
    "lastNameSI",
    "firstNameTA",
    "lastNameTA",
    "phone1",
    "nic",
    "email",
    "districts",
  ];
  allFields.forEach((field) => markFieldAsTouched(field));

  if (!validateStep1()) {
    Alert.alert(
      t("Error.Validation Error"),
      t("Error.Please fix all errors before proceeding")
    );
    return;
  }

  if (isValidating) {
    Alert.alert(
      t("Error.Please Wait"),
      t("Error.Validating your information, please wait...")
    );
    return;
  }

  setLoading(true);
  
  try {
    // Perform all API validations and collect results
    const hasNicError = await checkNICExists(nic);
    const hasEmailError = await checkEmailExists(email);
    const hasPhone1Error = await checkPhoneExists(selectedCountryCode1, phone1, "phone1");
    const hasPhone2Error = phone2.trim() 
      ? await checkPhoneExists(selectedCountryCode2, phone2, "phone2")
      : false;

    // If any API validation failed, show error and stop
    if (hasNicError || hasEmailError || hasPhone1Error || hasPhone2Error) {
      Alert.alert(
        t("Error.Validation Error"),
        t("Error.Please fix all errors before proceeding")
      );
      setLoading(false);
      return;
    }

    // All validations passed
    const formData = {
      empType: type,
      languages,
      assignDistrict: selectedDistricts,
      firstName: firstNameEN,
      lastName: lastNameEN,
      firstNameSinhala: firstNameSI,
      lastNameSinhala: lastNameSI,
      firstNameTamil: firstNameTA,
      lastNameTamil: lastNameTA,
      phoneCode1: selectedCountryCode1,
      phoneNumber1: phone1,
      phoneCode2: selectedCountryCode2,
      phoneNumber2: phone2,
      nic,
      email,
      profileImage,
    };
console.log("Form Data:", formData);
    setLoading(false);
    navigation.navigate("AddOfficerStep2", { formData, isnewsecondstep:isnew });
  } catch (error) {
    console.error("Validation error:", error);
    setLoading(false);
    Alert.alert(
      t("Error.Error"),
      t("Error.An error occurred during validation")
    );
  }
};

  const renderDistrictItem = ({
    item,
  }: {
    item: { en: string; si: string; ta: string };
  }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 flex-row justify-between items-center"
      onPress={() => toggleDistrictSelection(item)}
    >
      <Text className="text-base text-gray-800">
        {getTranslatedDistrict(item)}
      </Text>
      <Checkbox
        value={selectedDistricts.includes(item.en)}
        onValueChange={() => toggleDistrictSelection(item)}
        color={selectedDistricts.includes(item.en) ? "#21202B" : undefined}
      />
    </TouchableOpacity>
  );

  // Search input component for districts
  const renderDistrictSearchInput = () => (
    <View className="px-4 py-2 border-b border-gray-200">
      <View className="bg-gray-100 rounded-lg px-3 flex-row items-center">
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          placeholder={t("AddOfficer.SearchDistrict") || "Search district..."}
          value={districtSearch}
          onChangeText={setDistrictSearch}
          className="flex-1 ml-2 text-base"
          placeholderTextColor="#666"
        />
        {districtSearch ? (
          <TouchableOpacity onPress={clearSearch}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  // Updated renderCountryCodeItem with translated country names
  const renderCountryCodeItem = (
    { item }: { item: any },
    setCode: Function,
    setShow: Function
  ) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => {
        setCode(item.dial_code);
        setShow(false);
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">{item.emoji}</Text>
          <Text className="text-sm text-gray-600">{item.dial_code}</Text>
        </View>
        <Text className="text-base text-gray-800 font-medium">
          {getTranslatedCountry(item)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={() => navigation.navigate("ManageOfficers")}
            className="bg-[#F6F6F680] rounded-full py-4 px-3"
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-black text-center flex-1">
            {t("AddOfficer.AddOfficer")}
          </Text>
          <View style={{ width: 55 }} />
        </View>

        {/* Profile Picture */}
        <View className="items-center mt-6">
          <TouchableOpacity onPress={pickProfileImage}>
            <View className="relative">
              {/* Round image */}
              <View className="w-20 h-20 bg-gray-300 rounded-full overflow-hidden items-center justify-center">
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={40} color="#fff" />
                )}
              </View>

              {/* Pencil icon */}
              <View className="absolute bottom-0 right-0 w-6 h-6 bg-gray-800 rounded-full items-center justify-center">
                <Ionicons name="pencil" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Type */}
        <View className="p-4 ">
          <View className="px-6 mt-6 items-center ">
            <View className="flex flex-row items-center space-x-2 justify-between">
              <Text className="text-base font-medium">
                {t("AddOfficer.Type")}:
              </Text>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setType("Permanent")}
              >
                <RadioButton
                  value="Permanent"
                  status={type === "Permanent" ? "checked" : "unchecked"}
                  onPress={() => setType("Permanent")}
                  color="#21202B"
                />
                <Text className="ml-1 text-base text-[#534E4E]">
                  {t("AddOfficer.Permanent")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setType("Temporary")}
              >
                <RadioButton
                  value="Temporary"
                  status={type === "Temporary" ? "checked" : "unchecked"}
                  onPress={() => setType("Temporary")}
                  color="#21202B"
                />
                <Text className="ml-1 text-base text-[#534E4E]">
                  {t("AddOfficer.Temporary")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

          {/* Preferred Languages */}
          <View className="px-6 mt-4">
            <Text className="text-base font-medium mb-4">
              {t("AddOfficer.PreferredLanguages")}:
            </Text>
            <View className="flex-row justify-between space-x-4">
              {(Object.keys(languages) as Array<keyof typeof languages>).map(
                (lang) => (
                  <View key={lang} className="flex-row items-center space-x-1">
                    <Checkbox
                      value={languages[lang]}
                      onValueChange={() => toggleLanguage(lang)}
                      color={languages[lang] ? "#21202B" : undefined}
                    />
                    <Text className="text-base text-[#534E4E]">
                      {t(`AddOfficer.${lang}`)}
                    </Text>
                  </View>
                )
              )}
            </View>
            {errors.languages && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.languages}
              </Text>
            )}
          </View>

          <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

          {/* Form Fields */}
          <View className="px-6 mt-4 space-y-4">
            {/* District Dropdown - MULTI SELECT */}
            <View>
              <TouchableOpacity
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-3 flex-row justify-between items-center ${
                  errors.districts && touched.districts
                    ? "border border-red-500"
                    : ""
                }`}
                onPress={() => setShowDistrictDropdown(true)}
              >
                <Text
                  className={`${
                    selectedDistricts.length > 0
                      ? "text-black"
                      : "text-[#7D7D7D]"
                  }`}
                >
                  {getDistrictDisplayText()}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
              {errors.districts && touched.districts && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.districts}
                </Text>
              )}
            </View>

            <View>
              <TextInput
                placeholder={t("AddOfficer.FirstNameEnglish")}
                placeholderTextColor="#7D7D7D"
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                  errors.firstNameEN && touched.firstNameEN
                    ? "border border-red-500"
                    : ""
                }`}
                value={firstNameEN}
                onChangeText={handleFirstNameENChange}
                onBlur={handleFirstNameENBlur}
                underlineColorAndroid="transparent"
              />
              {errors.firstNameEN && touched.firstNameEN && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.firstNameEN}
                </Text>
              )}
            </View>

            <View>
              <TextInput
                placeholder={t("AddOfficer.LastNameEnglish")}
                placeholderTextColor="#7D7D7D"
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                  errors.lastNameEN && touched.lastNameEN
                    ? "border border-red-500"
                    : ""
                }`}
                value={lastNameEN}
                onChangeText={handleLastNameENChange}
                onBlur={handleLastNameENBlur}
                underlineColorAndroid="transparent"
              />
              {errors.lastNameEN && touched.lastNameEN && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.lastNameEN}
                </Text>
              )}
            </View>

            <View>
              <TextInput
                placeholder={t("AddOfficer.FirstNameSinhala")}
                placeholderTextColor="#7D7D7D"
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                  errors.firstNameSI && touched.firstNameSI
                    ? "border border-red-500"
                    : ""
                }`}
                value={firstNameSI}
                onChangeText={setFirstNameSI}
                onBlur={handleFirstNameSIBlur}
                underlineColorAndroid="transparent"
              />
              {errors.firstNameSI && touched.firstNameSI && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.firstNameSI}
                </Text>
              )}
            </View>

            <View>
              <TextInput
                placeholder={t("AddOfficer.LastNameSinhala")}
                placeholderTextColor="#7D7D7D"
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                  errors.lastNameSI && touched.lastNameSI
                    ? "border border-red-500"
                    : ""
                }`}
                value={lastNameSI}
                onChangeText={setLastNameSI}
                onBlur={handleLastNameSIBlur}
                underlineColorAndroid="transparent"
              />
              {errors.lastNameSI && touched.lastNameSI && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.lastNameSI}
                </Text>
              )}
            </View>

            <View>
              <TextInput
                placeholder={t("AddOfficer.FirstNameTamil")}
                placeholderTextColor="#7D7D7D"
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                  errors.firstNameTA && touched.firstNameTA
                    ? "border border-red-500"
                    : ""
                }`}
                value={firstNameTA}
                onChangeText={setFirstNameTA}
                onBlur={handleFirstNameTABlur}
                underlineColorAndroid="transparent"
              />
              {errors.firstNameTA && touched.firstNameTA && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.firstNameTA}
                </Text>
              )}
            </View>

            <View>
              <TextInput
                placeholder={t("AddOfficer.LastNameTamil")}
                placeholderTextColor="#7D7D7D"
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                  errors.lastNameTA && touched.lastNameTA
                    ? "border border-red-500"
                    : ""
                }`}
                value={lastNameTA}
                onChangeText={setLastNameTA}
                onBlur={handleLastNameTABlur}
                underlineColorAndroid="transparent"
              />
              {errors.lastNameTA && touched.lastNameTA && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.lastNameTA}
                </Text>
              )}
            </View>
          </View>
          <View className="border border-[#ADADAD] border-b-0 mt-4"></View>

          <View className="px-6 mt-4 space-y-4">
            {/* Phone Numbers */}
            <View>
              <View className="flex-row space-x-2">
                {/* Phone 1 Country Code */}
                <TouchableOpacity
                  className="bg-[#F4F4F4] rounded-2xl px-4 py-4 w-20 flex-row justify-between items-center"
                  onPress={() => setShowCountryCodeDropdown1(true)}
                >
                  <Text className="text-black">{selectedCountryCode1}</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>

                <View className="flex-1">
                  <TextInput
                    placeholder="7XXXXXXXX"
                    placeholderTextColor="#7D7D7D"
                    className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 flex-1 ${
                      errors.phone1 && touched.phone1
                        ? "border border-red-500"
                        : ""
                    }`}
                    value={phone1}
                    onChangeText={handlePhone1Change}
                    // onBlur={handlePhone1Blur}
                    keyboardType="phone-pad"
                    underlineColorAndroid="transparent"
                    maxLength={9}
                  />
                </View>
              </View>
              {errors.phone1 && touched.phone1 && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.phone1}
                </Text>
              )}
            </View>

            <View>
              <View className="flex-row space-x-2">
                {/* Phone 2 Country Code */}
                <TouchableOpacity
                  className="bg-[#F4F4F4] rounded-2xl px-4 py-4 w-20 flex-row justify-between items-center"
                  onPress={() => setShowCountryCodeDropdown2(true)}
                >
                  <Text className="text-black">{selectedCountryCode2}</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>

                <View className="flex-1">
                  <TextInput
                    placeholder="7XXXXXXXX"
                    placeholderTextColor="#7D7D7D"
                    className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 flex-1 ${
                      errors.phone2 && touched.phone2
                        ? "border border-red-500"
                        : ""
                    }`}
                    value={phone2}
                    onChangeText={handlePhone2Change}
                    // onBlur={handlePhone2Blur}
                    keyboardType="phone-pad"
                    underlineColorAndroid="transparent"
                    maxLength={9}
                  />
                </View>
              </View>
              {errors.phone2 && touched.phone2 && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.phone2}
                </Text>
              )}
            </View>

            <View>
              <TextInput
                placeholder={t("AddOfficer.NICNumber")}
                placeholderTextColor="#7D7D7D"
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                  errors.nic && touched.nic ? "border border-red-500" : ""
                }`}
                value={nic}
                onChangeText={handleNICChange}
                // onBlur={handleNICBlur}
                underlineColorAndroid="transparent"
                maxLength={12}
                autoCapitalize="characters"
              />
              {errors.nic && touched.nic && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.nic}
                </Text>
              )}
            </View>

            <View>
              <TextInput
                placeholder={t("AddOfficer.EmailAddress")}
                placeholderTextColor="#7D7D7D"
                className={`bg-[#F4F4F4] rounded-2xl px-4 py-4 ${
                  errors.email && touched.email ? "border border-red-500" : ""
                }`}
                value={email}
                onChangeText={handleEmailChange}
                // onBlur={handleEmailBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
              {errors.email && touched.email && (
                <Text className="text-red-500 text-sm mt-1 ml-2">
                  {errors.email}
                </Text>
              )}
            </View>
          </View>

          {/* Buttons */}
          <View className="px-6 flex-col w-full gap-4 mt-4">
            <TouchableOpacity
              className="bg-[#D9D9D9] rounded-3xl px-6 py-4 w-full items-center"
              onPress={handleCancel}
            >
              <Text className="text-[#686868]">{t("AddOfficer.Cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black rounded-3xl px-6 py-4 w-full items-center"
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white">{t("AddOfficer.Next")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* District Dropdown Modal - MULTI SELECT with Search */}
      <Modal
        visible={showDistrictDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDistrictModalClose}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <View>
                <Text className="text-lg font-semibold">
                  {t("AddOfficer.SelectDistricts")}
                </Text>
                {/* {selectedDistricts.length > 0 && (
                  <Text className="text-sm text-green-600">
                    {selectedDistricts.length} {t("AddOfficer.selected")}
                  </Text>
                )} */}
              </View>
              <View className="flex-row items-center">
                {/* {selectedDistricts.length > 0 && (
                  <TouchableOpacity
                    onPress={clearAllDistricts}
                    className="mr-3"
                  >
                    <Text className="text-red-500 text-sm font-medium">
                      {t("AddOfficer.ClearAll")}
                    </Text>
                  </TouchableOpacity>
                )} */}
                <TouchableOpacity onPress={handleDistrictModalClose}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            {renderDistrictSearchInput()}

            <FlatList
              // data={getFilteredDistricts()}
              // renderItem={renderDistrictItem}
              // keyExtractor={(item) => item.en}
                  data={getFilteredCFODistricts()}
    keyExtractor={(item) => item.en}
    renderItem={renderDistrictItem}
              showsVerticalScrollIndicator={false}
              className="max-h-64"
              ListEmptyComponent={
                <View className="px-4 py-8 items-center">
                  <Text className="text-gray-500 text-base">
                    {t("AddOfficer.NoDistrictsFound") || "No districts found"}
                  </Text>
                </View>
              }
            />
            <View className="px-4 py-3 border-t border-gray-200">
              <TouchableOpacity
                className="bg-[#21202B] rounded-xl py-3 items-center"
                onPress={handleDistrictModalClose}
              >
                <Text className="text-white font-semibold text-base">
                  {t("AddOfficer.Done")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Code Dropdown Modal 1 with Flags */}
      <Modal
        visible={showCountryCodeDropdown1}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeDropdown1(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectCountryCode")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryCodeDropdown1(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryData}
              renderItem={({ item }) =>
                renderCountryCodeItem(
                  { item },
                  setSelectedCountryCode1,
                  setShowCountryCodeDropdown1
                )
              }
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Country Code Dropdown Modal 2 with Flags */}
      <Modal
        visible={showCountryCodeDropdown2}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeDropdown2(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-11/12 max-h-80">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold">
                {t("AddOfficer.SelectCountryCode")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryCodeDropdown2(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryData}
              renderItem={({ item }) =>
                renderCountryCodeItem(
                  { item },
                  setSelectedCountryCode2,
                  setShowCountryCodeDropdown2
                )
              }
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AddOfficerStep1;
