import Constants from "expo-constants";

export function getLocalIp(): string | null {
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
