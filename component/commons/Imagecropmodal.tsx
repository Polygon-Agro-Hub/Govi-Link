import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  StyleSheet,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import { useTranslation } from "react-i18next";

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;

  aspect?: number;
}

const { width: SCREEN_W } = Dimensions.get("window");
const STAGE_SIZE = Math.min(SCREEN_W - 32, 360);
const MIN_FRAME_SIZE = 60;
const HANDLE_HIT_SIZE = 32;

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  imageUri,
  onCancel,
  onConfirm,
  aspect = 1,
}) => {
  const { t } = useTranslation();

  const [workingUri, setWorkingUri] = useState<string | null>(imageUri);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [displayW, setDisplayW] = useState(0);
  const [displayH, setDisplayH] = useState(0);
  const [processing, setProcessing] = useState(false);

  const [, forceRerender] = useState(0);
  const rerender = () => forceRerender((n) => n + 1);

  const displayWRef = useRef(0);
  const displayHRef = useRef(0);
  const setDisplaySize = (w: number, h: number) => {
    displayWRef.current = w;
    displayHRef.current = h;
    setDisplayW(w);
    setDisplayH(h);
  };

  const framePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const frameSize = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStart = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const resetFrame = (dW: number, dH: number) => {
    const base = Math.min(dW, dH) * 0.8;
    const width = aspect >= 1 ? base : base * aspect;
    const height = aspect >= 1 ? base / aspect : base;
    frameSize.current = { width, height };
    framePos.current = {
      x: (STAGE_SIZE - width) / 2,
      y: (STAGE_SIZE - height) / 2,
    };
  };

  useEffect(() => {
    if (visible && imageUri) {
      setWorkingUri(imageUri);
      Image.getSize(
        imageUri,
        (w, h) => {
          setNaturalW(w);
          setNaturalH(h);
          const scale = Math.min(STAGE_SIZE / w, STAGE_SIZE / h);
          const dW = w * scale;
          const dH = h * scale;
          setDisplaySize(dW, dH);
          resetFrame(dW, dH);
          rerender();
        },
        () => {
          setNaturalW(0);
          setNaturalH(0);
        },
      );
    }
  }, [visible, imageUri]);

  const movePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.current = { x: framePos.current.x, y: framePos.current.y };
      },
      onPanResponderMove: (_evt, gestureState) => {
        const dW = displayWRef.current;
        const dH = displayHRef.current;
        const { width: fW, height: fH } = frameSize.current;
        const stageLeft = (STAGE_SIZE - dW) / 2;
        const stageTop = (STAGE_SIZE - dH) / 2;

        let nextX = dragStart.current.x + gestureState.dx;
        let nextY = dragStart.current.y + gestureState.dy;

        const maxX = Math.max(stageLeft, stageLeft + dW - fW);
        const maxY = Math.max(stageTop, stageTop + dH - fH);
        nextX = Math.min(Math.max(nextX, stageLeft), maxX);
        nextY = Math.min(Math.max(nextY, stageTop), maxY);

        framePos.current = { x: nextX, y: nextY };
        rerender();
      },
    }),
  ).current;

  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStart.current = {
          width: frameSize.current.width,
          height: frameSize.current.height,
        };
      },
      onPanResponderMove: (_evt, gestureState) => {
        const dW = displayWRef.current;
        const dH = displayHRef.current;
        const stageLeft = (STAGE_SIZE - dW) / 2;
        const stageTop = (STAGE_SIZE - dH) / 2;

        const delta = (gestureState.dx + gestureState.dy) / 2;
        let newWidth = resizeStart.current.width + delta;

        const maxWidthFromRight = stageLeft + dW - framePos.current.x;
        const maxHeightFromBottom = stageTop + dH - framePos.current.y;
        const maxWidth = Math.min(
          maxWidthFromRight,
          maxHeightFromBottom * aspect,
        );

        newWidth = Math.min(Math.max(newWidth, MIN_FRAME_SIZE), maxWidth);
        const newHeight = newWidth / aspect;

        frameSize.current = { width: newWidth, height: newHeight };
        rerender();
      },
    }),
  ).current;

  const handleRotate = async () => {
    if (!workingUri) return;
    try {
      setProcessing(true);
      const result = await ImageManipulator.manipulateAsync(
        workingUri,
        [{ rotate: 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
      );
      setWorkingUri(result.uri);

      const newW = naturalH;
      const newH = naturalW;
      setNaturalW(newW);
      setNaturalH(newH);
      const scale = Math.min(STAGE_SIZE / newW, STAGE_SIZE / newH);
      const dW = newW * scale;
      const dH = newH * scale;
      setDisplaySize(dW, dH);
      resetFrame(dW, dH);
      rerender();
    } catch (error) {
      console.error("Rotate failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleFlip = async () => {
    if (!workingUri) return;
    try {
      setProcessing(true);
      const result = await ImageManipulator.manipulateAsync(
        workingUri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
      );
      setWorkingUri(result.uri);
    } catch (error) {
      console.error("Flip failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCrop = async () => {
    if (!workingUri || displayW === 0 || displayH === 0) return;
    try {
      setProcessing(true);
      const stageLeft = (STAGE_SIZE - displayW) / 2;
      const stageTop = (STAGE_SIZE - displayH) / 2;

      const scaleX = naturalW / displayW;
      const scaleY = naturalH / displayH;
      const { width: fW, height: fH } = frameSize.current;

      const originX = Math.max(0, (framePos.current.x - stageLeft) * scaleX);
      const originY = Math.max(0, (framePos.current.y - stageTop) * scaleY);
      const cropW = Math.min(naturalW - originX, fW * scaleX);
      const cropH = Math.min(naturalH - originY, fH * scaleY);

      const result = await ImageManipulator.manipulateAsync(
        workingUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropW),
              height: Math.round(cropH),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      onConfirm(result.uri);
    } catch (error) {
      console.error("Crop failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  const fW = frameSize.current.width;
  const fH = frameSize.current.height;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {t("AddOfficer.EditPhoto") || "Edit Photo"}
          </Text>

          <View
            style={[styles.stage, { width: STAGE_SIZE, height: STAGE_SIZE }]}
          >
            {workingUri && displayW > 0 && (
              <>
                <Image
                  source={{ uri: workingUri }}
                  style={{
                    position: "absolute",
                    left: (STAGE_SIZE - displayW) / 2,
                    top: (STAGE_SIZE - displayH) / 2,
                    width: displayW,
                    height: displayH,
                  }}
                  resizeMode="contain"
                />
                {/* Dim the whole stage; the frame itself stays clear */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <View style={styles.maskOverlay} />
                </View>

                {/* Draggable / resizable crop frame */}
                <View
                  {...movePanResponder.panHandlers}
                  style={[
                    styles.cropFrame,
                    {
                      left: framePos.current.x,
                      top: framePos.current.y,
                      width: fW,
                      height: fH,
                    },
                  ]}
                >
                  {/* Resize handle, bottom-right corner */}
                  <View
                    {...resizePanResponder.panHandlers}
                    style={styles.resizeHandleHit}
                  >
                    <View style={styles.resizeHandle} />
                  </View>
                </View>
              </>
            )}
            {processing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            )}
          </View>

          <Text style={styles.hint}>
            {t("AddOfficer.DragToReposition") ||
              "Drag inside the frame to move it, drag the corner to resize"}
          </Text>

          {/* Action icons: Rotate, Flip, Crop */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRotate}
              disabled={processing}
            >
              <MaterialIcons
                name="rotate-90-degrees-ccw"
                size={26}
                color="#21202B"
              />
              <Text style={styles.actionLabel}>
                {t("AddOfficer.Rotate") || "Rotate"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFlip}
              disabled={processing}
            >
              <MaterialIcons name="flip" size={26} color="#21202B" />
              <Text style={styles.actionLabel}>
                {t("AddOfficer.Flip") || "Flip"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCrop}
              disabled={processing}
            >
              <MaterialIcons name="crop" size={26} color="#21202B" />
              <Text style={styles.actionLabel}>
                {t("AddOfficer.Crop") || "Crop"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>
                {t("AddOfficer.Cancel") || "Cancel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#21202B",
    marginBottom: 12,
  },
  stage: {
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  maskOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cropFrame: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  resizeHandleHit: {
    position: "absolute",
    right: -HANDLE_HIT_SIZE / 2,
    bottom: -HANDLE_HIT_SIZE / 2,
    width: HANDLE_HIT_SIZE,
    height: HANDLE_HIT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  resizeHandle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#21202B",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 12,
    color: "#7D7D7D",
    marginTop: 8,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionLabel: {
    fontSize: 12,
    color: "#21202B",
    marginTop: 4,
  },
  bottomRow: {
    width: "100%",
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: "#D9D9D9",
    borderRadius: 24,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#686868",
    fontSize: 15,
    fontWeight: "500",
  },
});

export default ImageCropModal;
