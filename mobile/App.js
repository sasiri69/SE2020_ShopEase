import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { Text, TextInput } from "react-native";
import { useFonts as useRobotoFonts, Roboto_500Medium } from "@expo-google-fonts/roboto";
import { useFonts as useOpenSansFonts, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { useFonts as useMontserratFonts, Montserrat_700Bold } from "@expo-google-fonts/montserrat";
import { AuthProvider } from "./src/auth/AuthContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F4F6FA",
    card: "#FFFFFF",
    text: "#111827",
    primary: "#FF6A3D",
    border: "#E5E7EB",
  },
};

export default function App() {
  const [robotoLoaded] = useRobotoFonts({ Roboto_500Medium });
  const [openSansLoaded] = useOpenSansFonts({ OpenSans_400Regular });
  const [montserratLoaded] = useMontserratFonts({ Montserrat_700Bold });

  useEffect(() => {
    if (!robotoLoaded || !openSansLoaded || !montserratLoaded) return;
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [{ fontFamily: "OpenSans_400Regular" }, Text.defaultProps.style];

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [{ fontFamily: "OpenSans_400Regular" }, TextInput.defaultProps.style];
  }, [robotoLoaded, openSansLoaded, montserratLoaded]);

  if (!robotoLoaded || !openSansLoaded || !montserratLoaded) return null;

  return (
    <AuthProvider>
      <NavigationContainer theme={lightNavTheme}>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
