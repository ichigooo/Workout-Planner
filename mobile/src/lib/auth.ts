import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";
import { apiService } from "../services/api";
import { setCurrentUserId } from "../state/session";
import initApp from "../services/startup";

WebBrowser.maybeCompleteAuthSession();

function extractTokensFromUrl(url: string): {
    accessToken: string | null;
    refreshToken: string | null;
} {
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return { accessToken: null, refreshToken: null };

    const fragment = url.substring(hashIndex + 1);
    const params = new URLSearchParams(fragment);

    return {
        accessToken: params.get("access_token"),
        refreshToken: params.get("refresh_token"),
    };
}

export async function signInWithGoogle(): Promise<string> {
    const redirectUrl = Linking.createURL("/");

    console.log("[GoogleAuth] Redirect URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
        },
    });

    if (error || !data?.url) {
        throw new Error(error?.message || "Failed to get Google OAuth URL");
    }

    console.log("[GoogleAuth] Opening browser for OAuth...");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type !== "success" || !result.url) {
        throw new Error("Google sign-in was cancelled or failed");
    }

    console.log("[GoogleAuth] Got redirect URL back");

    const { accessToken, refreshToken } = extractTokensFromUrl(result.url);

    if (!accessToken || !refreshToken) {
        throw new Error("Failed to extract authentication tokens from redirect");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (sessionError || !sessionData?.user) {
        throw new Error(sessionError?.message || "Failed to establish session");
    }

    const user = sessionData.user;
    const userId = user.id;
    const userEmail = user.email ?? "";
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || null;

    console.log("[GoogleAuth] Session established for user:", userId);

    await apiService.createUserIfNeeded({
        id: userId,
        email: userEmail,
        name: userName,
    });

    await setCurrentUserId(userId);
    await initApp();

    return userId;
}
