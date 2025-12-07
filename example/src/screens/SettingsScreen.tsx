import { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import ThemedText from "../components/ui/ThemedText";
import ExpoBiometrics, {
  AuthenticationType,
  SecurityLevel,
} from "expo-biometrics";
import { ThemedView } from "../components/ui/ThemedView";

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
      const res = await ExpoBiometrics.supportedAuthenticationTypes();
      setSupportedAuthenticationTypes(res);
    } catch (error) {
      console.error(error);
    }
  };

  const checkHasHardware = async () => {
    try {
      const res = await ExpoBiometrics.hasHardware();
      setHasHardware(res);
    } catch (error) {
      console.error(error);
    }
  };

  const checkIsBiometricEnrolled = async () => {
    try {
      const res = await ExpoBiometrics.isEnrolled();
      setIsBiometricEnrolledInDevice(res);
    } catch (error) {
      console.error(error);
    }
  };

  const checkSecurityLevel = async () => {
    try {
      const res = await ExpoBiometrics.getEnrolledLevel();
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
    checkSecurityLevel();
    checkSupportedAuthenticationType();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={[styles.title]}>
          Settings
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="sectionTitle" style={[styles.sectionTitle]}>
            BIOMETRIC STATUS
          </ThemedText>
          <View style={styles.row}>
            <ThemedText type="subtitle" style={[styles.label]}>
              Available
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.value]}>
              {hasHardware ? "Yes" : "No"}
            </ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="subtitle" style={[styles.label]}>
              Authentication Type
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.value]}>
              {getAuthenticationType()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="sectionTitle" style={[styles.sectionTitle]}>
            ENROLLMENT STATUS
          </ThemedText>
          <View style={styles.row}>
            <ThemedText type="subtitle" style={[styles.label]}>
              Biometric Enrolled
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.value]}>
              {isBiometricEnrolledInDevice ? "Yes" : "No"}
            </ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="subtitle" style={[styles.label]}>
              Enrollment Level
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.value]}>
              {getEnrollmentLevel()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.banner}>
          <ThemedText type="subtitle">Powered by Expo Modules</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create((_theme, rt) => ({
  container: {
    flex: 1,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left,
    paddingRight: rt.insets.right,
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
  banner: {
    marginTop: 40,
    paddingVertical: 20,
    alignItems: "center",
  },
  bannerText: {
    opacity: 0.4,
    fontWeight: "bold",
  },
}));
