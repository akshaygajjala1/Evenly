import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PaymentMethodKey, getParticipantDisplay, useAppStore } from "../store/AppStore";

type Option = {
  key: PaymentMethodKey;
  title: string;
  subtitle: string;
};

const OPTIONS: Option[] = [
  { key: "manual", title: "Manual payment", subtitle: "Enter card details for this payment" },
  { key: "venmo", title: "Venmo", subtitle: "Connect your Venmo account (mock)" },
  { key: "stripe", title: "Stripe", subtitle: "Connect Stripe (mock)" },
  { key: "cash_app", title: "Cash App", subtitle: "Connect Cash App (mock)" },
  { key: "apple_pay", title: "Apple Pay", subtitle: "Use Apple Pay (mock)" }
];

export default function PayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state, actions } = useAppStore();

  const billId = (params.billId as string) || "";
  const bill = useMemo(() => state.bills.find((b) => b.id === billId), [state.bills, billId]);
  const receipt = useMemo(() => (bill ? state.receipts.find((r) => r.id === bill.receiptId) : undefined), [state.receipts, bill]);

  const [selected, setSelected] = useState<PaymentMethodKey | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectTarget, setConnectTarget] = useState<Option | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const sender = useMemo(() => {
    if (!bill) return null;
    return getParticipantDisplay(state, bill.senderId);
  }, [state, bill]);

  const canPay = useMemo(() => {
    if (!bill) return false;
    if (bill.status === "paid") return false;
    if (!selected) return false;
    if (selected !== "manual") return true;
    return cardNumber.trim().length >= 12 && expiry.trim().length >= 4 && cvc.trim().length >= 3;
  }, [bill, selected, cardNumber, expiry, cvc]);

  const onSelect = (opt: Option) => {
    setSelected(opt.key);
    if (opt.key !== "manual") {
      setConnectTarget(opt);
      setConnectOpen(true);
    }
  };

  const onPay = () => {
    if (!bill || !sender) return;
    if (!selected) return;

    Alert.alert(
      "Confirm payment",
      `Pay $${bill.amount.toFixed(2)} to ${sender.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay",
          onPress: () => {
            actions.markBillPaid(bill.id);
            Alert.alert("Paid", "Payment completed (demo).", [{ text: "Done", onPress: () => router.replace("/") }]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {!bill || !sender ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Bill not found</Text>
            <Text style={styles.emptySubtitle}>This payment request may have been removed.</Text>
            <Pressable style={styles.primary} onPress={() => router.replace("/")}>
              <Text style={styles.primaryText}>Go home</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Pay bill</Text>
              <Text style={styles.subtitle}>{receipt?.title || "Split"}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>You owe</Text>
                <Text style={styles.summaryValue}>${bill.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>To</Text>
                <Text style={styles.summaryTo}>{sender.name}</Text>
              </View>
              <Text style={styles.summaryHint}>Demo only. No real payment is processed.</Text>
            </View>

            {bill.status === "paid" && (
              <View style={styles.paidBanner}>
                <Text style={styles.paidText}>This bill is already paid.</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment method</Text>
              <Text style={styles.sectionSubtitle}>Choose how you want to pay this bill.</Text>

              <View style={styles.options}>
                {OPTIONS.map((opt) => {
                  const active = selected === opt.key;
                  return (
                    <Pressable key={opt.key} style={[styles.option, active && styles.optionActive]} onPress={() => onSelect(opt)}>
                      <View style={styles.optionTextWrap}>
                        <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{opt.title}</Text>
                        <Text style={[styles.optionSubtitle, active && styles.optionSubtitleActive]}>{opt.subtitle}</Text>
                      </View>
                      <View style={[styles.radio, active && styles.radioActive]} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {selected === "manual" && (
              <View style={styles.manualCard}>
                <Text style={styles.manualTitle}>Card details</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Card number</Text>
                  <TextInput value={cardNumber} onChangeText={setCardNumber} placeholder="1234 5678 9012 3456" style={styles.input} keyboardType="number-pad" />
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Expiry</Text>
                    <TextInput value={expiry} onChangeText={setExpiry} placeholder="MM/YY" style={styles.input} />
                  </View>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>CVC</Text>
                    <TextInput value={cvc} onChangeText={setCvc} placeholder="123" style={styles.input} keyboardType="number-pad" />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.footer}>
              <Pressable style={styles.secondary} onPress={() => router.back()}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.primary, !canPay && styles.primaryDisabled]} onPress={onPay} disabled={!canPay}>
                <Text style={styles.primaryText}>Pay</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <Modal transparent visible={connectOpen} animationType="fade" onRequestClose={() => setConnectOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Connect {connectTarget?.title}</Text>
            <Text style={styles.modalSubtitle}>This is a demo. Tap connect to simulate linking your account.</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondary} onPress={() => setConnectOpen(false)}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.primary}
                onPress={() => {
                  setConnectOpen(false);
                  Alert.alert("Connected", `${connectTarget?.title} connected (mock).`);
                }}
              >
                <Text style={styles.primaryText}>Connect</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  scroll: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, color: "#6b7280" },
  summaryCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  summaryLabel: { color: "#6b7280", fontWeight: "800" },
  summaryValue: { fontSize: 20, fontWeight: "900", color: "#111827" },
  summaryTo: { fontWeight: "900", color: "#111827" },
  summaryHint: { marginTop: 10, color: "#9ca3af", fontSize: 12 },
  paidBanner: { backgroundColor: "#ecfdf5", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#bbf7d0", marginBottom: 12 },
  paidText: { color: "#166534", fontWeight: "900" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  sectionSubtitle: { marginTop: 6, color: "#6b7280" },
  options: { marginTop: 10, gap: 10 },
  option: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  optionActive: { borderColor: "#111827" },
  optionTextWrap: { flex: 1, paddingRight: 12 },
  optionTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  optionTitleActive: { color: "#111827" },
  optionSubtitle: { marginTop: 4, color: "#6b7280" },
  optionSubtitleActive: { color: "#374151" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#d1d5db" },
  radioActive: { borderColor: "#111827", backgroundColor: "#111827" },
  manualCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  manualTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  field: { marginTop: 12 },
  label: { fontSize: 13, fontWeight: "800", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: "#f9fafb" },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  footer: { flexDirection: "row", gap: 10, marginTop: 8 },
  secondary: { flex: 1, backgroundColor: "#f3f4f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  secondaryText: { fontWeight: "900", color: "#111827" },
  primary: { flex: 1, backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryDisabled: { backgroundColor: "#9ca3af" },
  primaryText: { fontWeight: "900", color: "#fff" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  modalSubtitle: { marginTop: 8, color: "#6b7280", lineHeight: 18 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  emptyCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  emptySubtitle: { marginTop: 6, color: "#6b7280" }
});
