import { ScrollView, View, Text, StyleSheet } from "react-native";
import ThemedText from "../components/ThemedText";

export default function HomeScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
    >
      <View style={styles.content}>
        <ThemedText size="header" style={styles.title}>
          Expo Biometrics Examples
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
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    opacity: 0.6,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  label: {
    opacity: 0.8,
  },
  value: {
    fontWeight: "500",
  },
  voiceList: {
    flexDirection: "row",
    gap: 12,
  },
  voiceItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  voiceText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  voiceLanguage: {
    opacity: 0.6,
  },
  voiceHint: {
    opacity: 0.5,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  banner: {
    marginTop: 40,
    paddingVertical: 20,
    alignItems: "center",
  },
  bannerText: {
    opacity: 0.4,
    fontWeight: "bold",
  },
});
