// if you're using your physical phone, change this to the deployed url
// we have explained this in the course :-)
import { Platform } from "react-native";

const WEB_API_URL = "http://localhost:5001/api";
const MOBILE_API_URL = "http://192.168.1.71:5001/api";

export const API_URL = Platform.OS === "web" ? WEB_API_URL : MOBILE_API_URL;