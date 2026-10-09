import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";



export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  imageContainer: {
    height: 80,
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "left",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "left",
    marginBottom: 30,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
    position: "relative",
  },
  textInput: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDE2DF",
  },
  eyeButton: {
    position: "absolute",
    right: 4,
    top: 4,
    padding: 12,
    minWidth: 44,
    minHeight: 44,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
  },
  linkContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  linkText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});