// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   ScrollView,
//   TouchableOpacity,
//   StatusBar,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Modal,
//   FlatList,
// } from "react-native";
// import { AntDesign, MaterialIcons } from "@expo/vector-icons";
// import FormTabs from "../CapitalRequest/FormTabs";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useTranslation } from "react-i18next";
// import Checkbox from "expo-checkbox";
// import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
// import { useCallback } from "react";
// import { LinearGradient } from "expo-linear-gradient";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "../types";
// import banksData from "@/assets/json/banks.json";
// import branchesData from "@/assets/json/branches.json";

// type FormData = {
//   inspectionfinance?: FinanceInfoData;
// };

// type AssetCategory = {
//   key: string;
//   label: string;
//   subCategories?: { key: string; label: string }[];
// };
// type FinanceInfoData = {
//   accHolder: string;
//   accountNumber: number;
//   confirmAccountNumber: number;
//   bank?: string;
//   branch?: string;
//   debtsOfFarmer?: string;
//   noOfDependents?: string;
//   assets?: {
//     [parentKey: string]: string[];
//   };
// };
// const Input = ({
//   label,
//   placeholder,
//   value,
//   onChangeText,
//   required = false,
//   error,
//   keyboardType = "default",
// }: {
//   label: string;
//   placeholder: string;
//   required?: boolean;
//   value?: string;
//   onChangeText?: (text: string) => void;
//   error?: string;
//   keyboardType?: any;
// }) => (
//   <View className="mb-4">
//     <Text className="text-sm text-[#070707] mb-2">
//       {label} {required && <Text className="text-black">*</Text>}
//     </Text>
//     <View
//       className={`bg-[#F6F6F6] rounded-full flex-row items-center ${
//         error ? "border border-red-500" : ""
//       }`}
//     >
//       <TextInput
//         placeholder={placeholder}
//         placeholderTextColor="#838B8C"
//         className="px-5 py-4 text-base text-black flex-1"
//         value={value}
//         onChangeText={onChangeText}
//         keyboardType={keyboardType}
//       />
//     </View>

//     {error && <Text className="text-red-500 text-sm mt-1 ml-4">{error}</Text>}
//   </View>
// );

// type ValidationRule = {
//   required?: boolean;
//   type?: "accHolder" | "accountNumber" | "noOfDependents";
//   minLength?: number;
//   uniqueWith?: (keyof FormData)[];
// };

// const validateAndFormat = (
//   text: string,
//   rules: ValidationRule,
//   t: any,
//   formData: any,
//   currentKey: keyof typeof formData
// ) => {
//   let value = text;
//   let error = "";

//   if (rules.type === "accHolder") {
//     value = value.replace(/^\s+/, "");
//     value = value.replace(/[^a-zA-Z\s]/g, "");

//     if (value.length > 0) {
//       value = value.charAt(0).toUpperCase() + value.slice(1);
//     }
//     if (rules.required && value.trim().length === 0) {
//       error = t(`Error.${rules.type} is required`);
//     }
//   }

//   if (rules.minLength && value.length < rules.minLength) {
//     error = t("Error.Min length", { count: rules.minLength });
//   }

//   if (rules.type === "accountNumber") {
//     value = value.replace(/[^0-9]/g, "");

//     if (rules.required && value.trim().length === 0) {
//       error = t(`Error.${rules.type} is required`);
//     }

//     if (rules.required && value.trim().length === 0) {
//       error = t(`Error.${rules.type} is required`);
//     }
//   }

//   if (rules.type === "noOfDependents") {
//     value = value.replace(/[^0-9]/g, "");
//     if (rules.required && value.trim().length === 0) {
//       error = t(`Error.${rules.type} is required`);
//     }
//   }

//   return { value, error };
// };

// type FinanceInfoProps = {
//   navigation: any;
// };

// const FinanceInfo: React.FC<FinanceInfoProps> = ({ navigation }) => {
//   const route = useRoute<RouteProp<RootStackParamList, "FinanceInfo">>();
//   const { requestNumber } = route.params;
//   const prevFormData = route.params?.formData;
//   const [formData, setFormData] = useState(prevFormData);
//   console.log(formData)
//   const { t, i18n } = useTranslation();
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const [showBankDropdown, setShowBankDropdown] = useState(false);
//   const [showBranchDropdown, setShowBranchDropdown] = useState(false);
//   const [bankSearch, setBankSearch] = useState("");
//   const [branchSearch, setBranchSearch] = useState("");
//   const [selectedBranch, setSelectedBranch] = useState("");
//   const [selectedBank, setSelectedBank] = useState("");
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isNextEnabled, setIsNextEnabled] = useState(false);
//   const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
//   const [availableBranches, setAvailableBranches] = useState<
//     Array<{ ID: number; name: string }>
//   >([]);

//   const banks = banksData.map((bank) => ({
//     id: bank.ID,
//     name: bank.name,
//   }));
//   useEffect(() => {
//     const requiredFields: (keyof FinanceInfoData)[] = [
//       "accHolder",
//       "accountNumber",
//     ];

//     const allFilled = requiredFields.every((key) => {
//       const value = formData.inspectionfinance?.[key];
//       return (
//         value !== null && value !== undefined && value.toString().trim() !== ""
//       );
//     });
//     console.log("all", allFilled);
//     const assetsError = validateAssets(formData.inspectionfinance?.assets);
//     const hasErrors = Object.values({ ...errors, assets: assetsError }).some(
//       (err) => err && err.trim() !== ""
//     );

//     console.log("hass err", errors);

//     setIsNextEnabled(allFilled && !hasErrors && !hasAssetWarnings());
//   }, [formData, errors]);

//   let jobId = requestNumber;

//   const updateFormData = async (updates: Partial<FinanceInfoData>) => {
//     try {
//       const updatedFormData = {
//         ...formData,
//         inspectionfinance: {
//           ...formData.inspectionfinance,
//           ...updates,
//           bank: selectedBank,
//           branch: updates.branch ?? selectedBranch,
//         },
//       };

//       setFormData(updatedFormData);

//       await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
//     } catch (e) {
//       console.log("AsyncStorage save failed", e);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       const loadFormData = async () => {
//         try {
//           const savedData = await AsyncStorage.getItem(`${jobId}`);
//           if (savedData) {
//             const parsedData: FormData = JSON.parse(savedData);
//             setFormData(parsedData);

//             if (parsedData.inspectionfinance?.bank)
//               setSelectedBank(parsedData.inspectionfinance.bank);
//             if (parsedData.inspectionfinance?.branch)
//               setSelectedBranch(parsedData.inspectionfinance.branch);

//             if (parsedData.inspectionfinance?.bank) {
//               const bankObj = banks.find(
//                 (b) => b.name === parsedData.inspectionfinance?.bank
//               );
//               if (bankObj) {
//                 const filteredBranches =
//                   (branchesData as any)[bankObj.id.toString()] || [];
//                 setAvailableBranches(filteredBranches);
//               }
//             }
//           }
//         } catch (e) {
//           console.log("Failed to load form data", e);
//         }
//       };

//       loadFormData();
//     }, [])
//   );

//   const handleFieldChange = (
//     key: keyof FinanceInfoData,
//     text: string,
//     rules: ValidationRule
//   ) => {

