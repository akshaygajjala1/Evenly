import { Link, useRouter } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import ReceiptCard from "../components/ReceiptCard";

const mockReceipts = [
  { id: "1", title: "Dinner at Momo's", total: "$86.40", date: "Jun 1" },
  { id: "2", title: "Coffee Run", total: "$18.75", date: "May 28" },
  { id: "3", title: "Groceries", total: "$124.10", date: "May 25" }
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipts</Text>
        <Pressable style={styles.newButton} onPress={() => router.push("/scan")}>
          <Text style={styles.newButtonText}>New split</Text>
        </Pressable>
      </View>
      <FlatList
        data={mockReceipts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/review", params: { receiptId: item.id } }} asChild>
            <Pressable>
              <ReceiptCard title={item.title} total={item.total} date={item.date} />
            </Pressable>
          </Link>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7", paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: "700" },
  newButton: { backgroundColor: "#111827", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  newButtonText: { color: "#fff", fontWeight: "600" },
  separator: { height: 12 },
  listContent: { paddingBottom: 24 }
});
