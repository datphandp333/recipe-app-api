import { Dimensions, StyleSheet } from "react-native";

import { COLORS } from "../../constants/colors";

const { width } = Dimensions.get("window");
const cardWidth = (width - 56) / 2;

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingTop: 18,
    paddingBottom: 38,
  },

  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  greetingContainer: {
    flex: 1,
    paddingRight: 16,
  },

  greeting: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },

  userName: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
  },

  introSection: {
    paddingHorizontal: 20,
    marginTop: 21,
    marginBottom: 20,
  },

  introTitle: {
    color: COLORS.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -1,
    maxWidth: 330,
  },

  introDescription: {
    color: COLORS.textLight,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 330,
  },

  aiCard: {
    minHeight: 132,
    marginHorizontal: 20,
    marginBottom: 28,
    padding: 18,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    overflow: "hidden",
    elevation: 8,
  },

  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    marginRight: 13,
  },

  aiTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  aiEyebrow: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  aiTitle: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },

  aiDescription: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  featuredSection: {
    marginBottom: 30,
  },

  browseSection: {
    marginBottom: 26,
  },

  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionEyebrow: {
    color: COLORS.textLight,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 3,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.45,
  },

  refreshRecipeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchButton: {
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${COLORS.primary}14`,
  },

  searchButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  featuredCard: {
    height: 265,
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
    elevation: 8,
  },

  featuredImage: {
    width: "100%",
    height: "100%",
  },

  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 7, 34, 0.37)",
  },

  featuredContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 19,
    justifyContent: "space-between",
  },

  featuredBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: "rgba(64, 18, 105, 0.88)",
  },

  featuredBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  featuredTitle: {
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 11,
  },

  featuredMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },

  metaItem: {
    maxWidth: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },

  recipesSection: {
    paddingHorizontal: 20,
  },

  recipeGridHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recipeGridTitle: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  recipeCount: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: "700",
  },

  recipesGrid: {
    gap: 16,
  },

  row: {
    justifyContent: "space-between",
    gap: 16,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 58,
    paddingHorizontal: 30,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 7,
  },

  emptyDescription: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  categoryFilterContainer: {
    marginTop: 2,
  },

  categoryFilterScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },

  categoryButton: {
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectedCategory: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  categoryImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginBottom: 5,
    backgroundColor: COLORS.border,
  },

  selectedCategoryImage: {
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  categoryText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },

  selectedCategoryText: {
    color: COLORS.white,
  },
});

export const recipeCardStyles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 16,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
  },

  imageContainer: {
    position: "relative",
    height: 138,
  },

  image: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.border,
  },

  content: {
    padding: 12,
  },

  title: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    marginBottom: 4,
  },

  description: {
    color: COLORS.textLight,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },

  servingsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  servingsText: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
});