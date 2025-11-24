import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const {
                    data: { session: initialSession },
                    error,
                } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error) {
                    console.warn("[Auth] Failed to restore session:", error);
                    setSession(null);
                    setUser(null);
                } else {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);
                }
            } catch (e) {
                if (isMounted) {
                    console.warn("[Auth] Unexpected error restoring session:", e);
                    setSession(null);
                    setUser(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        init();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (!isMounted) return;
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value: AuthContextValue = {
        user,
        session,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}

