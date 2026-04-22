import { useSignIn, useAuth } from "@clerk/expo";
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
  const [debugMessage, setDebugMessage] = useState("");

  const handleSignIn = async () => {
    setDebugMessage("");

    if (!email || !password) {
      setDebugMessage("Please fill in all fields");
      return;
    }

    try {
      // Start sign-in with identifier
      await signIn.create({
        identifier: email.trim(),
      });

      // Complete password step
      await signIn.password({
        password,
      });

      // Finish sign-in if complete
      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl, session }) => {
            if (session?.currentTask) {
              console.log("Session task:", session.currentTask);
              return;
            }

            const url = decorateUrl("/");
            if (typeof window !== "undefined" && url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.replace("/");
            }
          },
        });
      } else {
        console.log("Sign-in not complete:", signIn);
        setDebugMessage("Sign in did not complete.");
      }
    } catch (err) {
      console.error("SIGN IN ERROR:", err);
      setDebugMessage(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          "Sign in failed"
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

          {!!debugMessage && (
            <Text style={{ textAlign: "center", marginBottom: 12, color: "red" }}>
              {debugMessage}
            </Text>
          )}

          {errors?.fields?.identifier && (
            <Text style={{ textAlign: "center", marginBottom: 8, color: "red" }}>
              {errors.fields.identifier.message}
            </Text>
          )}

          {errors?.fields?.password && (
            <Text style={{ textAlign: "center", marginBottom: 8, color: "red" }}>
              {errors.fields.password.message}
            </Text>
          )}

          <View style={authStyles.formContainer}>
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter email"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={authStyles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                authStyles.authButton,
                fetchStatus === "fetching" && authStyles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={fetchStatus === "fetching"}
              activeOpacity={0.8}
            >
              <Text style={authStyles.buttonText}>
                {fetchStatus === "fetching" ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.push("/(auth)/sign-up")}
            >
              <Text style={authStyles.linkText}>
                Don&apos;t have an account? <Text style={authStyles.link}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInScreen;