import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT:
    Number(process.env.PORT) ||
    5001,

  NODE_ENV:
    process.env.NODE_ENV ||
    "development",

  DATABASE_URL:
    process.env.DATABASE_URL,

  GEMINI_API_KEY:
    process.env.GEMINI_API_KEY,

  GEMINI_MODEL:
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite",
};