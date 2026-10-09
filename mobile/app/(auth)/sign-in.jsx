import { verificationMethods, sendVerification, verifySignInCode, VERIFICATION_LABELS } from "../../services/signInVerification";
import { useAuth, useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AuthFrame from "../../components/auth/AuthFrame";
import SocialButtons from "../../components/auth/SocialButtons";
import useAuthAction from "../../components/auth/useAuthAction";

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
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);

  const { busy, run } = useAuthAction();
  const isLoading = busy || fetchStatus === "fetching";

  const finishSignIn = async () => {
    const { error } = await signIn.finalize({
      navigate: ({ decorateUrl, session }) => {
        if (session?.currentTask) {
          router.replace("/account-tasks");
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

  const selectVerification = async (method) => {
    setErrorMessage("");
    setVerificationCode("");
    setVerificationMethod(method);
    try {
      const { error } = await sendVerification(signIn, method);
      if (error) setErrorMessage(getErrorMessage(error, "We could not send a code. Try again or use another method."));
    } catch (error) { setErrorMessage(getErrorMessage(error, "Verification could not be started.")); }
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

      if (["needs_client_trust", "needs_second_factor"].includes(signIn.status)) {
        const methods = verificationMethods(signIn);
        setAvailableMethods(methods);
        if (!methods.length) {
          router.push("/(auth)/complete-account");
          return;
        }
        setPassword("");
        await selectVerification(methods[0]);
        return;
      }

      router.push("/(auth)/complete-account");
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
      const { error } = await verifySignInCode(signIn, verificationMethod, verificationCode);

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
      const { error } = await sendVerification(signIn, verificationMethod);

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
    setVerificationMethod(null);
    setAvailableMethods([]);

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
          textAlign: "left",
          marginBottom: 20,
          fontSize: 16,
        }}
      >
        {verificationMethod === "totp" ? "Enter the current code from your authenticator app."
          : verificationMethod === "backup_code" ? "Enter one of the backup codes you saved when setting up two-factor authentication."
          : verificationMethod === "phone_code" ? "Enter the code sent to your registered phone number."
          : `Enter the verification code sent to ${email.trim()}.`}
      </Text>

      {renderError()}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {availableMethods.filter(method => method !== verificationMethod).map(method => <TouchableOpacity key={method} accessibilityRole="button" disabled={isLoading} onPress={() => run(() => selectVerification(method))} style={{ padding: 12, backgroundColor: "#DCECE4", borderRadius: 12 }}><Text style={authStyles.link}>Use {VERIFICATION_LABELS[method].toLowerCase()}</Text></TouchableOpacity>)}
      </View>

      <View style={authStyles.inputContainer}>
        <TextInput
          style={authStyles.textInput}
          accessibilityLabel="Verification code"
          placeholder="Enter verification code"
          placeholderTextColor={COLORS.textLight}
          value={verificationCode}
          onChangeText={(value) => {
            setVerificationCode(value);
            setErrorMessage("");
          }}
          keyboardType={verificationMethod === "backup_code" ? "default" : "number-pad"}
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
        onPress={() => run(handleVerifyDevice)}
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

      {["phone_code", "email_code"].includes(verificationMethod) && (
      <TouchableOpacity
        style={{
          alignSelf: "center",
          marginTop: 18,
        }}
        onPress={() => run(handleResendVerificationCode)}
        disabled={isLoading}
      >
        <Text style={authStyles.link}>
          Send another code
        </Text>
      </TouchableOpacity>)}

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
      <Text style={authStyles.title}>Welcome back</Text>
      <SocialButtons />

      <Text
        style={{
          color: COLORS.textLight,
          textAlign: "left",
          marginBottom: 20,
          fontSize: 16,
        }}
      >
        Your next good meal starts here.
      </Text>

      {renderError()}

      <Text style={authStyles.label}>Email address</Text>
      <View style={authStyles.inputContainer}>
        <TextInput
          style={authStyles.textInput}
          accessibilityLabel="Email address"
          placeholder="you@example.com"
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

      <Text style={authStyles.label}>Password</Text>
      <View style={authStyles.inputContainer}>
        <TextInput
          style={authStyles.textInput}
          accessibilityLabel="Password"
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
          onSubmitEditing={() => run(handleSignIn)}
        />

        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"}
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
        onPress={() => run(handleSignIn)}
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

  return <AuthFrame><View style={authStyles.formContainer}>
    {verificationMethod ? renderVerificationScreen() : renderSignInScreen()}
  </View></AuthFrame>;
};
export default SignInScreen;
