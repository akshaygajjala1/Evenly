const React = require("react");
const { ActivityIndicator, View, StyleSheet } = require("react-native");

function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});

module.exports = LoadingView;
