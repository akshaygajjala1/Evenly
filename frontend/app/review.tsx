import { useRouter, useSearchParams } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import PaymentMethodPicker from "../components/PaymentMethodPicker";

const mockTotals = {
  subtotal: 36.0,
  tax: 3.2,
  tip: 6.0,
  total: 45.2
};

export default function ReviewScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const receiptId = params.receiptId || "new";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Review & send</Text>
      <Text style={styles.subtitle}>Receipt ID: {receiptId}</Text>
      <View style={styles.card}>
        <Row label="Subtotal" value={`$${mockTotals.subtotal.toFixed(2)}`} />
        <Row label="Tax" value={`$${mockTotals.tax.toFixed(2)}`} />
        <Row label="Tip" value={`$${mockTotals.tip.toFixed(2)}`} />
        <View style={styles.row}>
          <Text style={[styles.label, styles.totalLabel]}>Total</Text>
          <Text style={[styles.value, styles.totalValue]}>${mockTotals.total.toFixed(2)}</Text>
        </View>
      </View>
      <PaymentMethodPicker />
      <Pressable style={styles.primary} onPress={() => router.replace("/")}>
        <Text style={styles.primaryText}>Send requests</Text>
      </Pressable>
      <Text style={styles.helper}>Mocked flow: no payments or messages sent.</Text>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 12 },
  card: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 14, gap: 8, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#374151", fontSize: 16 },
  value: { color: "#111827", fontSize: 16, fontWeight: "600" },
  totalLabel: { fontWeight: "700" },
  totalValue: { fontSize: 18 },
  primary: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 12 },
  primaryText: { color: "#fff", fontWeight: "700" },
  helper: { color: "#6b7280", textAlign: "center", marginTop: 8 }
});
