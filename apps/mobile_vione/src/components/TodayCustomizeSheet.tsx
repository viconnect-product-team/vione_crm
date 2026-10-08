import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  Briefcase,
  Users,
  Bell,
  Mic,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export type TodayKind = "meeting" | "opportunity" | "event" | "reminder" | "voice_moment";
export type TodayOrderMode = "priority" | "time";

export interface TodayPreferences {
  kinds: TodayKind[];
  order: TodayOrderMode;
  max: number;
}

export const DEFAULT_TODAY_PREFERENCES: TodayPreferences = {
  kinds: ["meeting", "opportunity", "event", "reminder", "voice_moment"],
  order: "priority",
  max: 5,
};

interface TodayCustomizeSheetProps {
  visible: boolean;
  onClose: () => void;
  prefs: TodayPreferences;
  onChange: (next: TodayPreferences) => void;
  onReset: () => void;
}

const KIND_METADATA: {
  kind: TodayKind;
  label: string;
  desc: string;
  icon: any;
}[] = [
  {
    kind: "meeting",
    label: "Cuộc gặp đối tác 1-1",
    desc: "Lịch hẹn làm việc, kết nối trực tuyến hoặc gặp trực tiếp",
    icon: Users,
  },
  {
    kind: "opportunity",
    label: "Cơ hội kinh doanh B2B",
    desc: "Đề xuất hợp tác, đơn hàng và dự án từ cộng đồng",
    icon: Briefcase,
  },
  {
    kind: "event",
    label: "Sự kiện & Hội thảo",
    desc: "Các diễn đàn thương mại, giao lưu kết nối doanh nhân",
    icon: Calendar,
  },
  {
    kind: "reminder",
    label: "Nhắc lịch & Giữ nhiệt kết nối",
    desc: "Cảnh báo chăm sóc khách hàng và lịch họp quan trọng",
    icon: Bell,
  },
  {
    kind: "voice_moment",
    label: "Khoảnh khắc giọng nói AI",
    desc: "Ghi âm ghi nhớ, bóc băng giọng nói và tóm tắt điều hành",
    icon: Mic,
  },
];

