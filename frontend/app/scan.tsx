import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View, Alert } from "react-native";
import Camera from "../components/Camera";
import * as ImagePicker from "expo-image-picker";

export default function ScanScreen() {
  const router = useRouter();
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoTaken = (photo: any) => {
    setCapturedPhoto(photo);
  };

  const handleUsePhoto = async () => {
    if (!capturedPhoto) {
      Alert.alert("No Photo", "Please take a photo first");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert("Success", "Receipt processed successfully!", [
        { text: "OK", onPress: () => router.push("/assign") }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to process receipt");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedPhoto(result.assets[0]);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Scan your receipt</Text>
      
      {!capturedPhoto ? (
        <Camera onPhotoTaken={handlePhotoTaken} />
      ) : (
        <View style={styles.photoPreview}>
          <Text style={styles.previewTitle}>Photo captured</Text>
          <Text style={styles.previewSubtitle}>Tap below to use this photo or retake</Text>
        </View>
      )}
      
      <View style={styles.actions}>
        {capturedPhoto ? (
          <>
            <Pressable 
              style={[styles.primary, isProcessing && styles.disabledButton]} 
              onPress={handleUsePhoto}
              disabled={isProcessing}
            >
              <Text style={styles.primaryText}>
                {isProcessing ? "Processing..." : "Use this photo"}
              </Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={handleRetake}>
              <Text style={styles.secondaryText}>Retake photo</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.secondary} onPress={handlePickImage}>
            <Text style={styles.secondaryText}>Choose from gallery</Text>
          </Pressable>
        )}
        <Text style={styles.helper}>Demo mode: Using simulated OCR processing</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  actions: { marginTop: 16, gap: 8 },
  primary: { backgroundColor: "#111827", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  disabledButton: { backgroundColor: "#9ca3af" },
  primaryText: { color: "#fff", fontWeight: "600" },
  secondary: { backgroundColor: "#f3f4f6", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  secondaryText: { color: "#111827", fontWeight: "600" },
  helper: { color: "#6b7280", fontSize: 14, textAlign: "center" },
  photoPreview: {
    height: 320,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  previewTitle: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 8 },
  previewSubtitle: { fontSize: 14, color: "#6b7280", textAlign: "center" }
});
