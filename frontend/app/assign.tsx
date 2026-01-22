import { useRouter, useLocalSearchParams } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import ColorLegend from "../components/ColorLegend";
import ItemAssignmentRow from "../components/ItemAssignmentRow";
import PersonBadge from "../components/PersonBadge";
import { Receipt, ReceiptItem } from "../services/backend";

const defaultPeople = [
  { id: "p1", name: "Alex", color: "#22c55e" },
  { id: "p2", name: "Jordan", color: "#3b82f6" },
  { id: "p3", name: "Sam", color: "#f97316" }
];

export default function AssignScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [people, setPeople] = useState(defaultPeople);

  useEffect(() => {
    if (params.receiptData) {
      try {
        const receiptData = JSON.parse(params.receiptData as string);
        setReceipt(receiptData);
        
        // Initialize assignments with empty arrays
        const initialAssignments: Record<string, string[]> = {};
        receiptData.items.forEach((item: ReceiptItem) => {
          initialAssignments[item.id] = [];
        });
        setAssignments(initialAssignments);
      } catch (error) {
        console.error("Failed to parse receipt data:", error);
      }
    }
  }, [params.receiptData]);

  const totals = useMemo(() => {
    if (!receipt) return {};
    
    const sums: Record<string, number> = {};
    receipt.items.forEach((item) => {
      const people = assignments[item.id] || [];
      if (!people.length) return;
      const share = item.price / people.length;
      people.forEach((pid) => {
        sums[pid] = (sums[pid] || 0) + share;
      });
    });
    return sums;
  }, [receipt, assignments]);

  const toggleAssign = (itemId: string, personId: string) => {
    setAssignments((prev) => {
      const current = prev[itemId] || [];
      const next = current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId];
      return { ...prev, [itemId]: next };
    });
  };

  const handleReview = () => {
    if (!receipt) return;
    
    // Calculate final totals for each person
    const finalTotals = totals;
    
    // Pass data to review screen
    router.push({
      pathname: "/review",
      params: {
        receiptData: JSON.stringify(receipt),
        assignments: JSON.stringify(assignments),
        totals: JSON.stringify(finalTotals),
        people: JSON.stringify(people)
      }
    });
  };

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Loading receipt...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Assign items</Text>
      <Text style={styles.subtitle}>
        {receipt.items.length} items • Total ${receipt.total.toFixed(2)}
      </Text>
      
      <FlatList
        data={people}
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
        data={receipt.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ItemAssignmentRow
            item={item}
            people={people}
            assignedTo={assignments[item.id] || []}
            onToggle={(personId) => toggleAssign(item.id, personId)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
      
      <ColorLegend people={people} />
      
      <Pressable style={styles.primary} onPress={handleReview}>
        <Text style={styles.primaryText}>Review split</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#6b7280", marginBottom: 16 },
  peopleRow: { marginBottom: 12 },
  primary: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 12 },
  primaryText: { color: "#fff", fontWeight: "700" }
});