export const TodayCustomizeSheet: React.FC<TodayCustomizeSheetProps> = ({
  visible,
  onClose,
  prefs,
  onChange,
  onReset,
}) => {
  const { isDark } = useTheme();

  const toggleKind = (kind: TodayKind) => {
    const has = prefs.kinds.includes(kind);
    // Luôn giữ tối thiểu 1 loại để thẻ không bao giờ trống
    if (has && prefs.kinds.length === 1) return;
    const nextKinds = has
      ? prefs.kinds.filter((k) => k !== kind)
      : [...prefs.kinds, kind];
    onChange({ ...prefs, kinds: nextKinds });
  };

  const handleSetOrder = (order: TodayOrderMode) => {
    onChange({ ...prefs, order });
  };

  const handleSetMax = (max: number) => {
    onChange({ ...prefs, max });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0A0D14" : "#FFFFFF",
              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <SlidersHorizontal size={17} color="#D8B282" style={{ marginRight: 8 }} />
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  Tuỳ Chỉnh Thẻ Hôm Nay
                </Text>
              </View>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Cấu hình nội dung, thứ tự hiển thị và số lượng tóm tắt điều hành
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={isDark ? "#D8B282" : "#64748B"} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Các khối nội dung hiển thị */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: isDark ? "#D8B282" : "#8C653B" }]}>
                CÁC KHỐI NỘI DUNG HIỂN THỊ
              </Text>

              <View
                style={[
                  styles.kindsBox,
                  {
                    backgroundColor: isDark ? "#121722" : "#F8FAFC",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                {KIND_METADATA.map((item, index) => {
                  const isActive = prefs.kinds.includes(item.kind);
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.kind}
                      style={[
                        styles.kindRow,
                        index < KIND_METADATA.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => toggleKind(item.kind)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.kindIconWrap,
                          {
                            backgroundColor: isActive
                              ? isDark
                                ? "rgba(216, 178, 130, 0.2)"
                                : "#F6E1C3"
                              : isDark
                              ? "rgba(255, 255, 255, 0.05)"
                              : "#F1F5F9",
                          },
                        ]}
                      >
                        <Icon
                          size={16}
                          color={isActive ? "#D8B282" : isDark ? "#64748B" : "#94A3B8"}
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={[
                            styles.kindTitle,
                            { color: isDark ? "#FFFFFF" : "#0F172A" },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.kindDesc,
                            { color: isDark ? "#94A3B8" : "#64748B" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.desc}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.checkboxCircle,
                          {
                            backgroundColor: isActive ? "#D8B282" : "transparent",
                            borderColor: isActive
                              ? "#D8B282"
                              : isDark
                              ? "rgba(255, 255, 255, 0.2)"
                              : "#CBD5E1",
                          },
                        ]}
                      >
                        {isActive && <Check size={12} color="#050C15" strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Thứ tự ưu tiên */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: isDark ? "#D8B282" : "#8C653B" }]}>
                THỨ TỰ SẮP XẾP
              </Text>
              <View style={styles.orderGrid}>
                <TouchableOpacity
                  style={[
                    styles.orderBtn,
                    {
                      backgroundColor:
                        prefs.order === "priority"
                          ? "#D8B282"
                          : isDark
                          ? "#121722"
                          : "#F8FAFC",
                      borderColor:
                        prefs.order === "priority"
                          ? "#D8B282"
                          : isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "#E2E8F0",
                    },
                  ]}
                  onPress={() => handleSetOrder("priority")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.orderBtnText,
                      {
                        color:
                          prefs.order === "priority"
                            ? "#050C15"
                            : isDark
                            ? "#94A3B8"
                            : "#475569",
                        fontWeight: prefs.order === "priority" ? "800" : "500",
                      },
                    ]}
                  >
                    Ưu tiên quan trọng
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orderBtn,
                    {
                      backgroundColor:
                        prefs.order === "time"
                          ? "#D8B282"
                          : isDark
                          ? "#121722"
                          : "#F8FAFC",
                      borderColor:
                        prefs.order === "time"
                          ? "#D8B282"
                          : isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "#E2E8F0",
                    },
                  ]}
                  onPress={() => handleSetOrder("time")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.orderBtnText,
                      {
                        color:
                          prefs.order === "time"
                            ? "#050C15"
                            : isDark
                            ? "#94A3B8"
                            : "#475569",
                        fontWeight: prefs.order === "time" ? "800" : "500",
                      },
                    ]}
                  >
                    Theo thời gian diễn ra
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Số lượng hiển thị tối đa */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: isDark ? "#D8B282" : "#8C653B" }]}>
                SỐ LƯỢNG MỤC TỐI ĐA TRÊN THẺ
              </Text>
              <View style={styles.maxGrid}>
                {[3, 5, 10].map((num) => {
                  const isSelected = prefs.max === num;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.maxBtn,
                        {
                          backgroundColor: isSelected
                            ? "#D8B282"
                            : isDark
                            ? "#121722"
                            : "#F8FAFC",
                          borderColor: isSelected
                            ? "#D8B282"
                            : isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "#E2E8F0",
                        },
                      ]}
                      onPress={() => handleSetMax(num)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.maxBtnText,
                          {
                            color: isSelected ? "#050C15" : isDark ? "#94A3B8" : "#475569",
                            fontWeight: isSelected ? "800" : "600",
                          },
                        ]}
                      >
                        {num} mục
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                backgroundColor: isDark ? "#0A0D14" : "#FFFFFF",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.resetBtn,
                {
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1",
                },
              ]}
              onPress={onReset}
              activeOpacity={0.7}
            >
              <RotateCcw size={15} color={isDark ? "#94A3B8" : "#64748B"} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.resetBtnText,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Mặc định
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.doneGrad}
              >
                <Check size={16} color="#050C15" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.doneText}>Hoàn tất</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  sheetContainer: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 178, 130, 0.12)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  kindsBox: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  kindRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  kindIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  kindTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  kindDesc: {
    fontSize: 11.5,
    marginTop: 1,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  orderGrid: {
    flexDirection: "row",
    gap: 10,
  },
  orderBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  orderBtnText: {
    fontSize: 13,
  },
  maxGrid: {
    flexDirection: "row",
    gap: 10,
  },
  maxBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  maxBtnText: {
    fontSize: 13.5,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
  },
  resetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtnText: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  doneBtn: {
    flex: 1.8,
    height: 48,
    borderRadius: 16,
    overflow: "hidden",
  },
  doneGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050C15",
  },
});
