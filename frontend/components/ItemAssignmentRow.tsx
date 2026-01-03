import { Pressable, StyleSheet, Text, View } from "react-native";

type Person = { id: string; name: string; color: string };
type Item = { id: string; name: string; price: number };

type Props = {
  item: Item;
  people: Person[];
  assignedTo: string[];
  onToggle: (personId: string) => void;
};

export default function ItemAssignmentRow({ item, people, assignedTo, onToggle }: Props) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.chips}>
        {people.map((person) => {
          const active = assignedTo.includes(person.id);
          return (
            <Pressable
              key={person.id}
              onPress={() => onToggle(person.id)}
              style={[
                styles.chip,
                { borderColor: person.color, backgroundColor: active ? person.color : "#fff" }
              ]}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : "#111827" }]}>
                {person.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  name: { fontWeight: "700", fontSize: 16 },
  price: { color: "#6b7280", fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontWeight: "600" }
});
