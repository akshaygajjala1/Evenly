import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.form}>
        <TextInput placeholder="Email" style={styles.input} autoCapitalize="none" />
        <TextInput placeholder="Password" style={styles.input} secureTextEntry />
        <Pressable style={styles.primary} onPress={() => router.replace("/")}>
          <Text style={styles.primaryText}>Continue</Text>
        </Pressable>
        <Text style={styles.helper}>Mocked auth: no real login.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  form: { gap: 12 },
  input: { borderColor: "#e5e7eb", borderWidth: 1, borderRadius: 10, padding: 12 },
  primary: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },
  helper: { color: "#6b7280", textAlign: "center" }
});
