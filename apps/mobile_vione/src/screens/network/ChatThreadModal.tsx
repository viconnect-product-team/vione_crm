import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Send,
  Phone,
  Users,
  ShieldCheck,
  CheckCheck,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Avatar } from "../../components/common/Avatar";
import { DmThreadSummary, DmMessage } from "../../types";
import { apiRequest } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
  OpportunityMeetingProposalCard,
  OpportunityMeetingData,
} from "../../components/OpportunityMeetingProposalCard";

interface ChatThreadModalProps {
  visible: boolean;
  thread: DmThreadSummary | null;
  onClose: () => void;
  onMessageSent?: (threadId: string, lastMessage: string) => void;
}

export const ChatThreadModal: React.FC<ChatThreadModalProps> = ({
  visible,
  thread,
  onClose,
  onMessageSent,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible || !thread) return;

    let isMounted = true;
    setIsLoading(true);

    const loadThreadMessages = async () => {
      try {
        const res = await apiRequest<{ thread: any; messages: any[] }>(
          `connect-app/dm/threads/${thread.threadId}`
        );

        if (!isMounted) return;

        if (res.data?.messages && Array.isArray(res.data.messages)) {
          const mapped: DmMessage[] = res.data.messages.map((m: any) => ({
            id: m.id || "msg-" + Math.random(),
            threadId: thread.threadId,
            senderUserId: m.senderUserId || m.sender_id || "",
            senderName: m.senderName || m.sender_name,
            body: m.body || m.text || "",
            createdAt: m.createdAt || m.created_at || new Date().toISOString(),
            isFromMe:
              m.isFromMe ||
              m.senderUserId === user?.id ||
              m.sender_id === user?.id,
            isSystem: m.isSystem || m.is_system || false,
          }));
          setMessages(mapped);
        } else {
          // Khởi tạo tin nhắn chào mừng mặc định nếu hội thoại mới
          const initialMsgs: DmMessage[] = [
            {
              id: "sys-0",
              threadId: thread.threadId,
              senderUserId: "system",
              body: `[system] Cuộc trò chuyện kinh doanh bảo mật với ${thread.displayName}`,
              createdAt: thread.lastMessageAt || new Date().toISOString(),
              isSystem: true,
            },
          ];
          if (thread.lastMessagePreview) {
            initialMsgs.push({
              id: "msg-preview",
              threadId: thread.threadId,
              senderUserId: thread.lastMessageFromMe ? (user?.id || "me") : thread.counterpartUserId,
              senderName: thread.lastMessageFromMe ? "Bạn" : thread.displayName,
              body: thread.lastMessagePreview,
              createdAt: thread.lastMessageAt || new Date().toISOString(),
              isFromMe: thread.lastMessageFromMe,
            });
          }
          setMessages(initialMsgs);
        }

        // Đánh dấu đã đọc
        apiRequest(`connect-app/dm/threads/${thread.threadId}/read`, {
          method: "POST",
        }).catch(() => {});
      } catch (e) {
        console.warn("Lỗi tải tin nhắn:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadThreadMessages();

    return () => {
      isMounted = false;
    };
  }, [visible, thread, user?.id]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !thread || isSending) return;

    setInputText("");
    setIsSending(true);

    const tempId = "temp-" + Date.now();
    const newMsg: DmMessage = {
      id: tempId,
      threadId: thread.threadId,
      senderUserId: user?.id || "me",
      senderName: user?.displayName || "Bạn",
      body: text,
      createdAt: new Date().toISOString(),
      isFromMe: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    onMessageSent?.(thread.threadId, text);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await apiRequest(
        `connect-app/dm/threads/${thread.threadId}/messages`,
        {
          method: "POST",
          body: {
            body: text,
            clientToken: Date.now().toString(),
          },
        }
      );
    } catch (e) {
      console.warn("Lỗi gửi tin nhắn:", e);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (!thread) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Avatar
              url={thread.avatarUrl}
              name={thread.displayName}
              size={40}
              showGoldBorder
            />
            <View style={styles.headerTextCol}>
              <View style={styles.nameRow}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {thread.displayName}
                </Text>
                {thread.isGroup && (
                  <View style={styles.groupBadge}>
                    <Users size={10} color="#B45309" />
                    <Text style={styles.groupBadgeText}>Nhóm</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {thread.isOnline ? (
                  <Text style={{ color: "#16A34A" }}>● Đang hoạt động</Text>
                ) : (
                  thread.companyName || "Đối tác kinh doanh ViOne"
                )}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              Alert.alert(
                "Thông tin đối tác",
                `${thread.displayName}\n${thread.companyName || "ViOne Business Connect"}`
              )
            }
          >
            <ShieldCheck size={20} color={Colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Message Thread List */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.chatArea}
        >
          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={Colors.gold} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
                if (item.isSystem) {
                  return (
                    <View style={styles.systemPillWrap}>
                      <View style={styles.systemPill}>
                        <Text style={styles.systemPillText}>{item.body.replace("[system] ", "")}</Text>
                      </View>
                    </View>
                  );
                }

                const isMe = item.isFromMe;

                // Check for Opportunity Meeting Proposal card
                if (item.body.startsWith("[opportunity_meeting_proposal]")) {
                  let proposalData: OpportunityMeetingData = {};
                  try {
                    const jsonStr = item.body.replace("[opportunity_meeting_proposal]", "").trim();
                    proposalData = JSON.parse(jsonStr);
                  } catch {
                    proposalData = { opportunityTitle: "Đề xuất hẹn gặp trao đổi cơ hội" };
                  }

                  return (
                    <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft, { maxWidth: "90%" }]}>
                      {!isMe && !thread.isGroup && (
                        <View style={{ marginRight: 8, alignSelf: "flex-end" }}>
                          <Avatar url={thread.avatarUrl} name={thread.displayName} size={28} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <OpportunityMeetingProposalCard
                          data={proposalData}
                          isFromMe={isMe}
                          messageId={item.id}
                        />
                      </View>
                    </View>
                  );
                }

                return (
                  <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                    {!isMe && !thread.isGroup && (
                      <View style={{ marginRight: 8 }}>
                        <Avatar url={thread.avatarUrl} name={thread.displayName} size={28} />
                      </View>
                    )}
                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleRight : styles.bubbleLeft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          isMe ? styles.bubbleTextRight : styles.bubbleTextLeft,
                        ]}
                      >
                        {item.body}
                      </Text>
                      <View style={styles.bubbleFooter}>
                        <Text
                          style={[
                            styles.bubbleTime,
                            isMe ? styles.bubbleTimeRight : styles.bubbleTimeLeft,
                          ]}
                        >
                          {formatTime(item.createdAt)}
                        </Text>
                        {isMe && (
                          <CheckCheck size={12} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0B0F17",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 178, 130, 0.2)",
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(216, 178, 130, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D8B282",
    marginLeft: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 1,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(216, 178, 130, 0.15)",
  },
  chatArea: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  systemPillWrap: {
    alignItems: "center",
    marginVertical: 12,
  },
  systemPill: {
    backgroundColor: "#181D2A",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  systemPillText: {
    fontSize: 11,
    color: "#D4C3A3",
    fontWeight: "500",
  },
  msgRow: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  msgRowLeft: {
    justifyContent: "flex-start",
  },
  msgRowRight: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "76%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleLeft: {
    backgroundColor: "#181D2A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: "#D8B282",
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextLeft: {
    color: "#FFFFFF",
  },
  bubbleTextRight: {
    color: "#050C15",
    fontWeight: "600",
  },
  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 10,
  },
  bubbleTimeLeft: {
    color: "#94A3B8",
  },
  bubbleTimeRight: {
    color: "rgba(5, 12, 21, 0.7)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0B0F17",
    borderTopWidth: 1,
    borderTopColor: "rgba(216, 178, 130, 0.2)",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#181D2A",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: "#FFFFFF",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D8B282",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#334155",
  },
});
