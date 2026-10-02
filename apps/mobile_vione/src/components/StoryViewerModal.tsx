import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { X, Heart, Eye, MapPin, Building2, Briefcase, Share2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "./common/Avatar";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface StoryItemData {
  id: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  authorAvatar: string;
  storyImage: string;
  storyCaption: string;
  tag?: string;
  timeAgo: string;
  viewsCount: number;
}

interface StoryViewerModalProps {
  visible: boolean;
  story: StoryItemData | null;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  visible,
  story,
  onClose,
}) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(48);
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && story) {
      setLiked(false);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          onClose();
        }
      });
    }
  }, [visible, story]);

  if (!story) return null;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Story Background Image */}
        <Image source={{ uri: story.storyImage }} style={styles.bgImage} resizeMode="cover" />

        <LinearGradient
          colors={["rgba(10, 10, 11, 0.75)", "transparent", "rgba(10, 10, 11, 0.92)"]}
          style={styles.gradientOverlay}
        />

        {/* Top Progress Bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.authorMeta}>
            <Avatar url={story.authorAvatar} name={story.authorName} size={40} showGoldBorder />
            <View style={styles.authorTexts}>
              <View style={styles.nameTagRow}>
                <Text style={styles.authorName} numberOfLines={1}>{story.authorName}</Text>
                {story.tag && (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{story.tag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.authorCompany} numberOfLines={1}>
                {story.authorTitle} · {story.authorCompany}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Details & Engagement */}
        <View style={styles.bottomSection}>
          <Text style={styles.captionText}>{story.storyCaption}</Text>

          <View style={styles.metaInfoRow}>
            <View style={styles.metaItem}>
              <Eye size={13} color="#D8B282" style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{story.viewsCount} lượt xem</Text>
            </View>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.metaText}>{story.timeAgo}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.likeBtn, liked && styles.likeBtnActive]}
              onPress={() => {
                setLiked(!liked);
                setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
              }}
              activeOpacity={0.8}
            >
              <Heart size={18} color={liked ? "#F43F5E" : "#D8B282"} fill={liked ? "#F43F5E" : "transparent"} />
              <Text style={[styles.likeText, liked && styles.likeTextActive]}>
                {likeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => alert("Đã sao chép liên kết khoảnh khắc doanh nhân.")}
              activeOpacity={0.8}
            >
              <Share2 size={16} color="#D8B282" style={{ marginRight: 6 }} />
              <Text style={styles.shareText}>Chia sẻ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0B",
    position: "relative",
  },
  bgImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "absolute",
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  progressBarBg: {
    position: "absolute",
    top: 48,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 2,
    overflow: "hidden",
    zIndex: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#D8B282",
  },
  headerRow: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  authorMeta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  authorTexts: {
    marginLeft: 10,
    flex: 1,
  },
  nameTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  tagBadge: {
    backgroundColor: "rgba(216, 178, 130, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.5)",
  },
  tagText: {
    color: "#D8B282",
    fontSize: 10,
    fontWeight: "700",
  },
  authorCompany: {
    color: "#CBD5E1",
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(10, 10, 11, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  bottomSection: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  captionText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    color: "#D8B282",
    fontSize: 12,
    fontWeight: "600",
  },
  dotSeparator: {
    color: "#94A3B8",
    marginHorizontal: 8,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18, 21, 31, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  likeBtnActive: {
    borderColor: "#F43F5E",
    backgroundColor: "rgba(244, 63, 94, 0.15)",
  },
  likeText: {
    color: "#D8B282",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  likeTextActive: {
    color: "#F43F5E",
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 21, 31, 0.8)",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 178, 130, 0.3)",
  },
  shareText: {
    color: "#D8B282",
    fontSize: 13,
    fontWeight: "600",
  },
});