//     const { value, error } = validateAndFormat(text, rules, t, formData, key);

//     setFormData((prev: FormData) => ({
//       ...prev,
//       inspectionfinance: {
//         ...prev.inspectionfinance,
//         [key]: value,
//         bank: selectedBank,
//         branch: prev.inspectionfinance?.branch ?? selectedBranch,
//       },
//     }));

//     // Update errors
//     setErrors((prev) => ({ ...prev, [key]: error || "" }));
//       updateFormData({ [key]: value });
//   };

//   const handleNext = () => {
//             navigation.navigate("LandInfo", { formData, requestNumber });

//     const validationErrors: Record<string, string> = {};

//     const accInfo = formData.inspectionfinance;

//     if (
//       !accInfo?.accHolder ||
//       accInfo.accHolder.trim() === ""
//     ) {
//       validationErrors.accHolder = t(
//         "Error.accHolder is required"
//       );
//     }

//     if (
//       !accInfo?.accountNumber ||
//       accInfo.accountNumber.toString().trim() === ""
//     ) {
//       validationErrors.accountNumber = t("Error.accountNumber is required");
//     }

//     if (!accInfo?.confirmAccountNumber) {
//       validationErrors.confirmAccountNumber = t(
//         "Error.Confirm account number is required"
//       );
//     } else if (accInfo.confirmAccountNumber !== accInfo.accountNumber) {
//       validationErrors.confirmAccountNumber = t(
//         "Error.Account numbers do not match"
//       );
//     }

//     const assets = accInfo?.assets;
//     const anyAssetSelected =
//       assets &&
//       Object.keys(assets).some((key) => {
//         const value = assets[key];
//         return Array.isArray(value) ? value.length > 0 : true;
//       });

//     if (!anyAssetSelected) {
//       validationErrors.assets = t(
//         "Error.At least one option must be selected."
//       );
//     }

//     if (!accInfo?.bank || accInfo.bank === "") {
//       validationErrors.bank = t("Error.Bank is required");
//     }
//     if (!accInfo?.branch || accInfo.branch === "") {
//       validationErrors.branch = t("Error.Branch is required");
//     }

//     if (Object.keys(validationErrors).length > 0) {
//       setErrors(validationErrors);

//       const errorMessage = "• " + Object.values(validationErrors).join("\n• ");
//       Alert.alert(t("Error.Validation Error"), errorMessage, [
//         { text: t("MAIN.OK") },
//       ]);
//       return;
//     }

//     //navigation.navigate("LandInfo", { formData, requestNumber });

//   };

//   const handleModalClose = (modalType: string) => {
//     switch (modalType) {
//       case "bank":
//         setBankSearch("");
//         setShowBankDropdown(false);
//         break;
//       case "branch":
//         setBranchSearch("");
//         setShowBranchDropdown(false);
//         break;
//     }
//   };
//   const handleBankSelect = (bank: { id: number; name: string }) => {
//     setSelectedBank(bank.name);

//     const filteredBranches = (branchesData as any)[bank.id.toString()] || [];
//     setAvailableBranches(filteredBranches);

//     setSelectedBranch(""); // reset branch
//     setShowBankDropdown(false); // close modal
//     updateFormData({
//       bank: bank.name,
//       branch: "", // reset branch in formData
//     });
//   };

//   const handleBranchSelect = (branch: { ID: number; name: string }) => {
//     setSelectedBranch(branch.name);
//     handleModalClose("branch");
//     updateFormData({
//       branch: branch.name,
//     });
//   };

//   const sortBanksAlphabetically = (
//     banks: Array<{ id: number; name: string }>
//   ) => {
//     return [...banks].sort((a, b) => {
//       const nameA = a.name.toLowerCase();
//       const nameB = b.name.toLowerCase();
//       return nameA.localeCompare(nameB);
//     });
//   };

//   // Sort branches by name
//   const sortBranchesAlphabetically = (
//     branches: Array<{ ID: number; name: string }>
//   ) => {
//     return [...branches].sort((a, b) => {
//       const nameA = a.name.toLowerCase();
//       const nameB = b.name.toLowerCase();
//       return nameA.localeCompare(nameB);
//     });
//   };

//   const getFilteredBanks = () => {
//     if (!bankSearch) return sortBanksAlphabetically(banks);
//     return sortBanksAlphabetically(
//       banks.filter((bank) =>
//         bank.name.toLowerCase().includes(bankSearch.toLowerCase())
//       )
//     );
//   };

//   const getFilteredBranches = () => {
//     if (!branchSearch) return sortBranchesAlphabetically(availableBranches);
//     return sortBranchesAlphabetically(
//       availableBranches.filter((branch) =>
//         branch.name.toLowerCase().includes(branchSearch.toLowerCase())
//       )
//     );
//   };
//   const renderBankItem = ({ item }: { item: { id: number; name: string } }) => (
//     <TouchableOpacity
//       className="px-4 py-3 border-b border-gray-200 rounded-2xl"
//       onPress={() => handleBankSelect(item)}
//     >
//       <Text className="text-base text-gray-800">{item.name}</Text>
//     </TouchableOpacity>
//   );

//   const renderBranchItem = ({
//     item,
//   }: {
//     item: { ID: number; name: string };
//   }) => (
//     <TouchableOpacity
//       className="px-4 py-3 border-b border-gray-200 rounded-2xl"
//       onPress={() => handleBranchSelect(item)}
//     >
//       <Text className="text-base text-gray-800">{item.name}</Text>
//     </TouchableOpacity>
//   );
//   const renderSearchInput = (
//     value: string,
//     onChangeText: (text: string) => void,
//     placeholder: string
//   ) => (
//     <View className="px-4 py-2 border-b border-gray-200">
//       <View className="bg-gray-100 rounded-lg px-3 flex-row items-center">
//         <MaterialIcons name="search" size={20} color="#666" />
//         <TextInput
//           placeholder={placeholder}
//           value={value}
//           onChangeText={onChangeText}
//           className="flex-1 ml-2 text-base"
//           placeholderTextColor="#666"
//         />
//         {value ? (
//           <TouchableOpacity onPress={() => onChangeText("")}>
//             <MaterialIcons name="close" size={20} color="#666" />
//           </TouchableOpacity>
//         ) : null}
//       </View>
//     </View>
//   );

//   const assetCategories: AssetCategory[] = [
//     {
//       key: "assetsLand",
//       label: t("InspectionForm.Land"),
//       subCategories: [
//         {
//           key: "Land Residential",
//           label: t("InspectionForm.Land Residential"),
//         },
//         { key: "Land Farm", label: t("InspectionForm.Land Farm") },
//       ],
//     },
//     {
//       key: "assetsBuilding",
//       label: t("InspectionForm.Building"),
//       subCategories: [
//         {
//           key: "House Residential",
//           label: t("InspectionForm.House Residential"),
//         },
//         {
//           key: "Building at the farm",
//           label: t("InspectionForm.Building at the farm"),
//         },
//       ],
//     },
//     {
//       key: "assetsVehicle",
//       label: t("InspectionForm.Vehicle"),

//       subCategories: [
//         { key: "Motor bike", label: t("InspectionForm.Motor bike") },
//         { key: "Three Wheeler", label: t("InspectionForm.Three Wheeler") },
//         { key: "Motor car", label: t("InspectionForm.Motor car") },
//         { key: "Motor van", label: t("InspectionForm.Motor van") },

