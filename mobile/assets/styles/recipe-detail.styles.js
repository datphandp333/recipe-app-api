import { Dimensions, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

const { height, width } = Dimensions.get("window");

const contentWidth = Math.min(width, 720);
const ingredientGap = 12;
const horizontalPadding = 32;

const ingredientCardWidth =
  (contentWidth - horizontalPadding - ingredientGap) / 2;

export const recipeDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerContainer: {
    height: Math.max(height * 0.48, 390),
    position: "relative",
    backgroundColor: COLORS.text,
  },

  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  headerImage: {
    width: "100%",
    height: "100%",
  },

  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },

  floatingButtons: {
    position: "absolute",
    top: 54,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  floatingButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 6,
  },

  titleSection: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 42,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 12,
  },

  categoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  recipeTitle: {
    color: COLORS.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.65)",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 5,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  locationText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },

  contentSection: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },

  statCard: {
    flex: 1,
    minHeight: 130,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  statIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },

  statLabel: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  sectionContainer: {
    marginBottom: 34,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 8,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  sectionDescription: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 17,
  },

  countBadge: {
    minWidth: 30,
    height: 27,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  videoCard: {
    height: 220,
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  webview: {
    flex: 1,
    backgroundColor: COLORS.card,
  },

  ingredientsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ingredientGap,
  },

  ingredientCard: {
    width: ingredientCardWidth,
    maxWidth: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },

  ingredientCardCompleted: {
    backgroundColor: `${COLORS.primary}0D`,
    borderColor: COLORS.primary,
    opacity: 0.78,
  },

  ingredientImageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 11,
    overflow: "hidden",
  },

  ingredientImage: {
    width: "88%",
    height: "88%",
  },

  ingredientNumber: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },

  ingredientNumberText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  ingredientCompletedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  ingredientInfo: {
    minHeight: 51,
  },

  ingredientName: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    marginBottom: 4,
  },

  ingredientMeasure: {
    color: COLORS.textLight,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },

  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.65,
  },

  instructionsContainer: {
    gap: 15,
  },

  instructionCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 3,
  },

  instructionCardCompleted: {
    backgroundColor: `${COLORS.primary}0D`,
    borderColor: COLORS.primary,
  },

  stepIndicator: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  stepNumber: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  instructionContent: {
    flex: 1,
  },

  instructionText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 13,
  },

  instructionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stepLabel: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  completeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: `${COLORS.primary}18`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
    alignItems: "center",
    justifyContent: "center",
  },

  completeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  primaryButton: {
    borderRadius: 17,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 5,
  },

  buttonGradient: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  notFoundContainer: {
    flex: 1,
    minHeight: height,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  notFoundTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 18,
    marginBottom: 9,
  },

  notFoundDescription: {
    maxWidth: 420,
    color: COLORS.textLight,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },

  notFoundButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },

  notFoundButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
});