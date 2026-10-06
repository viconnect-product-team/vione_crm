import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { X, Users, Award, ShieldCheck, Sparkles, Building2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CommunityItem } from "../types";
import { communityApi } from "../api/services";

interface CreateCommunityGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: CommunityItem) => void;
}

const CATEGORIES = [
  "Liên minh Doanh nghiệp Đa ngành",
  "CLB Doanh nhân C-Level",
  "Mạng lưới Đầu tư & Tài chính",
  "Hiệp hội Công nghệ & Chuyển đổi số",
  "Chuỗi Cung ứng & Bán lẻ",
];

export const CreateCommunityGroupModal: React.FC<CreateCommunityGroupModalProps> = ({
  visible,
  onClose,
  onGroupCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên cộng đồng / nhóm doanh nghiệp.");
      return;
    }

    const newCommunity: CommunityItem = {
      id: "c-" + Date.now(),
      name: name.trim(),
      description: description.trim() || `Liên minh doanh nghiệp ${category} kết nối hợp tác & chia sẻ giá trị bền vững.`,
      memberCount: 1,
      isMember: true,
      role: "Ban Điều Hành",
    };

    try {
      await communityApi.createCommunity({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
      });
    } catch (err) {
      console.warn("Lỗi tạo community lên API:", err);
    }

    onGroupCreated(newCommunity);
    Alert.alert("Thành công", `Đã khởi tạo liên minh/cộng đồng: ${name.trim()}`);
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Tạo Cộng Đồng / Liên Minh Mới</Text>
              <Text style={styles.headerSubtitle}>
                Kết nối các doanh nghiệp C-Level cùng hệ sinh thái phát triển
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
            <Text style={styles.inputLabel}>TÊN CỘNG ĐỒNG / LIÊN MINH DOANH NGHIỆP</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ví dụ: Liên Minh Logistics & Bán Lẻ Toàn Quốc..."
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>LĨNH VỰC HOẠT ĐỘNG</Text>
            <View style={styles.catWrap}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, category === cat && styles.catPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>MÔ TẢ MỤC TIÊU & TÔN CHỈ</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 80, textAlignVertical: "top" }]}
              multiline
              numberOfLines={3}
              placeholder="Mô tả mục tiêu liên kết kinh doanh, chuỗi giá trị và đối tượng doanh nghiệp tham gia..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.infoBox}>
              <ShieldCheck size={16} color="#D8B282" style={{ marginRight: 8 }} />
              <Text style={styles.infoBoxText}>
                Tài khoản khởi tạo sẽ tự động được cấp quyền <Text style={{ color: "#D8B282", fontWeight: "700" }}>Ban Điều Hành</Text> của cộng đồng.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} activeOpacity={0.85}>
              <LinearGradient
                colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Sparkles size={16} color="#050C15" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Khởi Tạo Liên Minh</Text>
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
    backgroundColor: "#0E1522",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    color: "#D8B282",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#181D2A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
  },
  catWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catPill: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  catPillActive: {
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    borderColor: "#D8B282",
  },
  catPillText: {
    color: "#94A3B8",
    fontSize: 11.5,
    fontWeight: "500",
  },
  catPillTextActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.08)",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.2)",
  },
  infoBoxText: {
    color: "#E2E8F0",
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cancelBtnText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  submitBtnText: {
    color: "#050C15",
    fontSize: 13,
    fontWeight: "700",
  },
});
