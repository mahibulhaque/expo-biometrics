import React from "react";
import { Text, TextProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type ThemedTextProps = TextProps & UnistylesVariants<typeof styles>;

export default function ThemedText({ style, type, ...rest }: ThemedTextProps) {
  styles.useVariants({ type });
  return <Text style={[styles.textColor, styles.textType, style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  textColor: {
    color: theme.colors.typography,
  },
  textType: {
    variants: {
      type: {
        default: {
          fontSize: 16,
          lineHeight: 24,
        },
        title: {
          fontSize: 24,
          fontWeight: "bold",
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: "bold",
        },
        subtitle: {
          fontSize: 16,
          fontWeight: "normal",
        },
        link: {
          lineHeight: 30,
          fontSize: 16,
          color: theme.colors.link,
        },
      },
    },
  },
}));
