import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();
  useEffect(() => {
    const isAuthRoute = segments[0] === "auth";
    if (!user && !isAuthRoute && !isLoadingUser) {
      // Yönlendirme işlemini 1 saniye geciktirin
      setTimeout(() => {
        router.replace("/auth");
      }, 1000); // 1000 ms = 1 saniye
    } else if (user && isAuthRoute && !isLoadingUser) {
      // Eğer kullanıcı oturum açmışsa ve auth rotasındaysa, anasayfaya yönlendir
      router.replace("/");
    }
  }, [user, segments]);
  return <>{children}</>;
}
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PaperProvider>
          <SafeAreaProvider>
            <RouteGuard>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </RouteGuard>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
