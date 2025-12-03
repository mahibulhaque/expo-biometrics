import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { Ionicons } from "@expo/vector-icons";
import { useUnistyles } from "react-native-unistyles";

export type HomeTabsParamsList = {
  home: undefined;
  settings: undefined;
};

const Tab = createBottomTabNavigator<HomeTabsParamsList>();

export default function HomeTabs() {
  const { theme } = useUnistyles();
  return (
    <Tab.Navigator
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: theme.colors.tint,
        tabBarActiveTintColor: theme.colors.activeTint,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.foreground,
        },
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          title: "Features",
          tabBarIcon: ({ focused, color, size }) => {
            return (
              <Ionicons
                name={focused ? "sparkles" : "sparkles-outline"}
                size={size}
                color={color}
              />
            );
          },
        }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ focused, color, size }) => {
            return (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={size}
                color={color}
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}
