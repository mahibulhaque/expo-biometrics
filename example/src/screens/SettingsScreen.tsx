import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import ThemedText from "../components/ThemedText";
import ExpoBiometrics, {
  AuthenticationType,
  SecurityLevel,
} from "expo-biometrics";

export default function SettingsScreen() {
  const [isBiometricEnrolledInDevice, setIsBiometricEnrolledInDevice] =
    useState<boolean>(false);
  const [hasHardware, setHasHardware] = useState<boolean>(false);
  const [supportedAuthenticationTypes, setSupportedAuthenticationTypes] =
    useState<AuthenticationType[]>([]);

  const [biometricSecurityLevel, setBiometricSecurityLevel] =
    useState<SecurityLevel>(SecurityLevel.NONE);

  const checkSupportedAuthenticationType = async () => {
    try {
      const res = await ExpoBiometrics.supportedAuthenticationTypesAsync();
      setSupportedAuthenticationTypes(res);
    } catch (error) {
      console.error(error);
    }
  };

  const checkHasHardware = async () => {
    try {
      const res = await ExpoBiometrics.hasHardwareAsync();
      setHasHardware(res);
    } catch (error) {
      console.error(error);
    }
  };

  const checkIsBiometricEnrolled = async () => {
    try {
      const res = await ExpoBiometrics.isEnrolledAsync();
      setIsBiometricEnrolledInDevice(res);
    } catch (error) {
      console.error(error);
    }
  };

  const checkSecurityLevel = async () => {
    try {
      const res = await ExpoBiometrics.getEnrolledLevelAsync();
      setBiometricSecurityLevel(res);
    } catch (error) {
      console.error(error);
    }
  };

  const getAuthenticationType = () => {
    if (supportedAuthenticationTypes.length === 0) {
      return "None";
    }
    switch (supportedAuthenticationTypes[0]) {
      case AuthenticationType.FACIAL_RECOGNITION:
        return "Facial Recognition";
      case AuthenticationType.FINGERPRINT:
        return "Fingerprint";
      case AuthenticationType.IRIS:
        return "Iris";
      default:
        return "Unknown";
    }
  };

  const getEnrollmentLevel = () => {
    switch (Number(biometricSecurityLevel.toFixed())) {
      case SecurityLevel.BIOMETRIC_STRONG:
        return "Strong";
      case SecurityLevel.BIOMETRIC_WEAK:
        return "Weak";
      case SecurityLevel.SECRET:
        return "Pin/Pattern";
      default:
        return "None";
    }
  };

  useEffect(() => {
    checkHasHardware();
    checkIsBiometricEnrolled();
    checkSupportedAuthenticationType();
  }, []);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
    >
      <View style={styles.content}>
        <ThemedText size="header" style={styles.title}>
          Settings
        </ThemedText>

        <View style={styles.section}>
          <ThemedText size="caption" style={styles.sectionTitle}>
            BIOMETRIC STATUS
          </ThemedText>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Available</ThemedText>
            <ThemedText style={styles.value}>
              {hasHardware ? "Yes" : "No"}
            </ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.label}>Authentication Type</ThemedText>
            <ThemedText style={styles.value}>
              {getAuthenticationType()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText size="caption" style={styles.sectionTitle}>
            ENROLLMENT STATUS
          </ThemedText>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Biometric Enrolled</ThemedText>
            <ThemedText style={styles.value}>
              {isBiometricEnrolledInDevice ? "Yes" : "No"}
            </ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.label}>Enrollment Level</ThemedText>
            <ThemedText style={styles.value}>{getEnrollmentLevel()}</ThemedText>
          </View>
        </View>

        <View style={styles.banner}>
          <ThemedText size="caption" style={styles.bannerText}>
            Powered by Expo Modules
          </ThemedText>
        </View>
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
