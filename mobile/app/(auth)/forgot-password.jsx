import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/colors";

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] =
    useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isLoading = fetchStatus === "fetching";

  const getErrorMessage = (error) => {
    return (
      error?.errors?.[0]?.longMessage ||
      error?.errors?.[0]?.message ||
      error?.message ||
      "Something went wrong. Please try again."
    );
  };

  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    setErrorMessage("");

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      const { error: createError } = await signIn.create({
        identifier: cleanEmail,
      });

      if (createError) {
        setErrorMessage(getErrorMessage(createError));
        return;
      }

      const { error: sendCodeError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (sendCodeError) {
        setErrorMessage(getErrorMessage(sendCodeError));
        return;
      }

      setEmail(cleanEmail);
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("code");
    } catch (error) {
      console.error("Send reset code error:", error);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleVerifyCode = async () => {
    const cleanCode = verificationCode.trim();

    setErrorMessage("");

    if (!cleanCode) {
      setErrorMessage(
        "Please enter the verification code."
      );
      return;
    }

    try {
      const { error } =
        await signIn.resetPasswordEmailCode.verifyCode({
          code: cleanCode,
        });

      if (error) {
        setErrorMessage(getErrorMessage(error));
        return;
      }

      // Clerk must confirm the reset process is ready
      // before this screen allows a new password.
      if (signIn.status === "needs_new_password") {
        setStep("password");
        return;
      }

      if (signIn.status === "needs_second_factor") {
        setErrorMessage(
          "This account needs an additional verification step before its password can be changed."
        );
        return;
      }

      setErrorMessage(
        "The code was accepted, but Clerk could not start the password reset. Please request a new code and try again."
      );
    } catch (error) {
      console.error("Verify reset code error:", error);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage("");

    if (!newPassword) {
      setErrorMessage("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    try {
      const { error: passwordError } =
        await signIn.resetPasswordEmailCode.submitPassword({
          password: newPassword,
          signOutOfOtherSessions: true,
        });

      if (passwordError) {
        setErrorMessage(getErrorMessage(passwordError));
        return;
      }

      if (signIn.status === "complete") {
        const { error: finalizeError } =
          await signIn.finalize({
            navigate: ({ decorateUrl, session }) => {
              if (session?.currentTask) {
                console.log(
                  "Clerk session task:",
                  session.currentTask
                );
                return;
              }

              const url = decorateUrl("/");

              if (
                typeof window !== "undefined" &&
                url.startsWith("http")
              ) {
                window.location.href = url;
                return;
              }

              router.replace("/");
            },
          });

        if (finalizeError) {
          setErrorMessage(
            getErrorMessage(finalizeError)
          );
        }

        return;
      }

      if (signIn.status === "needs_second_factor") {
        setErrorMessage(
          "Your password was changed, but this account requires two-factor authentication."
        );
        return;
      }

      setErrorMessage(
        "Your password was changed. Please return to Sign In and use your new password."
      );
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Reset password error:", error);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleResendCode = async () => {
    setErrorMessage("");

    try {
      const { error } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (error) {
        setErrorMessage(getErrorMessage(error));
        return;
      }

      setVerificationCode("");
    } catch (error) {
      console.error("Resend reset code error:", error);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleBack = () => {
    if (step === "password") {
      setErrorMessage("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("code");
      return;
    }

    if (step === "code") {
      setErrorMessage("");
      setVerificationCode("");
      setStep("email");
      return;
    }

    router.replace("/(auth)/sign-in");
  };

  const renderError = () => {
    const clerkError =
      errors?.fields?.identifier?.message ||
      errors?.fields?.code?.message ||
      errors?.fields?.password?.message;

    const displayedError = errorMessage || clerkError;

    if (!displayedError) {
      return null;
    }

    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={19}
          color="#B42318"
        />

        <Text style={styles.errorText}>
          {displayedError}
        </Text>
      </View>
    );
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View
        style={[
          styles.progressDot,
          styles.progressDotActive,
        ]}
      />

      <View
        style={[
          styles.progressLine,
          step !== "email" && styles.progressLineActive,
        ]}
      />

      <View
        style={[
          styles.progressDot,
          step !== "email" && styles.progressDotActive,
        ]}
      />

      <View
        style={[
          styles.progressLine,
          step === "password" &&
            styles.progressLineActive,
        ]}
      />

      <View
        style={[
          styles.progressDot,
          step === "password" &&
            styles.progressDotActive,
        ]}
      />
    </View>
  );

  const renderEmailStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons
          name="mail-outline"
          size={34}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.title}>
        Forgot your password?
      </Text>

      <Text style={styles.description}>
        Enter the email connected to your recipe account.
        Clerk will send you a verification code.
      </Text>

      <Text style={styles.inputLabel}>
        Email address
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={20}
          color={COLORS.textLight}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={COLORS.textLight}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrorMessage("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          editable={!isLoading}
          returnKeyType="send"
          onSubmitEditing={handleSendCode}
        />
      </View>

      {renderError()}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          isLoading && styles.disabledButton,
        ]}
        onPress={handleSendCode}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              Send verification code
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={COLORS.white}
            />
          </>
        )}
      </TouchableOpacity>
    </>
  );

  const renderCodeStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={34}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.title}>
        Check your email
      </Text>

      <Text style={styles.description}>
        Enter the verification code sent to{" "}
        <Text style={styles.emailText}>{email}</Text>.
      </Text>

      <Text style={styles.inputLabel}>
        Verification code
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="keypad-outline"
          size={20}
          color={COLORS.textLight}
        />

        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="Enter code"
          placeholderTextColor={COLORS.textLight}
          value={verificationCode}
          onChangeText={(value) => {
            setVerificationCode(value);
            setErrorMessage("");
          }}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="oneTimeCode"
          editable={!isLoading}
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={handleVerifyCode}
        />
      </View>

      {renderError()}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          isLoading && styles.disabledButton,
        ]}
        onPress={handleVerifyCode}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              Verify code
            </Text>

            <Ionicons
              name="checkmark"
              size={20}
              color={COLORS.white}
            />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleResendCode}
        disabled={isLoading}
      >
        <Ionicons
          name="refresh-outline"
          size={18}
          color={COLORS.primary}
        />

        <Text style={styles.secondaryButtonText}>
          Resend code
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={34}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.title}>
        Create a new password
      </Text>

      <Text style={styles.description}>
        Choose a secure password containing at least eight
        characters.
      </Text>

      <Text style={styles.inputLabel}>
        New password
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.textLight}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor={COLORS.textLight}
          value={newPassword}
          onChangeText={(value) => {
            setNewPassword(value);
            setErrorMessage("");
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          editable={!isLoading}
        />

        <TouchableOpacity
          onPress={() =>
            setShowPassword(
              (currentValue) => !currentValue
            )
          }
          disabled={isLoading}
        >
          <Ionicons
            name={
              showPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={21}
            color={COLORS.textLight}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>
        Confirm password
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.textLight}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter the password again"
          placeholderTextColor={COLORS.textLight}
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setErrorMessage("");
          }}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleResetPassword}
        />

        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(
              (currentValue) => !currentValue
            )
          }
          disabled={isLoading}
        >
          <Ionicons
            name={
              showConfirmPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={21}
            color={COLORS.textLight}
          />
        </TouchableOpacity>
      </View>

      {renderError()}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          isLoading && styles.disabledButton,
        ]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              Change password
            </Text>

            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={COLORS.white}
            />
          </>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios" ? "padding" : "height"
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <View style={styles.card}>
            {renderProgress()}

            {step === "email" && renderEmailStep()}
            {step === "code" && renderCodeStep()}
            {step === "password" &&
              renderPasswordStep()}

            <TouchableOpacity
              style={styles.signInButton}
              onPress={() =>
                router.replace("/(auth)/sign-in")
              }
              disabled={isLoading}
            >
              <Text style={styles.signInText}>
                Remembered your password?{" "}
                <Text style={styles.signInLink}>
                  Sign in
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 17,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },

  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },

  progressDotActive: {
    backgroundColor: COLORS.primary,
  },

  progressLine: {
    width: 48,
    height: 3,
    backgroundColor: COLORS.border,
  },

  progressLineActive: {
    backgroundColor: COLORS.primary,
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: `${COLORS.primary}18`,
    marginBottom: 17,
  },

  title: {
    color: COLORS.text,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  description: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 24,
  },

  emailText: {
    color: COLORS.text,
    fontWeight: "800",
  },

  inputLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 17,
  },

  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 14,
  },

  codeInput: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 5,
    textAlign: "center",
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
    borderRadius: 13,
    padding: 12,
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    color: "#B42318",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  primaryButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    paddingHorizontal: 18,
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: `${COLORS.primary}12`,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: `${COLORS.primary}35`,
    marginTop: 12,
  },

  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  signInButton: {
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 2,
  },

  signInText: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: "center",
  },

  signInLink: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});

export default ForgotPasswordScreen;