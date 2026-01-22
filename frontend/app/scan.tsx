import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View, Alert } from "react-native";
import Camera from "../components/Camera";
import * as ImagePicker from "expo-image-picker";
import { backendService, Receipt } from "../services/backend";

export default function ScanScreen() {
  const router = useRouter();
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedReceipt, setProcessedReceipt] = useState<Receipt | null>(null);

  const handlePhotoTaken = (photo: any) => {
    setCapturedPhoto(photo);
    setProcessedReceipt(null); // Reset previous receipt
  };

  const handleUsePhoto = async () => {
    if (!capturedPhoto) {
      Alert.alert("No Photo", "Please take a photo first");
      return;
    }

    setIsProcessing(true);
    try {
      // Process the receipt image using your backend OCR
      const receipt = await backendService.processReceiptImage(capturedPhoto.uri);
      setProcessedReceipt(receipt);
      
      Alert.alert(
        "Receipt Processed!", 
        `Found ${receipt.items.length} items with total $${receipt.total.toFixed(2)}`,
        [
          { text: "View Items", onPress: () => navigateToAssign(receipt) },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to process receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const navigateToAssign = (receipt: Receipt) => {
    // Store receipt data for the assign screen
    // In a real app, you'd use a state management solution
    router.push({
      pathname: "/assign",
      params: { receiptData: JSON.stringify(receipt) }
    });
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
      setProcessedReceipt(null); // Reset previous receipt
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setProcessedReceipt(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Scan your receipt</Text>
      
      {!capturedPhoto ? (
        <Camera onPhotoTaken={handlePhotoTaken} />
      ) : (
        <View style={styles.photoPreview}>
          {processedReceipt ? (
            <View style={styles.receiptSummary}>
              <Text style={styles.previewTitle}>✅ Receipt Processed</Text>
              <Text style={styles.previewSubtitle}>
                {processedReceipt.items.length} items • Total ${processedReceipt.total.toFixed(2)}
              </Text>
              <View style={styles.itemsList}>
                {processedReceipt.items.slice(0, 3).map((item) => (
                  <Text key={item.id} style={styles.itemText}>
                    • {item.name} - ${item.price.toFixed(2)}
                  </Text>
                ))}
                {processedReceipt.items.length > 3 && (
                  <Text style={styles.moreText}>+{processedReceipt.items.length - 3} more items</Text>
                )}
              </View>
              
              {/* Total Breakdown Section */}
              <View style={styles.totalBreakdown}>
                <Text style={styles.totalTitle}>💰 Total Breakdown</Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>${processedReceipt.subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax:</Text>
                  <Text style={styles.totalValue}>${processedReceipt.tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.totalRow, styles.totalRowFinal]}>
                  <Text style={styles.totalLabelFinal}>Total:</Text>
                  <Text style={styles.totalValueFinal}>${processedReceipt.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.photoCaptured}>
              <Text style={styles.previewTitle}>📸 Photo captured</Text>
              <Text style={styles.previewSubtitle}>Tap below to process with OCR</Text>
            </View>
          )}
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
                {isProcessing ? "Processing OCR..." : processedReceipt ? "Use Receipt" : "Process with OCR"}
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
        <Text style={styles.helper}>
          {processedReceipt ? "Receipt ready for item assignment" : "Using your backend OCR with pytesseract"}
        </Text>
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
  previewSubtitle: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  receiptSummary: { alignItems: "center", padding: 20 },
  itemsList: { marginTop: 16, alignItems: "flex-start" },
  itemText: { fontSize: 14, color: "#374151", marginBottom: 4 },
  moreText: { fontSize: 12, color: "#6b7280", fontStyle: "italic" },
  photoCaptured: { alignItems: "center" },
  totalBreakdown: { 
    marginTop: 20, 
    padding: 16, 
    backgroundColor: "#f8fafc", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#e2e8f0",
    width: "100%"
  },
  totalTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12, textAlign: "center" },
  totalRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 8
  },
  totalRowFinal: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0"
  },
  totalLabel: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  totalLabelFinal: { fontSize: 15, color: "#111827", fontWeight: "600" },
  totalValue: { fontSize: 14, color: "#374151", fontWeight: "500" },
  totalValueFinal: { fontSize: 16, color: "#111827", fontWeight: "700" }
});
