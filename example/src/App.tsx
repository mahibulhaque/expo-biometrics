import { NavigationContainer } from "@react-navigation/native";
import RootStack from "./navigators/RootNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
