import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import Camera from "../components/Camera";

export default function ScanScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Scan your receipt</Text>
      <Camera />
      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={() => router.push("/assign")}>
          <Text style={styles.primaryText}>Use this photo</Text>
        </Pressable>
        <Text style={styles.helper}>Mocked: no actual OCR yet.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  actions: { marginTop: 16, gap: 8 },
  primary: { backgroundColor: "#111827", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "600" },
  helper: { color: "#6b7280", fontSize: 14, textAlign: "center" }
});
