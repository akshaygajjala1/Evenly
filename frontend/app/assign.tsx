import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import ColorLegend from "../components/ColorLegend";
import ItemAssignmentRow from "../components/ItemAssignmentRow";
import PersonBadge from "../components/PersonBadge";
import { getParticipantDisplay, useAppStore } from "../store/AppStore";

export default function AssignScreen() {
  const router = useRouter();
  const { state, actions } = useAppStore();
  const draft = state.draftSplit;
  const receipt = draft?.receipt;

  const [assignments, setAssignments] = useState<Record<string, string[]>>(draft?.assignments || {});
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const participantIds = useMemo(() => {
    if (!draft) return [];
    const unique = Array.from(new Set([state.currentUser.id, ...draft.participantIds]));
    return unique;
  }, [draft, state.currentUser.id]);

  const participantPeople = useMemo(() => {
    return participantIds.map((id) => {
      const info = getParticipantDisplay(state, id);
      return { id, name: info.name, color: info.color };
    });
  }, [participantIds, state]);

  const totals = useMemo(() => {
    if (!receipt) return {};

    const sums: Record<string, number> = {};
    receipt.items.forEach((item) => {
      const assigned = assignments[item.id] || [];
      const valid = assigned.filter((pid) => participantIds.includes(pid));
      if (!valid.length) return;
      const share = item.price / valid.length;
      valid.forEach((pid) => {
        sums[pid] = (sums[pid] || 0) + share;
      });
    });

    const itemsTotal = receipt.items.reduce((acc, it) => acc + it.price, 0);
    const baseTotal = itemsTotal > 0 ? itemsTotal : receipt.subtotal;

    if (baseTotal > 0) {
      const tax = receipt.tax || 0;
      const tip = receipt.tip || 0;
      Object.keys(sums).forEach((pid) => {
        const ratio = sums[pid] / baseTotal;
        sums[pid] = sums[pid] + tax * ratio + tip * ratio;
      });
    }

    return sums;
  }, [receipt, assignments, participantIds]);

  const toggleAssign = (itemId: string, personId: string) => {
    if (!participantIds.includes(personId)) return;
    setAssignments((prev) => {
      const current = prev[itemId] || [];
      const next = current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId];
      const updated = { ...prev, [itemId]: next };
      actions.setDraftAssignments(updated);
      return updated;
    });
  };

  const handleContinue = () => {
    if (!receipt || !draft) return;

    const hasAny = receipt.items.some((it) => (assignments[it.id] || []).some((pid) => participantIds.includes(pid)));
    if (!hasAny) {
      Alert.alert("Assign at least one item", "Tap a person chip on an item to assign it.");
      return;
    }

    actions.setDraftParticipants(participantIds);
    actions.setDraftTotals(totals);
    router.push("/send");
  };

  if (!draft || !receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No receipt to split</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Split assignment</Text>
        <Text style={styles.subtitle}>{receipt.items.length} items • Total ${receipt.total.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Participants</Text>
          <Pressable style={styles.cardLink} onPress={() => setParticipantsOpen(true)}>
            <Text style={styles.cardLinkText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.participantsRow}>
          {participantPeople.map((p) => (
            <View key={p.id} style={[styles.participantChip, { borderColor: p.color }]}>
              <View style={[styles.dot, { backgroundColor: p.color }]} />
              <Text style={styles.participantName}>{p.name}</Text>
            </View>
          ))}
          <Pressable style={styles.addChip} onPress={() => router.push("/add-friend")}>
            <Text style={styles.addChipText}>+ Add friend</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={receipt.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ItemAssignmentRow
            item={item}
            people={participantPeople}
            assignedTo={(assignments[item.id] || []).filter((pid) => participantIds.includes(pid))}
            onToggle={(personId) => toggleAssign(item.id, personId)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingVertical: 12 }}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current totals</Text>
        <FlatList
          data={participantPeople}
          keyExtractor={(p) => p.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <PersonBadge name={item.name} color={item.color} total={totals[item.id]} />}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
        <ColorLegend people={participantPeople} />
      </View>

      <Pressable style={styles.primary} onPress={handleContinue}>
        <Text style={styles.primaryText}>Continue</Text>
      </Pressable>

      <Modal transparent visible={participantsOpen} animationType="fade" onRequestClose={() => setParticipantsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select participants</Text>
            <Text style={styles.modalSubtitle}>Select who is included in this split.</Text>

            <View style={styles.modalList}>
              <Pressable style={styles.modalRow}>
                <View style={styles.modalLeft}>
                  <View style={[styles.dot, { backgroundColor: "#111827" }]} />
                  <Text style={styles.modalName}>{state.currentUser.name}</Text>
                </View>
                <View style={[styles.checkbox, styles.checkboxOn]} />
              </Pressable>

              {state.friends.map((f) => {
                const checked = participantIds.includes(f.id);
                return (
                  <Pressable
                    key={f.id}
                    style={styles.modalRow}
                    onPress={() => {
                      const next = checked
                        ? participantIds.filter((id) => id !== f.id)
                        : [...participantIds, f.id];
                      actions.setDraftParticipants(next);
                    }}
                  >
                    <View style={styles.modalLeft}>
                      <View style={[styles.dot, { backgroundColor: f.color }]} />
                      <Text style={styles.modalName}>{f.name}</Text>
                    </View>
                    <View style={[styles.checkbox, checked && styles.checkboxOn]} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondary} onPress={() => setParticipantsOpen(false)}>
                <Text style={styles.secondaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7f7" },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, color: "#6b7280" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  cardLink: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "#f3f4f6" },
  cardLinkText: { fontWeight: "900", color: "#111827" },
  participantsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  participantChip: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" },
  participantName: { fontWeight: "900", color: "#111827" },
  addChip: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#f9fafb" },
  addChipText: { fontWeight: "900", color: "#111827" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  primary: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "900" },
  emptyCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  emptySubtitle: { marginTop: 6, color: "#6b7280" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  modalSubtitle: { marginTop: 6, color: "#6b7280" },
  modalList: { marginTop: 12 },
  modalRow: { paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  modalLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalName: { fontWeight: "900", color: "#111827" },
  checkbox: { width: 18, height: 18, borderRadius: 6, borderWidth: 2, borderColor: "#d1d5db" },
  checkboxOn: { borderColor: "#111827", backgroundColor: "#111827" },
  modalActions: { marginTop: 14 },
  secondary: { backgroundColor: "#f3f4f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  secondaryText: { fontWeight: "900", color: "#111827" }
});
