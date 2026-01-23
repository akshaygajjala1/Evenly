import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppStore } from "../store/AppStore";

export default function ReviewScreen() {
  const router = useRouter();
  const { state, actions } = useAppStore();
  const draft = state.draftSplit;

  const [title, setTitle] = useState(draft?.title || "New split");

  const receipt = draft?.receipt;

  const itemCountLabel = useMemo(() => {
    if (!receipt) return "";
    return `${receipt.items.length} items`;
  }, [receipt]);

  if (!draft || !receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No receipt to review</Text>
          <Text style={styles.emptySubtitle}>Start a new split from the home screen.</Text>
          <Pressable style={styles.primary} onPress={() => router.replace("/")}>
            <Text style={styles.primaryText}>Go home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Review receipt</Text>
          <Text style={styles.subtitle}>{itemCountLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Split title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Dinner at Momo's"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Totals</Text>
          <Row label="Subtotal" value={`$${receipt.subtotal.toFixed(2)}`} />
          <Row label="Tax" value={`$${receipt.tax.toFixed(2)}`} />
          <Row label="Tip" value={`$${receipt.tip.toFixed(2)}`} />
          <View style={styles.row}>
            <Text style={[styles.label, styles.totalLabel]}>Total</Text>
            <Text style={[styles.value, styles.totalValue]}>${receipt.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {receipt.items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.itemPrice}>${it.price.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.secondary}
            onPress={() => {
              actions.clearDraft();
              router.replace("/");
            }}
          >
            <Text style={styles.secondaryText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={styles.primary}
            onPress={() => {
              actions.setDraftTitle(title.trim().length ? title.trim() : "New split");
              router.push("/assign");
            }}
          >
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  scroll: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, color: "#6b7280" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  label: { color: "#6b7280", fontSize: 14, fontWeight: "800" },
  value: { color: "#111827", fontSize: 14, fontWeight: "900" },
  totalLabel: { fontWeight: "900", color: "#111827" },
  totalValue: { fontSize: 16, fontWeight: "900" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  itemName: { flex: 1, paddingRight: 10, fontWeight: "800", color: "#111827" },
  itemPrice: { fontWeight: "900", color: "#111827" },
  footer: { flexDirection: "row", gap: 10, marginTop: 6 },
  secondary: { flex: 1, backgroundColor: "#f3f4f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  secondaryText: { color: "#111827", fontWeight: "900" },
  primary: { flex: 1, backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "900" },
  emptyCard: { margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  emptySubtitle: { marginTop: 6, color: "#6b7280" }
});
