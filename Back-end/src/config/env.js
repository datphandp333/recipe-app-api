import dotenv from "dotenv";

dotenv.config();

const cleanEnvironmentValue = (
  value,
  fallback = ""
) => {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() || fallback;
};

const createPortNumber = (
  value,
  fallback = 5001
) => {
  const port = Number(value);

  if (
    !Number.isInteger(port) ||
    port <= 0 ||
    port > 65535
  ) {
    return fallback;
  }

  return port;
};

export const ENV = {
  PORT: createPortNumber(
    process.env.PORT,
    5001
  ),

  NODE_ENV: cleanEnvironmentValue(
    process.env.NODE_ENV,
    "development"
  ),

  DATABASE_URL: cleanEnvironmentValue(
    process.env.DATABASE_URL
  ),

  GEMINI_API_KEY: cleanEnvironmentValue(
    process.env.GEMINI_API_KEY
  ),

  GEMINI_MODEL: cleanEnvironmentValue(
    process.env.GEMINI_MODEL,
    "gemini-3.5-flash-lite"
  ),

  PEXELS_API_KEY: cleanEnvironmentValue(
    process.env.PEXELS_API_KEY
  ),
};