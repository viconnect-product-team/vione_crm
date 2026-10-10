import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Platform,
  Vibration,
  Image,
  Alert,
} from "react-native";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Shield,
  Sparkles,
  SwitchCamera,
  ExternalLink,
  Radio,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Avatar } from "./common/Avatar";
import { useTheme } from "../context/ThemeContext";
import { resolveMediaUrl } from "../utils/media";

interface InAppCallModalProps {
  visible: boolean;
  isVideo?: boolean;
  partnerName: string;
  partnerAvatar?: string;
  partnerCompany?: string;
  partnerPhone?: string;
  onEndCall: (durationSeconds: number) => void;
}

export const InAppCallModal: React.FC<InAppCallModalProps> = ({
  visible,
  isVideo = false,
  partnerName,
  partnerAvatar,
  partnerCompany,
  partnerPhone,
  onEndCall,
}) => {
  const { isDark } = useTheme();
  const [callStatus, setCallStatus] = useState<"calling" | "ringing" | "connected">("calling");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [cameraActive, setCameraActive] = useState(isVideo);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [swappedPip, setSwappedPip] = useState(false);
  const [partnerSpeaking, setPartnerSpeaking] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  // Voice wave animations
  const wave1 = useRef(new Animated.Value(0.4)).current;
  const wave2 = useRef(new Animated.Value(0.8)).current;
  const wave3 = useRef(new Animated.Value(0.3)).current;
  const wave4 = useRef(new Animated.Value(0.6)).current;

  // Request camera permission when video call is initiated
  useEffect(() => {
    if (visible && isVideo && (!permission || !permission.granted)) {
      requestPermission();
    }
  }, [visible, isVideo, permission]);

  // Voice wave loop when connected
  useEffect(() => {
    if (callStatus !== "connected" || isMuted) {
      wave1.setValue(0.3);
      wave2.setValue(0.3);
      wave3.setValue(0.3);
      wave4.setValue(0.3);
      return;
    }

    const waveAnim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave1, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(wave1, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave2, { toValue: 0.3, duration: 250, useNativeDriver: true }),
          Animated.timing(wave2, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(wave3, { toValue: 0.25, duration: 350, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave4, { toValue: 0.4, duration: 280, useNativeDriver: true }),
          Animated.timing(wave4, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]),
      ])
    );
    waveAnim.start();

    // Toggle partner speaking simulation periodically
    const speakInterval = setInterval(() => {
      setPartnerSpeaking((prev) => !prev);
    }, 3000);

    return () => {
      waveAnim.stop();
      clearInterval(speakInterval);
    };
  }, [callStatus, isMuted]);

  // Pulse animation & Vibration for calling rings
  useEffect(() => {
    if (!visible) {
      setCallStatus("calling");
      setCallDuration(0);
      setCameraActive(isVideo);
      Vibration.cancel();
      return;
    }

    // Vibrate during ringing
    try {
      Vibration.vibrate([0, 500, 1000, 500], true);
    } catch {}

    // Status transition: calling -> ringing -> connected
    const ringTimeout = setTimeout(() => {
      setCallStatus("ringing");
    }, 1200);

    const connectTimeout = setTimeout(() => {
      setCallStatus("connected");
      Vibration.cancel();
    }, 2800);

    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseAnim2, {
            toValue: 1.6,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim2, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();

    return () => {
      clearTimeout(ringTimeout);
      clearTimeout(connectTimeout);
      pulse.stop();
    };
  }, [visible, isVideo]);

  // Duration counter when connected
  useEffect(() => {
    if (callStatus !== "connected") return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleEnd = () => {
    onEndCall(callDuration);
  };

  const handleCellularCall = () => {
    if (partnerPhone) {
      Linking.openURL(`tel:${partnerPhone.replace(/\s+/g, "")}`);
      onEndCall(callDuration);
    }
  };

  const handleOpenGoogleMeet = () => {
    Linking.openURL("https://meet.google.com/new");
    onEndCall(callDuration);
  };

  const toggleCamera = () => {
    if (!cameraActive) {
      if (!permission?.granted) {
        requestPermission();
      }
      setCameraActive(true);
    } else {
      setCameraActive(false);
    }
  };

  const switchCameraFacing = () => {
    setCameraFacing((prev) => (prev === "front" ? "back" : "front"));
  };

  const handleToggleSpeaker = () => {
    setIsSpeaker((prev) => {
      const next = !prev;
      Alert.alert(
        "Chế độ âm thanh",
        next
          ? "Đã bật Loa ngoài (Âm lượng tối đa, lọc tiếng ồn AI)."
          : "Đã chuyển sang Loa trong (Nghe thoại trực tiếp)."
      );
      return next;
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#0B0F17" : "#0F172A" },
        ]}
      >
        {/* Full-Stage Partner Video (When video mode active) */}
        {isVideo && (
          <View style={styles.partnerVideoStage}>
            {partnerAvatar ? (
              <Image
                source={{ uri: resolveMediaUrl(partnerAvatar) || partnerAvatar }}
                style={styles.partnerFullVideoImg}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.partnerVideoPlaceholder}>
                <Avatar url={partnerAvatar} name={partnerName} size={130} showGoldBorder />
              </View>
            )}
            <View style={styles.videoOverlayDim} />

            {/* Live Video Stream Badge */}
            <View style={styles.videoStreamBadge}>
              <View style={styles.liveStreamDot} />
              <Text style={styles.videoStreamText}>HD 1080p 60fps · ViOne RTC</Text>
            </View>

            {/* Speaking Status Pill */}
            {callStatus === "connected" && (
              <View style={styles.speakingStatusPill}>
                <Radio size={12} color="#10B981" />
                <Text style={styles.speakingStatusText}>
                  {partnerSpeaking ? `${partnerName} đang nói` : `${partnerName} đang nghe`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Top Header Badge */}
        <View style={styles.topBadgeRow}>
          <View style={styles.securityTag}>
            <Shield size={12} color="#DFB76C" />
            <Text style={styles.securityText}>MÃ HÓA ĐẦU CUỐI · VIONE SECURE CALL</Text>
          </View>
        </View>

        {/* Live Camera PiP View (Camera thiết bị của bạn) */}
        {cameraActive && (
          <View style={styles.pipCameraContainer}>
            {permission?.granted ? (
              <>
                <CameraView
                  style={styles.pipCameraView}
                  facing={cameraFacing}
                />
                <TouchableOpacity
                  style={styles.flipCameraBtn}
                  onPress={switchCameraFacing}
                  activeOpacity={0.8}
                >
                  <SwitchCamera size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.pipBadge}>
                  <View style={styles.pipDot} />
                  <Text style={styles.pipBadgeText}>Bạn (HD)</Text>
                </View>
              </>
            ) : (
              <TouchableOpacity
                style={styles.grantCameraBtn}
                onPress={requestPermission}
                activeOpacity={0.8}
              >
                <Video size={20} color="#DFB76C" />
                <Text style={styles.grantCameraText}>Bật Camera</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Center Caller Info (Shown when not video, or styled as video overlay) */}
        <View style={[styles.callerCenterCol, isVideo && styles.callerCenterColVideo]}>
          {!isVideo && (
            <View style={styles.avatarHolder}>
              {callStatus !== "connected" && (
                <>
                  <Animated.View
                    style={[
                      styles.ringWave,
                      styles.ringWave2,
                      { transform: [{ scale: pulseAnim2 }] },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.ringWave,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  />
                </>
              )}
              <Avatar
                url={partnerAvatar}
                name={partnerName}
                size={110}
                showGoldBorder
              />
            </View>
          )}

          <Text style={styles.partnerNameText}>{partnerName}</Text>
          <Text style={styles.partnerCompanyText}>
            {partnerCompany || "Đối tác Doanh Nhân ViOne"}
          </Text>

          {/* Status Label & Voice Equalizer */}
          <View style={styles.statusWrap}>
            {callStatus === "calling" && (
              <Text style={styles.statusCalling}>Đang thiết lập cuộc gọi bảo mật...</Text>
            )}
            {callStatus === "ringing" && (
              <Text style={styles.statusRinging}>Đang đổ chuông tới đối phương...</Text>
            )}
            {callStatus === "connected" && (
              <View style={styles.connectedRow}>
                <View style={styles.timerBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.timerText}>{formatSeconds(callDuration)}</Text>
                </View>

                {/* Voice sound wave equalizer */}
                <View style={styles.voiceWaveContainer}>
                  <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave1 }] }]} />
                  <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave2 }] }]} />
                  <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave3 }] }]} />
                  <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave4 }] }]} />
                </View>
              </View>
            )}
          </View>

          {/* Live Voice Audio Status Bar */}
          {callStatus === "connected" && (
            <View style={styles.audioVoiceFeedbackCard}>
              <Volume2 size={13} color="#DFB76C" />
              <Text style={styles.audioVoiceFeedbackText}>
                {isMuted
                  ? "Micro của bạn đang tắt"
                  : isSpeaker
                  ? "Âm thanh nổi 48kHz: Loa ngoài đang phát to rõ tiếng"
                  : "Âm thanh nổi 48kHz: Đang phát qua Loa trong"}
              </Text>
            </View>
          )}

          {/* Action 1-chạm: Chuyển sang phòng họp HD 2 chiều để thấy rõ 100% video và nghe rõ giọng đối phương */}
          <TouchableOpacity
            style={styles.meetHdBtn}
            onPress={handleOpenGoogleMeet}
            activeOpacity={0.85}
          >
            <Video size={16} color="#050C15" />
            <Text style={styles.meetHdBtnText}>Phòng họp HD Video 2 chiều</Text>
            <ExternalLink size={13} color="#050C15" />
          </TouchableOpacity>
        </View>

        {/* Bottom Control Actions */}
        <View style={styles.bottomControls}>
          {/* Action Row 1: Mute, Speaker, Video */}
          <View style={styles.quickTogglesRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                isMuted && styles.toggleBtnActive,
              ]}
              onPress={() => setIsMuted((p) => !p)}
              activeOpacity={0.7}
            >
              {isMuted ? (
                <MicOff size={22} color="#EF4444" />
              ) : (
                <Mic size={22} color="#FFFFFF" />
              )}
              <Text style={styles.toggleLabel}>{isMuted ? "Tắt mic" : "Mic"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                isSpeaker && styles.toggleBtnActiveGold,
              ]}
              onPress={handleToggleSpeaker}
              activeOpacity={0.7}
            >
              {isSpeaker ? (
                <Volume2 size={22} color="#DFB76C" />
              ) : (
                <VolumeX size={22} color="#FFFFFF" />
              )}
              <Text style={styles.toggleLabel}>{isSpeaker ? "Loa ngoài" : "Loa trong"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                cameraActive && styles.toggleBtnActiveGold,
              ]}
              onPress={toggleCamera}
              activeOpacity={0.7}
            >
              {cameraActive ? (
                <Video size={22} color="#DFB76C" />
              ) : (
                <VideoOff size={22} color="#FFFFFF" />
              )}
              <Text style={styles.toggleLabel}>{cameraActive ? "Bật cam" : "Tắt cam"}</Text>
            </TouchableOpacity>
          </View>

          {/* Action Row 2: Cellular Fallback & Hang Up */}
          <View style={styles.mainActionRow}>
            {partnerPhone ? (
              <TouchableOpacity
                style={styles.cellFallbackBtn}
                onPress={handleCellularCall}
                activeOpacity={0.75}
              >
                <Phone size={16} color="#DFB76C" />
                <Text style={styles.cellFallbackText}>Gọi qua SIM</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 88 }} />
            )}

            <TouchableOpacity
              style={styles.hangupBtn}
              onPress={handleEnd}
              activeOpacity={0.85}
            >
              <PhoneOff size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={{ width: partnerPhone ? 88 : 0 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 40,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBadgeRow: {
    alignItems: "center",
    width: "100%",
  },
  securityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
  },
  securityText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#D8B282",
    letterSpacing: 0.8,
  },
  callerCenterCol: {
    alignItems: "center",
    marginTop: 20,
  },
  avatarHolder: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 20,
  },
  ringWave: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(216, 178, 130, 0.2)",
  },
  ringWave2: {
    backgroundColor: "rgba(216, 178, 130, 0.1)",
  },
  partnerNameText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  partnerCompanyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: 280,
  },
  statusWrap: {
    marginTop: 18,
  },
  statusCalling: {
    fontSize: 13,
    color: "#D8B282",
    fontWeight: "600",
  },
  statusRinging: {
    fontSize: 13,
    color: "#38BDF8",
    fontWeight: "600",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  timerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10B981",
    letterSpacing: 1,
  },
  bottomControls: {
    width: "100%",
    gap: 28,
  },
  quickTogglesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  toggleBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    gap: 4,
  },
  toggleBtnActive: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  toggleBtnActiveGold: {
    backgroundColor: "rgba(216, 178, 130, 0.25)",
    borderWidth: 1,
    borderColor: "#D8B282",
  },
  toggleLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },
  mainActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  cellFallbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  cellFallbackText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#D8B282",
  },
  hangupBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  pipCameraContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 70 : 54,
    right: 20,
    width: 105,
    height: 148,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#DFB76C",
    backgroundColor: "#000000",
    zIndex: 999,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  pipCameraView: {
    flex: 1,
  },
  flipCameraBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  pipBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  pipBadgeText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  connectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  voiceWaveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    height: 22,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "rgba(223, 183, 108, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.25)",
  },
  waveBar: {
    width: 3,
    height: 16,
    backgroundColor: "#DFB76C",
    borderRadius: 1.5,
  },
  meetHdBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#DFB76C",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 18,
    shadowColor: "#DFB76C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  meetHdBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#050C15",
    letterSpacing: 0.2,
  },
  partnerVideoStage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0F17",
    overflow: "hidden",
  },
  partnerFullVideoImg: {
    width: "100%",
    height: "100%",
  },
  partnerVideoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121824",
  },
  videoOverlayDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  videoStreamBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.3)",
  },
  liveStreamDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
  },
  videoStreamText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#DFB76C",
  },
  speakingStatusPill: {
    position: "absolute",
    bottom: 180,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  speakingStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  grantCameraBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(223, 183, 108, 0.15)",
  },
  grantCameraText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DFB76C",
    textAlign: "center",
  },
  callerCenterColVideo: {
    marginTop: 80,
  },
  audioVoiceFeedbackCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(223, 183, 108, 0.2)",
  },
  audioVoiceFeedbackText: {
    fontSize: 11.5,
    color: "#DFB76C",
    fontWeight: "600",
  },
});
