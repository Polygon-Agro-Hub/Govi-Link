import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import Dashboard from "@/component/ChiefFieldOfficer/Dashboard";
import NavigationBar from "@/Items/NavigationBar";
import { RootState } from "@/services/reducxStore";

const Tab = createBottomTabNavigator();

export default function DashboardTabNavigator() {
  const jobRole = useSelector((state: RootState) => state.auth.jobRole);
  const [initialTab, setInitialTab] = useState("Dashboard");

  useEffect(() => {
    if (jobRole === "Chief Field Officer") setInitialTab("Dashboard");
  }, [jobRole]);

  return (
    <Tab.Navigator
      initialRouteName={initialTab}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: false,
        tabBarStyle: { position: "absolute", backgroundColor: "#fff" },
      }}
      tabBar={(props) => <NavigationBar {...props} />}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
    </Tab.Navigator>
  );
}
