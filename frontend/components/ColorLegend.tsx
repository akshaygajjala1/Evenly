import { StyleSheet, Text, View } from "react-native";

type Person = { id: string; name: string; color: string };

export default function ColorLegend({ people }: { people: Person[] }) {
  return (
    <View style={styles.container}>
      {people.map((person) => (
        <View key={person.id} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: person.color }]} />
          <Text style={styles.name}>{person.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontWeight: "500" }
});
