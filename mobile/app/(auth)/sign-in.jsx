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

const SignInScreen = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isLoading = fetchStatus === "fetching";

  const handleSignIn = async () => {
    const cleanEmail = email.trim().toLowerCase();

    setErrorMessage("");

    if (!cleanEmail || !password) {
      setErrorMessage("Please enter your email and password.");
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
        setErrorMessage(
          createError?.errors?.[0]?.longMessage ||
            createError?.errors?.[0]?.message ||
            createError.message ||
            "Unable to start sign-in."
        );
        return;
      }

      const { error: passwordError } = await signIn.password({
        password,
      });

      if (passwordError) {
        setErrorMessage(
          passwordError?.errors?.[0]?.longMessage ||
            passwordError?.errors?.[0]?.message ||
            passwordError.message ||
            "The email or password is incorrect."
        );
        return;
      }

      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize({
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
            finalizeError.message ||
              "Unable to finish signing in."
          );
        }

        return;
      }

      if (signIn.status === "needs_second_factor") {
        setErrorMessage(
          "This account requires two-factor authentication, which has not been added to this app yet."
        );
        return;
      }

      setErrorMessage(
        "Sign-in could not be completed. Please try again."
      );
    } catch (error) {
      console.error("Sign-in error:", error);

      setErrorMessage(
        error?.errors?.[0]?.longMessage ||
          error?.errors?.[0]?.message ||
          error?.message ||
          "Sign-in failed. Please try again."
      );
    }
  };

  if (isSignedIn) {
    return null;
  }

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

          <Text style={authStyles.title}>Welcome Back</Text>

          <Text
            style={{
              color: COLORS.textLight,
              fontSize: 14,
              lineHeight: 20,
              textAlign: "center",
              marginTop: -10,
              marginBottom: 20,
            }}
          >
            Sign in to discover recipes and access your saved
            favorites.
          </Text>

          {!!errorMessage && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
                backgroundColor: "#FEF3F2",
                borderWidth: 1,
                borderColor: "#FECDCA",
                borderRadius: 13,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color="#B42318"
              />

              <Text
                style={{
                  flex: 1,
                  color: "#B42318",
                  fontSize: 13,
                  lineHeight: 19,
                  fontWeight: "600",
                }}
              >
                {errorMessage}
              </Text>
            </View>
          )}

          {errors?.fields?.identifier && (
            <Text
              style={{
                color: "#B42318",
                fontSize: 13,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              {errors.fields.identifier.message}
            </Text>
          )}

          {errors?.fields?.password && (
            <Text
              style={{
                color: "#B42318",
                fontSize: 13,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              {errors.fields.password.message}
            </Text>
          )}

          <View style={authStyles.formContainer}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 13,
                fontWeight: "800",
                marginBottom: -7,
              }}
            >
              Email address
            </Text>

            <View style={authStyles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.textLight}
              />

              <TextInput
                style={authStyles.textInput}
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
                returnKeyType="next"
              />
            </View>

            <Text
              style={{
                color: COLORS.text,
                fontSize: 13,
                fontWeight: "800",
                marginBottom: -7,
              }}
            >
              Password
            </Text>

            <View style={authStyles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.textLight}
              />

              <TextInput
                style={authStyles.textInput}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setErrorMessage("");
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
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
                accessibilityLabel={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
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

            <TouchableOpacity
              style={{
                alignSelf: "flex-end",
                paddingVertical: 3,
                marginTop: -5,
                marginBottom: 7,
              }}
              onPress={() =>
                router.push("/(auth)/forgot-password")
              }
              disabled={isLoading}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 13,
                  fontWeight: "800",
                }}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                authStyles.authButton,
                isLoading && authStyles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Text style={authStyles.buttonText}>
                    Sign in
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color={COLORS.white}
                  />
                </View>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInScreen;