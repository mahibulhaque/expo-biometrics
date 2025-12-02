import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeTabs from "./HomeTabNavigator";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator initialRouteName="home-tab">
      <Stack.Screen
        name="home-tab"
        component={HomeTabs}
        options={{ title: "Overview" }}
      />
    </Stack.Navigator>
  );
}
