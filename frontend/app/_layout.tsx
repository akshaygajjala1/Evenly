import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="index" options={{ title: "Evenly" }} />
        <Stack.Screen name="scan" options={{ title: "Scan Receipt" }} />
        <Stack.Screen name="assign" options={{ title: "Assign" }} />
        <Stack.Screen name="review" options={{ title: "Review & Send" }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
      </Stack>
    </>
  );
}
