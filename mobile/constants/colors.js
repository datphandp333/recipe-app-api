import { EDITORIAL_COLORS as E } from "./editorialTheme";
const recipeTheme = {
  primary: E.green,
  primaryDark: E.dark,
  primaryLight: E.sage,

  background: E.background,
  surface: E.surface,
  card: "#FFFFFF",
  white: "#FFFFFF",

  text: E.ink,
  textLight: E.muted,
  textMuted: "#8A948F",

  border: E.line,
  borderLight: "#F2EAE0",

  accent: E.gold,
  accentLight: E.cream,
  saffron: E.cream,

  success: "#2E7D32",
  danger: "#C73E3A",

  shadow: E.ink,
};

export const THEMES = {
  recipe: recipeTheme,
};

export const COLORS = THEMES.recipe;