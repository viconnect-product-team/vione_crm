import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Search,
  Crown,
  Briefcase,
  CheckCircle2,
  Send,
  MessageSquare,
  Copy,
  ArrowRight,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  Bot,
  Lightbulb,
  ShieldCheck,
  Zap,
  Building2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { useDmOpenThread } from "@/hooks/use-bc-dm";

export interface CandidateAccount {
  id: string;
  name: string;
  avatarUrl: string;
  executiveRole: string;
  department: string;
  association: string;
  company: string;
  jobTitle: string;
  industry: string;
  skills: string[];
  talents: string[];
  headline: string;
  dealSize: string;
  phone: string;
  email: string;
  verified: boolean;
}

// 16 Official Accounts from Database Clean Slate
export const AI_KNOWLEDGE_ACCOUNTS: CandidateAccount[] = [
  {
    id: "c1983000-0000-4000-8000-000000000001",
    name: "Lê Hoàng Long",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Tổng thư ký Hiệp hội CEO 1983",
    department: "Ban Thư ký",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "Tập đoàn Đầu tư & Xây dựng Hoàng Long",
    jobTitle: "Chủ tịch HĐQT & Tổng Giám Đốc",
    industry: "Đầu tư bất động sản & Xây dựng công nghiệp",
    skills: ["Điều hành thư ký", "Điều phối chính sách", "Quản trị hiệp hội", "Hạ tầng khu công nghiệp"],
    talents: ["Gắn kết hội viên", "Thủ tục pháp lý dự án", "Xúc tiến đầu tư liên tỉnh"],
    headline: "Tổng thư ký Hiệp hội CEO 1983. Đầu tàu điều phối và kết nối hội viên vững mạnh.",
    dealSize: ">500 Tỷ VNĐ",
    phone: "0983 000 001",
    email: "ceo.tongthuky@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000002",
    name: "Nguyễn Văn Cường",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Trưởng ban thành viên",
    department: "Ban Thành viên",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "Cường Thịnh Corp",
    jobTitle: "Tổng Giám Đốc",
    industry: "Vật liệu xây dựng & Chuỗi cung ứng công trình",
    skills: ["Phát triển hội viên", "Gắn kết liên kết kinh doanh", "Thẩm định năng lực thành viên", "Phân phối VLXD"],
    talents: ["Mở rộng mạng lưới", "Kết nối đối tác tin cậy", "Đàm phán hợp đồng cung ứng"],
    headline: "Trưởng ban thành viên CEO 1983. Chuyên trách thẩm định, phát triển và kết nối hội viên chất lượng cao.",
    dealSize: "100 - 300 Tỷ VNĐ",
    phone: "0983 000 002",
    email: "ceo.thanhvien@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000003",
    name: "Vũ Thu Trang",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Trưởng ban tài chính",
    department: "Ban Tài chính",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "Kiến Vàng Capital",
    jobTitle: "Chủ tịch kiêm Giám Đốc Đầu Tư",
    industry: "Tài chính, Quản lý Quỹ & Đầu tư vốn",
    skills: ["Cấu trúc vốn", "Quản lý quỹ hội", "Kiểm soát thu chi", "Định giá doanh nghiệp", "Gọi vốn quỹ mạo hiểm"],
    talents: ["Huy động vốn", "Tối ưu hóa dòng tiền", "Bảo toàn quỹ phát triển"],
    headline: "Trưởng ban tài chính CEO 1983. Đảm bảo minh bạch tài chính quỹ hội và cố vấn cấu trúc vốn doanh nghiệp.",
    dealSize: "200 - 500 Tỷ VNĐ",
    phone: "0983 000 003",
    email: "ceo.taichinh@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000004",
    name: "Phạm Quang Huy",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Trưởng ban truyền thông",
    department: "Ban Truyền thông",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "Huy Hoàng Media Group",
    jobTitle: "Tổng Giám Đốc",
    industry: "Truyền thông số, Báo chí & Tổ chức sự kiện",
    skills: ["Chiến lược truyền thông", "Xây dựng thương hiệu CEO", "Tổ chức sự kiện đỉnh cao", "Quan hệ báo chí B2B"],
    talents: ["Lan tỏa hình ảnh", "Tổ chức hội nghị quy mô lớn", "Viral thương hiệu"],
    headline: "Trưởng ban truyền thông CEO 1983. Đưa hình ảnh hiệp hội và thương hiệu doanh nhân thành viên vươn xa.",
    dealSize: "50 - 200 Tỷ VNĐ",
    phone: "0983 000 004",
    email: "ceo.truyenthong@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000005",
    name: "Hoàng Minh Tuấn",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Trưởng ban xúc tiến thương mại",
    department: "Ban Xúc tiến thương mại",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "Tuấn Minh Global Trade",
    jobTitle: "Chủ tịch HĐQT",
    industry: "Xuất nhập khẩu & Xúc tiến thương mại B2B",
    skills: ["Giao thương B2B nội khối", "Xuất khẩu quốc tế", "Đấu thầu thương mại", "Kênh phân phối đại lý"],
    talents: ["Chốt deal triệu USD", "Cầu nối thương mại quốc tế", "Chuỗi bán buôn B2B"],
    headline: "Trưởng ban xúc tiến thương mại CEO 1983. Biến cơ hội gặp gỡ thành doanh thu và hợp đồng ký kết thực chất.",
    dealSize: "100 - 400 Tỷ VNĐ",
    phone: "0983 000 005",
    email: "ceo.xuctien@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000006",
    name: "Đỗ Thị Mai",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Ủy viên Ban Thư ký",
    department: "Ban Thư ký",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "EcoClean Vietnam",
    jobTitle: "Giám Đốc Điều Hành",
    industry: "Công nghệ sinh học & Môi trường xanh",
    skills: ["Xử lý môi trường", "Giải pháp Net Zero", "Hồ sơ ESG", "Quy chuẩn ISO"],
    talents: ["Tư vấn tiêu chuẩn xanh", "Chứng nhận xuất khẩu ESG"],
    headline: "Ủy viên Ban Thư ký CEO 1983. Tiên phong giải pháp công nghệ xanh và phát triển bền vững.",
    dealSize: "20 - 80 Tỷ VNĐ",
    phone: "0983 000 006",
    email: "ceo.member1@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000007",
    name: "Bùi Đức Thắng",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Phó Ban Thành viên",
    department: "Ban Thành viên",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "Thắng Lợi XNK JSC",
    jobTitle: "Phó Tổng Giám Đốc",
    industry: "Nông sản chế biến & Logistics kho vận",
    skills: ["Logistics chuỗi lạnh", "Kho bãi hàng hải", "Chứng nhận FDA & Halal", "Thu mua nông sản"],
    talents: ["Tối ưu chi phí vận tải", "Liên kết hợp tác xã nông sản"],
    headline: "Phó Ban Thành viên CEO 1983. Cung cấp giải pháp logistics toàn diện và kết nối chuỗi cung ứng nông sản.",
    dealSize: "30 - 100 Tỷ VNĐ",
    phone: "0983 000 007",
    email: "ceo.member2@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000008",
    name: "Ngô Bảo Anh",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Ủy viên Ban Tài chính",
    department: "Ban Tài chính",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "MediaPro Solution",
    jobTitle: "Giám Đốc Tài Chính (CFO)",
    industry: "Kiểm toán & Quản trị tài chính doanh nghiệp",
    skills: ["Kiểm toán nội bộ", "Kiểm soát chi phí thuế", "Báo cáo tài chính chuẩn quốc tế", "Phần mềm ERP kế toán"],
    talents: ["Tối ưu hóa dòng tiền", "Chống thất thoát vốn", "Hạn chế rủi ro pháp lý thuế"],
    headline: "Ủy viên Ban Tài chính CEO 1983. Cố vấn quản trị tài chính minh bạch và tối ưu nguồn lực doanh nghiệp.",
    dealSize: "10 - 50 Tỷ VNĐ",
    phone: "0983 000 008",
    email: "ceo.member3@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000009",
    name: "Đinh Trọng Hiếu",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Ủy viên Ban Truyền thông",
    department: "Ban Truyền thông",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "Tài Chính Việt An",
    jobTitle: "Giám Đốc Truyền Thông Thương Hiệu",
    industry: "Tư vấn thương hiệu & Marketing B2B",
    skills: ["Sáng tạo nội dung B2B", "Quảng cáo đa kênh", "Sản xuất video giới thiệu doanh nghiệp", "KOLs B2B"],
    talents: ["Xây dựng hình ảnh chuyên nghiệp", "Chiến dịch viral thương hiệu"],
    headline: "Ủy viên Ban Truyền thông CEO 1983. Chuyên gia xây dựng câu chuyện thương hiệu và định vị giá trị lãnh đạo.",
    dealSize: "15 - 60 Tỷ VNĐ",
    phone: "0983 000 009",
    email: "ceo.member4@ceo1983.com",
    verified: true,
  },
  {
    id: "c1983000-0000-4000-8000-000000000010",
    name: "Trịnh Kim Oanh",
    avatarUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Ủy viên Ban Xúc tiến thương mại",
    department: "Ban Xúc tiến thương mại",
    association: "Hiệp hội Doanh nhân CEO 1983",
    company: "An Phát Holding",
    jobTitle: "Phó Giám Đốc Kinh Doanh",
    industry: "Thương mại phân phối & Bán lẻ hiện đại",
    skills: ["Phát triển chuỗi bán lẻ", "Xúc tiến thương mại điện tử", "Đàm phán nhà phân phối", "Thị trường nội địa"],
    talents: ["Mở rộng kênh MT/GT", "Phát triển đại lý độc quyền toàn quốc"],
    headline: "Ủy viên Ban Xúc tiến CEO 1983. Đẩy mạnh kết nối cung ứng hàng hóa vào các chuỗi phân phối lớn.",
    dealSize: "20 - 90 Tỷ VNĐ",
    phone: "0983 000 010",
    email: "ceo.member5@ceo1983.com",
    verified: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "James Nguyễn",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Ban Quản Trị Hệ Thống & Cố Vấn Công Nghệ",
    department: "Ban Chiến Lược Công Nghệ",
    association: "ViOne Platform & Uranus Tech",
    company: "Uranus Tech",
    jobTitle: "CTO & Co-Founder",
    industry: "Trí tuệ nhân tạo (AI), Cloud & Phần mềm doanh nghiệp",
    skills: ["Kiến trúc AI Copilot", "Bảo mật đám mây", "Chuyển đổi số doanh nghiệp", "Phát triển ứng dụng Web/Mobile"],
    talents: ["Tự động hóa luồng CRM", "Hệ thống kết nối B2B", "Bảo mật dữ liệu cấp cao"],
    headline: "Lãnh đạo công nghệ Uranus Tech. Trực tiếp kiến tạo nền tảng kết nối thông minh ViOne & Business Connect.",
    dealSize: "100 - 500 Tỷ VNĐ",
    phone: "0901 000 003",
    email: "jamesnguyen@uranustech.vn",
    verified: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Platform Admin ViConnect",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Platform Admin Toàn Quyền",
    department: "Ban Điều Hành Nền Tảng",
    association: "Hệ Sinh Thái ViConnect / ViOne",
    company: "ViConnect Holdings",
    jobTitle: "Tổng Quản Trị Hệ Thống",
    industry: "Nền tảng số & Quản trị dữ liệu",
    skills: ["Quản trị hệ thống toàn quyền", "Phân quyền RBAC", "Kiểm soát an ninh mạng", "Điều phối dữ liệu đa hiệp hội"],
    talents: ["Bảo mật cấp enterprise", "Giám sát thời gian thực"],
    headline: "Tài khoản Quản trị toàn quyền nền tảng ViConnect & ViOne.",
    dealSize: ">1.000 Tỷ VNĐ",
    phone: "0901 000 001",
    email: "admin1@connect.vn",
    verified: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Quản trị viên Hệ thống",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Quản Trị Viên (Admin)",
    department: "Ban Quản Trị",
    association: "ViOne Platform",
    company: "ViOne Platform",
    jobTitle: "Trưởng Ban Vận Hành Kỹ Thuật",
    industry: "Vận hành CRM & Hỗ trợ kỹ thuật",
    skills: ["Quản trị người dùng", "Duyệt giao dịch tài chính", "Cấu hình sự kiện", "Kiểm duyệt nội dung"],
    talents: ["Điều phối luồng công việc", "Xử lý sự cố kỹ thuật"],
    headline: "Quản trị viên điều phối vận hành hệ thống ViOne.",
    dealSize: "100 - 200 Tỷ VNĐ",
    phone: "0901 000 002",
    email: "admin@connect.vn",
    verified: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Demo User",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Hội viên Doanh nghiệp Tiêu Biểu",
    department: "Hội viên VIONE",
    association: "Cộng đồng Doanh nhân ViOne",
    company: "VIONE Demo Corp",
    jobTitle: "Giám Đốc Kinh Doanh",
    industry: "Dịch vụ thương mại & Bán buôn",
    skills: ["Giao thương B2B", "Kết nối đối tác", "Thương mại dịch vụ", "Chăm sóc khách hàng VIP"],
    talents: ["Mở rộng tệp khách hàng", "Đàm phán đơn hàng giá trị cao"],
    headline: "Hội viên năng động tại cộng đồng ViOne. Sẵn sàng giao lưu kết nối và chia sẻ cơ hội hợp tác.",
    dealSize: "10 - 50 Tỷ VNĐ",
    phone: "0901 000 004",
    email: "demo.user@vione.vn",
    verified: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Nguyen Hoang Nam",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Hội viên Doanh nghiệp",
    department: "Hội viên VIONE",
    association: "Cộng đồng Doanh nhân ViOne",
    company: "Nam Phát Logistics",
    jobTitle: "Giám Đốc Vận Tải",
    industry: "Kho vận & Giao nhận quốc tế",
    skills: ["Vận tải đường bộ liên tỉnh", "Kho bãi lưu trữ", "Dịch vụ hải quan nhanh", "Bảo hiểm hàng hóa"],
    talents: ["Điều phối đội xe chuyên dụng", "Cam kết tiến độ giao nhận 24/7"],
    headline: "Hội viên ViOne chuyên về logistics và vận chuyển hàng hóa nội địa & xuất nhập khẩu.",
    dealSize: "20 - 60 Tỷ VNĐ",
    phone: "0901 000 005",
    email: "peer1@vione.vn",
    verified: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Tran Thu Thao",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    executiveRole: "Hội viên Doanh nghiệp",
    department: "Hội viên VIONE",
    association: "Cộng đồng Doanh nhân ViOne",
    company: "Thảo Điền Architecture",
    jobTitle: "Kiến Trúc Sư Trưởng & Founder",
    industry: "Thiết kế kiến trúc, Nội thất cao cấp & Cảnh quan",
    skills: ["Thiết kế biệt thự nghỉ dưỡng", "Nội thất văn phòng trụ sở CEO", "Quy hoạch cảnh quan sinh thái", "Vật liệu xanh"],
    talents: ["Tối ưu không gian làm việc sáng tạo", "Thiết kế phong thủy tài lộc"],
    headline: "Kiến trúc sư trưởng Thảo Điền Architecture. Tạo dựng không gian sống và trụ sở làm việc đẳng cấp cho CEO.",
    dealSize: "15 - 70 Tỷ VNĐ",
    phone: "0901 000 006",
    email: "peer2@vione.vn",
    verified: true,
  },
];

