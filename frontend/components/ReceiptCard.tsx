import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  total: string;
  date: string;
};

export default function ReceiptCard({ title, total, date }: Props) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text style={styles.total}>{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  title: { fontSize: 16, fontWeight: "700" },
  date: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  total: { fontSize: 18, fontWeight: "700", color: "#111827" }
});
