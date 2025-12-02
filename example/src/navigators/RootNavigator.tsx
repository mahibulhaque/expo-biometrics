import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeTabs from "./HomeTabNavigator";
import CreateKeysScreen from "../screens/CreateKeysScreen";
import CreateSignatureScreen from "../screens/CreateSignatureScreen";
import SimplePromptScreen from "../screens/SimplePromptScreen";

export type RootStackParamList = {
  main: undefined;
  "create-keys": undefined;
  "create-signature": undefined;
  "simple-prompt": undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="main"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="main" component={HomeTabs} />
      <Stack.Screen name="create-keys" component={CreateKeysScreen} />
      <Stack.Screen name="create-signature" component={CreateSignatureScreen} />
      <Stack.Screen name="simple-prompt" component={SimplePromptScreen} />
    </Stack.Navigator>
  );
}
