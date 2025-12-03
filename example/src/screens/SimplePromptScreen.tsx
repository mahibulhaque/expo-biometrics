import { View, TouchableOpacity } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import ThemedText from "../components/ui/ThemedText";
import { ThemedView } from "../components/ui/ThemedView";
import { RootStackParamList } from "../navigators/RootNavigator";
import { Pressable } from "react-native";

export default function SimplePromptScreen() {
  const { theme } = useUnistyles();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.typography}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Simple Prompt Example
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingTop: 40, // space for the header
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  title: {
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.foreground,
  },
  backButtonPressed: {
    opacity: 0.6,
    backgroundColor: theme.colors.dimmed,
  },
}));
