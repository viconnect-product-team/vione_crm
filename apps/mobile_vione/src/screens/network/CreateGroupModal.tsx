import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Users, Check, Sparkles } from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Avatar } from "../../components/common/Avatar";
import { ConnectionPerson, DmThreadSummary } from "../../types";

interface CreateGroupModalProps {
  visible: boolean;
  partners: ConnectionPerson[];
  onClose: () => void;
  onGroupCreated: (newGroup: DmThreadSummary) => void;
}

const EMOJI_OPTIONS = ["👥", "🚀", "💼", "💎", "🌐", "⚡"];
const SUGGESTED_NAMES = [
  "Ban Điều Hành Doanh Nghiệp",
  "Dự Án Đầu Tư B2B",
  "Liên Minh C-Level ViOne",
  "Nhóm Hợp Tác Thương Mại",
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  partners,
  onClose,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("👥");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    const name = groupName.trim();
    if (!name) {
      Alert.alert("Thiếu tên nhóm", "Vui lòng nhập tên nhóm làm việc hoặc chọn tên gợi ý.");
      return;
    }

    if (selectedIds.length === 0) {
      Alert.alert("Chưa chọn thành viên", "Vui lòng chọn ít nhất 1 thành viên tham gia nhóm.");
      return;
    }

    const newGroup: DmThreadSummary = {
      threadId: "group_" + Date.now(),
      counterpartUserId: "group_" + Date.now(),
      displayName: `${selectedEmoji} ${name}`,
      companyName: `${selectedIds.length} thành viên tham gia`,
      lastMessagePreview: "Nhóm đã được tạo thành công",
      lastMessageAt: new Date().toISOString(),
      lastMessageFromMe: true,
      unreadCount: 0,
      isConnected: true,
      isGroup: true,
      membersCount: selectedIds.length + 1,
    };

    onGroupCreated(newGroup);
    onClose();
    setGroupName("");
    setSelectedIds([]);
    Alert.alert("Thành công", `Đã tạo nhóm "${newGroup.displayName}"!`);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo Nhóm Làm Việc</Text>
          <TouchableOpacity
            style={[
              styles.createHeaderBtn,
              (!groupName.trim() || selectedIds.length === 0) && styles.createHeaderBtnDisabled,
            ]}
            onPress={handleCreate}
            disabled={!groupName.trim() || selectedIds.length === 0}
          >
            <Text style={styles.createHeaderText}>Tạo nhóm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Group Icon & Name */}
          <View style={styles.nameSection}>
            <View style={styles.emojiPicker}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiBtn,
                    selectedEmoji === emoji && styles.emojiBtnActive,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.nameInput}
              placeholder="Đặt tên nhóm chat kinh doanh..."
              placeholderTextColor="#94A3B8"
              value={groupName}
              onChangeText={setGroupName}
            />

            {/* Quick Name Suggestions */}
            <View style={styles.suggestionsWrap}>
              {SUGGESTED_NAMES.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={styles.sugChip}
                  onPress={() => setGroupName(sug)}
                >
                  <Sparkles size={11} color="#B45309" style={{ marginRight: 4 }} />
                  <Text style={styles.sugChipText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Members Selection */}
          <View style={styles.membersSectionHeader}>
            <Text style={styles.membersTitle}>Chọn Thành Viên</Text>
            <Text style={styles.selectedCountText}>
              Đã chọn: {selectedIds.length}
            </Text>
          </View>

          <FlatList
            data={partners}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.membersList}
            renderItem={({ item }) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.memberItem, isSelected && styles.memberItemSelected]}
                  onPress={() => toggleSelect(item.id)}
                >
                  <Avatar url={item.avatarUrl} name={item.name} size={42} showGoldBorder />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberCompany} numberOfLines={1}>
                      {item.title} • {item.company}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxActive,
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  createHeaderBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  createHeaderBtnDisabled: {
    backgroundColor: "#CBD5E1",
  },
  createHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  nameSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  emojiPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnActive: {
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#D97706",
  },
  emojiText: {
    fontSize: 20,
  },
  nameInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  sugChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  sugChipText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
  membersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  selectedCountText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "600",
  },
  membersList: {
    paddingHorizontal: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  memberItemSelected: {
    borderColor: "#D97706",
    backgroundColor: "#FFFBEB",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  memberCompany: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#D97706",
    borderColor: "#D97706",
  },
});
