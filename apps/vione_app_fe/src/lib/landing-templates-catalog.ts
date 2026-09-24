export type LandingTemplateCategory = "b2b" | "executive" | "tech" | "association";

export type LandingTemplateMeta = {
  id: string;
  name: string;
  versionLabel: string;
  category: LandingTemplateCategory;
  categoryName: string;
  tagline: string;
  description: string;
  tags: string[];
  themeColor: string;
  badge?: string;
  previewRoute: string;
  recommendedFor: string;
  features: string[];
};

export const LANDING_TEMPLATES_CATALOG: LandingTemplateMeta[] = [
  {
    id: "vione-gold-white",
    name: "ViOne Connect — Vàng Đồng Ánh Kim & Trắng Tinh Khiết",
    versionLabel: "Official ViOne 5.0",
    category: "b2b",
    categoryName: "Hệ Sinh Thái ViOne",
    tagline: "Sắc vàng đồng vương giả & Trắng ngọc trai — Kết nối kinh doanh 5.0",
    description:
      "Giao diện chuẩn nhận diện ViOne với tone màu vàng đồng sáng ánh kim như logo icon ViOne, nền trắng ngọc trai, text đen thanh lịch. Tích hợp trọn vẹn 3 trụ cột: ViOne Connect App, Hệ thống CRM Doanh nghiệp cô lập và Danh thiếp Titanium NFC 1-chạm.",
    tags: ["ViOne Official", "Vàng Đồng Ánh Kim", "Trắng & Đen", "Hợp Nhất CRM", "NFC 1-Chạm"],
    themeColor: "#DFB76C",
    badge: "Mặc định ViOne",
    previewRoute: "/landing?template=vione-gold-white",
    recommendedFor: "Hệ sinh thái ViOne Connect, viconnect.vn, doanh nghiệp thành viên và đối tác chiến lược.",
    features: [
      "Tone vàng đồng sang trọng (#DFB76C, #D4AF37) kết hợp nền trắng ngọc trai & chữ đen",
      "Hiệu ứng chữ đa dạng: Morphing text, Gold shimmer, Kinetic counters, Floating badges",
      "Cổng chuyển trực tiếp vào Hệ thống CRM Doanh nghiệp cô lập 163 bảng dữ liệu",
      "Khu vực tải ứng dụng ViOne Connect (Android APK trực tiếp & iOS TestFlight)",
    ],
  },
  {
    id: "b2b-v1",
    name: "B2B Ecosystem Standard",
    versionLabel: "Template V1",
    category: "b2b",
    categoryName: "Doanh Nghiệp B2B",
    tagline: "Hệ sinh thái kết nối kinh doanh toàn diện — Chuẩn B2B Enterprise",
    description:
      "Giao diện chuẩn chỉ gồm Hero 3D tương tác, hệ sinh thái 8 phân hệ, giải pháp kết nối giao thương B2B, hồ sơ đối tác chiến lược và form đăng nhập/đăng ký nhanh.",
    tags: ["Chuẩn B2B", "3D Hero", "Đa phân hệ", "Đối tác chiến lược"],
    themeColor: "#0284c7",
    badge: "Tiêu chuẩn",
    previewRoute: "/business-connect/v1",
    recommendedFor: "Doanh nghiệp thương mại, sàn kết nối B2B và hiệp hội tổng hợp.",
    features: [
      "Hero 3D Card tương tác chuyển động mượt mà",
      "Khối Ecosystem tích hợp 8 trụ cột ViOne",
      "Khu vực giới thiệu đối tác & case studies",
      "Kêu gọi hành động CTA chuyển đổi cao",
    ],
  },
  {
    id: "b2b-v2",
    name: "Executive Zen & Flow",
    versionLabel: "Template V2",
    category: "executive",
    categoryName: "Doanh Nhân Lãnh Đạo",
    tagline: "Phong cách tối giản, thiền định doanh nhân — Tĩnh tại & Tinh tế",
    description:
      "Tông nền đá đen huyền bí Slate/Obsidian điểm xuyết ánh vàng Champagne thanh lịch. Bố cục rộng rãi, thoáng đạt, mang lại cảm giác an yên và đẳng cấp cho nhà lãnh đạo.",
    tags: ["Tối giản", "Dark Gold", "Zen Flow", "Thanh lịch"],
    themeColor: "#D8B282",
    badge: "Thịnh hành",
    previewRoute: "/business-connect/v2",
    recommendedFor: "Nhóm doanh nhân cấp cao, câu lạc bộ golf, câu lạc bộ đầu tư.",
    features: [
      "Bảng màu Slate & Champagne Gold độc bản",
      "Hiệu ứng cuộn Flow êm dịu, không giật lag",
      "Tập trung trải nghiệm đọc và giá trị cốt lõi",
      "Tối ưu hiển thị hoàn hảo trên màn hình OLED",
    ],
  },
  {
    id: "b2b-v3",
    name: "Heritage & Prestige Trust",
    versionLabel: "Template V3",
    category: "association",
    categoryName: "Hiệp Hội Uy Tín",
    tagline: "Di sản & Uy tín vĩnh cửu — Tôn vinh giá trị truyền thống hoàng gia",
    description:
      "Lấy cảm hứng từ các hiệp hội quý tộc và viện hàn lâm, kết hợp hoa văn phôi đồng cổ điển, huy hiệu hoàng gia dập nổi và đường nét kiến trúc La Mã uy nghiêm.",
    tags: ["Di sản", "Prestige", "Huy hiệu cổ điển", "Niềm tin vững chắc"],
    themeColor: "#F59E0B",
    badge: "Hoàng Gia",
    previewRoute: "/business-connect/v3",
    recommendedFor: "Hội Doanh nhân lâu năm, tổ chức ngành nghề truyền thống, câu lạc bộ tinh hoa.",
    features: [
      "Huy hiệu hoàng kim ánh kim loại chân thực",
      "Cột mốc lịch sử và bảng vàng vinh danh",
      "Phông chữ Serif sang trọng chuẩn chuẩn Editorial",
      "Độ tín nhiệm cao cho đối tác tài chính & đầu tư",
    ],
  },
  {
    id: "b2b-v4",
    name: "Premium Editorial Magazine",
    versionLabel: "Template V4",
    category: "executive",
    categoryName: "Tạp Chí Doanh Nhân",
    tagline: "Ấn bản Tạp chí Doanh nhân Đương đại — Typography thời thượng",
    description:
      "Bố cục tạp chí quốc tế Forbes / Bloomberg với lưới grid phá cách, tiêu đề tương phản cao, hình ảnh phóng sự sắc nét và các trích dẫn danh ngôn lãnh đạo.",
    tags: ["Editorial", "Magazine", "Typography", "Đương đại"],
    themeColor: "#EC4899",
    previewRoute: "/business-connect/v4",
    recommendedFor: "Hội nghị thượng đỉnh, diễn đàn kinh tế, ấn phẩm truyền thông doanh nhân.",
    features: [
      "Bố cục layout tạp chí đa cột nghệ thuật",
      "Typography kích thước lớn gây ấn tượng thị giác",
      "Khu vực bài viết tiêu điểm & phỏng vấn độc quyền",
      "Phong cách thời thượng không bao giờ lỗi mốt",
    ],
  },
  {
    id: "b2b-v5",
    name: "Executive Glass & Aurora",
    versionLabel: "Template V5",
    category: "tech",
    categoryName: "Công Nghệ & Tương Lai",
    tagline: "Kính đa tầng & Dải cực quang lộng lẫy — Glassmorphism hiện đại",
    description:
      "Hiệu ứng kính mờ Backdrop-blur đa lớp phối hợp cùng dải ánh sáng cực quang chuyển màu mềm mại, tạo chiều sâu thị giác cực kỳ cuốn hút và tràn đầy năng lượng.",
    tags: ["Glassmorphism", "Aurora Glow", "Hiện đại", "Năng lượng trẻ"],
    themeColor: "#8B5CF6",
    badge: "Độc đáo",
    previewRoute: "/business-connect/v5",
    recommendedFor: "Doanh nghiệp công nghệ, Startup sáng tạo, cộng đồng doanh nhân thế hệ mới.",
    features: [
      "Hiệu ứng kính Frosted Glass đa lớp sang trọng",
      "Dải màu Aurora mesh gradient sống động",
      "Animation tương tác mượt mà chuẩn 60fps",
      "Nổi bật phong cách chuyển đổi số tiên phong",
    ],
  },
  {
    id: "b2b-v6",
    name: "Deep Tech Matrix & Cyber Radar",
    versionLabel: "Template V6",
    category: "tech",
    categoryName: "Công Nghệ & Tương Lai",
    tagline: "Trung tâm chỉ huy viễn thám & Radar điều hành — Cyber Matrix HUD",
    description:
      "Giao diện mang phong cách trạm điều khiển tương lai Cyberpunk / Telemetry: Radar quét sóng quét trực tiếp, bảng số liệu viễn thám thời gian thực và lưới tọa độ bảo mật.",
    tags: ["Cyber Radar", "HUD Matrix", "Viễn thám", "Bảo mật cao"],
    themeColor: "#06B6D4",
    previewRoute: "/business-connect/v6",
    recommendedFor: "Hiệp hội công nghệ thông tin, an ninh mạng, Fintech, AI & Logistics.",
    features: [
      "Radar quét động học phát hiện kết nối kinh doanh",
      "Bảng đồng hồ HUD đo lường chỉ số tăng trưởng",
      "Tone màu Cyber Emerald / Cyan phát sáng tinh tế",
      "Tạo cảm giác công nghệ đỉnh cao và bảo mật tuyệt đối",
    ],
  },
  {
    id: "b2b-v7",
    name: "Corporate Monument & 3D Governance",
    versionLabel: "Template V7",
    category: "b2b",
    categoryName: "Doanh Nghiệp B2B",
    tagline: "Đại lộ Tập đoàn & Kim tự tháp Quản trị — Vững như bàn thạch",
    description:
      "Mô hình kim tự tháp quản trị 3D Isometric trực quan, tượng trưng cho nền tảng vững chắc của tập đoàn, hệ thống kiểm soát tuân thủ và chiến lược tăng trưởng bền vững.",
    tags: ["3D Governance", "Monument", "Tập đoàn lớn", "Bền vững"],
    themeColor: "#10B981",
    previewRoute: "/business-connect/v7",
    recommendedFor: "Tập đoàn đa ngành, liên đoàn thương mại, hội đồng quản trị cấp liên hiệp.",
    features: [
      "Mô hình kim tự tháp 3D Isometric xoay tương tác",
      "Phân tầng quản trị minh bạch từ HĐQT tới hội viên",
      "Độ tin cậy tối thượng cho các dự án quy mô quốc gia",
      "Phong thái đĩnh đạc của các tập đoàn nghìn tỷ",
    ],
  },
  {
    id: "b2b-v8",
    name: "Executive Titanium Suite",
    versionLabel: "Template V8",
    category: "executive",
    categoryName: "Doanh Nhân Lãnh Đạo",
    tagline: "Bộ giải pháp Titanium nguyên khối — Đỉnh cao công nghệ hội viên",
    description:
      "Được gia công từ chất liệu Titanium phay xước, phối màu đen vũ trụ kết hợp ánh kim Hologram. Tích hợp trọn vẹn thẻ định danh thông minh, NFC và AI Copilot.",
    tags: ["Titanium", "Ultra Premium", "NFC Card", "AI Copilot"],
    themeColor: "#94A3B8",
    badge: "Mới nhất",
    previewRoute: "/business-connect/v8",
    recommendedFor: "Thương hiệu cao cấp, CLB Doanh nhân VIP, dịch vụ Private Banking.",
    features: [
      "Chất liệu kim loại Titanium phay xước siêu thực",
      "Tích hợp thẻ định danh doanh nhân số hóa",
      "Showcase AI Copilot hỗ trợ ghép nối giao thương",
      "Thiết kế tối ưu khí chất nhà điều hành",
    ],
  },
  {
    id: "ceo1983-official",
    name: "CLB Doanh Nhân CEO 1983 Official",
    versionLabel: "Flagship CLB",
    category: "association",
    categoryName: "Hiệp Hội Uy Tín",
    tagline: "Cổng thông tin & Đăng ký hội viên chính thức CLB Doanh Nhân CEO 1983",
    description:
      "Mẫu Landing page độc quyền của CLB Doanh Nhân CEO 1983: Logo Phượng Hoàng Hoàng Kim, hiệu ứng pháo hoa ngày lễ, form nộp hồ sơ gia nhập hội viên trực tuyến và ban lãnh đạo.",
    tags: ["CEO 1983", "Cổng chính thức", "Gia nhập hội viên", "Phượng Hoàng Vàng"],
    themeColor: "#EAB308",
    badge: "Flagship CLB",
    previewRoute: "/landing/ceo1983",
    recommendedFor: "CLB Doanh Nhân CEO 1983, các câu lạc bộ đồng niên doanh nhân toàn quốc.",
    features: [
      "Biểu tượng Phượng Hoàng Vàng hoàng gia",
      "Hệ thống nộp hồ sơ xét duyệt hội viên tích hợp",
      "Danh sách Ban Chấp Hành & Hội Đồng Cố Vấn uy tín",
      "Chủ đề sự kiện lễ hội linh hoạt theo mùa",
    ],
  },
  {
    id: "ceo1983-bluewhite",
    name: "CLB Doanh Nhân CEO 1983 (Xanh Trắng - Chuẩn CEO1983.com)",
    versionLabel: "Bản Xanh Trắng V1",
    category: "association",
    categoryName: "Hiệp Hội Uy Tín",
    tagline: "Phong cách chuẩn CEO1983.com: Xanh Hoàng Gia, Trắng, chữ Đen sắc nét",
    description:
      "Giao diện chuẩn chỉ theo phong cách nhận diện chính thức của ceo1983.com: Tone màu xanh hoàng gia và trắng ngọc trai, chữ đen sắc sảo, tích hợp 8 trụ cột hệ sinh thái theo layout Business Connect V1, thẻ thông minh NFC và đăng ký hội viên trực tuyến.",
    tags: ["CEO1983.com", "Xanh Trắng", "Chữ Đen", "Chuẩn V1", "Thẻ NFC"],
    themeColor: "#004B91",
    badge: "CEO1983.com",
    previewRoute: "/landing?template=ceo1983-bluewhite",
    recommendedFor: "CLB Doanh Nhân CEO 1983, các hiệp hội doanh nhân hiện đại, chuẩn nhận diện trang nhã.",
    features: [
      "Bảng màu Xanh Hoàng Gia #004B91 và Trắng thanh lịch",
      "Cấu trúc đầy đủ 8 trụ cột hệ sinh thái Business Connect",
      "Showcase Thẻ Doanh nhân điện tử & Chạm thẻ NFC 1 giây",
      "Form đăng ký xét duyệt hội viên trực tuyến tích hợp",
    ],
  },
  {
    id: "ceo1983-vertical-3d",
    name: "CLB CEO 1983 — Bức Tranh 3D Khổ Dọc (Continuous Landscape)",
    versionLabel: "3D Vertical Landscape",
    category: "association",
    categoryName: "Hiệp Hội Uy Tín",
    tagline: "Bức tranh 3D khổ dọc liên tục: Sky → Birds → Kites → Villas → Water → Underwater Leadership",
    description:
      "Trải nghiệm cuộn khám phá một bức tranh 3D khổ dọc không phân cắt: Bầu trời rộng mở, đàn chim bứt phá, cánh diều no gió, quần thể villa thượng lưu, khối nước vô cực và đại dương sâu thẳm cùng ban lãnh đạo CLB CEO 1983.",
    tags: ["3D Tranh Dọc", "Continuous Landscape", "CEO 1983", "Sky to Ocean", "Điện Ảnh 3D"],
    themeColor: "#0284C7",
    badge: "Mới · Độc Bản",
    previewRoute: "/landing/ceo/v1",
    recommendedFor: "CLB Doanh Nhân CEO 1983, trải nghiệm thương hiệu độc bản ấn tượng khi người dùng đăng ký hội viên.",
    features: [
      "Bức tranh 3D liên tục không chia cắt section chữ nhật",
      "Parallax đa tầng mượt mà: Sky, Birds, Kites, Villas, Water, Underwater",
      "Thanh điều hướng Navigation Indicator 6 nấc tương tác tối giản",
      "Đăng ký nộp hồ sơ tự động cấp tài khoản & mật khẩu gửi về Gmail",
    ],
  },
];

export const ACTIVE_LANDING_TEMPLATE_STORAGE_KEY = "vione_active_landing_template";
export const LANDING_TEMPLATE_CHANGE_EVENT = "vione-landing-template-changed";

export function getActiveLandingTemplateId(): string {
  if (typeof window === "undefined") return "vione-gold-white";
  try {
    const saved = localStorage.getItem(ACTIVE_LANDING_TEMPLATE_STORAGE_KEY);
    if (saved && saved !== "b2b-v1" && LANDING_TEMPLATES_CATALOG.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    /* ignore */
  }
  return "vione-gold-white";
}

export function setActiveLandingTemplateId(templateId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_LANDING_TEMPLATE_STORAGE_KEY, templateId);
    window.dispatchEvent(new CustomEvent(LANDING_TEMPLATE_CHANGE_EVENT, { detail: templateId }));
  } catch {
    /* ignore */
  }
}

export function getLandingTemplate(templateId: string): LandingTemplateMeta {
  return LANDING_TEMPLATES_CATALOG.find((t) => t.id === templateId) || LANDING_TEMPLATES_CATALOG[0];
}
