import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import FieldOfficerDashboard from "@/component/FeildOfficer/FieldOfficerDashboard";
// import Dashboard from "@/component/ChiefFieldOfficer/Dashboard";
import { Text, View } from "react-native";
import CustomDrawerContent from '@/Items/CustomDrawerContent';
import DashboardTabNavigator from "./DashboardTabNavigator";


const Drawer = createDrawerNavigator();

export default function DrawerNavigation() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false, // show header for drawer toggle
           drawerStyle: {
      width: "70%"
    },
      }}
      
drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="FieldOfficerDashboard" component={FieldOfficerDashboard}    
      options={{
          drawerItemStyle: { display: "none" }, // hides from drawer
        }}/>
    <Drawer.Screen
        name="DashboardTabs"
        component={DashboardTabNavigator}
        options={{ drawerItemStyle: { display: "none" } }} // hide from drawer
      />
    </Drawer.Navigator>
  );
}
