import * as Application from "expo-application";
import { useCallback, useEffect, useState } from "react";
import "react-native-reanimated";

import {
  AutoEnvAttributes,
  LDEvaluationDetail,
  LDFlagValue,
  ReactNativeLDClient,
} from "@launchdarkly/react-native-client-sdk";
import { useFeatureFlagging } from "@/contexts/FeatureFlaggingContext";

export const LD_PRODUCTION_MOBILE_KEY = process.env.EXPO_PUBLIC_LD_PRODUCTION_MOBILE_KEY;

if (!LD_PRODUCTION_MOBILE_KEY) {
  throw new Error("EXPO_PUBLIC_LD_PRODUCTION_MOBILE_KEY is not set");
}

const applicationInfo = Application.applicationId
  ? {
      id: Application.applicationId,
      name: Application.applicationName?.replace(/ /g, "_") ?? undefined,
      version: Application.nativeApplicationVersion ?? undefined,
    }
  : undefined;


export const useFeatureFlagValue = (flagName: string) => {
  const { counter, ldClient } = useFeatureFlagging();

  const getValue = useCallback(() => {
    void counter;

    if (!ldClient) {
      return { value: false, reason: "LD client not initialized" };
    }

    const { value, reason }: LDEvaluationDetail = ldClient.variationDetail(
      flagName,
      false
    );

    return { value, reason };
  }, [flagName, counter, ldClient]);

  return { getValue };
};

export const useSetupLaunchDarkly = () => {
  const { setCounter, setLdClient } = useFeatureFlagging();
  useEffect(() => {
    const ldClient = new ReactNativeLDClient(
      LD_PRODUCTION_MOBILE_KEY,
      AutoEnvAttributes.Enabled,
      {
        withReasons: true,
        initialConnectionMode: "polling",
        applicationInfo,
      }
    );

    ldClient.on("change", (arg1: any) => {
      console.log("LdTest ON CHANGE", arg1);
      setCounter((c) => c + 1);
    });
    
    setLdClient(ldClient);
  }, [setCounter, setLdClient]);
};
