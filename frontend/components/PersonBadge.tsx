import { StyleSheet, Text, View } from "react-native";

type Props = {
  name: string;
  color: string;
  total?: number;
};

export default function PersonBadge({ name, color, total }: Props) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.name}>{name}</Text>
      {typeof total === "number" && (
        <Text style={styles.total}>${total.toFixed(2)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff"
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  name: { fontWeight: "600", marginRight: 6 },
  total: { color: "#6b7280", fontSize: 12 }
});