//         { key: "Tractor", label: t("InspectionForm.Tractor") },
//       ],
//     },
//     {
//       key:"assetsMachinery",
//       label:t("InspectionForm.Machinery"),
//            subCategories: [
//         { key: "Combined Harvestor", label: t("InspectionForm.Combined Harvestor") },
//         { key: "JCB", label: t("InspectionForm.JCB") },
//       ]
//     },
//     {
//       key: "assetsFarmTool",
//       label: t("InspectionForm.Special Farm Tools"),
//     },
//   ];

//   const validateAssets = (assets: FinanceInfoData["assets"]) => {
//     if (!assets) return "At least one option must be selected.";

//     // Check if any category/standalone asset has a value or subitems
//     const anySelected = Object.keys(assets).some((key) => {
//       const value = assets[key];
//       return Array.isArray(value) ? value.length > 0 : true; // standalone asset has empty array
//     });

//     return anySelected ? "" : "At least one option must be selected.";
//   };
//   // Check if any selected category has no sub-items (like Land or Building)
//   const hasAssetWarnings = (): boolean => {
//     const parentAssets = formData.inspectionfinance?.assets || {};
//     return assetCategories.some((category) => {
//       const isCategorySelected = parentAssets.hasOwnProperty(category.key);
//       return (
//         isCategorySelected && (parentAssets[category.key]?.length || 0) === 0
//       );
//     });
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       style={{ flex: 1, backgroundColor: "white" }}
//     >
//       <View className="flex-1 bg-[#F3F3F3] ">
//         <StatusBar barStyle="dark-content" />
//         <View className="flex-row items-center justify-center py-4 mt-2">
//           <TouchableOpacity className="absolute left-4 bg-[#E0E0E080] rounded-full p-4" onPress={()=> navigation.goBack()}>
//             <AntDesign name="left" size={20} color="#000" />
//           </TouchableOpacity>

//           <Text className="text-lg font-semibold text-black">
//             {t("InspectionForm.Inspection Form")}
//           </Text>
//         </View>

//         {/* Tabs */}
//         <FormTabs activeKey="Finance Info" />

//         <ScrollView
//           className="flex-1 px-6 bg-white rounded-t-3xl"
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={{ paddingBottom: 120 }}
//         >
//           <View className="h-6" />
//           <Input
//             label={t("InspectionForm.Account Holder’s Name")}
//             placeholder="----"
//             value={formData.inspectionfinance?.accHolder || ""}
//             onChangeText={(text) =>
//               handleFieldChange("accHolder", text, {
//                 required: true,
//                 type: "accHolder",
//               })
//             }
//             required
//             error={errors.accHolder}
//           />

//           <Input
//             label={t("InspectionForm.Account Number")}
//             placeholder="----"
//             value={formData.inspectionfinance?.accountNumber?.toString() || ""}
//             onChangeText={(text) => {
//               const numericValue =
//                 parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;

//               setFormData((prev: FormData) => ({
//                 ...prev,
//                 inspectionfinance: {
//                   ...prev.inspectionfinance,
//                   accountNumber: numericValue,
//                 },
//               }));

//               updateFormData({ accountNumber: numericValue });
//             }}
//             error={errors.accountNumber}
//             keyboardType="number-pad"
//             required
//           />

//           <Input
//             label={t("InspectionForm.Confirm Account Number")}
//             placeholder="----"
//             value={formData.inspectionfinance?.confirmAccountNumber?.toString() || ""}
//             onChangeText={(text) => {
//               // Convert to number safely
//               const numericValue = text ? parseInt(text, 10) : undefined; // undefined if empty

//               // Update state
//               setFormData((prev: FormData) => ({
//                 ...prev,
//                 inspectionfinance: {
//                   ...prev.inspectionfinance,
//                   confirmAccountNumber: numericValue,
//                 },
//               }));

//               // Save to AsyncStorage
//               updateFormData({ confirmAccountNumber: numericValue });

//               // Validation
//               let error = "";
//               if (!numericValue) {
//                 error = t("Error.Confirm account number is required");
//               } else if (numericValue !== formData.inspectionfinance?.accountNumber) {
//                 error = t("Error.Account numbers do not match");
//               }

//               setErrors((prev) => ({ ...prev, confirmAccountNumber: error }));
//             }}
//             error={errors.confirmAccountNumber}
//             keyboardType="number-pad"
//             required
//           />

//           <View>
//             <Text className="text-sm text-[#070707] mb-2">
//               {t("InspectionForm.Bank Name")} *
//             </Text>
//             <TouchableOpacity
//               className={`bg-[#F4F4F4] rounded-full px-4 py-4 flex-row justify-between items-center ${
//                 errors.bank ? "border border-red-500" : ""
//               }`}
//               onPress={() => setShowBankDropdown(true)}
//             >
//               <Text
//                 className={`${selectedBank ? "text-black" : "text-[#7D7D7D]"}`}
//               >
//                 {selectedBank || t("InspectionForm.Select Bank")}
//               </Text>
//               <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
//             </TouchableOpacity>
//             {errors.bank && (
//               <Text className="text-red-500 text-sm mt-1 ml-2">
//                 {errors.bank}
//               </Text>
//             )}
//           </View>

//           <View className="mt-4">
//             <Text className="text-sm text-[#070707] mb-2">
//               {t("InspectionForm.Branch Name")} *
//             </Text>
//             <TouchableOpacity
//               className={`bg-[#F4F4F4] rounded-full px-4 py-4 flex-row justify-between items-center ${
//                 errors.branch ? "border border-red-500" : ""
//               }`}
//               onPress={() => setShowBranchDropdown(true)}
//               disabled={availableBranches.length === 0}
//             >
//               <Text
//                 className={`${
//                   selectedBranch ? "text-black" : "text-[#7D7D7D]"
//                 }`}
//               >
//                 {selectedBranch || t("InspectionForm.Select Branch")}
//               </Text>
//               <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
//             </TouchableOpacity>
//             {errors.branch && (
//               <Text className="text-red-500 text-sm mt-1 ml-2">
//                 {errors.branch}
//               </Text>
//             )}
//           </View>

//           <View className="border-t border-[#CACACA] my-10 mb-4" />

//           <View className="mt-4">
//             <Text className="text-sm text-[#070707] mb-2">
//               {t("InspectionForm.Existing debts of the farmer")} *
//             </Text>
//             <View
//               className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
//                 errors.debts ? "border border-red-500" : ""
//               }`}
//             >
//               <TextInput
//                 placeholder={t("InspectionForm.Type here...")}
//                 value={formData.inspectionfinance?.debtsOfFarmer || ""}
//                 onChangeText={(text) => {
//                   // Remove leading spaces
//                   let formattedText = text.replace(/^\s+/, "");

//                   // Capitalize first letter
//                   if (formattedText.length > 0) {
//                     formattedText =
//                       formattedText.charAt(0).toUpperCase() +
//                       formattedText.slice(1);
//                   }

//                   // Update state
//                   setFormData((prev: FormData) => ({
//                     ...prev,
//                     inspectionfinance: {
//                       ...prev.inspectionfinance,
//                       debtsOfFarmer: formattedText,
//                     },
//                   }));

