import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppStore } from "../store/AppStore";

export default function AddFriendScreen() {
  const router = useRouter();
  const { state, actions } = useAppStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");

  const canSubmit = useMemo(() => name.trim().length > 0 && (phone.trim().length > 0 || userId.trim().length > 0), [name, phone, userId]);

  const onAdd = () => {
    if (!canSubmit) return;

    const id = userId.trim().length ? userId.trim() : undefined;
    const normalizedPhone = phone.trim().length ? phone.trim() : undefined;

    if (id && id === state.currentUser.id) {
      Alert.alert("Invalid", "You can't add yourself as a friend.");
      return;
    }

    if (id && state.friends.some((f) => f.id === id)) {
      Alert.alert("Already added", "That user is already in your friends.");
      return;
    }

    actions.addFriend({ name: name.trim(), phone: normalizedPhone, id });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Add friend</Text>
        <Text style={styles.subtitle}>Mocked search. Add by phone number or a unique user ID.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g., Alex" style={styles.input} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g., +1 555 123 4567"
            style={styles.input}
            keyboardType="phone-pad"
          />
          <Text style={styles.hint}>OR</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>User ID</Text>
          <TextInput value={userId} onChangeText={setUserId} placeholder="e.g., user_42" style={styles.input} autoCapitalize="none" />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.primary, !canSubmit && styles.primaryDisabled]} onPress={onAdd} disabled={!canSubmit}>
            <Text style={styles.primaryText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7f7" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 6, color: "#6b7280", lineHeight: 18 },
  field: { marginTop: 14 },
  label: { fontSize: 13, color: "#374151", fontWeight: "700", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  hint: { marginTop: 10, textAlign: "center", color: "#9ca3af", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  secondary: { flex: 1, backgroundColor: "#f3f4f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  secondaryText: { color: "#111827", fontWeight: "700" },
  primary: { flex: 1, backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryDisabled: { backgroundColor: "#9ca3af" },
  primaryText: { color: "#fff", fontWeight: "800" }
});
