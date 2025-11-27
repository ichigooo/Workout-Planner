import Constants from "expo-constants";

// run ipconfig getifaddr en0 to get the local IP
const CURRENT_IP = "";

export function getLocalIp(): string | null {
    if (CURRENT_IP) return CURRENT_IP;
    try {
        const hostUri = Constants.expoConfig?.hostUri;

        if (!hostUri) return null; // likely a production build

        // hostUri format: "192.168.1.23:8081"
        const [ip] = hostUri.split(":");

        // Basic sanity check
        if (!ip || ip.split(".").length !== 4) return null;

        return ip;
    } catch (error) {
        console.error("[getLocalIp] Error getting local IP", error);
        return null;
    }
}