//                   // Validation
//                   let error = "";
//                   if (!formattedText || formattedText.trim() === "") {
//                     error = t("Error.debtsOfFarmer is required");
//                   }
//                   setErrors((prev) => ({ ...prev, debts: error }));

//                   // Save to AsyncStorage
//                   if (!error) {
//                     updateFormData({ debtsOfFarmer: formattedText });
//                   }
//                 }}
//                 keyboardType="default"
//                 multiline={true}
//                 textAlignVertical="top"
//               />
//             </View>
//             {errors.debts && (
//               <Text className="text-red-500 text-sm mt-1 ml-2">
//                 {errors.debts}
//               </Text>
//             )}
//           </View>

//           <View className="mt-4">
//             <Input
//               label={t("InspectionForm.No of Dependents")}
//               placeholder={t("InspectionForm.0 or more")}
//               value={formData.inspectionfinance?.noOfDependents}
//               onChangeText={(text) =>
//                 handleFieldChange("noOfDependents", text, {
//                   required: true,
//                   type: "noOfDependents",
//                 })
//               }
//               error={errors.noOfDependents}
//               keyboardType={"phone-pad"}
//               required
//             />
//           </View>

//           {/* tickble options  */}
//           <View className="mt-4">
//             <Text className="text-sm text-[#070707] mb-4">
//               {t("InspectionForm.Assets owned by the farmer")} *
//             </Text>
//             {assetCategories.map((category) => {
//               const parentAssets = formData.inspectionfinance?.assets || {};
//               console.log(parentAssets);

//               const isCategorySelected = parentAssets.hasOwnProperty(
//                 category.key
//               );

//               const showLandWarning =
//                 category.key &&
//                 isCategorySelected &&
//                 (parentAssets[category.key]?.length || 0) === 0;

//               return (
//                 <View key={category.key} className="mb-4 ml-4">
//                   <View className="flex-row items-center mb-2">
//                     <Checkbox
//                       value={isCategorySelected}
//                       onValueChange={(newValue) => {
//                         let updatedAssets = { ...parentAssets };
//                         console.log("up ass", updatedAssets);
//                         if (newValue) {
//                           updatedAssets[category.key] =
//                             updatedAssets[category.key] || [];
//                         } else {
//                           delete updatedAssets[category.key];
//                         }
//                         setFormData((prev: any) => ({
//                           ...prev,
//                           inspectionfinance: {
//                             ...prev.inspectionfinance,
//                             assets: updatedAssets,
//                           },
//                         }));
//                         updateFormData({ assets: updatedAssets });

//                         const noCategorySelected =
//                           Object.keys(updatedAssets).filter(
//                             (key) => key !== "Special Farm Tools" // ignore this category
//                           ).length === 0;

//                         setErrors((prev) => ({
//                           ...prev,
//                           assets: noCategorySelected
//                             ? t("Error.At least one option must be selected.")
//                             : "",
//                         }));
//                       }}
//                       color={isCategorySelected ? "#000" : undefined}
//                       style={{ borderRadius: 6 }}
//                     />
//                     <Text className="ml-2 text-black ">
//                       {t(category.label)}
//                     </Text>
//                   </View>

//                   {isCategorySelected &&
//                     category.subCategories?.map((sub) => {
//                       const isSubSelected = parentAssets[
//                         category.key
//                       ]?.includes(sub.key);

//                       return (
//                         <View
//                           key={sub.key}
//                           className="flex-row items-center ml-6 mb-2 mt-2"
//                         >
//                           <Checkbox
//                             value={isSubSelected}
//                             onValueChange={(newValue) => {
//                               let updatedAssets = { ...parentAssets };

// if (newValue) {
//   updatedAssets[category.key] =
//     updatedAssets[category.key] || [];
//   if (
//     !updatedAssets[category.key].includes(sub.key)
//   ) {
//     updatedAssets[category.key].push(sub.key);
//   }
// } else {
//   updatedAssets[category.key] = updatedAssets[
//     category.key
//   ].filter((s: string) => s !== sub.key);
// }

//                               setFormData((prev: any) => ({
//                                 ...prev,
//                                 inspectionfinance: {
//                                   ...prev.inspectionfinance,
//                                   assets: updatedAssets,
//                                 },
//                               }));
//                               updateFormData({ assets: updatedAssets });
//                             }}
//                             color={isSubSelected ? "#000" : undefined}
//                             style={{ borderRadius: 6 }}
//                           />
//                           <Text className="ml-2 text-black">
//                             {t(sub.label)}
//                           </Text>
//                         </View>
//                       );
//                     })}

//                   {category.key === "Special Farm Tools" &&
//                     isCategorySelected && (
//                       <View className=" mt-2 bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2">
//                         <TextInput
//                           placeholder={t("InspectionForm.Type here...")}
//                           value={parentAssets["Special Farm Tools"]?.[0] || ""}
//                           onChangeText={(text) => {
//                             let formattedText = text.replace(/^\s+/, "");

//                             if (formattedText.length > 0) {
//                               formattedText =
//                                 formattedText.charAt(0).toUpperCase() +
//                                 formattedText.slice(1);
//                             }

//                             let updatedAssets = { ...parentAssets };
//                             if (!updatedAssets["Special Farm Tools"]) {
//                               updatedAssets["Special Farm Tools"] = [];
//                             }

//                             if (formattedText.length > 0) {
//                               updatedAssets["Special Farm Tools"][0] =
//                                 formattedText;
//                             } else {
//                               updatedAssets["Special Farm Tools"] = [];
//                             }

//                             setFormData((prev: any) => ({
//                               ...prev,
//                               inspectionfinance: {
//                                 ...prev.inspectionfinance,
//                                 assets: updatedAssets,
//                               },
//                             }));

//                             updateFormData({ assets: updatedAssets });

//                             // Validation
//                             const error =
//                               formattedText.trim() === ""
//                                 ? t("Error.SpecialFarmTools is required")
//                                 : "";
//                             setErrors((prev) => ({
//                               ...prev,
//                               specialTools: error,
//                             }));
//                           }}
//                           keyboardType="default"
//                           multiline={true}
//                           textAlignVertical="top"
//                         />
//                       </View>
//                     )}

//                   {showLandWarning && (
//                     <Text
//                       className={`${
//                         category.key === "Special Farm Tools" ? "" : ""
//                       } text-red-500 text-sm mt-2`}
//                     >
//                       {category.key === "Special Farm Tools"
//                         ? t(
//                             `Error.Please specify any special farm tools utilized by the farmer.`
//                           )
//                         : t("Error.At least one", {
//                             category: category.label,
//                           })}
//                     </Text>
//                   )}
//                 </View>
//               );
//             })}

//             {errors.assets && (
//               <Text className="text-red-500 text-sm mt-1 ml-2">
//                 {errors.assets}
//               </Text>
//             )}
//           </View>
//         </ScrollView>

