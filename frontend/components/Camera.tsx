import { useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image } from "react-native";

export default function Camera({ onPhotoTaken }: { onPhotoTaken: (photo: any) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoResult = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false,
        });
        setPhoto(photoResult);
        onPhotoTaken(photoResult);
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const retakePicture = () => {
    setPhoto(null);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}>
            <Text style={styles.flipButtonText}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "#fff",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 10,
    borderRadius: 8,
    margin: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  flipButton: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 10,
    borderRadius: 20,
  },
  flipButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff0000",
  },
  placeholder: {
    width: 80,
  },
  preview: {
    flex: 1,
  },
  previewActions: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  retakeButton: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
