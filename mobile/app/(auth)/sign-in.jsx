import { useAuth, useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";

const getErrorMessage = (error, fallbackMessage) => {
  return (
    error?.errors?.[0]?.longMessage ||
    error?.errors?.[0]?.message ||
    error?.message ||
    fallbackMessage
  );
};

const SignInScreen = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] =
    useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsClientTrust, setNeedsClientTrust] =
    useState(false);

  const isLoading = fetchStatus === "fetching";

  const finishSignIn = async () => {
    const { error } = await signIn.finalize({
      navigate: ({ decorateUrl, session }) => {
        if (session?.currentTask) {
          console.log("Clerk session task:", session.currentTask);
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

    if (error) {
      setErrorMessage(
        getErrorMessage(error, "Sign in could not be completed.")
      );
    }
  };

  const handleSignIn = async () => {
    const cleanEmail = email.trim().toLowerCase();

    setErrorMessage("");

    if (!cleanEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    try {
      // Current Clerk flow: email and password are submitted together.
      const { error } = await signIn.password({
        emailAddress: cleanEmail,
        password,
      });

      if (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Your email or password is incorrect."
          )
        );
        return;
      }

      if (signIn.status === "complete") {
        await finishSignIn();
        return;
      }

      if (signIn.status === "needs_client_trust") {
        const emailCodeFactor =
          signIn.supportedSecondFactors?.find(
            (factor) => factor.strategy === "email_code"
          );

        if (!emailCodeFactor) {
          setErrorMessage(
            "Your account needs an additional verification step that is not available."
          );
          return;
        }

        const { error: sendCodeError } =
          await signIn.mfa.sendEmailCode();

        if (sendCodeError) {
          setErrorMessage(
            getErrorMessage(
              sendCodeError,
              "We could not send a verification code."
            )
          );
          return;
        }

        setNeedsClientTrust(true);
        return;
      }

      if (signIn.status === "needs_second_factor") {
        setErrorMessage(
          "This account requires two-factor authentication."
        );
        return;
      }

      setErrorMessage(
        "Sign in could not be completed. Please try again."
      );
    } catch (error) {
      console.error("SIGN IN ERROR:", error);
      setErrorMessage(
        getErrorMessage(
          error,
          "Your email or password is incorrect."
        )
      );
    }
  };

  const handleVerifyDevice = async () => {
    setErrorMessage("");

    if (!verificationCode.trim()) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    try {
      const { error } = await signIn.mfa.verifyEmailCode({
        code: verificationCode.trim(),
      });

      if (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "That verification code is not valid."
          )
        );
        return;
      }

      if (signIn.status === "complete") {
        await finishSignIn();
        return;
      }

      setErrorMessage(
        "Verification did not complete. Please try again."
      );
    } catch (error) {
      console.error("SIGN IN VERIFICATION ERROR:", error);
      setErrorMessage(
        getErrorMessage(
          error,
          "That verification code is not valid."
        )
      );
    }
  };

  const handleResendVerificationCode = async () => {
    setErrorMessage("");

    try {
      const { error } = await signIn.mfa.sendEmailCode();

      if (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "We could not resend the verification code."
          )
        );
        return;
      }

      setVerificationCode("");
    } catch (error) {
      console.error("RESEND VERIFICATION CODE ERROR:", error);
      setErrorMessage(
        getErrorMessage(
          error,
          "We could not resend the verification code."
        )
      );
    }
  };

  const resetToSignIn = async () => {
    setErrorMessage("");
    setVerificationCode("");
    setNeedsClientTrust(false);

    try {
      await signIn.reset();
    } catch (error) {
      console.error("RESET SIGN IN ERROR:", error);
    }
  };

  if (isSignedIn) {
    return null;
  }

  const renderError = () => {
    const clerkError =
      errors?.fields?.identifier?.message ||
      errors?.fields?.password?.message ||
      errors?.fields?.code?.message;

    const displayedError = errorMessage || clerkError;

    if (!displayedError) {
      return null;
    }

    return (
      <Text
        style={{
          textAlign: "center",
          marginBottom: 12,
          color: "#D32F2F",
          fontSize: 14,
        }}
      >
        {displayedError}
      </Text>
    );
  };

  const renderVerificationScreen = () => (
    <>
      <Text style={authStyles.title}>Verify Your Account</Text>

      <Text
        style={{
          color: COLORS.textLight,
          textAlign: "center",
          marginBottom: 20,
          fontSize: 16,
        }}
      >
        We sent a verification code to {email.trim()}.
      </Text>

      {renderError()}

      <View style={authStyles.inputContainer}>
        <TextInput
          style={authStyles.textInput}
          placeholder="Enter verification code"
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
        />
      </View>

      <TouchableOpacity
        style={[
          authStyles.authButton,
          (!verificationCode.trim() || isLoading) &&
            authStyles.buttonDisabled,
        ]}
        onPress={handleVerifyDevice}
        disabled={!verificationCode.trim() || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={authStyles.buttonText}>
            Verify and Sign In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          alignSelf: "center",
          marginTop: 18,
        }}
        onPress={handleResendVerificationCode}
        disabled={isLoading}
      >
        <Text style={authStyles.link}>
          Send another code
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          alignSelf: "center",
          marginTop: 14,
        }}
        onPress={resetToSignIn}
        disabled={isLoading}
      >
        <Text style={authStyles.link}>
          Use a different account
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderSignInScreen = () => (
    <>
      <Text style={authStyles.title}>Welcome Back</Text>

      <Text
        style={{
          color: COLORS.textLight,
          textAlign: "center",
          marginBottom: 20,
          fontSize: 16,
        }}
      >
        Sign in to discover recipes and access your saved favorites.
      </Text>

      {renderError()}

      <View style={authStyles.inputContainer}>
        <TextInput
          style={authStyles.textInput}
          placeholder="Enter email"
          placeholderTextColor={COLORS.textLight}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrorMessage("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!isLoading}
        />
      </View>

      <View style={authStyles.inputContainer}>
        <TextInput
          style={authStyles.textInput}
          placeholder="Enter password"
          placeholderTextColor={COLORS.textLight}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrorMessage("");
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
        />

        <TouchableOpacity
          style={authStyles.eyeButton}
          onPress={() =>
            setShowPassword((currentValue) => !currentValue)
          }
          disabled={isLoading}
        >
          <Ionicons
            name={
              showPassword
                ? "eye-outline"
                : "eye-off-outline"
            }
            size={20}
            color={COLORS.textLight}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{
          alignSelf: "flex-end",
          marginTop: 2,
          marginBottom: 12,
        }}
        onPress={() =>
          router.push("/(auth)/forgot-password")
        }
        disabled={isLoading}
      >
        <Text style={authStyles.link}>
          Forgot password?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          authStyles.authButton,
          (isLoading || !email.trim() || !password) &&
            authStyles.buttonDisabled,
        ]}
        onPress={handleSignIn}
        disabled={isLoading || !email.trim() || !password}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={authStyles.buttonText}>
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.linkContainer}
        onPress={() => router.push("/(auth)/sign-up")}
        disabled={isLoading}
      >
        <Text style={authStyles.linkText}>
          Don&apos;t have an account?{" "}
          <Text style={authStyles.link}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={authStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.imageContainer}>
            <Image
              source={require("../../assets/images/i1.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View>

          <View style={authStyles.formContainer}>
            {needsClientTrust
              ? renderVerificationScreen()
              : renderSignInScreen()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInScreen;