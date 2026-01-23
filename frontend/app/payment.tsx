import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PaymentMethodKey, useAppStore } from "../store/AppStore";

type Option = {
  key: PaymentMethodKey;
  title: string;
  subtitle: string;
};

const OPTIONS: Option[] = [
  { key: "manual", title: "Manual payment", subtitle: "Enter card details for this request" },
  { key: "venmo", title: "Venmo", subtitle: "Connect your Venmo account (mock)" },
  { key: "stripe", title: "Stripe", subtitle: "Connect Stripe (mock)" },
  { key: "cash_app", title: "Cash App", subtitle: "Connect Cash App (mock)" },
  { key: "apple_pay", title: "Apple Pay", subtitle: "Use Apple Pay (mock)" }
];

export default function PaymentScreen() {
  const router = useRouter();
  const { state, actions } = useAppStore();
  const draft = state.draftSplit;

  const [selected, setSelected] = useState<PaymentMethodKey | null>(draft?.preferredPaymentMethod || null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectTarget, setConnectTarget] = useState<Option | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const canContinue = useMemo(() => {
    if (!selected) return false;
    if (selected !== "manual") return true;
    return cardNumber.trim().length >= 12 && expiry.trim().length >= 4 && cvc.trim().length >= 3;
  }, [selected, cardNumber, expiry, cvc]);

  if (!draft) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing to pay yet</Text>
          <Text style={styles.emptySubtitle}>Start a new split to choose a payment method.</Text>
          <Pressable style={styles.primary} onPress={() => router.replace("/")}>
            <Text style={styles.primaryText}>Go home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const onSelect = (opt: Option) => {
    setSelected(opt.key);

    if (opt.key !== "manual") {
      setConnectTarget(opt);
      setConnectOpen(true);
    }
  };

  const onContinue = () => {
    if (!selected) return;
    actions.setDraftPaymentMethod(selected);
    router.push("/send");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.title}>Choose payment method</Text>
          <Text style={styles.subtitle}>This is how your friends will pay you for this split.</Text>
        </View>

        <View style={styles.section}>
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

            <Text style={styles.disclaimer}>Demo only. No real payment is processed.</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Pressable style={styles.secondary} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Back</Text>
          </Pressable>
          <Pressable style={[styles.primary, !canContinue && styles.primaryDisabled]} onPress={onContinue} disabled={!canContinue}>
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
        </View>
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
  hero: { marginBottom: 14 },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, color: "#6b7280", lineHeight: 18 },
  section: { gap: 10 },
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
  manualCard: { marginTop: 14, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  manualTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  field: { marginTop: 12 },
  label: { fontSize: 13, fontWeight: "800", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: "#f9fafb" },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  disclaimer: { marginTop: 12, color: "#9ca3af", fontSize: 12 },
  footer: { flexDirection: "row", gap: 10, marginTop: 16 },
  secondary: { flex: 1, backgroundColor: "#f3f4f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  secondaryText: { fontWeight: "800", color: "#111827" },
  primary: { flex: 1, backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryDisabled: { backgroundColor: "#9ca3af" },
  primaryText: { fontWeight: "900", color: "#fff" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  modalSubtitle: { marginTop: 8, color: "#6b7280", lineHeight: 18 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  emptyCard: { margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  emptySubtitle: { marginTop: 6, color: "#6b7280" }
});