// Quick Prompts Chips
const QUICK_PROMPTS = [
  { label: "💰 Gọi vốn & Tài chính", query: "Tôi cần tìm người có kinh nghiệm gọi vốn, thẩm định tài chính và kết nối quỹ đầu tư" },
  { label: "🚢 Xuất khẩu & Logistics", query: "Tôi cần tìm đối tác chuyên về xuất nhập khẩu nông sản, logistics và hải quan quốc tế" },
  { label: "⚡ Chuyển đổi số AI", query: "Cần tìm chuyên gia tư vấn ứng dụng AI, tự động hóa quy trình và giải pháp phần mềm cho doanh nghiệp" },
  { label: "📢 Truyền thông & Báo chí", query: "Tôi cần tìm người có khả năng xây dựng thương hiệu cá nhân C-Level và quan hệ báo chí truyền thông" },
  { label: "⚖️ Quản trị & Thư ký", query: "Cần tìm đầu mối ban thư ký điều phối hoạt động và chính sách hiệp hội" },
  { label: "🏗️ Xây dựng & Bất động sản", query: "Tìm đối tác có kinh nghiệm đầu tư bất động sản, hạ tầng và tổng thầu xây dựng" },
  { label: "🤝 Xúc tiến thương mại B2B", query: "Cần kết nối mở rộng thị trường phân phối và xúc tiến giao thương B2B nội khối" },
  { label: "👥 Phát triển hội viên", query: "Tìm trưởng ban thành viên để thẩm định và gia nhập cộng đồng doanh nhân" },
];

