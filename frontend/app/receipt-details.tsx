import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { getParticipantDisplay, useAppStore } from "../store/AppStore";

export default function ReceiptDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state } = useAppStore();

  const receiptId = (params.receiptId as string) || "";

  const record = useMemo(() => state.receipts.find((r) => r.id === receiptId), [state.receipts, receiptId]);
  const billsForReceipt = useMemo(() => state.bills.filter((b) => b.receiptId === receiptId), [state.bills, receiptId]);

  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Receipt not found</Text>
          <Pressable style={styles.primary} onPress={() => router.replace("/")}>
            <Text style={styles.primaryText}>Go home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const receipt = record.receipt;
  const paidBy = record.payerId ? getParticipantDisplay(state, record.payerId).name : undefined;

  const confirmations = record.participantIds
    .map((pid) => {
      const bill = billsForReceipt.find((b) => b.recipientId === pid);
      const display = getParticipantDisplay(state, pid);
      const status = bill?.status || "pending";
      return {
        participantId: pid,
        name: display.name,
        color: display.color,
        amount: bill?.amount,
        status
      };
    })
    .filter((row) => typeof row.amount === "number" && row.amount > 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{record.title}</Text>
          <Text style={styles.subtitle}>Receipt • {new Date(record.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>${receipt.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tax</Text>
            <Text style={styles.value}>${receipt.tax.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tip</Text>
            <Text style={styles.value}>${receipt.tip.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${receipt.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Confirmations</Text>
          <Text style={styles.confirmSubtitle}>
            {paidBy ? `Receipt paid by ${paidBy}.` : "Receipt paid."}
          </Text>

          {confirmations.length === 0 ? (
            <Text style={styles.confirmEmpty}>No payment confirmations for this receipt yet.</Text>
          ) : (
            confirmations.map((c) => (
              <View key={c.participantId} style={styles.confirmRow}>
                <View style={styles.confirmLeft}>
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <View>
                    <Text style={styles.confirmName}>{c.name}</Text>
                    <Text style={styles.confirmAmount}>${(c.amount || 0).toFixed(2)}</Text>
                  </View>
                </View>
                <View style={[styles.badge, c.status === "paid" ? styles.badgePaid : styles.badgePending]}>
                  <Text style={[styles.badgeText, c.status === "paid" ? styles.badgeTextPaid : styles.badgeTextPending]}>
                    {c.status === "paid" ? "Paid" : "Pending"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {receipt.items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.itemPrice}>${it.price.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.primary} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Done</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  scroll: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, color: "#6b7280" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  label: { color: "#6b7280", fontWeight: "700" },
  value: { color: "#111827", fontWeight: "900" },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 10 },
  totalLabel: { color: "#111827", fontWeight: "900" },
  totalValue: { color: "#111827", fontWeight: "900", fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 10 },
  confirmSubtitle: { marginTop: -6, marginBottom: 12, color: "#6b7280" },
  confirmEmpty: { color: "#6b7280" },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  confirmLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  confirmName: { fontWeight: "900", color: "#111827" },
  confirmAmount: { marginTop: 2, color: "#6b7280", fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgePending: { backgroundColor: "#fff", borderColor: "#e5e7eb" },
  badgePaid: { backgroundColor: "#ecfdf5", borderColor: "#bbf7d0" },
  badgeText: { fontWeight: "900", fontSize: 12 },
  badgeTextPending: { color: "#374151" },
  badgeTextPaid: { color: "#166534" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  itemName: { fontWeight: "800", color: "#111827", flex: 1, paddingRight: 10 },
  itemPrice: { fontWeight: "900", color: "#111827" },
  primary: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  primaryText: { color: "#fff", fontWeight: "900" }
});
