import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { FC, ReactNode, useEffect, useRef } from "react";
import "react-native-reanimated";
import basic from "@/constants/basic.json";
import customerNetwork from "@/constants/customer-network.json";
import {
  FeatureFlaggingProvider,
  useFeatureFlagging,
} from "@/contexts/FeatureFlaggingContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFeatureFlagValue } from "@/hooks/useLaunchDarkly";
import { Text, View } from "react-native";
import { LDContext } from "@launchdarkly/react-native-client-sdk";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const FeatureFlagMonitor: FC<{ children: ReactNode }> = ({ children }) => {
  const { ldClient } = useFeatureFlagging();
  useEffect(() => {
    if (!ldClient) return;

    console.log("LdTest calling identify");

    Promise.resolve()
      .then(() => ldClient.identify(basic as LDContext))
      .then(() => ldClient.identify(customerNetwork as LDContext));
  }, [ldClient]);

  const { getValue } = useFeatureFlagValue("mica-banner");

  const values = useRef<string[]>([]);
  
  console.log("LdTest MiCA Banner value:", getValue());

  // Render the different unique values of the flag over time. Should only be "false, true".
  const currentValue = String(getValue().value);
  if (
    !values.current.length ||
    values.current[values.current.length - 1] !== currentValue
  ) {
    values.current.push(currentValue);
  }
  return (
    <>
      <View style={{ marginTop: 100 }}>
        <Text>LdTest MiCA Banner value: {values.current.join(", ")}</Text>
      </View>
      {children}
    </>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <FeatureFlaggingProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <FeatureFlagMonitor>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </FeatureFlagMonitor>
        <StatusBar style="auto" />
      </ThemeProvider>
    </FeatureFlaggingProvider>
  );
}
