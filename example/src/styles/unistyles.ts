import { StyleSheet } from "react-native-unistyles";

const lightTheme = {
  colors: {
    background: "#FCFAF8",
    foreground: "#EDEAE6",
    typography: "#1B140C",
    dimmed: "#ECE8E4",
    tint: "#9A734C",
    activeTint: "#1B140C",
    link: "#1E3799",
    accents: {
      banana: "#F6E58D",
      pumpkin: "#FFBE76",
      apple: "#FF7979",
      grass: "#BADC58",
      storm: "#686DE0",
    },
  },
  gap: (v: number) => v * 8,
} as const;

const darkTheme = {
  colors: {
    background: "#221A11",
    foreground: "#332618",
    typography: "#FFFFFF",
    dimmed: "#A8A198",
    tint: "#C9AD92",
    activeTint: "#C9AD92",
    link: "#0C2461",
    accents: {
      banana: "#f9CA24",
      pumpkin: "#F0932B",
      apple: "#EB4D4B",
      grass: "#6AB04C",
      storm: "#4834D4",
    },
  },
  gap: (v: number) => v * 8,
} as const;

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

const breakpoints = {
  xs: 0,
  sm: 300,
  md: 500,
  lg: 800,
  xl: 1200,
};

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof appThemes;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  breakpoints,
  settings: {
    adaptiveThemes: true,
  },
});
