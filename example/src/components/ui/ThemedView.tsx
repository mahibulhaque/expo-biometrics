import { View, type ViewProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  return <View style={[styles.container, style]} {...otherProps} />;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
}));
