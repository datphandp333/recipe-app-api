import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export const searchStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },

  heroSection: {
    marginBottom: 18,
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 7,
  },

  heroTitle: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  heroSubtitle: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 340,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    minHeight: 56,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: 11,
    paddingVertical: 13,
  },

  clearButton: {
    padding: 4,
  },

  modeContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  modeButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  activeModeButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  modeButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },

  activeModeButtonText: {
    color: COLORS.white,
  },

  quickSearchSection: {
    marginTop: 22,
  },

  quickSearchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  quickSearchTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  resetText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  quickSearchList: {
    gap: 9,
    paddingRight: 8,
  },

  quickSearchChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },

  activeQuickSearchChip: {
    backgroundColor: `${COLORS.primary}18`,
    borderColor: COLORS.primary,
  },

  quickSearchChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  activeQuickSearchChipText: {
    color: COLORS.primary,
  },

  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 15,
  },

  resultsHeading: {
    flex: 1,
    paddingRight: 12,
  },

  resultsTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
  },

  resultsDescription: {
    color: COLORS.textLight,
    fontSize: 13,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 36,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}18`,
  },

  countBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  recipesGrid: {
    paddingBottom: 32,
  },

  row: {
    justifyContent: "space-between",
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },

  loadingText: {
    color: COLORS.textLight,
    fontSize: 14,
    marginTop: 12,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 26,
  },

  emptyIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}12`,
    marginBottom: 16,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 7,
  },

  emptyDescription: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
});