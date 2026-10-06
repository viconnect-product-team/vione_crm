import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Handshake,
  Sparkles,
  Video,
} from "lucide-react-native";
import { apiRequest } from "../api/client";

export interface OpportunityMeetingData {
  opportunityId?: string;
  opportunityTitle?: string;
  meetingTime?: string;
  date?: string;
  time?: string;
  format?: "offline" | "online";
  location?: string;
  note?: string;
  status?: "pending" | "accepted" | "declined";
  proposerName?: string;
  posterName?: string;
}

export interface OpportunityMeetingProposalCardProps {
  data: OpportunityMeetingData;
  isFromMe: boolean;
  messageId: string;
  onStatusChange?: (newStatus: "accepted" | "declined") => void;
}

export const OpportunityMeetingProposalCard: React.FC<OpportunityMeetingProposalCardProps> = ({
  data,
  isFromMe,
  messageId,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">(
    data.status || "pending"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRespond = async (action: "accept" | "decline") => {
    setIsProcessing(true);
    const newStatus = action === "accept" ? "accepted" : "declined";

    try {
      await apiRequest("connect-app/meetings/respond", {
        method: "POST",
        body: {
          messageId,
          opportunityId: data.opportunityId,
          action,
        },
      }).catch(async () => {
        await apiRequest("meetings/respond", {
          method: "POST",
          body: { messageId, action },
        }).catch(() => {});
      });

      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);

      if (action === "accept") {
        Alert.alert(
          "Thành công",
          "Đã đồng ý cuộc hẹn trao đổi cơ hội! Cuộc gặp đã được tự động thêm vào Lịch cuộc gặp ở Trang chủ."
        );
      } else {
        Alert.alert("Thông báo", "Đã từ chối đề xuất cuộc hẹn này.");
      }
    } catch {
      Alert.alert("Lỗi", "Không thể xử lý yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Banner */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Handshake size={15} color="#D8B282" />
          <Text style={styles.headerTitle}>ĐỀ XUẤT HẸN GẶP B2B</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            status === "accepted"
              ? styles.badgeAccepted
              : status === "declined"
              ? styles.badgeDeclined
              : styles.badgePending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              status === "accepted"
                ? styles.textAccepted
                : status === "declined"
                ? styles.textDeclined
                : styles.textPending,
            ]}
          >
            {status === "accepted"
              ? "ĐÃ ĐỒNG Ý"
              : status === "declined"
              ? "ĐÃ TỪ CHỐI"
              : "CHỜ XÁC NHẬN"}
          </Text>
        </View>
      </View>

      {/* Opportunity Title */}
      <View style={styles.bodyContent}>
        <View style={styles.titleRow}>
          <Sparkles size={14} color="#D8B282" style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.opportunityTitle}>
            {data.opportunityTitle || "Trao đổi cơ hội hợp tác kinh doanh"}
          </Text>
        </View>

        {/* Time & Date */}
        <View style={styles.infoRow}>
          <CalendarDays size={13} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.infoText}>
            {data.time || "09:30"} · {data.date ? new Date(data.date).toLocaleDateString("vi-VN") : "Hôm nay"}
          </Text>
        </View>

        {/* Location & Format */}
        <View style={styles.infoRow}>
          {data.format === "online" ? (
            <Video size={13} color="#D8B282" style={{ marginRight: 6 }} />
          ) : (
            <MapPin size={13} color="#D8B282" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.infoText} numberOfLines={1}>
            {data.location || (data.format === "online" ? "Google Meet Trực Tuyến" : "Văn phòng doanh nghiệp")}
          </Text>
        </View>

        {/* Note if any */}
        {data.note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>"{data.note}"</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons or Status Footer */}
      <View style={styles.actionFooter}>
        {status === "pending" ? (
          !isFromMe ? (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => handleRespond("decline")}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <XCircle size={14} color="#94A3B8" style={{ marginRight: 4 }} />
                <Text style={styles.declineBtnText}>Từ chối</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtnTouch}
                onPress={() => handleRespond("accept")}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.acceptBtnGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#050811" />
                  ) : (
                    <>
                      <CheckCircle2 size={14} color="#050811" style={{ marginRight: 4 }} />
                      <Text style={styles.acceptBtnText}>Đồng ý hẹn</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.fromMePendingText}>
              Đã gửi đề xuất hẹn gặp. Đang chờ đối tác xác nhận...
            </Text>
          )
        ) : status === "accepted" ? (
          <View style={styles.resultRow}>
            <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.resultAcceptedText}>
              Cuộc hẹn đã được xác nhận và ghim vào Lịch hôm nay
            </Text>
          </View>
        ) : (
          <View style={styles.resultRow}>
            <XCircle size={14} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.resultDeclinedText}>Đã từ chối cuộc hẹn này</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 8,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.35)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(216, 178, 130, 0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 178, 130, 0.2)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D8B282",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  badgeAccepted: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  badgeDeclined: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  textPending: {
    color: "#F59E0B",
  },
  textAccepted: {
    color: "#10B981",
  },
  textDeclined: {
    color: "#EF4444",
  },
  bodyContent: {
    padding: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  opportunityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    lineHeight: 19,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: "#94A3B8",
    flex: 1,
  },
  noteBox: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderLeftWidth: 2,
    borderLeftColor: "#D8B282",
  },
  noteText: {
    fontSize: 11.5,
    color: "#D4C3A3",
    fontStyle: "italic",
    lineHeight: 16,
  },
  actionFooter: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  declineBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  acceptBtnTouch: {
    flex: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  acceptBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#050811",
  },
  fromMePendingText: {
    fontSize: 11.5,
    color: "#94A3B8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 4,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  resultAcceptedText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#10B981",
  },
  resultDeclinedText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#EF4444",
  },
});
