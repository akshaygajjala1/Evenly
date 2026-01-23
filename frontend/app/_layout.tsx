import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppStoreProvider } from "../store/AppStore";

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTitleAlign: "center",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "#f7f7f7" },
            contentStyle: { backgroundColor: "#f7f7f7" }
          }}
        >
          <Stack.Screen name="index" options={{ title: "Evenly" }} />
          <Stack.Screen name="scan" options={{ title: "Scan Receipt" }} />
          <Stack.Screen name="review" options={{ title: "Receipt" }} />
          <Stack.Screen name="assign" options={{ title: "Split" }} />
          <Stack.Screen name="payment" options={{ title: "Payment method" }} />
          <Stack.Screen name="send" options={{ title: "Send requests" }} />
          <Stack.Screen name="pay" options={{ title: "Pay" }} />
          <Stack.Screen name="add-friend" options={{ title: "Add friend" }} />
          <Stack.Screen name="receipt-details" options={{ title: "Receipt" }} />
          <Stack.Screen name="login" options={{ title: "Login" }} />
        </Stack>
      </>
    </AppStoreProvider>
  );
}
