import { StyleSheet, Text, View } from "react-native";

export default function Camera() {
  return (
    <View style={styles.frame}>
      <View style={styles.innerFrame}>
        <Text style={styles.text}>Camera preview (mock)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 320,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    backgroundColor: "#f3f4f6"
  },
  innerFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#d1d5db",
    margin: 12,
    borderRadius: 12
  },
  text: { color: "#6b7280", fontWeight: "600" }
});
