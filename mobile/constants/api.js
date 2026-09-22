import { Platform } from "react-native";

const removeTrailingSlash = (value = "") =>
  String(value).replace(/\/+$/, "");

const normalizeApiUrl = (value = "") => {
  const cleanedUrl = removeTrailingSlash(value);

  if (!cleanedUrl) {
    return "";
  }

  return cleanedUrl.endsWith("/api")
    ? cleanedUrl
    : `${cleanedUrl}/api`;
};

const configuredApiUrl = normalizeApiUrl(
  process.env.EXPO_PUBLIC_API_URL
);

const WEB_API_URL = "http://localhost:5001/api";

const NATIVE_API_URL =
  configuredApiUrl ||
  Platform.select({
    android: "http://10.0.2.2:5001/api",
    default: "http://localhost:5001/api",
  });

export const API_URL =
  Platform.OS === "web"
    ? WEB_API_URL
    : NATIVE_API_URL;