import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import {
  X,
  Nfc,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  Plus,
  Radio,
  Clock,
  ExternalLink,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

interface NfcTagItem {
  id: string;
  label: string;
  uid: string;
  status: "ACTIVE" | "REVOKED";
  totalTaps: number;
  lastTapAt: string;
  writtenAt: string;
}

interface NfcTagsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SAMPLE_NFC_TAGS: NfcTagItem[] = [
  {
    id: "nfc-1",
    label: "Thẻ Doanh Nhân ViOne VIP Gold (Kim Loại Mạ Vàng)",
    uid: "04:5A:2F:8A:9B:6C:80",
    status: "ACTIVE",
    totalTaps: 148,
    lastTapAt: "Hôm nay, 14:15",
    writtenAt: "10/01/2026",
  },
  {
    id: "nfc-2",
    label: "Nhãn dán NFC Mặt Lưng Điện Thoại (Titanium Slim)",
    uid: "04:3B:11:7C:2D:4E:81",
    status: "ACTIVE",
    totalTaps: 64,
    lastTapAt: "Hôm qua, 18:30",
    writtenAt: "15/02/2026",
  },
  {
    id: "nfc-3",
    label: "Thẻ Hội Nghị Thượng Đỉnh B2B (Badge Nhựa PVC)",
    uid: "04:88:99:AA:BB:CC:82",
    status: "REVOKED",
    totalTaps: 12,
    lastTapAt: "10 ngày trước",
    writtenAt: "01/03/2026",
  },
];

export const NfcTagsModal: React.FC<NfcTagsModalProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const [tags, setTags] = useState<NfcTagItem[]>(SAMPLE_NFC_TAGS);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const handleRevokeTag = (tagId: string, label: string) => {
    Alert.alert(
      "Thu hồi thẻ NFC",
      `Bạn có chắc muốn vô hiệu hoá thẻ "${label}"? Sau khi thu hồi, bất kỳ ai chạm vào thẻ này sẽ không thể xem danh tính của bạn.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Thu hồi thẻ",
          style: "destructive",
          onPress: () => {
            setTags((prev) =>
              prev.map((t) => (t.id === tagId ? { ...t, status: "REVOKED" } : t))
            );
            Alert.alert("Hoàn tất", "Đã thu hồi quyền liên kết của thẻ NFC.");
          },
        },
      ]
    );
  };

  const handleStartRename = (tag: NfcTagItem) => {
    setEditingTagId(tag.id);
    setEditingLabel(tag.label);
  };

  const handleSaveRename = (tagId: string) => {
    if (!editingLabel.trim()) {
      Alert.alert("Lỗi", "Tên gợi nhớ của thẻ không được để trống");
      return;
    }
    setTags((prev) =>
      prev.map((t) => (t.id === tagId ? { ...t, label: editingLabel.trim() } : t))
    );
    setEditingTagId(null);
  };

  const handleWriteNewNfcTag = () => {
    Alert.alert(
      "Ghi Thẻ NFC Mới",
      "Vui lòng đưa thẻ chip NFC ViOne hoặc nhãn dán NFC trắng lại gần mặt lưng điện thoại (vùng ăng-ten NFC) để ghi danh tính số.",
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Mô phỏng ghi thẻ",
          onPress: () => {
            const newTag: NfcTagItem = {
              id: "nfc-" + Date.now(),
              label: "Thẻ NFC ViOne mới ghi",
              uid: "04:E1:92:AA:77:88:" + Math.floor(Math.random() * 90 + 10),
              status: "ACTIVE",
              totalTaps: 0,
              lastTapAt: "Chưa chạm",
              writtenAt: new Date().toLocaleDateString("vi-VN"),
            };
            setTags((prev) => [newTag, ...prev]);
            Alert.alert("Thành công", "Đã lập trình và liên kết thẻ NFC mới thành công!");
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0B0F17" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Nfc size={12} color="#DFB76C" />
                <Text style={styles.badgeText}>QUẢN LÝ THIẾT BỊ PHẦN CỨNG</Text>
              </View>
              <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                Thẻ & Chip NFC Của Bạn
              </Text>
              <Text style={styles.subtitle}>
                Danh sách {tags.length} thẻ NFC vật lý đã liên kết danh tính số.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Banner hướng dẫn chạm NFC */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.08)" : "#FDF6EC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "rgba(216, 178, 130, 0.4)",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Sparkles size={14} color="#DFB76C" />
                <Text style={styles.infoTitle}>Công nghệ Chạm 1 Giây (Tap to Connect)</Text>
              </View>
              <Text style={styles.infoText}>
                Khi chạm thẻ vào điện thoại đối tác (iOS hoặc Android), hồ sơ danh thiếp điện tử của bạn sẽ tự động mở mà đối tác không cần cài bất kỳ ứng dụng nào.
              </Text>
            </View>

            {/* Danh sách thẻ */}
            <View style={styles.tagsList}>
              {tags.map((tag) => {
                const isActive = tag.status === "ACTIVE";
                const isEditing = editingTagId === tag.id;

                return (
                  <View
                    key={tag.id}
                    style={[
                      styles.tagCard,
                      {
                        backgroundColor: isDark ? "#12151F" : "#F8FAFC",
                        borderColor: isActive
                          ? isDark
                            ? "rgba(216, 178, 130, 0.25)"
                            : "#E2E8F0"
                          : isDark
                          ? "rgba(239, 68, 68, 0.25)"
                          : "rgba(239, 68, 68, 0.3)",
                      },
                    ]}
                  >
                    <View style={styles.tagCardTop}>
                      <View style={styles.tagIconWrap}>
                        <Nfc size={18} color={isActive ? "#DFB76C" : "#EF4444"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {isEditing ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <TextInput
                              style={[
                                styles.editInput,
                                {
                                  color: isDark ? "#FFFFFF" : "#0F172A",
                                  backgroundColor: isDark ? "#181D2A" : "#FFFFFF",
                                  borderColor: "#DFB76C",
                                },
                              ]}
                              value={editingLabel}
                              onChangeText={setEditingLabel}
                              autoFocus
                            />
                            <TouchableOpacity
                              style={styles.saveEditBtn}
                              onPress={() => handleSaveRename(tag.id)}
                            >
                              <Text style={styles.saveEditText}>Lưu</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text
                              style={[styles.tagLabel, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                              numberOfLines={1}
                            >
                              {tag.label}
                            </Text>
                            <TouchableOpacity onPress={() => handleStartRename(tag)}>
                              <Edit2 size={12} color="#94A3B8" />
                            </TouchableOpacity>
                          </View>
                        )}

                        <Text style={styles.tagUid}>UID: {tag.uid}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isActive
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                            borderColor: isActive
                              ? "rgba(16, 185, 129, 0.35)"
                              : "rgba(239, 68, 68, 0.35)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isActive ? "#10B981" : "#EF4444" },
                          ]}
                        >
                          {isActive ? "ĐANG HOẠT ĐỘNG" : "ĐÃ THU HỒI"}
                        </Text>
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View
                      style={[
                        styles.tagStatsRow,
                        { borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0" },
                      ]}
                    >
                      <View style={styles.statItem}>
                        <Text style={styles.statVal}>{tag.totalTaps}</Text>
                        <Text style={styles.statLbl}>Lượt chạm</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statVal}>{tag.lastTapAt}</Text>
                        <Text style={styles.statLbl}>Chạm gần nhất</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statVal}>{tag.writtenAt}</Text>
                        <Text style={styles.statLbl}>Ngày lập trình</Text>
                      </View>
                    </View>

                    {/* Footer Actions */}
                    {isActive && (
                      <View style={styles.tagCardFooter}>
                        <TouchableOpacity
                          style={styles.revokeBtn}
                          onPress={() => handleRevokeTag(tag.id, tag.label)}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={13} color="#EF4444" style={{ marginRight: 4 }} />
                          <Text style={styles.revokeBtnText}>Thu hồi thẻ khi bị mất</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={{ height: 90 }} />
          </ScrollView>

          {/* Floating Bottom Add Tag Button */}
          <View
            style={[
              styles.bottomBar,
              { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" },
            ]}
          >
            <TouchableOpacity
              style={styles.addTagBtn}
              onPress={handleWriteNewNfcTag}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                style={styles.addTagGrad}
              >
                <Plus size={16} color="#050C15" strokeWidth={2.5} />
                <Text style={styles.addTagText}>Ghi & Liên Kết Thẻ NFC Mới</Text>
              </LinearGradient>
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
    height: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DFB76C",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#DFB76C",
  },
  infoText: {
    fontSize: 11.5,
    color: "#94A3B8",
    lineHeight: 16,
  },
  tagsList: {
    gap: 12,
  },
  tagCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  tagCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  tagIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagLabel: {
    fontSize: 13.5,
    fontWeight: "800",
    flex: 1,
  },
  tagUid: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 2,
    fontFamily: "monospace",
  },
  editInput: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  saveEditBtn: {
    backgroundColor: "#DFB76C",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveEditText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#050C15",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  tagStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
  },
  statVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DFB76C",
  },
  statLbl: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  tagCardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  revokeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    backgroundColor: "rgba(11, 15, 23, 0.95)",
  },
  addTagBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  addTagGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 8,
  },
  addTagText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#050C15",
    letterSpacing: 0.3,
  },
});
