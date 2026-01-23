import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { getParticipantDisplay, useAppStore } from "../store/AppStore";

export default function SendScreen() {
  const router = useRouter();
  const { state, actions } = useAppStore();
  const draft = state.draftSplit;
  const [isSending, setIsSending] = useState(false);

  const summary = useMemo(() => {
    if (!draft) return null;
    const participants = draft.participantIds.map((id) => ({ id, ...getParticipantDisplay(state, id) }));
    const rows = participants
      .map((p) => ({
        ...p,
        amount: typeof draft.totals[p.id] === "number" ? draft.totals[p.id] : 0
      }))
      .filter((r) => r.amount > 0);

    const total = rows.reduce((acc, r) => acc + r.amount, 0);
    return { rows, total };
  }, [draft, state]);

  if (!draft || !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Nothing to send</Text>
          <Text style={styles.subtitle}>Start a new split first.</Text>
          <Pressable style={styles.primary} onPress={() => router.replace("/")}>
            <Text style={styles.primaryText}>Go home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const onSend = async () => {
    if (summary.rows.length === 0) {
      Alert.alert("No requests", "Assign at least one item to someone to create requests.");
      return;
    }

    setIsSending(true);
    try {
      actions.addReceiptAndBills({
        receipt: draft.receipt,
        title: draft.title,
        participantIds: draft.participantIds,
        totals: draft.totals,
        preferredPaymentMethod: draft.preferredPaymentMethod
      });
      actions.clearDraft();
      Alert.alert("Sent", "Payment requests were created.", [{ text: "Done", onPress: () => router.replace("/") }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Send requests</Text>
          <Text style={styles.subtitle}>Review totals and send the split.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Split summary</Text>
          <Text style={styles.cardSubtitle}>{draft.title}</Text>

          <View style={styles.divider} />

          {summary.rows.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={styles.left}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text style={styles.name}>{r.name}</Text>
              </View>
              <Text style={styles.amount}>${r.amount.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total requests</Text>
            <Text style={styles.totalAmount}>${summary.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.secondary} onPress={() => router.back()} disabled={isSending}>
            <Text style={styles.secondaryText}>Back</Text>
          </Pressable>
          <Pressable style={[styles.primary, isSending && styles.primaryDisabled]} onPress={onSend} disabled={isSending}>
            <Text style={styles.primaryText}>{isSending ? "Sending..." : "Send"}</Text>
          </Pressable>
        </View>
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
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  cardSubtitle: { marginTop: 6, color: "#6b7280" },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontWeight: "800", color: "#111827" },
  amount: { fontWeight: "900", color: "#111827" },
  totalLabel: { fontWeight: "900", color: "#111827" },
  totalAmount: { fontWeight: "900", color: "#111827", fontSize: 16 },
  note: { marginTop: 10, color: "#6b7280" },
  footer: { flexDirection: "row", gap: 10, marginTop: 16 },
  secondary: { flex: 1, backgroundColor: "#f3f4f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  secondaryText: { fontWeight: "800", color: "#111827" },
  primary: { flex: 1, backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryDisabled: { backgroundColor: "#9ca3af" },
  primaryText: { fontWeight: "900", color: "#fff" }
});
