import { CommunityOpportunityItem } from "../../../components/OpportunityDetailModal";

export interface AiPartnerItem {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  industryKey: string;
  location: string;
  distanceTier: "near" | "city" | "national";
  suggestion: string;
  matchScore: string;
  initial: string;
}

export interface VoiceMomentItem {
  id: string;
  title: string;
  author: string;
  date: string;
  duration: string;
  location: string;
  transcript: string;
  audioUrl?: string;
}

export interface TodayMeetingItem {
  id: string;
  title: string;
  counterpart: string;
  phone?: string;
  time: string;
  date: string;
  format: string;
  location: string;
  status: string;
}

export const INITIAL_TODAY_OPPORTUNITIES: CommunityOpportunityItem[] = [
  {
    id: "opp-today-1",
    title: "Gói thầu thiết kế thi công nội thất & cơ điện trụ sở tập đoàn",
    organization: "Tập đoàn Bất Động Sản Khang Điền",
    communityName: "Liên minh Doanh Nhân B2B",
    communityId: "c-b2b-leaders",
    publishedDate: "Hôm nay",
    dealValue: "5.2 Tỷ VNĐ",
    category: "Xây dựng & Kiến trúc",
    daysLeft: "Đăng hôm nay · Còn 7 ngày",
    interested: false,
  },
  {
    id: "opp-today-2",
    title: "Tìm đối tác chiến lược cung ứng giải pháp AI & Phần mềm CRM",
    organization: "Tập đoàn Công Nghệ TechVibe",
    communityName: "Gia Đình ViOne",
    communityId: "c-vione-internal",
    publishedDate: "Hôm nay",
    dealValue: "850 Triệu VNĐ",
    category: "Công nghệ & AI",
    daysLeft: "Đăng hôm nay · Còn 14 ngày",
    interested: true,
  },
];

export const INITIAL_TODAY_MEETINGS: TodayMeetingItem[] = [
  {
    id: "meet-today-1",
    title: "Trao đổi hợp tác chuỗi giá trị và phân phối bán lẻ",
    counterpart: "Ông Trần Đình Long · Chủ tịch HĐQT",
    phone: "0988 888 888",
    time: "14:30 - 15:30",
    date: "Hôm nay",
    format: "online",
    location: "Google Meet Trực Tuyến",
    status: "confirmed",
  },
];

export interface HomeScreenProps {
  navigation?: any;
  onOpenV?: () => void;
}
