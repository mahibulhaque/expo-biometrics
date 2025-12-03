import { useNavigation } from "@react-navigation/native";
import ThemedText from "../components/ui/ThemedText";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { RootStackParamList } from "../navigators/RootNavigator";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "react-native";

type Example = {
  title: string;
  description: string;
  route: keyof RootStackParamList;
};

const examples: Example[] = [
  {
    title: "Simple Prompt",
    description: "Method to prompt user for biometric authenticaion",
    route: "simple-prompt",
  },
  {
    title: "Create Keys",
    description: "Private and Public keypair generation method",
    route: "create-keys",
  },
  {
    title: "Create Signature",
    description: "Encrypted payload creation method using private key",
    route: "create-signature",
  },
];

export default function Home() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
    >
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Examples
        </ThemedText>

        {examples.map((example, index) => (
          <Pressable
            key={example.route}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
              index === examples.length - 1 && styles.lastCard,
            ]}
            onPress={() => {
              navigation.push(example.route);
            }}
          >
            <ThemedText style={styles.cardTitle}>{example.title}</ThemedText>
            <ThemedText type="subtitle" style={styles.cardDescription}>
              {example.description}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 24,
  },
  card: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  cardPressed: {
    opacity: 0.7,
  },
  lastCard: {
    borderBottomWidth: 0,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 4,
  },
  cardDescription: {
    opacity: 0.6,
  },
});