//         <Modal
//           visible={showBankDropdown}
//           transparent={true}
//           animationType="slide"
//           onRequestClose={() => handleModalClose("bank")}
//         >
//           <View className="flex-1 bg-black/50 justify-center items-center">
//             <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
//               <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
//                 <Text className="text-lg font-semibold">
//                   {t("AddOfficer.SelectBank")}
//                 </Text>
//                 <TouchableOpacity onPress={() => handleModalClose("bank")}>
//                   <MaterialIcons name="close" size={24} color="#666" />
//                 </TouchableOpacity>
//               </View>
//               {renderSearchInput(
//                 bankSearch,
//                 setBankSearch,
//                 t("AddOfficer.SearchBank") || "Search bank..."
//               )}
//               <FlatList
//                 data={getFilteredBanks()}
//                 renderItem={renderBankItem}
//                 keyExtractor={(item) => item.id.toString()}
//                 showsVerticalScrollIndicator={false}
//                 className="max-h-96"
//               />
//             </View>
//           </View>
//         </Modal>

//         <Modal
//           visible={showBranchDropdown}
//           transparent={true}
//           animationType="slide"
//           onRequestClose={() => handleModalClose("branch")}
//         >
//           <View className="flex-1 bg-black/50 justify-center items-center">
//             <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
//               <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
//                 <Text className="text-lg font-semibold">
//                   {t("AddOfficer.SelectBranch")}
//                 </Text>
//                 <TouchableOpacity onPress={() => handleModalClose("branch")}>
//                   <MaterialIcons name="close" size={24} color="#666" />
//                 </TouchableOpacity>
//               </View>
//               {renderSearchInput(
//                 branchSearch,
//                 setBranchSearch,
//                 t("AddOfficer.SearchBranch") || "Search branch..."
//               )}
//               <FlatList
//                 data={getFilteredBranches()}
//                 renderItem={renderBranchItem}
//                 keyExtractor={(item) => item.ID.toString()}
//                 showsVerticalScrollIndicator={false}
//                 className="max-h-96"
//               />
//             </View>
//           </View>
//         </Modal>
//         <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
//           <TouchableOpacity
//             className="flex-1 bg-[#444444] rounded-full py-4 items-center"
//             onPress={() =>
//               navigation.navigate("Main", {
//                 screen: "MainTabs",
//                 params: {
//                   screen: "CapitalRequests",
//                 },
//               })
//             }
//           >
//             <Text className="text-white text-base font-semibold">
//               {t("InspectionForm.Exit")}
//             </Text>
//           </TouchableOpacity>
//           {isNextEnabled == false ? (
//             <View className="flex-1">
//               <TouchableOpacity className="flex-1 " onPress={handleNext}>
//                 <LinearGradient
//                   colors={["#F35125", "#FF1D85"]}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 0 }}
//                   className=" rounded-full py-4 items-center"
//                   style={{
//                     shadowColor: "#000",
//                     shadowOffset: { width: 0, height: 3 },
//                     shadowOpacity: 0.25,
//                     shadowRadius: 5,
//                     elevation: 6,
//                   }}
//                 >
//                   <Text className="text-white text-base font-semibold">
//                     {t("InspectionForm.Next")}
//                   </Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <View className="flex-1 bg-gray-300 rounded-full py-4 items-center">
//               <Text className="text-white text-base font-semibold">
//                 {t("InspectionForm.Next")}
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// export default FinanceInfo;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import FormTabs from "../CapitalRequest/FormTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Checkbox from "expo-checkbox";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import banksData from "@/assets/json/banks.json";
import branchesData from "@/assets/json/branches.json";

type FormData = {
  inspectionfinance?: FinanceInfoData;
};

type AssetCategory = {
  key: string;
  label: string;
  subCategories?: { key: string; label: string }[];
};
type FinanceInfoData = {
  accHolder: string;
  accountNumber: number;
  confirmAccountNumber: number;
  bank?: string;
  branch?: string;
  debtsOfFarmer?: string;
  noOfDependents?: string;
  assets?: {
    [parentKey: string]: string[];
  };
    assetsLand?: string[];
  assetsBuilding?: string[];
  assetsVehicle?: string[];
  assetsMachinery?: string[];
  assetsFarmTool?: string; //
};
const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  required = false,
  error,
  keyboardType = "default",
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  keyboardType?: any;
}) => (
  <View className="mb-4">
    <Text className="text-sm text-[#070707] mb-2">
      {label} {required && <Text className="text-black">*</Text>}
    </Text>
    <View
      className={`bg-[#F6F6F6] rounded-full flex-row items-center ${
        error ? "border border-red-500" : ""
      }`}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#838B8C"
        className="px-5 py-4 text-base text-black flex-1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>

    {error && <Text className="text-red-500 text-sm mt-1 ml-4">{error}</Text>}
  </View>
);

type ValidationRule = {
  required?: boolean;
  type?: "accHolder" | "accountNumber" | "noOfDependents";
  minLength?: number;
  uniqueWith?: (keyof FormData)[];
};

