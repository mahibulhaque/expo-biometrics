import { ScrollView, StyleSheet, View } from "react-native";
import ThemedText from "../components/ThemedText";

export default function SimplePromptScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
    >
      <View style={styles.content}>
        <ThemedText size="header" style={styles.title}>
          Simple Prompt Example
        </ThemedText>
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
