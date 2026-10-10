import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Sparkles,
  ChevronRight,
  Handshake,
  MessageSquare,
  ShieldCheck,
  Building2,
  Briefcase,
  MapPin,
} from "lucide-react-native";
import { AiPartnerItem } from "./home.types";
import { styles } from "./home.styles";

export interface AiPartnersSectionProps {
  isDark: boolean;
  navigation?: any;
  distanceFilter: "all" | "near" | "city" | "national";
  setDistanceFilter: (d: "all" | "near" | "city" | "national") => void;
  industryFilter: string;
  setIndustryFilter: (ind: string) => void;
  filteredAiPartners: AiPartnerItem[];
  setSelectedPartnerForMeeting: (p: { name: string; company: string }) => void;
  setScheduleMeetingVisible: (v: boolean) => void;
}

export const AiPartnersSection: React.FC<AiPartnersSectionProps> = ({
  isDark,
  navigation,
  distanceFilter,
  setDistanceFilter,
  industryFilter,
  setIndustryFilter,
  filteredAiPartners,
  setSelectedPartnerForMeeting,
  setScheduleMeetingVisible,
}) => {
  return (
    <>
        {/* 6. Khối V · GỢI Ý HÔM NAY (Khớp 100% RelationshipSuggestions PWA) */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeaderRow}>
            <View style={styles.aiHeaderLeft}>
              <Sparkles size={16} color="#D8B282" style={{ marginRight: 6 }} />
              <Text style={styles.aiSectionLabel}>V · GỢI Ý HÔM NAY (AI)</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation?.navigate("Network")}
              activeOpacity={0.7}
              style={styles.aiViewAllBtn}
            >
              <Text style={styles.aiViewAllText}>Xem tất cả</Text>
              <ChevronRight size={13} color="#D8B282" />
            </TouchableOpacity>
          </View>

          <Text style={styles.aiHeadline}>GỢI Ý KẾT NỐI TỪ TRÍ TUỆ NHÂN TẠO</Text>
          <Text style={styles.aiSubtitle}>
            Hệ sinh thái AI tự động tính toán dữ liệu năng lực, chuỗi giá trị và đề xuất đối tác C-Level tương thích cao nhất.
          </Text>

          {/* Lọc theo phạm vi */}
          <View style={{ marginTop: 12, marginBottom: 6 }}>
            <Text style={styles.filterGroupTitle}>LỌC THEO PHẠM VI KHÔNG GIAN</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[
                { id: "all", label: "Tất cả phạm vi" },
                { id: "near", label: "📍 Gần tôi (10km)" },
                { id: "city", label: "🏢 Cùng thành phố" },
                { id: "national", label: "🌐 Toàn quốc" },
              ].map((df) => {
                const active = distanceFilter === df.id;
                return (
                  <TouchableOpacity
                    key={df.id}
                    style={[styles.aiFilterChip, active && styles.aiFilterChipActive]}
                    onPress={() => setDistanceFilter(df.id as any)}
                  >
                    <Text style={[styles.aiFilterChipText, active && styles.aiFilterChipTextActive]}>
                      {df.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Lọc theo ngành nghề */}
          <View style={{ marginTop: 6, marginBottom: 12 }}>
            <Text style={styles.filterGroupTitle}>LỌC THEO LĨNH VỰC & CHUỖI GIÁ TRỊ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[
                { id: "all", label: "Tất cả ngành nghề" },
                { id: "logistics", label: "📦 Chuỗi cung ứng & Bán lẻ" },
                { id: "tech", label: "💻 Công nghệ & AI" },
                { id: "investment", label: "💎 Quỹ đầu tư & Vốn" },
                { id: "construction", label: "🏗️ Xây dựng & Bất động sản" },
                { id: "media", label: "📢 Truyền thông B2B" },
              ].map((ind) => {
                const active = industryFilter === ind.id;
                return (
                  <TouchableOpacity
                    key={ind.id}
                    style={[styles.aiFilterChip, active && styles.aiFilterChipActive]}
                    onPress={() => setIndustryFilter(ind.id)}
                  >
                    <Text style={[styles.aiFilterChipText, active && styles.aiFilterChipTextActive]}>
                      {ind.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Danh sách đối tác gợi ý */}
          <View style={styles.aiListCol}>
            {filteredAiPartners.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Không có gợi ý trong phạm vi này. Vui lòng mở rộng bộ lọc.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setDistanceFilter("all");
                    setIndustryFilter("all");
                  }}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ color: "#D8B282", fontSize: 12, fontWeight: "700" }}>
                    Đặt lại bộ lọc
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredAiPartners.map((item: AiPartnerItem) => (
                <View key={item.id} style={styles.aiPartnerCard}>
                  <View style={styles.aiPartnerTop}>
                    <LinearGradient colors={["#2A2016", "#14110E"]} style={styles.aiAvatarCircle}>
                      <Text style={styles.aiAvatarInitial}>{item.initial}</Text>
                    </LinearGradient>

                    <View style={styles.aiPartnerInfo}>
                      <View style={styles.aiNameRow}>
                        <Text style={styles.aiPartnerName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.aiLocationTag}>
                          <MapPin size={10} color="#D8B282" style={{ marginRight: 2 }} />
                          <Text style={styles.aiLocationText}>{item.location}</Text>
                        </View>
                      </View>
                      <View style={styles.aiMetaRow}>
                        <Briefcase size={11} color="#D8B282" style={{ marginRight: 4 }} />
                        <Text style={styles.aiMetaText} numberOfLines={1}>
                          {item.title} · {item.company}
                        </Text>
                      </View>
                      <View style={styles.aiMetaRow}>
                        <Building2 size={11} color="#D8B282" style={{ marginRight: 4 }} />
                        <Text style={styles.aiIndustryText} numberOfLines={1}>
                          {item.industry}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.aiReasonBox}>
                    <Text style={styles.aiSuggestionText}>{item.suggestion}</Text>
                    <Text style={styles.aiMatchScoreText}>★ {item.matchScore}</Text>
                  </View>

                  <View style={styles.aiActionRow}>
                    <TouchableOpacity
                      style={styles.aiConnectBtn}
                      onPress={() => {
                        setSelectedPartnerForMeeting({
                          name: item.name,
                          company: item.company,
                        });
                        setScheduleMeetingVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Handshake size={13} color="#050C15" style={{ marginRight: 4 }} />
                      <Text style={styles.aiConnectBtnText}>Lên lịch 1-1</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.aiMessageBtn}
                      onPress={() => navigation?.navigate("Network")}
                      activeOpacity={0.8}
                    >
                      <MessageSquare size={13} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.aiMessageBtnText}>Nhắn tin</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
    </>
  );
};
