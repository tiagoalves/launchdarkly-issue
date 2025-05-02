import {
  AutoEnvAttributes,
  LDContext,
  LDEvaluationDetail,
  ReactNativeLDClient,
} from "@launchdarkly/react-native-client-sdk";
import * as Application from "expo-application";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FC,
} from "react";
import { Text, View } from "react-native";
import basic from "./basic.json";
import customerNetwork from "./customer-network.json";

interface FeatureFlaggingContextType {
  counter: number;
  setCounter: React.Dispatch<React.SetStateAction<number>>;

  ldClient: ReactNativeLDClient | undefined;
  setLdClient: React.Dispatch<
    React.SetStateAction<ReactNativeLDClient | undefined>
  >;
}

const LD_PRODUCTION_MOBILE_KEY =
  process.env.EXPO_PUBLIC_LD_PRODUCTION_MOBILE_KEY;

if (!LD_PRODUCTION_MOBILE_KEY) {
  throw new Error("EXPO_PUBLIC_LD_PRODUCTION_MOBILE_KEY is not set");
}

// --------- Context ---------

const FeatureFlaggingContext = createContext<
  FeatureFlaggingContextType | undefined
>(undefined);

interface FeatureFlaggingProviderProps {
  children: ReactNode;
}

const FeatureFlaggingProvider: React.FC<
  FeatureFlaggingProviderProps
> = ({ children }) => {
  const [counter, setCounter] = useState(0);
  const [ldClient, setLdClient] = useState<ReactNativeLDClient | undefined>(
    undefined
  );

  return (
    <FeatureFlaggingContext.Provider
      value={{ counter, setCounter, ldClient, setLdClient }}
    >
      {children}
    </FeatureFlaggingContext.Provider>
  );
};

const useFeatureFlagging = () => {
  const context = useContext(FeatureFlaggingContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureFlagging must be used within a FeatureFlaggingProvider"
    );
  }
  return context;
};

// --------- Usage Hook ---------

const applicationInfo = Application.applicationId
  ? {
      id: Application.applicationId,
      name: Application.applicationName?.replace(/ /g, "_") ?? undefined,
      version: Application.nativeApplicationVersion ?? undefined,
    }
  : undefined;

const useFeatureFlagValue = (flagName: string) => {
  const { counter, ldClient } = useFeatureFlagging();

  const getValue = useCallback(() => {
    void counter; // Does nothing other than force callback to be recreated

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

const useSetupLaunchDarkly = () => {
  const { setCounter, setLdClient } = useFeatureFlagging();
  useEffect(() => {
    console.log("LdTest Mount Info - useSetupLaunchDarkly MOUNTED");
    return () => {
      console.log("LdTest Mount Info - useSetupLaunchDarkly UNmounted");
    };
  }, []);

  useEffect(() => {
    console.log("LdTest LD client and CHANGE listener set up - MOUNTED");

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

    return () => {
      console.log("LdTest LD client and CHANGE listener set up - UNmounted");
    };
  }, [setCounter, setLdClient]);
};

// --------- Components ---------

const FeatureFlagMonitor: FC = () => {
  useEffect(() => {
    console.log("LdTest Mount Info - FeatureFlagMonitor MOUNTED");
    return () => {
      console.log("LdTest Mount Info - FeatureFlagMonitor UNmounted");
    };
  }, []);

  useSetupLaunchDarkly();

  const { ldClient } = useFeatureFlagging();
  useEffect(() => {
    if (!ldClient) return;

    console.log("LdTest calling identify");

    Promise.resolve()
      .then(() => console.log("LdTest identify 1 START"))
      .then(() => ldClient.identify(basic as LDContext)) // Leads to mica-banner: false
      .then(() => console.log("LdTest identify 1 END"))
      .then(() => console.log("LdTest identify 2 START"))
      .then(() => ldClient.identify(customerNetwork as LDContext)) // Leads to mica-banner: true
      .then(() => console.log("LdTest identify 2 END"))
      .catch((error) => {
        console.log("LdTest identify error", error);
      });
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
    </>
  );
};

// Just render this component by itself somewhere:
//    <FeatureFlagTest />

export const FeatureFlagTest: FC = () => {
  return (
    <>
      <FeatureFlaggingProvider>
        <FeatureFlagMonitor />
      </FeatureFlaggingProvider>
    </>
  );
};
