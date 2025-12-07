import { useState } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import ThemedText from "../components/ui/ThemedText";
import { ThemedView } from "../components/ui/ThemedView";
import { RootStackParamList } from "../navigators/RootNavigator";
import ExpoBiometricsModule from "expo-biometrics";

export default function CreateKeysScreen() {
  const { theme } = useUnistyles();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [_, setPublicKey] = useState<string>("");

  const onCreateSignatureRequest = async () => {
    const challengeFromServer = {
      challenge: "3q2-7wAAAAkAAABXc2lnbi10aGlzLXNlY29uZC1mYWN0b3I",
      rpId: "example.com",
      timeout: 60000,
      userVerification: "required",
      allowCredentials: [
        {
          type: "public-key",
          id: "lW1q3toVZp6Uu2a0nZf5sg",
          transports: ["internal"],
        },
      ],
    };

    const payload = JSON.stringify(challengeFromServer);
    try {
      const res = await ExpoBiometricsModule.createSignature({
        payload: payload,
        promptMessage: "Biometric verification",
        cancelLabel: "Cancel",
      });

      console.log({ res });
      if (res.success) {
        setPublicKey(res.signature);
      } else {
        setPublicKey("");
      }
    } catch (e) {
      console.error(e);
    }
  };

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
          Create Keys Example
        </ThemedText>
        <Pressable
          onPress={onCreateSignatureRequest}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.colors.tint },
            pressed && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={styles.buttonText}>Create Keys</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start",
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

  button: {
    width: "100%",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
}));
