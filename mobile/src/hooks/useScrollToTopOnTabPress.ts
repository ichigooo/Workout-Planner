import { useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { ScrollView } from "react-native";

export function useScrollToTopOnTabPress<T extends ScrollView = ScrollView>() {
    const ref = useRef<T | null>(null);
    const navigation = useNavigation();

    useEffect(() => {
        const handler = () => {
            try {
                if (ref.current && typeof (ref.current as any).scrollTo === "function") {
                    (ref.current as any).scrollTo({ y: 0, animated: true });
                }
            } catch (e) {
                // ignore
            }
        };

        const unsub = (navigation as any)?.addListener
            ? (navigation as any).addListener("tabPress", handler)
            : null;
        return () => {
            if (unsub && typeof unsub === "function") unsub();
        };
    }, [navigation]);

    return ref;
}
