import { Dimensions, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

const { width } = Dimensions.get("window");

const horizontalPagePadding = 40;
const columnGap = 14;
const availableWidth = Math.min(width, 720);
const cardWidth =
  (availableWidth - horizontalPagePadding - columnGap) / 2;

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingBottom: 40,
  },

  heroIntro: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 10,
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  welcomeText: {
    color: COLORS.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  welcomeSubtitle: {
    maxWidth: 500,
    color: COLORS.textLight,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },

  surpriseButton: {
    alignSelf: "flex-start",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 19,
    paddingVertical: 12,
    marginTop: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 5,
  },

  surpriseButtonDisabled: {
    opacity: 0.65,
  },

  surpriseButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  welcomeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 25,
    gap: 10,
  },

  animalImageCard: {
    flex: 1,
    height: 92,
    maxWidth: 150,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },

  animalImage: {
    width: 82,
    height: 82,
  },

  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  sectionEyebrow: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  featuredCard: {
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 8,
  },

  featuredImageContainer: {
    height: 250,
    position: "relative",
    backgroundColor: COLORS.border,
  },

  featuredImage: {
    width: "100%",
    height: "100%",
  },

  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 19,
    backgroundColor: "rgba(0, 0, 0, 0.27)",
  },

  featuredBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  featuredBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  featuredContent: {
    justifyContent: "flex-end",
  },

  featuredTitle: {
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 5,
  },

  featuredMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 13,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },

  categoriesSection: {
    marginBottom: 24,
  },

  categoryFilterContainer: {
    marginTop: 2,
  },

  categoryFilterScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 11,
  },

  categoryButton: {
    minWidth: 92,
    minHeight: 103,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  selectedCategory: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowOpacity: 0.16,
    elevation: 4,
  },

  categoryImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 7,
    backgroundColor: COLORS.background,
  },

  selectedCategoryImage: {
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  categoryText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  selectedCategoryText: {
    color: COLORS.white,
  },

  recipesSection: {
    paddingHorizontal: 20,
    marginTop: 4,
  },

  loadingLabel: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  recipesGrid: {
    paddingBottom: 10,
  },

  row: {
    justifyContent: "space-between",
    gap: columnGap,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 28,
    paddingVertical: 48,
  },

  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.primary}18`,
    marginBottom: 17,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 7,
  },

  emptyDescription: {
    maxWidth: 330,
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});

export const recipeCardStyles = StyleSheet.create({
  container: {
    width: cardWidth,
    maxWidth: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },

  imageContainer: {
    position: "relative",
    height: 145,
    backgroundColor: COLORS.border,
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
    minHeight: 40,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    marginBottom: 5,
  },

  description: {
    minHeight: 32,
    color: COLORS.textLight,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },

  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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