import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Share2,
  CalendarPlus,
  QrCode,
  ShieldCheck,
  Award,
  ChevronRight,
  Info,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { B2BEvent } from "../types";
import { eventsApi } from "../api/services";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface EventDetailModalProps {
  visible: boolean;
  event: B2BEvent | null;
  onClose: () => void;
  onRegisterToggle?: (eventId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  visible,
  event,
  onClose,
  onRegisterToggle,
}) => {
  const [isRegistered, setIsRegistered] = useState(event?.isRegistered ?? false);

  if (!event) return null;

  const handleRegister = () => {
    const nextState = !isRegistered;
    setIsRegistered(nextState);
    if (onRegisterToggle) {
      onRegisterToggle(event.id);
    }

    if (nextState) {
      eventsApi.registerEvent(event.id).catch((err) =>
        console.warn("Lỗi đăng ký sự kiện lên API:", err)
      );
      Alert.alert(
        "Đăng ký thành công",
        `Bạn đã nhận vé mời VIP tham gia: ${event.title}.\nMã vé QR đã được kích hoạt trên hệ thống ViOne.`
      );
    } else {
      eventsApi.cancelEventRegistration(event.id).catch((err) =>
        console.warn("Lỗi hủy đăng ký sự kiện:", err)
      );
      Alert.alert("Hủy đăng ký", "Bạn đã hủy đăng ký tham gia sự kiện này.");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Kính mời Quý Doanh nghiệp tham gia sự kiện: ${event.title}\nThời gian: ${event.startsAt}\nĐịa điểm: ${event.location}\nĐăng ký qua ViOne Connect: https://vione.vn/events/${event.id}`,
      });
    } catch (err) {
      // Ignored
    }
  };

  const handleAddToCalendar = () => {
    Alert.alert(
      "Đã thêm vào lịch",
      `Sự kiện "${event.title}" đã được đồng bộ vào lịch làm việc trên thiết bị của bạn.`
    );
  };

  const ticketCode = `VIONE-TICKET-${event.id.toUpperCase()}-2026`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{event.category || "Hội Nghị C-Level"}</Text>
              </View>
              <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.85 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Banner Card */}
            <View style={styles.bannerWrapper}>
              <LinearGradient
                colors={["#151D2C", "#0E1522", "#070B12"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerTopRow}>
                  <View style={styles.liveTag}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>SỰ KIỆN DOANH NGHIỆP ĐỈNH CAO</Text>
                  </View>
                  <Text style={styles.registeredCount}>
                    🔥 {event.registeredCount || 120} C-Level đăng ký
                  </Text>
                </View>

                <Text style={styles.eventTitle}>{event.title}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color="#D8B282" style={{ marginRight: 6 }} />
                    <Text style={styles.metaText}>{event.startsAt}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color="#D8B282" style={{ marginRight: 6 }} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {event.location}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* VIP Dynamic QR Ticket Badge if Registered */}
            {isRegistered && (
              <View style={styles.ticketCard}>
                <LinearGradient
                  colors={["rgba(216, 178, 130, 0.15)", "rgba(10, 10, 11, 0.95)"]}
                  style={styles.ticketGradient}
                >
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketBadgeRow}>
                      <ShieldCheck size={16} color="#D8B282" style={{ marginRight: 6 }} />
                      <Text style={styles.ticketBadgeText}>VÉ MỜI VIP ĐÃ XÁC THỰC</Text>
                    </View>
                    <View style={styles.verifiedTag}>
                      <Text style={styles.verifiedTagText}>HỢP LỆ</Text>
                    </View>
                  </View>

                  <View style={styles.qrSection}>
                    <View style={styles.qrBox}>
                      <QrCode size={110} color="#050C15" />
                    </View>
                    <View style={styles.qrMeta}>
                      <Text style={styles.ticketCodeLabel}>MÃ CHECK-IN TẠI QUẦY:</Text>
                      <Text style={styles.ticketCodeValue}>{ticketCode}</Text>
                      <Text style={styles.ticketNote}>
                        Xuất trình mã QR tại cửa đón tiếp hoặc chạm thẻ NFC ViOne để vào khán phòng.
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Agenda Timeline */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Clock size={16} color="#D8B282" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>CHƯƠNG TRÌNH & NGHỊ TRÌNH (AGENDA)</Text>
              </View>

              <View style={styles.timelineList}>
                <View style={styles.timelineItem}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>08:30</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.agendaItemTitle}>Đón tiếp C-Level & Check-in QR</Text>
                    <Text style={styles.agendaItemDesc}>
                      Trà cà phê sáng, trao đổi danh thiếp số ViOne tại Executive Lounge
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>09:00</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.agendaItemTitle}>Khai mạc & Keynote Xu hướng B2B 2026</Text>
                    <Text style={styles.agendaItemDesc}>
                      Báo cáo thị trường, chuỗi giá trị toàn cầu và động lực tăng trưởng mới
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>10:15</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.agendaItemTitle}>Tọa đàm Xúc tiến Hợp tác & Ký kết B2B</Text>
                    <Text style={styles.agendaItemDesc}>
                      Giao lưu cùng Chủ tịch các Tập đoàn hàng đầu, cơ hội liên danh dự án
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>11:30</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.agendaItemTitle}>Tiệc giao thương & Kết nối 1-on-1</Text>
                    <Text style={styles.agendaItemDesc}>
                      Thảo luận chuyên sâu theo từng bàn ngành nghề và khớp nối nhu cầu
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Venue & Location Details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <MapPin size={16} color="#D8B282" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>ĐỊA ĐIỂM TỔ CHỨC</Text>
              </View>

              <Text style={styles.venueName}>{event.location}</Text>
              <Text style={styles.venueAddress}>
                Sảnh Grand Ballroom · Tầng 2 · Khu vực đỗ xe VIP miễn phí cho Doanh nhân ViOne
              </Text>

              <View style={styles.venueActionsRow}>
                <TouchableOpacity
                  style={styles.venueActionBtn}
                  onPress={() => Alert.alert("Chỉ đường", `Mở định vị tới: ${event.location}`)}
                  activeOpacity={0.8}
                >
                  <MapPin size={14} color="#D8B282" style={{ marginRight: 6 }} />
                  <Text style={styles.venueActionText}>Chỉ đường Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.venueActionBtn}
                  onPress={handleAddToCalendar}
                  activeOpacity={0.8}
                >
                  <CalendarPlus size={14} color="#D8B282" style={{ marginRight: 6 }} />
                  <Text style={styles.venueActionText}>Thêm vào lịch</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Share Action */}
            <TouchableOpacity style={styles.shareRowBtn} onPress={handleShare} activeOpacity={0.8}>
              <Share2 size={16} color="#D8B282" style={{ marginRight: 8 }} />
              <Text style={styles.shareRowText}>Chia sẻ thông tin sự kiện với đối tác</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.bottomFooter}>
            <TouchableOpacity
              style={[styles.mainActionBtn, isRegistered && styles.mainActionBtnRegistered]}
              onPress={handleRegister}
              activeOpacity={0.88}
            >
              {isRegistered ? (
                <View style={styles.btnContentRow}>
                  <CheckCircle size={18} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={styles.mainActionTextRegistered}>Đã có vé mời VIP (Chạm để hủy)</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.goldBtnGradient}
                >
                  <Text style={styles.mainActionText}>Đăng ký tham gia ngay (Vé mời VIP)</Text>
                </LinearGradient>
              )}
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#0B0F17",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.25)",
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D8B282",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  bannerWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    overflow: "hidden",
    marginBottom: 16,
  },
  bannerGradient: {
    padding: 18,
  },
  bannerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.5,
  },
  registeredCount: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    lineHeight: 25,
    marginBottom: 14,
  },
  metaRow: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    color: "#E2E8F0",
    fontWeight: "500",
    flex: 1,
  },
  ticketCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8B282",
    overflow: "hidden",
    marginBottom: 16,
  },
  ticketGradient: {
    padding: 16,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  ticketBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.5,
  },
  verifiedTag: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10B981",
  },
  qrSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qrMeta: {
    flex: 1,
    marginLeft: 14,
  },
  ticketCodeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  ticketCodeValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#D8B282",
    marginTop: 2,
    marginBottom: 6,
  },
  ticketNote: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: "#0E1522",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.5,
  },
  timelineList: {
    gap: 14,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timeBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D8B282",
  },
  timelineContent: {
    flex: 1,
  },
  agendaItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 3,
  },
  agendaItemDesc: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 17,
  },
  venueName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 18,
    marginBottom: 14,
  },
  venueActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  venueActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216, 178, 130, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
    borderRadius: 10,
    paddingVertical: 10,
  },
  venueActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D8B282",
  },
  shareRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  shareRowText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D8B282",
  },
  bottomFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  mainActionBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  mainActionBtnRegistered: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainActionTextRegistered: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },
  goldBtnGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050C15",
  },
});
