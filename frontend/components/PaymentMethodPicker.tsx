import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const methods = ["Stripe", "PayPal", "Venmo", "Manual"];

export default function PaymentMethodPicker() {
  const [selected, setSelected] = useState(methods[0]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Payment method</Text>
      <View style={styles.row}>
        {methods.map((m) => (
          <Pressable
            key={m}
            onPress={() => setSelected(m)}
            style={[styles.option, selected === m && styles.optionSelected]}
          >
            <Text style={[styles.optionText, selected === m && styles.optionTextSelected]}>
              {m}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  optionSelected: {
    borderColor: "#111827",
    backgroundColor: "#111827"
  },
  optionText: { color: "#111827", fontWeight: "600" },
  optionTextSelected: { color: "#fff" }
});
