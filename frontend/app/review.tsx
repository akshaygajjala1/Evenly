import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View, FlatList } from "react-native";
import PaymentMethodPicker from "../components/PaymentMethodPicker";
import { Receipt } from "../services/backend";

interface Person {
  id: string;
  name: string;
  color: string;
}

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    if (params.receiptData && params.assignments && params.totals && params.people) {
      try {
        const receiptData = JSON.parse(params.receiptData as string);
        const assignmentsData = JSON.parse(params.assignments as string);
        const totalsData = JSON.parse(params.totals as string);
        const peopleData = JSON.parse(params.people as string);
        
        setReceipt(receiptData);
        setAssignments(assignmentsData);
        setTotals(totalsData);
        setPeople(peopleData);
      } catch (error) {
        console.error("Failed to parse review data:", error);
      }
    }
  }, [params]);

  const handleSendRequests = () => {
    // In a real app, this would send payment requests
    console.log("Sending payment requests:", {
      receipt,
      assignments,
      totals,
      people
    });
    
    // Navigate back to home
    router.replace("/");
  };

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Review & send</Text>
      <Text style={styles.subtitle}>Receipt ID: {receipt.id.slice(-8)}</Text>
      
      <View style={styles.card}>
        <Row label="Subtotal" value={`$${receipt.subtotal.toFixed(2)}`} />
        <Row label="Tax" value={`$${receipt.tax.toFixed(2)}`} />
        <Row label="Tip" value={`$${receipt.tip.toFixed(2)}`} />
        <View style={styles.row}>
          <Text style={[styles.label, styles.totalLabel]}>Total</Text>
          <Text style={[styles.value, styles.totalValue]}>${receipt.total.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Split by person</Text>
      <View style={styles.card}>
        <FlatList
          data={people}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={styles.personRow}>
              <View style={styles.personInfo}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.personName}>{item.name}</Text>
              </View>
              <Text style={styles.personAmount}>
                ${totals[item.id]?.toFixed(2) || "0.00"}
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

      <PaymentMethodPicker />
      
      <Pressable style={styles.primary} onPress={handleSendRequests}>
        <Text style={styles.primaryText}>Send requests</Text>
      </Pressable>
      
      <Text style={styles.helper}>
        Payment requests will be sent to each person
      </Text>
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
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 14, gap: 8, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#374151", fontSize: 16 },
  value: { color: "#111827", fontSize: 16, fontWeight: "600" },
  totalLabel: { fontWeight: "700" },
  totalValue: { fontSize: 18 },
  personRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  personInfo: { flexDirection: "row", alignItems: "center" },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  personName: { fontSize: 16, fontWeight: "500" },
  personAmount: { fontSize: 16, fontWeight: "600", color: "#111827" },
  separator: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 4 },
  primary: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 12 },
  primaryText: { color: "#fff", fontWeight: "700" },
  helper: { color: "#6b7280", textAlign: "center", marginTop: 8 }
});
