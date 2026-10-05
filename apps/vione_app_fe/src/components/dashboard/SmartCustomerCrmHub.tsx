import { useState, useMemo } from "react";
import {
  Sparkles,
  Flame,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  QrCode,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Tag,
  Plus,
  Download,
  FileText,
  ChevronRight,
  Building2,
  UserCheck,
  Send,
  SlidersHorizontal,
  Search,
  Filter,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { downloadCsv } from "@/lib/csv";

export interface SmartCustomer {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  source: "nfc" | "ocr_card" | "b2b_network" | "website_lead";
  sourceLabel: string;
  stage: "prospect" | "consulting" | "won" | "nurturing";
  stageLabel: string;
  leadScore: number;
  dealValue: number; // VND
  needSummary: string;
  industry: string;
  lastContactAt: string;
  cadenceStatus: "ok" | "due_today" | "overdue";
  cadenceNote: string;
  tags: string[];
  aiPitch: string;
}

const INITIAL_SMART_CUSTOMERS: SmartCustomer[] = [
  {
    id: "sc-1",
    name: "Trần Anh Tuấn",
    title: "Tổng Giám Đốc",
    company: "Tập Đoàn Bất Động Sản An Phát",
    phone: "0912 345 678",
    email: "tuan.tran@anphatgroup.vn",
    source: "nfc",
    sourceLabel: "Chạm thẻ NFC ViOne",
    stage: "consulting",
    stageLabel: "Đang tư vấn 1-1",
    leadScore: 96,
    dealValue: 1200000000,
    needSummary: "Cần tìm giải pháp ViOne ERP quản trị 5 tòa nhà văn phòng và thẻ cư dân số Titanium",
    industry: "Bất động sản & Quản lý tòa nhà",
    lastContactAt: "Hôm nay, 08:30",
    cadenceStatus: "due_today",
    cadenceNote: "Cần gửi bản demo tính năng tự động hóa và bảng báo giá giải pháp",
    tags: ["VIP C-Level", "Đối tác chiến lược", "NFC Verified"],
    aiPitch: "Tập đoàn An Phát đang mở rộng 3 dự án mới tại Hà Nội. Nên đề xuất gói giải pháp ViOne Enterprise tích hợp thẻ định danh cư dân NFC để tối ưu chi phí vận hành.",
  },
  {
    id: "sc-2",
    name: "Nguyễn Thị Mai Lan",
    title: "Giám Đốc Chuỗi Cung Ứng",
    company: "Công ty Cổ phần Thực phẩm Xanh EcoFood",
    phone: "0983 888 999",
    email: "lan.nguyen@ecofood.com.vn",
    source: "ocr_card",
    sourceLabel: "Quét danh thiếp AI OCR",
    stage: "prospect",
    stageLabel: "Tiềm năng mới",
    leadScore: 89,
    dealValue: 650000000,
    needSummary: "Tìm đơn vị cung ứng bao bì Kraft sinh học phân hủy hoàn toàn 500,000 sản phẩm/tháng",
    industry: "F&B & Nông sản sạch",
    lastContactAt: "Hôm qua, 14:15",
    cadenceStatus: "ok",
    cadenceNote: "Đã gửi hồ sơ năng lực sơ bộ qua email",
    tags: ["B2B Supply Chain", "Doanh nghiệp Xanh", "Hot Lead"],
    aiPitch: "EcoFood vừa đạt chứng nhận ISO 22000 và đang tìm kiếm nhà cung cấp bao bì thân thiện môi trường. Nhắc lại cam kết chứng chỉ FSC và chiết khấu đơn hàng lớn.",
  },
  {
    id: "sc-3",
    name: "Lê Hoàng Long",
    title: "Chủ tịch HĐQT",
    company: "Tập Đoàn Cơ Điện & Năng Lượng Long Phát",
    phone: "0903 111 222",
    email: "long.le@longphat.com",
    source: "b2b_network",
    sourceLabel: "Kết nối Doanh nhân 1-1",
    stage: "won",
    stageLabel: "Đã ký hợp đồng",
    leadScore: 98,
    dealValue: 2400000000,
    needSummary: "Triển khai giải pháp CRM Doanh nghiệp toàn diện cho 250 kỹ sư & kinh doanh",
    industry: "Năng lượng & Cơ điện công nghiệp",
    lastContactAt: "2 ngày trước",
    cadenceStatus: "ok",
    cadenceNote: "Lịch kickoff dự án vào Thứ Năm tuần tới",
    tags: ["VIP Hạng Kim Cương", "Doanh thu > 500 tỷ", "Khách hàng thân thiết"],
    aiPitch: "Tập đoàn Long Phát có chu kỳ bảo dưỡng quý IV rất bận rộn. Cần chuẩn bị lộ trình đào tạo nhân sự nhanh gọn trong 2 tuần.",
  },
  {
    id: "sc-4",
    name: "Phạm Hải Đăng",
    title: "Giám Đốc Công Nghệ (CTO)",
    company: "NextGen SaaS Solutions Vietnam",
    phone: "0938 777 666",
    email: "dang.pham@nextgensaas.io",
    source: "website_lead",
    sourceLabel: "Đăng ký từ Website ViOne",
    stage: "prospect",
    stageLabel: "Cần liên hệ lại",
    leadScore: 84,
    dealValue: 450000000,
    needSummary: "Tìm kiếm đối tác công nghệ có doanh thu MRR từ 200 triệu để rót vốn vòng Seed/Pre-A",
    industry: "Công nghệ thông tin & AI",
    lastContactAt: "3 ngày trước",
    cadenceStatus: "overdue",
    cadenceNote: "⚠ Quá hạn 2 ngày chưa gọi điện tư vấn chi tiết",
    tags: ["Tech Investor", "Seed Fund", "Cần gọi ngay"],
    aiPitch: "NextGen đang có quỹ đầu tư mạo hiểm quan tâm đến mô hình AI Matching cho doanh nghiệp của ViOne. Hãy đặt lịch hẹn 1-1 với CEO ngay trong hôm nay.",
  },
  {
    id: "sc-5",
    name: "Vũ Đình Trọng",
    title: "Phó Tổng Giám Đốc",
    company: "Tổng Công Ty Xây Dựng & Hạ Tầng Miền Bắc",
    phone: "0977 555 444",
    email: "trong.vu@infrabac.vn",
    source: "nfc",
    sourceLabel: "Chạm thẻ NFC ViOne",
    stage: "nurturing",
    stageLabel: "Chăm sóc định kỳ",
    leadScore: 78,
    dealValue: 800000000,
    needSummary: "Cần tìm tổng thầu xây dựng cụm nhà xưởng tiêu chuẩn LEED 15,000m² tại KCN Nam Tân Uyên",
    industry: "Xây dựng công nghiệp & Hạ tầng",
    lastContactAt: "5 ngày trước",
    cadenceStatus: "due_today",
    cadenceNote: "Nhắc lịch gửi thiệp mời tham gia Hội thảo Xúc tiến Thương mại ViOne",
    tags: ["LEED Project", "C-Level Network", "Đối tác dự thầu"],
    aiPitch: "Tổng thầu Hạ Tầng Miền Bắc chuẩn bị mở thầu gói EPC nhà xưởng. Gửi kèm hồ sơ năng lực liên danh của CLB Xúc tiến Thương mại ViOne.",
  },
];

export function SmartCustomerCrmHub() {
  const t = useT();
  const [customers, setCustomers] = useState<SmartCustomer[]>(INITIAL_SMART_CUSTOMERS);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedCadence, setSelectedCadence] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCustomerForDetail, setActiveCustomerForDetail] = useState<SmartCustomer | null>(null);
  const [aiPitchModalCustomer, setAiPitchModalCustomer] = useState<SmartCustomer | null>(null);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState<boolean>(false);

  // Form thêm khách hàng mới
  const [newCustName, setNewCustName] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustTitle, setNewCustTitle] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustNeed, setNewCustNeed] = useState("");
  const [newCustSource, setNewCustSource] = useState<"nfc" | "ocr_card" | "b2b_network" | "website_lead">("nfc");

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedSource !== "all" && c.source !== selectedSource) return false;
      if (selectedStage !== "all" && c.stage !== selectedStage) return false;
      if (selectedCadence === "due_today" && c.cadenceStatus !== "due_today") return false;
      if (selectedCadence === "overdue" && c.cadenceStatus !== "overdue") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.needSummary.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [customers, selectedSource, selectedStage, selectedCadence, searchQuery]);

  // Aggregate stats
  const totalCount = customers.length;
  const hotLeadsCount = customers.filter((c) => c.leadScore >= 80).length;
  const overdueCount = customers.filter((c) => c.cadenceStatus === "overdue").length;
  const totalPipelineValue = customers.reduce((sum, c) => sum + c.dealValue, 0);

  const formatVnd = (val: number) => {
    if (val >= 1000000000) {
      return (val / 1000000000).toFixed(2) + " tỷ đ";
    }
    return (val / 1000000).toFixed(0) + " tr đ";
  };

  const handleStageChange = (id: string, newStage: SmartCustomer["stage"]) => {
    const stageMap: Record<SmartCustomer["stage"], string> = {
      prospect: "Tiềm năng mới",
      consulting: "Đang tư vấn 1-1",
      won: "Đã chốt hợp đồng",
      nurturing: "Chăm sóc định kỳ",
    };
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage, stageLabel: stageMap[newStage] } : c))
    );
    toast.success("Đã cập nhật giai đoạn khách hàng trong CRM");
  };

  const handleExportCsv = () => {
    const columns = [
      { header: "Họ và tên", value: (c: SmartCustomer) => c.name },
      { header: "Chức vụ", value: (c: SmartCustomer) => c.title },
      { header: "Doanh nghiệp", value: (c: SmartCustomer) => c.company },
      { header: "Số điện thoại", value: (c: SmartCustomer) => c.phone },
      { header: "Email", value: (c: SmartCustomer) => c.email },
      { header: "Nguồn thu thập", value: (c: SmartCustomer) => c.sourceLabel },
      { header: "Điểm tiềm năng AI", value: (c: SmartCustomer) => `${c.leadScore}/100` },
      { header: "Giai đoạn", value: (c: SmartCustomer) => c.stageLabel },
      { header: "Giá trị dự kiến (VNĐ)", value: (c: SmartCustomer) => c.dealValue },
      { header: "Nhu cầu kết nối", value: (c: SmartCustomer) => c.needSummary },
    ];
    downloadCsv("vione_smart_customers_crm.csv", filteredCustomers, columns);
    toast.success("Đã xuất danh sách khách hàng thông minh ra file CSV");
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      toast.error("Vui lòng điền họ tên và số điện thoại khách hàng");
      return;
    }
    const sourceLabelMap = {
      nfc: "Chạm thẻ NFC ViOne",
      ocr_card: "Quét danh thiếp AI OCR",
      b2b_network: "Kết nối Doanh nhân 1-1",
      website_lead: "Đăng ký từ Website ViOne",
    };
    const newCust: SmartCustomer = {
      id: `sc-${Date.now()}`,
      name: newCustName.trim(),
      company: newCustCompany.trim() || "Doanh nghiệp ViOne",
      title: newCustTitle.trim() || "Đại diện Doanh nghiệp",
      phone: newCustPhone.trim(),
      email: newCustEmail.trim() || "customer@connect.vn",
      source: newCustSource,
      sourceLabel: sourceLabelMap[newCustSource],
      stage: "prospect",
      stageLabel: "Tiềm năng mới",
      leadScore: 85,
      dealValue: 500000000,
      needSummary: newCustNeed.trim() || "Quan tâm đến giải pháp số và hệ sinh thái ViOne",
      industry: "Thương mại & Dịch vụ",
      lastContactAt: "Vừa xong",
      cadenceStatus: "ok",
      cadenceNote: "Khách hàng vừa được thêm vào hệ thống",
      tags: ["Khách hàng mới", "CRM Synced"],
      aiPitch: `Khách hàng ${newCustName} từ ${newCustCompany || "doanh nghiệp đối tác"} vừa kết nối qua kênh ${sourceLabelMap[newCustSource]}. Hãy gọi điện giới thiệu và đặt lịch gặp gỡ 1-1.`,
    };
    setCustomers([newCust, ...customers]);
    setNewCustomerModalOpen(false);
    setNewCustName("");
    setNewCustCompany("");
    setNewCustTitle("");
    setNewCustPhone("");
    setNewCustEmail("");
    setNewCustNeed("");
    toast.success("Đã thêm khách hàng thành công vào hệ thống CRM");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & KPI Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Tổng khách hàng */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-[#DFB76C]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Khách hàng Thông minh
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#DFB76C]/15 text-[#8C653B] dark:text-[#DFB76C]">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {totalCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+12% tuần này</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Đồng bộ tự động từ Mobile App & NFC</p>
        </div>

        {/* KPI 2: Cơ hội Hot (Score >= 80) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-[#DFB76C]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cơ hội tiềm năng cao (AI)
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {hotLeadsCount}
            </span>
            <span className="text-xs font-bold text-[#8C653B] dark:text-[#DFB76C]">C-Level & VIP Deal</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Điểm phân tích tiềm năng AI ≥ 80</p>
        </div>

        {/* KPI 3: Cảnh báo Cadence / SLA */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-[#DFB76C]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cần chăm sóc ngay
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {overdueCount}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Quá hạn SLA</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tỉ lệ phản hồi đa kênh đạt 98.4%</p>
        </div>

        {/* KPI 4: Giá trị Pipeline */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-[#DFB76C]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Giá trị Pipeline dự kiến
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#8C653B] dark:text-[#DFB76C]">
              {formatVnd(totalPipelineValue)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">5 hợp đồng trọng điểm quý này</p>
        </div>
      </div>

      {/* 2. Control Bar: Search, Filters, Add Customer & Export */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách hàng, doanh nghiệp, số điện thoại hoặc nhu cầu..."
            className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#DFB76C] focus:ring-1 focus:ring-[#DFB76C]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nguồn */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">Tất cả nguồn thu thập</option>
            <option value="nfc">Thẻ NFC ViOne</option>
            <option value="ocr_card">Quét danh thiếp AI OCR</option>
            <option value="b2b_network">Kết nối Doanh nhân 1-1</option>
            <option value="website_lead">Website ViOne Lead</option>
          </select>

          {/* Giai đoạn */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">Tất cả giai đoạn</option>
            <option value="prospect">Tiềm năng mới</option>
            <option value="consulting">Đang tư vấn 1-1</option>
            <option value="won">Đã chốt hợp đồng</option>
            <option value="nurturing">Chăm sóc định kỳ</option>
          </select>

          {/* Cadence / SLA */}
          <select
            value={selectedCadence}
            onChange={(e) => setSelectedCadence(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">Tất cả trạng thái chăm sóc</option>
            <option value="due_today">Cần liên hệ hôm nay</option>
            <option value="overdue">⚠ Quá hạn liên hệ</option>
          </select>

          {/* Buttons: Export & Add */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setNewCustomerModalOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#E8C98E] to-[#C99E55] px-4 text-xs font-bold text-slate-950 shadow-md shadow-[#DFB76C]/25 hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* 3. Customer Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-[#DFB76C]/60 hover:shadow-md"
          >
            <div>
              {/* Top Row: AI Score, Source Badge, Cadence Alert */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                      cust.leadScore >= 90
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        : cust.leadScore >= 80
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    <Flame className="h-3 w-3" />
                    <span>AI Lead: {cust.leadScore}/100</span>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {cust.source === "nfc" && <CreditCard className="h-3 w-3 text-[#8C653B] dark:text-[#DFB76C]" />}
                    {cust.source === "ocr_card" && <QrCode className="h-3 w-3 text-blue-500" />}
                    {cust.source === "b2b_network" && <UserCheck className="h-3 w-3 text-emerald-500" />}
                    {cust.source === "website_lead" && <Send className="h-3 w-3 text-purple-500" />}
                    <span>{cust.sourceLabel}</span>
                  </span>
                </div>

                {cust.cadenceStatus === "overdue" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Quá hạn SLA</span>
                  </span>
                ) : cust.cadenceStatus === "due_today" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                    <Clock className="h-3 w-3" />
                    <span>Cần chăm sóc hôm nay</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>SLA Đạt</span>
                  </span>
                )}
              </div>

              {/* Main Info: Name, Title, Company */}
              <div className="mt-4 flex items-start gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#2A2016] to-[#14110E] text-base font-extrabold text-[#DFB76C] border border-[#DFB76C]/30 shadow-xs">
                  {cust.name.split(" ").slice(-1)[0][0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {cust.name}
                    </h3>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#8C653B] dark:text-[#DFB76C]" />
                  </div>
                  <p className="text-xs font-semibold text-[#8C653B] dark:text-[#DFB76C] truncate">{cust.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{cust.company}</p>
                </div>
              </div>

              {/* Need Summary & Deal Value */}
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Nhu cầu kết nối & Hợp tác:</span>
                  <span className="font-bold text-[#8C653B] dark:text-[#DFB76C]">
                    Deal dự kiến: {formatVnd(cust.dealValue)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium line-clamp-2">
                  {cust.needSummary}
                </p>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {cust.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10.5px] font-medium text-slate-600 dark:text-slate-400"
                  >
                    <Tag className="h-2.5 w-2.5 text-[#8C653B] dark:text-[#DFB76C]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions & Stage Selector */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              {/* Stage dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Giai đoạn:</span>
                <select
                  value={cust.stage}
                  onChange={(e) => handleStageChange(cust.id, e.target.value as SmartCustomer["stage"])}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="prospect">Tiềm năng mới</option>
                  <option value="consulting">Đang tư vấn 1-1</option>
                  <option value="won">Đã chốt hợp đồng</option>
                  <option value="nurturing">Chăm sóc định kỳ</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${cust.phone}`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#DFB76C] hover:text-[#8C653B] transition"
                  title={`Gọi ${cust.phone}`}
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>

                <a
                  href={`mailto:${cust.email}?subject=ViOne%20Connect%20-%20Hợp%20tác%20kinh%20doanh`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#DFB76C] hover:text-[#8C653B] transition"
                  title={`Gửi email ${cust.email}`}
                >
                  <Mail className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setAiPitchModalCustomer(cust)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#DFB76C]/40 bg-[#DFB76C]/10 px-2.5 text-xs font-bold text-[#8C653B] dark:text-[#DFB76C] hover:bg-[#DFB76C]/20 transition cursor-pointer"
                  title="Gợi ý kịch bản mở rộng hợp tác AI"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Pitch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCustomerForDetail(cust)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <span>Chi tiết</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Sparkles className="h-10 w-10 text-slate-400 mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy khách hàng phù hợp</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Hãy thử thay đổi điều kiện lọc hoặc thêm mới khách hàng từ ứng dụng ViOne Mobile qua quét danh thiếp / thẻ NFC.
          </p>
        </div>
      )}

      {/* 4. Modal: AI Pitch / Kịch bản kết nối thông minh */}
      {aiPitchModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-[#DFB76C]/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#DFB76C]/15 text-[#8C653B] dark:text-[#DFB76C]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Kịch bản Kết nối AI • {aiPitchModalCustomer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAiPitchModalCustomer(null)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Đánh giá tiềm năng từ AI Engine ViOne:
                </p>
                <p className="leading-relaxed">{aiPitchModalCustomer.aiPitch}</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Doanh nghiệp:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{aiPitchModalCustomer.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngành nghề:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{aiPitchModalCustomer.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhu cầu chính:</span>
                  <span className="font-semibold text-[#8C653B] dark:text-[#DFB76C] text-right max-w-xs">{aiPitchModalCustomer.needSummary}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <a
                  href={`tel:${aiPitchModalCustomer.phone}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Gọi ngay ({aiPitchModalCustomer.phone})</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(aiPitchModalCustomer.aiPitch);
                    toast.success("Đã sao chép kịch bản AI vào bộ nhớ tạm");
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#E8C98E] to-[#C99E55] px-4 text-xs font-bold text-slate-950 shadow-md shadow-[#DFB76C]/25 hover:brightness-105 transition cursor-pointer"
                >
                  <span>Sao chép kịch bản</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Thêm khách hàng mới thủ công */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Thêm Khách hàng vào CRM ViOne
              </h3>
              <button
                type="button"
                onClick={() => setNewCustomerModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs sm:text-sm outline-none focus:border-[#DFB76C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doanh nghiệp / Tổ chức
                </label>
                <input
                  type="text"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  placeholder="Ví dụ: Tập đoàn An Phát"
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs sm:text-sm outline-none focus:border-[#DFB76C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="0988 123 456"
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs sm:text-sm outline-none focus:border-[#DFB76C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nguồn thu thập
                  </label>
                  <select
                    value={newCustSource}
                    onChange={(e) => setNewCustSource(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 text-xs font-semibold outline-none"
                  >
                    <option value="nfc">Thẻ NFC ViOne</option>
                    <option value="ocr_card">Quét danh thiếp</option>
                    <option value="b2b_network">Gặp gỡ 1-1</option>
                    <option value="website_lead">Website ViOne</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nhu cầu kết nối & Hợp tác
                </label>
                <textarea
                  rows={2}
                  value={newCustNeed}
                  onChange={(e) => setNewCustNeed(e.target.value)}
                  placeholder="Ví dụ: Cần tìm giải pháp ERP và nhà cung cấp vật liệu xây dựng..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs sm:text-sm outline-none focus:border-[#DFB76C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCustomerModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#E8C98E] to-[#C99E55] px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-[#DFB76C]/25"
                >
                  Lưu vào CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