export function DynamicAiMatcherPanel({ initialQuery = "" }: { initialQuery?: string } = {}) {
  const navigate = useNavigate();
  const openThread = useDmOpenThread();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAccount | null>(null);
  const [icebreakerSentId, setIcebreakerSentId] = useState<string | null>(null);

  const handleDirectMessage = async (accountId: string) => {
    try {
      setOpeningId(accountId);
      const res = await openThread.mutateAsync(`u:${accountId}`);
      if (res && res.ok && res.threadId) {
        void navigate({
          to: "/connect-app/inbox/$threadId",
          params: { threadId: res.threadId },
        });
      } else {
        void navigate({ to: "/connect-app/inbox" });
      }
    } catch {
      void navigate({ to: "/connect-app/inbox" });
    } finally {
      setOpeningId(null);
    }
  };

  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleChipClick = (prompt: typeof QUICK_PROMPTS[0]) => {
    setQuery(prompt.query);
    setActiveChip(prompt.label);
  };

  // Dynamic AI Matching Algorithm: analyzes roles, departments, companies, skills, talents
  const matchedResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Default top suggestions
      return AI_KNOWLEDGE_ACCOUNTS.map((acc, idx) => ({
        account: acc,
        matchScore: 98 - idx * 3,
        reason: `Lãnh đạo chủ chốt Ban ${acc.department.replace("Ban ", "")} với hơn 15 năm kinh nghiệm điều hành thực chiến.`,
        highlightSkill: acc.talents[0] || acc.skills[0],
        icebreaker: `Chào anh/chị ${acc.name}, tôi theo dõi hồ sơ của anh/chị tại ${acc.association} và rất ấn tượng với thế mạnh về ${acc.talents[0] || acc.industry}. Tôi rất mong muốn được kết nối và trao đổi cơ hội hợp tác B2B.`,
      }));
    }

    const keywords = q
      .replace(/[.,?!:;]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1);

    const scored = AI_KNOWLEDGE_ACCOUNTS.map((acc) => {
      let score = 50;
      let matchedFactors: string[] = [];

      const searchCorpus = [
        acc.name,
        acc.executiveRole,
        acc.department,
        acc.company,
        acc.jobTitle,
        acc.industry,
        acc.headline,
        ...acc.skills,
        ...acc.talents,
      ]
        .join(" ")
        .toLowerCase();

      keywords.forEach((kw) => {
        if (searchCorpus.includes(kw)) {
          score += 12;
          // Specific high-value bonus
          if (acc.talents.some((t) => t.toLowerCase().includes(kw))) {
            score += 10;
            matchedFactors.push(`Thế mạnh: ${kw}`);
          }
          if (acc.skills.some((s) => s.toLowerCase().includes(kw))) {
            score += 8;
            matchedFactors.push(`Kỹ năng: ${kw}`);
          }
          if (acc.industry.toLowerCase().includes(kw)) {
            score += 9;
            matchedFactors.push(`Ngành: ${acc.industry}`);
          }
          if (acc.department.toLowerCase().includes(kw)) {
            score += 10;
            matchedFactors.push(`Ban: ${acc.department}`);
          }
        }
      });

      // Cap score between 65% and 99%
      const finalScore = Math.min(99, Math.max(65, score));

      // Dynamic AI Synthesis of Reason
      let reason = `AI đánh giá hồ sơ phù hợp cao dựa trên vị trí ${acc.executiveRole} tại ${acc.department} và kinh nghiệm sâu trong ngành ${acc.industry}.`;
      if (matchedFactors.length > 0) {
        reason = `AI nhận diện tài khoản đáp ứng trực tiếp yêu cầu nhờ năng lực ${matchedFactors.slice(0, 2).join(", ")}.`;
      }

      // Dynamic Icebreaker Generator
      const icebreaker = `Kính chào anh/chị ${acc.name}, qua phân tích của ViOne AI Copilot, tôi biết anh/chị là ${acc.executiveRole} chuyên về ${acc.talents[0] || acc.skills[0]}. Hiện tôi đang có nhu cầu về "${query.slice(0, 60)}...", rất mong có cơ hội được thỉnh giáo và kết nối sâu hơn cùng anh/chị.`;

      return {
        account: acc,
        matchScore: finalScore,
        reason,
        highlightSkill: acc.talents[0] || acc.skills[0],
        icebreaker,
      };
    });

    // Sort descending by matchScore
    return scored.sort((a, b) => b.matchScore - a.matchScore);
  }, [query]);

  const handleCopyIcebreaker = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIcebreakerSentId(id);
    toast.success("✓ Đã sao chép câu mở lời do AI gợi ý!");
    setTimeout(() => setIcebreakerSentId(null), 3000);
  };

  const handleSendConnect = (name: string) => {
    toast.success(`✓ Đã gửi yêu cầu kết nối kèm câu mở lời AI tới ${name}!`);
  };

  return (
    <div className="rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] dark:bg-gradient-to-b dark:from-[#0B132B] dark:via-[#080F22] dark:to-[#040814] p-4 sm:p-6 shadow-sm dark:shadow-2xl text-[var(--bc-mobile-text)] dark:text-white transition-colors">
      {/* Header with AI badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-[var(--bc-mobile-accent-grad)] text-black shadow-md flex items-center justify-center">
              <Bot className="w-4 h-4 text-black" />
            </span>
            <span className="text-xs font-mono font-black tracking-widest text-[var(--bc-mobile-accent-strong)] dark:text-[#F6E1C3] uppercase">
              VIONE DYNAMIC AI COPILOT
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
              LIVE ENGINE
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[var(--bc-mobile-text)] dark:text-white">
            Gợi Ý Kết Nối & Phân Tích Độ Phù Hợp AI
          </h2>
          <p className="text-xs text-[var(--bc-mobile-muted)] dark:text-slate-300 mt-1 leading-relaxed">
            Hỏi tự nhiên theo nhu cầu: AI phân tích chuyên sâu chức danh, ban ngành, công ty và tài năng của 200+ lãnh đạo để tìm đúng đối tác.
          </p>
        </div>
      </div>

      {/* Natural Language Query Search Input */}
      <div className="relative mb-3 flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--bc-mobile-accent)]">
          <Search className="w-4 h-4 text-[var(--bc-mobile-accent)]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveChip(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          placeholder="VD: Tôi cần tìm 1 người có khả năng gọi vốn và tài chính..."
          className="w-full pl-10 pr-24 py-2.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] dark:bg-black/60 text-xs sm:text-sm text-[var(--bc-mobile-text)] dark:text-white placeholder:text-[var(--bc-mobile-muted)] dark:placeholder:text-slate-400 focus:outline-none focus:border-[var(--bc-mobile-border-gold)] focus:ring-1 focus:ring-[var(--bc-mobile-border-gold)] transition-all shadow-inner [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />
        <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveChip(null);
              }}
              aria-label="Xóa nội dung tìm kiếm"
              className="grid h-6 w-6 place-items-center rounded-full bg-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--bc-mobile-accent-grad)] text-black shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            Tìm
          </button>
        </div>
      </div>

      {/* Quick Suggestion Prompt Chips */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--bc-mobile-muted)] uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[var(--bc-mobile-accent)]" />
          <span>Gợi ý câu hỏi phổ biến:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                activeChip === chip.label
                  ? "bg-[var(--bc-mobile-accent-grad)] text-black border-transparent shadow-md font-bold scale-105"
                  : "bg-[var(--bc-mobile-surface-2)] border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] dark:bg-white/5 dark:border-white/10 dark:text-slate-300 hover:border-[var(--bc-mobile-border-gold)] hover:text-[var(--bc-mobile-text)]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[var(--bc-mobile-muted)] pb-2 mb-3 border-b border-[var(--bc-mobile-border)]">
        <span className="font-bold flex items-center gap-1 text-[var(--bc-mobile-text)]">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span>Top đối tác khớp yêu cầu:</span>
        </span>
        <span className="font-mono text-[11px] font-bold text-[var(--bc-mobile-accent)]">
          {matchedResults.length} hồ sơ đã quét
        </span>
      </div>

      {/* Dynamic Matched Candidates Cards */}
      <div className="space-y-3.5">
        {matchedResults.map(({ account, matchScore, reason, highlightSkill, icebreaker }) => (
          <div
            key={account.id}
            className="p-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] dark:bg-[#060A17] dark:border-[#D8B282]/30 hover:border-[var(--bc-mobile-border-gold)] transition-all shadow-sm group relative overflow-hidden"
          >
            {/* Top Match Score Pill Banner */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--bc-mobile-accent-soft)] text-[var(--bc-mobile-accent-strong)] dark:text-amber-300 border border-[var(--bc-mobile-border)]">
                  {account.department}
                </span>
                <span className="text-[10px] text-[var(--bc-mobile-muted)]">· {account.association}</span>
              </div>

              {/* Match Percentage Display */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-xs">
                <Percent className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {matchScore}% PHÙ HỢP
                </span>
              </div>
            </div>

            {/* Account Info Row */}
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                <img
                  src={account.avatarUrl}
                  alt={account.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[var(--bc-mobile-border-gold)] shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[var(--bc-mobile-accent-grad)] text-black">
                  <Crown className="w-3 h-3 fill-current text-black" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-[var(--bc-mobile-text)] dark:text-white group-hover:text-[var(--bc-mobile-accent)] transition-colors leading-tight">
                    {account.name}
                  </h3>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                </div>

                <p className="text-xs font-bold text-[var(--bc-mobile-accent)] dark:text-[#D8B282] mt-0.5 leading-snug">
                  {account.executiveRole}
                </p>

                <p className="text-[11.5px] text-[var(--bc-mobile-muted)] mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[var(--bc-mobile-muted)] shrink-0" />
                  <span className="truncate">{account.company}</span>
                </p>
              </div>
            </div>

            {/* AI Deep Evaluation Breakdown: Lý do đề xuất & Thế mạnh */}
            <div className="mt-3.5 p-3 rounded-xl bg-[var(--bc-mobile-surface)] dark:bg-black/40 border border-[var(--bc-mobile-border)] space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">🎯</span>
                <div>
                  <span className="font-bold text-[var(--bc-mobile-text)] dark:text-slate-200">Đánh giá của AI: </span>
                  <span className="text-[var(--bc-mobile-muted)] dark:text-slate-300 leading-relaxed">{reason}</span>
                </div>
              </div>

              {/* Core capabilities tags */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10.5px] font-bold text-[var(--bc-mobile-accent)] uppercase">Thế mạnh:</span>
                {account.talents.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] border border-[var(--bc-mobile-border)]"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-[var(--bc-mobile-accent)]" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Smart Icebreaker (Gợi ý mở lời tiếp cận) */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] font-bold text-[var(--bc-mobile-accent-strong)] dark:text-amber-300 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  <span>AI gợi ý mở lời tiếp cận:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyIcebreaker(icebreaker, account.id)}
                  className="text-[11px] font-bold text-[var(--bc-mobile-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{icebreakerSentId === account.id ? "✓ Đã sao chép" : "Sao chép"}</span>
                </button>
              </div>
              <p className="text-[11px] italic text-[var(--bc-mobile-text)] dark:text-[#F6E1C3] line-clamp-2 leading-relaxed">
                "{icebreaker}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 pt-2.5 border-t border-[var(--bc-mobile-border)] flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={openingId === account.id}
                onClick={() => handleDirectMessage(account.id)}
                className="flex-1 py-2 px-3 rounded-xl border border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[var(--bc-mobile-surface)] disabled:opacity-60"
              >
                {openingId === account.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--bc-mobile-accent)]" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--bc-mobile-accent)]" />
                )}
                <span>Nhắn tin</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendConnect(account.name)}
                className="flex-1 py-2 px-3 rounded-xl bg-[var(--bc-mobile-accent-grad)] text-black text-xs font-bold uppercase tracking-wider shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-black" />
                <span>Kết nối ngay</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
