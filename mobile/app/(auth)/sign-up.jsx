import { useAuth, useSignUp } from "@clerk/expo";
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
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";

export default function SignUpScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");

  const handleSubmit = async () => {
    setDebugMessage("");

    if (!emailAddress || !password) {
      setDebugMessage("Please fill in all fields.");
      return;
    }

    try {
      const { error } = await signUp.password({
        emailAddress: emailAddress.trim(),
        password,
      });

      if (error) {
        console.error("SIGN UP ERROR:", JSON.stringify(error, null, 2));
        setDebugMessage(error.message || "Failed to create account.");
        return;
      }

      await signUp.verifications.sendEmailCode();
      setDebugMessage("Verification code sent.");
    } catch (err) {
      console.error("SIGN UP ERROR:", err);
      setDebugMessage("Failed to create account.");
    }
  };

  const handleVerify = async () => {
    setDebugMessage("");

    if (!code) {
      setDebugMessage("Please enter the verification code.");
      return;
    }

    try {
      await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ decorateUrl, session }) => {
            if (session?.currentTask) {
              console.log("Session task:", session.currentTask);
              return;
            }

            const url = decorateUrl("/");
            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else {
        console.error("Sign-up attempt not complete:", signUp);
        setDebugMessage("Verification did not complete.");
      }
    } catch (err) {
      console.error("VERIFY ERROR:", err);
      setDebugMessage("Verification failed.");
    }
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  const showVerifyScreen =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  if (showVerifyScreen) {
    return (
      <View style={authStyles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          style={authStyles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={authStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={authStyles.imageContainer}>
              <Image
                source={require("../../assets/images/i3.png")}
                style={authStyles.image}
                contentFit="contain"
              />
            </View>

            <Text style={authStyles.title}>Verify Your Email</Text>
            <Text style={authStyles.subtitle}>
              We&apos;ve sent a verification code to {emailAddress}
            </Text>

            {!!debugMessage && (
              <Text style={{ textAlign: "center", marginBottom: 12, color: "red" }}>
                {debugMessage}
              </Text>
            )}

            {errors?.fields?.code && (
              <Text style={{ textAlign: "center", marginBottom: 12, color: "red" }}>
                {errors.fields.code.message}
              </Text>
            )}

            <View style={authStyles.formContainer}>
              <View style={authStyles.inputContainer}>
                <TextInput
                  style={authStyles.textInput}
                  placeholder="Enter verification code"
                  placeholderTextColor={COLORS.textLight}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[
                  authStyles.authButton,
                  fetchStatus === "fetching" && authStyles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={fetchStatus === "fetching"}
                activeOpacity={0.8}
              >
                <Text style={authStyles.buttonText}>
                  {fetchStatus === "fetching" ? "Verifying..." : "Verify Email"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={authStyles.linkContainer}
                onPress={() => signUp.verifications.sendEmailCode()}
              >
                <Text style={authStyles.linkText}>
                  <Text style={authStyles.link}>I need a new code</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        style={authStyles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.imageContainer}>
            <Image
              source={require("../../assets/images/i2.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View>

          <Text style={authStyles.title}>Create Account</Text>

          {!!debugMessage && (
            <Text style={{ textAlign: "center", marginBottom: 12, color: "red" }}>
              {debugMessage}
            </Text>
          )}

          {errors?.fields?.emailAddress && (
            <Text style={{ textAlign: "center", marginBottom: 8, color: "red" }}>
              {errors.fields.emailAddress.message}
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
                value={emailAddress}
                onChangeText={setEmailAddress}
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
              onPress={handleSubmit}
              disabled={fetchStatus === "fetching"}
              activeOpacity={0.8}
            >
              <Text style={authStyles.buttonText}>
                {fetchStatus === "fetching" ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.back()}
            >
              <Text style={authStyles.linkText}>
                Already have an account? <Text style={authStyles.link}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}