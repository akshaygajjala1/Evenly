import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import ColorLegend from "../components/ColorLegend";
import ItemAssignmentRow from "../components/ItemAssignmentRow";
import PersonBadge from "../components/PersonBadge";

const mockPeople = [
  { id: "p1", name: "Alex", color: "#22c55e" },
  { id: "p2", name: "Jordan", color: "#3b82f6" },
  { id: "p3", name: "Sam", color: "#f97316" }
];

const mockItems = [
  { id: "i1", name: "Tacos", price: 14.5 },
  { id: "i2", name: "Nachos", price: 12.0 },
  { id: "i3", name: "Sodas", price: 9.5 }
];

export default function AssignScreen() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Record<string, string[]>>({
    i1: ["p1"],
    i2: ["p2"],
    i3: ["p1", "p3"]
  });

  const totals = useMemo(() => {
    const sums: Record<string, number> = {};
    mockItems.forEach((item) => {
      const people = assignments[item.id] || [];
      if (!people.length) return;
      const share = item.price / people.length;
      people.forEach((pid) => {
        sums[pid] = (sums[pid] || 0) + share;
      });
    });
    return sums;
  }, [assignments]);

  const toggleAssign = (itemId: string, personId: string) => {
    setAssignments((prev) => {
      const current = prev[itemId] || [];
      const next = current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId];
      return { ...prev, [itemId]: next };
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Assign items</Text>
      <FlatList
        data={mockPeople}
        keyExtractor={(p) => p.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.peopleRow}
        renderItem={({ item }) => (
          <PersonBadge name={item.name} color={item.color} total={totals[item.id]} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
      />
      <FlatList
        data={mockItems}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ItemAssignmentRow
            item={item}
            people={mockPeople}
            assignedTo={assignments[item.id] || []}
            onToggle={(personId) => toggleAssign(item.id, personId)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
      <ColorLegend people={mockPeople} />
      <Pressable style={styles.primary} onPress={() => router.push("/review")}>
        <Text style={styles.primaryText}>Review split</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  peopleRow: { marginBottom: 12 },
  primary: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 12 },
  primaryText: { color: "#fff", fontWeight: "700" }
});
