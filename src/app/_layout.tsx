import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        'SF-Pro-Rounded-Bold': require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
        'SF-Pro-Rounded-Semibold': require('../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
                <SafeAreaProvider>
                    <ThemeProvider value={DarkTheme}>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen
                                name="new-mode"
                                options={{
                                    headerShown: false,
                                    presentation: "transparentModal",
                                    gestureEnabled: false,
                                    contentStyle: { backgroundColor: "transparent" },
                                }}
                            />
                            <Stack.Screen
                                name="rename-mode"
                                options={{
                                    headerShown: false,
                                    presentation: "transparentModal",
                                    gestureEnabled: false,
                                    contentStyle: { backgroundColor: "transparent" },
                                }}
                            />
                            <Stack.Screen
                                name="add-session"
                                options={{
                                    headerShown: false,
                                    presentation: "transparentModal",
                                    gestureEnabled: false,
                                    contentStyle: { backgroundColor: "transparent" },
                                }}
                            />
                        </Stack>
                    </ThemeProvider>
                    <StatusBar style="light" />
                </SafeAreaProvider>
            </KeyboardProvider>
        </GestureHandlerRootView>
    );
}