const validateAndFormat = (
  text: string,
  rules: ValidationRule,
  t: any,
  formData: any,
  currentKey: keyof typeof formData
) => {
  let value = text;
  let error = "";

  if (rules.type === "accHolder") {
    value = value.replace(/^\s+/, "");
    value = value.replace(/[^a-zA-Z\s]/g, "");

    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  if (rules.minLength && value.length < rules.minLength) {
    error = t("Error.Min length", { count: rules.minLength });
  }

  if (rules.type === "accountNumber") {
    value = value.replace(/[^0-9]/g, "");

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }

    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  if (rules.type === "noOfDependents") {
    value = value.replace(/[^0-9]/g, "");
    if (rules.required && value.trim().length === 0) {
      error = t(`Error.${rules.type} is required`);
    }
  }

  return { value, error };
};

type FinanceInfoProps = {
  navigation: any;
};

const FinanceInfo: React.FC<FinanceInfoProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "FinanceInfo">>();
  const { requestNumber } = route.params;
  const prevFormData = route.params?.formData;
  const [formData, setFormData] = useState(prevFormData);
  console.log(formData);
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [availableBranches, setAvailableBranches] = useState<
    Array<{ ID: number; name: string }>
  >([]);

  const banks = banksData.map((bank) => ({
    id: bank.ID,
    name: bank.name,
  }));
useEffect(() => {
  const requiredFields: (keyof FinanceInfoData)[] = [
    "accHolder",
    "accountNumber",
  ];

  const allFilled = requiredFields.every((key) => {
    const value = formData.inspectionfinance?.[key];
    return value !== null && value !== undefined && value.toString().trim() !== "";
  });

  // Check assets including assetsFarmTool
  const assetsError = (() => {
    const assetKeys: (keyof FinanceInfoData)[] = [
      "assetsLand",
      "assetsBuilding",
      "assetsVehicle",
      "assetsMachinery",
      "assetsFarmTool",
    ];

    return assetKeys.some((key) => {
      const value = formData.inspectionfinance?.[key];
      if (key === "assetsFarmTool") {
        return typeof value === "string" && value.trim() !== "";
      } else {
        return Array.isArray(value) && value.length > 0;
      }
    })
      ? ""
      : t("Error.At least one option must be selected.");
  })();

  const hasErrors = Object.values({ ...errors, assets: assetsError }).some(
    (err) => err && err.trim() !== ""
  );

  setIsNextEnabled(allFilled && !hasErrors && !hasAssetWarnings());
}, [formData, errors]);




  let jobId = requestNumber;

  const updateFormData = async (updates: Partial<FinanceInfoData>) => {
    try {
      const updatedFormData = {
        ...formData,
        inspectionfinance: {
          ...formData.inspectionfinance,
          ...updates,
          bank: selectedBank,
          branch: updates.branch ?? selectedBranch,
        },
      };

      setFormData(updatedFormData);

      await AsyncStorage.setItem(`${jobId}`, JSON.stringify(updatedFormData));
    } catch (e) {
      console.log("AsyncStorage save failed", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadFormData = async () => {
        try {
          const savedData = await AsyncStorage.getItem(`${jobId}`);
          if (savedData) {
            const parsedData: FormData = JSON.parse(savedData);
            setFormData(parsedData);

            if (parsedData.inspectionfinance?.bank)
              setSelectedBank(parsedData.inspectionfinance.bank);
            if (parsedData.inspectionfinance?.branch)
              setSelectedBranch(parsedData.inspectionfinance.branch);

            if (parsedData.inspectionfinance?.bank) {
              const bankObj = banks.find(
                (b) => b.name === parsedData.inspectionfinance?.bank
              );
              if (bankObj) {
                const filteredBranches =
                  (branchesData as any)[bankObj.id.toString()] || [];
                setAvailableBranches(filteredBranches);
              }
            }
          }
        } catch (e) {
          console.log("Failed to load form data", e);
        }
      };

      loadFormData();
    }, [])
  );

  const handleFieldChange = (
    key: keyof FinanceInfoData,
    text: string,
    rules: ValidationRule
  ) => {
    const { value, error } = validateAndFormat(text, rules, t, formData, key);

    setFormData((prev: FormData) => ({
      ...prev,
      inspectionfinance: {
        ...prev.inspectionfinance,
        [key]: value,
        bank: selectedBank,
        branch: prev.inspectionfinance?.branch ?? selectedBranch,
      },
    }));

    // Update errors
    setErrors((prev) => ({ ...prev, [key]: error || "" }));
    updateFormData({ [key]: value });
  };
const handleNext = () => {
  const validationErrors: Record<string, string> = {};
  const accInfo = formData.inspectionfinance;

  // Account holder
  if (!accInfo?.accHolder || accInfo.accHolder.trim() === "") {
    validationErrors.accHolder = t("Error.accHolder is required");
  }

  // Account number
  if (!accInfo?.accountNumber || accInfo.accountNumber.toString().trim() === "") {
    validationErrors.accountNumber = t("Error.accountNumber is required");
  }

  // Confirm account number
  if (!accInfo?.confirmAccountNumber) {
    validationErrors.confirmAccountNumber = t(
      "Error.Confirm account number is required"
    );
  } else if (accInfo.confirmAccountNumber !== accInfo.accountNumber) {
    validationErrors.confirmAccountNumber = t(
      "Error.Account numbers do not match"
    );
  }

  // Assets check
  const assetKeys: (keyof FinanceInfoData)[] = [
    "assetsLand",
    "assetsBuilding",
    "assetsVehicle",
    "assetsMachinery",
    "assetsFarmTool",
  ];

  const anyAssetSelected = assetKeys.some((key) => {
    const value = accInfo?.[key];
    if (key === "assetsFarmTool") {
      return typeof value === "string" && value.trim() !== "";
    } else {
      return Array.isArray(value) && value.length > 0;
    }
  });

  if (!anyAssetSelected) {
    validationErrors.assets = t("Error.At least one option must be selected.");
  }

  // Bank & branch
  if (!accInfo?.bank || accInfo.bank === "") {
    validationErrors.bank = t("Error.Bank is required");
  }
  if (!accInfo?.branch || accInfo.branch === "") {
    validationErrors.branch = t("Error.Branch is required");
  }

  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);

    const errorMessage =
      "• " + Object.values(validationErrors).join("\n• ");
    Alert.alert(t("Error.Validation Error"), errorMessage, [
      { text: t("MAIN.OK") },
    ]);
    return;
  }

  // Navigate if no errors
  navigation.navigate("LandInfo", { formData, requestNumber });
};


  const handleModalClose = (modalType: string) => {
    switch (modalType) {
      case "bank":
        setBankSearch("");
        setShowBankDropdown(false);
        break;
      case "branch":
        setBranchSearch("");
        setShowBranchDropdown(false);
        break;
    }
  };
  const handleBankSelect = (bank: { id: number; name: string }) => {
    setSelectedBank(bank.name);

    const filteredBranches = (branchesData as any)[bank.id.toString()] || [];
    setAvailableBranches(filteredBranches);

    setSelectedBranch(""); // reset branch
    setShowBankDropdown(false); // close modal
    updateFormData({
      bank: bank.name,
      branch: "", // reset branch in formData
    });
  };

  const handleBranchSelect = (branch: { ID: number; name: string }) => {
    setSelectedBranch(branch.name);
    handleModalClose("branch");
    updateFormData({
      branch: branch.name,
    });
  };

  const sortBanksAlphabetically = (
    banks: Array<{ id: number; name: string }>
  ) => {
    return [...banks].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Sort branches by name
  const sortBranchesAlphabetically = (
    branches: Array<{ ID: number; name: string }>
  ) => {
    return [...branches].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const getFilteredBanks = () => {
    if (!bankSearch) return sortBanksAlphabetically(banks);
    return sortBanksAlphabetically(
      banks.filter((bank) =>
        bank.name.toLowerCase().includes(bankSearch.toLowerCase())
      )
    );
  };

  const getFilteredBranches = () => {
    if (!branchSearch) return sortBranchesAlphabetically(availableBranches);
    return sortBranchesAlphabetically(
      availableBranches.filter((branch) =>
        branch.name.toLowerCase().includes(branchSearch.toLowerCase())
      )
    );
  };
  const renderBankItem = ({ item }: { item: { id: number; name: string } }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl"
      onPress={() => handleBankSelect(item)}
    >
      <Text className="text-base text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );

  const renderBranchItem = ({
    item,
  }: {
    item: { ID: number; name: string };
  }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200 rounded-2xl"
      onPress={() => handleBranchSelect(item)}
    >
      <Text className="text-base text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );
  const renderSearchInput = (
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string
  ) => (
    <View className="px-4 py-2 border-b border-gray-200">
      <View className="bg-gray-100 rounded-lg px-3 flex-row items-center">
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          className="flex-1 ml-2 text-base"
          placeholderTextColor="#666"
        />
        {value ? (
          <TouchableOpacity onPress={() => onChangeText("")}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const removeFromStorage = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error("Error removing key", key, e);
    }
  };

  const assetCategories: AssetCategory[] = [
    {
      key: "assetsLand",
      label: t("InspectionForm.Land"),
      subCategories: [
        {
          key: "Land Residential",
          label: t("InspectionForm.Land Residential"),
        },
        { key: "Land Farm", label: t("InspectionForm.Land Farm") },
      ],
    },
    {
      key: "assetsBuilding",
      label: t("InspectionForm.Building"),
      subCategories: [
        {
          key: "House Residential",
          label: t("InspectionForm.House Residential"),
        },
        {
          key: "Building at the farm",
          label: t("InspectionForm.Building at the farm"),
        },
      ],
    },
    {
      key: "assetsVehicle",
      label: t("InspectionForm.Vehicle"),

      subCategories: [
        { key: "Motor bike", label: t("InspectionForm.Motor bike") },
        { key: "Three Wheeler", label: t("InspectionForm.Three Wheeler") },
        { key: "Motor car", label: t("InspectionForm.Motor car") },
        { key: "Motor van", label: t("InspectionForm.Motor van") },

        { key: "Tractor", label: t("InspectionForm.Tractor") },
      ],
    },
    {
      key: "assetsMachinery",
      label: t("InspectionForm.Machinery"),
      subCategories: [
        {
          key: "Combined Harvestor",
          label: t("InspectionForm.Combined Harvestor"),
        },
        { key: "JCB", label: t("InspectionForm.JCB") },
      ],
    },
    {
      key: "assetsFarmTool",
      label: t("InspectionForm.Special Farm Tools"),
    },
  ];

  const validateAssets = (assets: FinanceInfoData["assets"]) => {
    if (!assets) return "At least one option must be selected.";

    // Check if any category/standalone asset has a value or subitems
    const anySelected = Object.keys(assets).some((key) => {
      const value = assets[key];
      return Array.isArray(value) ? value.length > 0 : true; // standalone asset has empty array
    });

    return anySelected ? "" : "At least one option must be selected.";
  };
  // Check if any selected category has no sub-items (like Land or Building)
  const hasAssetWarnings = (): boolean => {
    const parentAssets = formData.inspectionfinance || {};
    return assetCategories.some((category) => {
      const isCategorySelected = parentAssets.hasOwnProperty(category.key);
      return (
        isCategorySelected && (parentAssets[category.key]?.length || 0) === 0
      );
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-[#F3F3F3] ">
        <StatusBar barStyle="dark-content" />
        <View className="flex-row items-center justify-center py-4 mt-2">
          <TouchableOpacity
            className="absolute left-4 bg-[#E0E0E080] rounded-full p-4"
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-black">
            {t("InspectionForm.Inspection Form")}
          </Text>
        </View>

        {/* Tabs */}
        <FormTabs activeKey="Finance Info" />

        <ScrollView
          className="flex-1 px-6 bg-white rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="h-6" />
          <Input
            label={t("InspectionForm.Account Holder’s Name")}
            placeholder="----"
            value={formData.inspectionfinance?.accHolder || ""}
            onChangeText={(text) =>
              handleFieldChange("accHolder", text, {
                required: true,
                type: "accHolder",
              })
            }
            required
            error={errors.accHolder}
          />

          <Input
            label={t("InspectionForm.Account Number")}
            placeholder="----"
            value={formData.inspectionfinance?.accountNumber?.toString() || ""}
            onChangeText={(text) => {
              const numericValue =
                parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;

              setFormData((prev: FormData) => ({
                ...prev,
                inspectionfinance: {
                  ...prev.inspectionfinance,
                  accountNumber: numericValue,
                },
              }));

              updateFormData({ accountNumber: numericValue });
            }}
            error={errors.accountNumber}
            keyboardType="number-pad"
            required
          />

          <Input
            label={t("InspectionForm.Confirm Account Number")}
            placeholder="----"
            value={
              formData.inspectionfinance?.confirmAccountNumber?.toString() || ""
            }
            onChangeText={(text) => {
              // Convert to number safely
              const numericValue = text ? parseInt(text, 10) : undefined; // undefined if empty

              // Update state
              setFormData((prev: FormData) => ({
                ...prev,
                inspectionfinance: {
                  ...prev.inspectionfinance,
                  confirmAccountNumber: numericValue,
                },
              }));

              // Save to AsyncStorage
              updateFormData({ confirmAccountNumber: numericValue });

              // Validation
              let error = "";
              if (!numericValue) {
                error = t("Error.Confirm account number is required");
              } else if (
                numericValue !== formData.inspectionfinance?.accountNumber
              ) {
                error = t("Error.Account numbers do not match");
              }

              setErrors((prev) => ({ ...prev, confirmAccountNumber: error }));
            }}
            error={errors.confirmAccountNumber}
            keyboardType="number-pad"
            required
          />

          <View>
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Bank Name")} *
            </Text>
            <TouchableOpacity
              className={`bg-[#F4F4F4] rounded-full px-4 py-4 flex-row justify-between items-center ${
                errors.bank ? "border border-red-500" : ""
              }`}
              onPress={() => setShowBankDropdown(true)}
            >
              <Text
                className={`${selectedBank ? "text-black" : "text-[#7D7D7D]"}`}
              >
                {selectedBank || t("InspectionForm.Select Bank")}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {errors.bank && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.bank}
              </Text>
            )}
          </View>

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Branch Name")} *
            </Text>
            <TouchableOpacity
              className={`bg-[#F4F4F4] rounded-full px-4 py-4 flex-row justify-between items-center ${
                errors.branch ? "border border-red-500" : ""
              }`}
              onPress={() => setShowBranchDropdown(true)}
              disabled={availableBranches.length === 0}
            >
              <Text
                className={`${
                  selectedBranch ? "text-black" : "text-[#7D7D7D]"
                }`}
              >
                {selectedBranch || t("InspectionForm.Select Branch")}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {errors.branch && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.branch}
              </Text>
            )}
          </View>

          <View className="border-t border-[#CACACA] my-10 mb-4" />

          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-2">
              {t("InspectionForm.Existing debts of the farmer")} *
            </Text>
            <View
              className={`bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2 ${
                errors.debts ? "border border-red-500" : ""
              }`}
            >
              <TextInput
                placeholder={t("InspectionForm.Type here...")}
                value={formData.inspectionfinance?.debtsOfFarmer || ""}
                onChangeText={(text) => {
                  // Remove leading spaces
                  let formattedText = text.replace(/^\s+/, "");

                  // Capitalize first letter
                  if (formattedText.length > 0) {
                    formattedText =
                      formattedText.charAt(0).toUpperCase() +
                      formattedText.slice(1);
                  }

                  // Update state
                  setFormData((prev: FormData) => ({
                    ...prev,
                    inspectionfinance: {
                      ...prev.inspectionfinance,
                      debtsOfFarmer: formattedText,
                    },
                  }));

                  // Validation
                  let error = "";
                  if (!formattedText || formattedText.trim() === "") {
                    error = t("Error.debtsOfFarmer is required");
                  }
                  setErrors((prev) => ({ ...prev, debts: error }));

                  // Save to AsyncStorage
                  if (!error) {
                    updateFormData({ debtsOfFarmer: formattedText });
                  }
                }}
                keyboardType="default"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            {errors.debts && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.debts}
              </Text>
            )}
          </View>

          <View className="mt-4">
            <Input
              label={t("InspectionForm.No of Dependents")}
              placeholder={t("InspectionForm.0 or more")}
              value={formData.inspectionfinance?.noOfDependents}
              onChangeText={(text) =>
                handleFieldChange("noOfDependents", text, {
                  required: true,
                  type: "noOfDependents",
                })
              }
              error={errors.noOfDependents}
              keyboardType={"phone-pad"}
              required
            />
          </View>

          {/* tickble options  */}
          <View className="mt-4">
            <Text className="text-sm text-[#070707] mb-4">
              {t("InspectionForm.Assets owned by the farmer")} *
            </Text>
            {assetCategories.map((category) => {
              const parentAssets = formData.inspectionfinance || {}; // <- point here
              const isCategorySelected = parentAssets.hasOwnProperty(
                category.key
              );

              const showLandWarning =
                category.key &&
                isCategorySelected &&
                (parentAssets[category.key]?.length || 0) === 0;

              return (
                <View key={category.key} className="mb-4 ml-4">
                  <View className="flex-row items-center mb-2">
                    <Checkbox
                      value={isCategorySelected}
                      onValueChange={(newValue) => {
                        let updatedFormData = { ...formData.inspectionfinance };
                        if (newValue) {
                          updatedFormData[category.key] =
                            updatedFormData[category.key] || [];
                        } else {
                          delete updatedFormData[category.key];
                        }

                        setFormData((prev: any) => ({
                          ...prev,
                          inspectionfinance: {
                            ...updatedFormData,
                            bank: selectedBank,
                            branch: updatedFormData.branch || selectedBranch,
                          },
                        }));

                        if (newValue) {
                          updateFormData({
                            [category.key]: updatedFormData[category.key],
                          });
                        } else {
                          removeFromStorage(category.key);
                        }

                        const noCategorySelected =
                          Object.keys(updatedFormData).filter(
                            (key) => key !== "Special Farm Tools"
                          ).length === 0;

                        setErrors((prev) => ({
                          ...prev,
                          assets: noCategorySelected
                            ? t("Error.At least one option must be selected.")
                            : "",
                        }));
                      }}
                      color={isCategorySelected ? "#000" : undefined}
                      style={{ borderRadius: 6 }}
                    />
                    <Text className="ml-2 text-black ">
                      {t(category.label)}
                    </Text>
                  </View>

                  {isCategorySelected &&
                    category.subCategories?.map((sub) => {
                      const isSubSelected = parentAssets[
                        category.key
                      ]?.includes(sub.key);

                      return (
                        <View
                          key={sub.key}
                          className="flex-row items-center ml-6 mb-2 mt-2"
                        >
                          <Checkbox
                            value={isSubSelected}
                            onValueChange={(newValue) => {
                              let updatedFormData = {
                                ...formData.inspectionfinance,
                              };
                              if (newValue) {
                                updatedFormData[category.key] =
                                  updatedFormData[category.key] || [];
                                if (
                                  !updatedFormData[category.key].includes(
                                    sub.key
                                  )
                                ) {
                                  updatedFormData[category.key].push(sub.key);
                                }
                              } else {
                                updatedFormData[category.key] = updatedFormData[
                                  category.key
                                ].filter((s: string) => s !== sub.key);
                              }
                              setFormData((prev: any) => ({
                                ...prev,
                                inspectionfinance: {
                                  ...updatedFormData,
                                  bank: selectedBank,
                                  branch:
                                    updatedFormData.branch || selectedBranch,
                                },
                              }));
                              updateFormData({
                                [category.key]: updatedFormData[category.key],
                              });
                            }}
                            color={isSubSelected ? "#000" : undefined}
                            style={{ borderRadius: 6 }}
                          />
                          <Text className="ml-2 text-black">
                            {t(sub.label)}
                          </Text>
                        </View>
                      );
                    })}

                  {category.key === "assetsFarmTool" && isCategorySelected && (
                    <View className="mt-2 bg-[#F6F6F6] rounded-3xl h-40 px-4 py-2">
                      <TextInput
                        placeholder={t("InspectionForm.Type here...")}
                        value={formData.inspectionfinance?.assetsFarmTool || ""}
                        onChangeText={(text) => {
                          let formattedText = text.replace(/^\s+/, "");

                          if (formattedText.length > 0) {
                            formattedText =
                              formattedText.charAt(0).toUpperCase() +
                              formattedText.slice(1);
                          }

                          setFormData((prev: { inspectionfinance: any }) => {
                            const updatedInspection = {
                              ...prev.inspectionfinance,
                            };

                            if (formattedText.length > 0) {
                              updatedInspection.assetsFarmTool = formattedText;
                            } else {
                              delete updatedInspection.assetsFarmTool; 
                            }

                            const updatedFormData = {
                              ...prev,
                              inspectionfinance: updatedInspection,
                            };

                            AsyncStorage.setItem(
                              `${jobId}`,
                              JSON.stringify(updatedFormData)
                            );

                            return updatedFormData;
                          });

                          const error =
                            formattedText.trim() === ""
                              ? t("Error.SpecialFarmTools is required")
                              : "";
                          setErrors((prev) => ({
                            ...prev,
                            specialTools: error,
                          }));
                        }}
                        keyboardType="default"
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  )}

                  {showLandWarning && (
                    <Text
                      className={`${
                        category.key === "assetsFarmTool" ? "" : ""
                      } text-red-500 text-sm mt-2`}
                    >
                      {category.key === "assetsFarmTool"
                        ? t(
                            `Error.Please specify any special farm tools utilized by the farmer.`
                          )
                        : t("Error.At least one", {
                            category: category.label,
                          })}
                    </Text>
                  )}
                </View>
              );
            })}

            {errors.assets && (
              <Text className="text-red-500 text-sm mt-1 ml-2">
                {errors.assets}
              </Text>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={showBankDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => handleModalClose("bank")}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                <Text className="text-lg font-semibold">
                  {t("AddOfficer.SelectBank")}
                </Text>
                <TouchableOpacity onPress={() => handleModalClose("bank")}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {renderSearchInput(
                bankSearch,
                setBankSearch,
                t("AddOfficer.SearchBank") || "Search bank..."
              )}
              <FlatList
                data={getFilteredBanks()}
                renderItem={renderBankItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                className="max-h-96"
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showBranchDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => handleModalClose("branch")}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                <Text className="text-lg font-semibold">
                  {t("AddOfficer.SelectBranch")}
                </Text>
                <TouchableOpacity onPress={() => handleModalClose("branch")}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {renderSearchInput(
                branchSearch,
                setBranchSearch,
                t("AddOfficer.SearchBranch") || "Search branch..."
              )}
              <FlatList
                data={getFilteredBranches()}
                renderItem={renderBranchItem}
                keyExtractor={(item) => item.ID.toString()}
                showsVerticalScrollIndicator={false}
                className="max-h-96"
              />
            </View>
          </View>
        </Modal>
        <View className="flex-row px-6 py-4 gap-4 bg-white border-t border-gray-200 ">
          <TouchableOpacity
            className="flex-1 bg-[#444444] rounded-full py-4 items-center"
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text className="text-white text-base font-semibold">
              {t("InspectionForm.Back")}
            </Text>
          </TouchableOpacity>
          {isNextEnabled == true ? (
            <View className="flex-1">
              <TouchableOpacity className="flex-1 " onPress={handleNext}>
                <LinearGradient
                  colors={["#F35125", "#FF1D85"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className=" rounded-full py-4 items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 5,
                    elevation: 6,
                  }}
                >
                  <Text className="text-white text-base font-semibold">
                    {t("InspectionForm.Next")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1 bg-gray-300 rounded-full py-4 items-center">
              <Text className="text-white text-base font-semibold">
                {t("InspectionForm.Next")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default FinanceInfo;
