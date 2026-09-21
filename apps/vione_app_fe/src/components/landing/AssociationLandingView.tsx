import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronRight,
  Clock,
  Crown,
  Download,
  FolderOpen,
  Gift,
  Handshake,
  IdCard,
  Mail,
  MapPin,
  Newspaper,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Award,
  Building2,
  Phone,
  Zap,
} from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { LangSwitcher } from "@/components/LangSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useLang } from "@/lib/i18n";
import type { PublicAssociation } from "@/lib/associations.functions";
import { LandingInteractiveShowcase } from "./LandingInteractiveShowcase";
import authBg from "@/assets/connect-auth-bg.jpg";

/** Multilingual dictionary for Association Landing showcase elements */
const LAND_I18N = {
  vi: {
    heroBadge: "NỀN TẢNG SỐ HÓA HIỆP HỘI DOANH NGHIỆP",
    heroTagline: "Gắn kết doanh nhân — Nâng tầm giá trị thương hiệu",
    heroDesc: "Cộng đồng kết nối giao thương, hợp tác đầu tư và chia sẻ tri thức quản trị bền vững. Trải nghiệm ứng dụng hội viên với đầy đủ thẻ số, danh bạ B2B và đặc quyền sự kiện.",
    ctaOpen: "Mở App Hội Viên",
    ctaContact: "Liên hệ ban thư ký",
    ctaSignIn: "Đăng nhập",
    passTitle: "Quét mã để cài đặt & mở ứng dụng",
    passSubtitle: "Hỗ trợ tức thì trên cả iPhone, Android & Máy tính",
    passDirect: "Mở trực tiếp trên trình duyệt",
    stat1: "Hội viên chính thức",
    stat2: "Sự kiện thường niên",
    stat3: "Số hóa danh thiếp & vé",
    stat4: "Kết nối giao thương B2B",
    leadTag: "BAN LÃNH ĐẠO & BAN CHẤP HÀNH",
    leadTitle: "Đội Ngũ Lãnh Đạo Tiên Phong",
    leadTerm: "Nhiệm kỳ 2026 — 2030",
    featTag: "HỆ SINH THÁI TÍNH NĂNG TOÀN DIỆN",
    featTitle: "Quyền Lợi & Tiện Ích Dành Cho Hội Viên",
    featDesc: "Nền tảng số hóa tối tân mang đến trải nghiệm kết nối đỉnh cao cho các nhà lãnh đạo và doanh nhân thành đạt.",
    f1Title: "Thẻ Hội Viên VIP Số & NFC",
    f1Desc: "Định danh doanh nhân chuẩn quốc tế, tích hợp mã QR động, chip NFC và đồng bộ Apple Wallet & Google Wallet.",
    f2Title: "Sàn Kết Nối Giao Thương B2B",
    f2Desc: "Đăng tải nhu cầu mua - bán - hợp tác. AI thông minh tự động gợi ý đối tác phù hợp nhất trong mạng lưới.",
    f3Title: "Sự Kiện & Check-in QR Siêu Tốc",
    f3Desc: "Đăng ký tham dự diễn đàn, hội nghị xúc tiến, gala dinner và check-in trong 1 giây qua mã QR bảo mật.",
    f4Title: "Đặc Quyền & Ưu Đãi Đối Tác",
    f4Desc: "Thư viện quyền lợi độc quyền, voucher giảm giá dịch vụ khách sạn, ẩm thực, tài chính và logistics.",
    evTag: "SỰ KIỆN & LỊCH HOẠT ĐỘNG",
    evTitle: "Diễn Đàn & Hội Nghị Xúc Tiến Thương Mại",
    evAll: "Xem tất cả sự kiện",
    evRegister: "Đăng ký vé & Check-in",
    oppTag: "KẾT NỐI KINH DOANH",
    oppTitle: "Cơ Hội Giao Thương B2B Nổi Bật",
    oppPost: "Đăng nhu cầu mới",
    oppMatch: "Kết nối giao thương",
    prodTag: "SẢN PHẨM & DỊCH VỤ",
    prodTitle: "Gian Hàng Doanh Nghiệp Hội Viên",
    prodAll: "Xem tất cả gian hàng",
    prodDetail: "Xem chi tiết & Báo giá",
    modTitle: "Khám Phá Các Phân Hệ Ứng Dụng",
    modDesc: "Truy cập nhanh các phân hệ dịch vụ trong hệ sinh thái",
    modApp: "Vào ứng dụng",
  },
  en: {
    heroBadge: "DIGITAL ENTERPRISE ASSOCIATION PLATFORM",
    heroTagline: "Connecting Executives — Elevating Business Value",
    heroDesc: "A premier ecosystem for business matchmaking, investment cooperation, and executive governance. Experience the digital member app with smart passes, B2B directory, and exclusive perks.",
    ctaOpen: "Launch Member App",
    ctaContact: "Contact Secretariat",
    ctaSignIn: "Sign in",
    passTitle: "Scan QR code to install & launch",
    passSubtitle: "Instant access across iOS, Android & Desktop",
    passDirect: "Open directly in browser",
    stat1: "Official Members",
    stat2: "Annual Events",
    stat3: "Digital Passes & Cards",
    stat4: "24/7 B2B Matchmaking",
    leadTag: "LEADERSHIP & EXECUTIVE BOARD",
    leadTitle: "Pioneering Leadership Team",
    leadTerm: "Term 2026 — 2030",
    featTag: "COMPREHENSIVE ECOSYSTEM",
    featTitle: "Exclusive Member Benefits & Capabilities",
    featDesc: "State-of-the-art enterprise digital platform providing unparalleled connectivity for business leaders.",
    f1Title: "VIP Digital Pass & NFC Identity",
    f1Desc: "International executive identity with dynamic QR codes, NFC tap-to-connect, and Apple / Google Wallet integration.",
    f2Title: "B2B Trade & Deal Exchange",
    f2Desc: "Post buy-sell-cooperate opportunities. Smart AI engine recommends optimal verified partners instantly.",
    f3Title: "Rapid QR Event Check-in",
    f3Desc: "Book forum tickets, trade summits, and gala banquets with instant 1-second encrypted QR badge check-in.",
    f4Title: "Executive Privileges & Perks",
    f4Desc: "Exclusive privilege library with member-only discounts across luxury hotels, dining, aviation, and logistics.",
    evTag: "EVENTS & FORUMS",
    evTitle: "Business Forums & Trade Summits",
    evAll: "View all events",
    evRegister: "Book ticket & Check-in",
    oppTag: "BUSINESS OPPORTUNITIES",
    oppTitle: "Featured B2B Trade & Matchmaking",
    oppPost: "Post new request",
    oppMatch: "Connect & Inquire",
    prodTag: "PRODUCTS & SERVICES",
    prodTitle: "Member Enterprise Showcase",
    prodAll: "View all products",
    prodDetail: "Details & Quotation",
    modTitle: "Explore Application Modules",
    modDesc: "Fast access to all enterprise modules in the ecosystem",
    modApp: "Open application",
  },
  ja: {
    heroBadge: "企業協会デジタル化プラットフォーム",
    heroTagline: "エグゼクティブの連携 — 企業価値の最大化",
    heroDesc: "ビジネスマッチング、投資協力、持続可能な経営知見を共有するプレミアムコミュニティ。スマート会員証、B2B名簿、限定イベント特典を提供。",
    ctaOpen: "会員アプリを開く",
    ctaContact: "事務局へのお問い合わせ",
    ctaSignIn: "ログイン",
    passTitle: "QRコードをスキャンしてインストール",
    passSubtitle: "iOS、Android、PCブラウザに即時対応",
    passDirect: "ブラウザで直接起動",
    stat1: "正会員企業",
    stat2: "年間公式イベント",
    stat3: "デジタル会員証＆名刺",
    stat4: "24/7 B2Bマッチング",
    leadTag: "理事会・リーダーシップ",
    leadTitle: "先駆的なリーダーシップ陣",
    leadTerm: "任期 2026年〜2030年",
    featTag: "包括的な機能エコシステム",
    featTitle: "会員専用の特典と機能",
    featDesc: "ビジネスリーダーに最高峰のネットワーキング体験を提供する最先端エンタープライズ基盤。",
    f1Title: "VIPデジタル会員証＆NFC",
    f1Desc: "国際基準の身分証明、動的QRコード、NFCチップ、Apple Wallet & Google Wallet連携。",
    f2Title: "B2B商談＆マッチング広場",
    f2Desc: "調達・販売・協業ニーズを投稿。AIが協会ネットワークから最適な提携先を自動推薦。",
    f3Title: "イベント＆高速QRチェックイン",
    f3Desc: "フォーラム、商談会、ガラディナーの予約から安全なQRコードによる1秒受付まで完結。",
    f4Title: "会員限定の特権＆優待",
    f4Desc: "高級ホテル、飲食、金融、物流サービスにおける会員専用の割引とプレミアム特典。",
    evTag: "イベント＆活動スケジュール",
    evTitle: "ビジネスフォーラム＆貿易促進サミット",
    evAll: "すべてのイベントを見る",
    evRegister: "チケット予約＆チェックイン",
    oppTag: "ビジネス商談",
    oppTitle: "注目のB2Bビジネス商機",
    oppPost: "新規ニーズを投稿",
    oppMatch: "マッチング申請",
    prodTag: "製品＆サービス",
    prodTitle: "会員企業製品ブース",
    prodAll: "すべての製品を見る",
    prodDetail: "詳細と見積もり",
    modTitle: "アプリ機能モジュールを探索",
    modDesc: "エコシステム内の各機能へクイックアクセス",
    modApp: "アプリへ進む",
  },
  ko: {
    heroBadge: "기업 협회 디지털 혁신 플랫폼",
    heroTagline: "경영인 연대 — 비즈니스 가치 극대화",
    heroDesc: "B2B 비즈니스 매칭, 투자 협력, 지속가능한 경영 노하우를 공유하는 최고 경영진 커뮤니티. 스마트 디지털 회원증과 B2B 디렉토리를 경험하세요.",
    ctaOpen: "회원 앱 열기",
    ctaContact: "사무국 문의",
    ctaSignIn: "로그인",
    passTitle: "QR 코드를 스캔하여 앱 설치 및 실행",
    passSubtitle: "iOS, Android 및 PC 완벽 지원",
    passDirect: "웹 브라우저에서 바로 열기",
    stat1: "정회원 기업",
    stat2: "연간 공식 행사",
    stat3: "디지털 패스 & 명함",
    stat4: "24/7 B2B 매칭",
    leadTag: "임원진 및 리더십",
    leadTitle: "선도적인 리더십 팀",
    leadTerm: "임기 2026 — 2030",
    featTag: "통합 기능 생태계",
    featTitle: "회원 전용 특권 및 핵심 기능",
    featDesc: "비즈니스 리더에게 최상의 네트워킹 경험을 선사하는 최첨단 엔터프라이즈 디지털 플랫폼.",
    f1Title: "VIP 디지털 회원증 & NFC",
    f1Desc: "글로벌 표준 경영인 인증, 동적 QR 코드, NFC 태그 및 Apple/Google Wallet 연동.",
    f2Title: "B2B 비즈니스 매칭 마켓",
    f2Desc: "구매·판매·협력 수요 등록 시 AI가 최적의 검증된 협회 파트너를 스마트하게 추천.",
    f3Title: "초고속 QR 이벤트 체크인",
    f3Desc: "포럼, 무역 진흥 컨퍼런스, 갈라 디너 예약 및 1초 암호화 QR 체크인 지원.",
    f4Title: "프리미엄 회원 특권 & 제휴 혜택",
    f4Desc: "특급 호텔, 다이닝, 금융, 물류 등 회원사 전용 독점 할인 및 바우처 라이브러리.",
    evTag: "이벤트 & 공식 일정",
    evTitle: "비즈니스 포럼 & 무역 진흥 회의",
    evAll: "전체 이벤트 보기",
    evRegister: "티켓 예매 & 체크인",
    oppTag: "비즈니스 기회",
    oppTitle: "주요 B2B 비즈니스 거래 기회",
    oppPost: "신규 수요 등록",
    oppMatch: "비즈니스 매칭 신청",
    prodTag: "제품 및 서비스",
    prodTitle: "회원사 제품 쇼케이스",
    prodAll: "전체 제품 보기",
    prodDetail: "상세정보 및 견적",
    modTitle: "앱 에코시스템 탐색",
    modDesc: "엔터프라이즈 서비스 모듈 빠른 접근",
    modApp: "앱 시작하기",
  },
  zh: {
    heroBadge: "企业商会数字化运营平台",
    heroTagline: "凝聚精英力量 — 赋能企业未来",
    heroDesc: "汇聚领军企业家的商务对接、投资合作与高端治理平台。尊享数字会员身份、B2B资源人脉与专属高端活动特权。",
    ctaOpen: "打开会员App",
    ctaContact: "联系秘书处",
    ctaSignIn: "登录",
    passTitle: "扫码安装并打开应用程序",
    passSubtitle: "全面支持 iPhone、Android 与电脑浏览器",
    passDirect: "在浏览器中直接打开",
    stat1: "正式会员单位",
    stat2: "年度品牌活动",
    stat3: "数字化证件与门票",
    stat4: "24/7 B2B商业对接",
    leadTag: "领导班子与理事会",
    leadTitle: "卓越领导核心团队",
    leadTerm: "任期 2026 — 2030",
    featTag: "全方位服务生态系统",
    featTitle: "会员专享权益与数字化功能",
    featDesc: "为商界领袖量身打造的顶级数字化连接平台，助力企业实现资源高效互联与跨越式发展。",
    f1Title: "VIP数字会员卡与NFC名片",
    f1Desc: "国际商务认证体系，动态安全二维码，NFC触控互联，支持同步至 Apple Wallet 与 Google Wallet。",
    f2Title: "B2B商机对接与资源匹配",
    f2Desc: "发布采购、供应及战略合作需求。智能AI系统为您精准匹配商会网络内的优质合作伙伴。",
    f3Title: "高端会议与极速QR签到",
    f3Desc: "一键报名峰会论坛、招商推介会与商务晚宴，凭加密二维码实现1秒极速无感入场。",
    f4Title: "专属特权与商务礼遇",
    f4Desc: "覆盖星级酒店、高端餐饮、商务出行与金融物流的会员专享折扣礼遇库。",
    evTag: "活动与会议日程",
    evTitle: "商务论坛与贸易促进大会",
    evAll: "查看全部活动",
    evRegister: "预约报名与签到",
    oppTag: "商业商机",
    oppTitle: "精选 B2B 合作商机对接",
    oppPost: "发布新需求",
    oppMatch: "对接洽谈",
    prodTag: "产品与服务",
    prodTitle: "会员企业产品展厅",
    prodAll: "查看全部展品",
    prodDetail: "查看详情与报价",
    modTitle: "探索应用生态系统",
    modDesc: "快速访问商会数字化平台的各项核心功能",
    modApp: "进入系统",
  },
  km: {
    heroBadge: "ថ្នាលឌីជីថលសមាគមសហគ្រាស",
    heroTagline: "ការតភ្ជាប់ថ្នាក់ដឹកនាំ — លើកកម្ពស់តម្លៃអាជីវកម្ម",
    heroDesc: "ប្រព័ន្ធអេកូឡូស៊ីឈានមុខសម្រាប់ការតភ្ជាប់ពាណិជ្ជកម្ម កិច្ចសហប្រតិបត្តិការវិនិយោគ និងការចែករំលែកចំណេះដឹងគ្រប់គ្រងប្រកបដោយនិរន្តរភាព។ បទពិសោធន៍កម្មវិធីសមាជិកដែលមានកាតឌីជីថល បញ្ជី B2B និងឯកសិទ្ធិព្រឹត្តិការណ៍។",
    ctaOpen: "បើកកម្មវិធីសមាជិក",
    ctaContact: "ទាក់ទងលេខាធិការដ្ឋាន",
    ctaSignIn: "ចូលប្រើប្រាស់",
    passTitle: "ស្កេនកូដ QR ដើម្បីដំឡើង និងបើកកម្មវិធី",
    passSubtitle: "គាំទ្រភ្លាមៗនៅលើ iOS, Android និងកុំព្យូទ័រ",
    passDirect: "បើកផ្ទាល់នៅលើកម្មវិធីរុករក",
    stat1: "សមាជិកផ្លូវការ",
    stat2: "ព្រឹត្តិការណ៍ប្រចាំឆ្នាំ",
    stat3: "កាតឌីជីថល និងនាមប័ណ្ណ",
    stat4: "ការតភ្ជាប់ពាណិជ្ជកម្ម B2B",
    leadTag: "ថ្នាក់ដឹកនាំ និងក្រុមប្រឹក្សាភិបាល",
    leadTitle: "ក្រុមអ្នកដឹកនាំត្រួសត្រាយផ្លូវ",
    leadTerm: "អាណត្តិ ២០២៦ — ២០៣០",
    featTag: "ប្រព័ន្ធអេកូឡូស៊ីមុខងារទូលំទូលាយ",
    featTitle: "អត្ថប្រយោជន៍ និងលក្ខណៈពិសេសផ្តាច់មុខសម្រាប់សមាជិក",
    featDesc: "ថ្នាលឌីជីថលសហគ្រាសកម្រិតខ្ពស់ ផ្តល់នូវបទពិសោធន៍តភ្ជាប់ដ៏ប្រសើរសម្រាប់អ្នកដឹកនាំអាជីវកម្ម។",
    f1Title: "កាតសមាជិក VIP ឌីជីថល និង NFC",
    f1Desc: "អត្តសញ្ញាណធុរកិច្ចស្តង់ដារអន្តរជាតិ រួមបញ្ចូល QR ថាមវន្ត បន្ទះឈីប NFC និងការធ្វើសមកាលកម្ម Apple / Google Wallet។",
    f2Title: "ការតភ្ជាប់ពាណិជ្ជកម្ម B2B",
    f2Desc: "បង្ហោះតម្រូវការទិញ-លក់-សហការ។ AI ឆ្លាតវៃណែនាំដៃគូដែលសមស្របបំផុតដោយស្វ័យប្រវត្តិ។",
    f3Title: "ព្រឹត្តិការណ៍ និងការចុះឈ្មោះ QR លឿនរហ័ស",
    f3Desc: "កក់សំបុត្រវេទិកា សន្និសីទជំរុញពាណិជ្ជកម្ម ពិធីជប់លៀង និង Check-in ក្នុងរយៈពេល ១ វិនាទីតាម QR សុវត្ថិភាព។",
    f4Title: "ឯកសិទ្ធិ និងការផ្តល់ជូនពិសេសពីដៃគូ",
    f4Desc: "បណ្ណាល័យសិទ្ធិផ្តាច់មុខ ប័ណ្ណបញ្ចុះតម្លៃសណ្ឋាគារ ភោជនីយដ្ឋាន ហិរញ្ញវត្ថុ និងភស្តុភារកម្ម។",
    evTag: "ព្រឹត្តិការណ៍ និងកាលវិភាគសកម្មភាព",
    evTitle: "វេទិកាធុរកិច្ច និងសន្និសីទជំរុញពាណិជ្ជកម្ម",
    evAll: "មើលព្រឹត្តិការណ៍ទាំងអស់",
    evRegister: "កក់សំបុត្រ និង Check-in",
    oppTag: "ឱកាសអាជីវកម្ម",
    oppTitle: "ឱកាសពាណិជ្ជកម្ម B2B ពិសេស",
    oppPost: "បង្ហោះតម្រូវការថ្មី",
    oppMatch: "ស្នើសុំការតភ្ជាប់",
    prodTag: "ផលិតផល និងសេវាកម្ម",
    prodTitle: "ស្តង់ពិព័រណ៍ផលិតផលសហគ្រាសសមាជិក",
    prodAll: "មើលផលិតផលទាំងអស់",
    prodDetail: "មើលព័ត៌មានលម្អិត និងសម្រង់តម្លៃ",
    modTitle: "ស្វែងរកម៉ូឌុលកម្មវិធី",
    modDesc: "ចូលប្រើប្រាស់ម៉ូឌុលសេវាកម្មក្នុងប្រព័ន្ធអេកូឡូស៊ីយ៉ាងរហ័ស",
    modApp: "ចូលទៅកាន់កម្មវិធី",
  },
  lo: {
    heroBadge: "ແພລັດຟອມດິຈິທັອນສະມາຄົມວິສາຫະກິດ",
    heroTagline: "ເຊື່ອມໂຍງນັກທຸລະກິດ — ຍົກລະດັບຄຸນຄ່າແບຣນ",
    heroDesc: "ລະບົບນິເວດຊັ້ນນໍາສໍາລັບການເຊື່ອມໂຍງການຄ້າ, ການຮ່ວມມືລົງທຶນ ແລະ ການແບ່ງປັນຄວາມຮູ້ດ້ານການຄຸ້ມຄອງແບບຍືນຍົງ. ປະສົບການແອັບສະມາຊິກພ້ອມບັດດິຈິທັອນ, ລາຍຊື່ B2B ແລະ ສິດທິພິເສດໃນງານ.",
    ctaOpen: "ເປີດແອັບສະມາຊິກ",
    ctaContact: "ຕິດຕໍ່ກອງເລຂາ",
    ctaSignIn: "ເຂົ້າສູ່ລະບົບ",
    passTitle: "ສະແກນ QR ເພື່ອຕິດຕັ້ງ ແລະ ເປີດແອັບ",
    passSubtitle: "ຮອງຮັບທັນທີທັງ iOS, Android ແລະ ຄອມພິວເຕີ",
    passDirect: "ເປີດໂດຍກົງໃນບຣາວເຊີ",
    stat1: "ສະມາຊິກທາງການ",
    stat2: "ງານປະຈໍາປີ",
    stat3: "ບັດດິຈິທັອນ & ນາມບັດ",
    stat4: "ການເຊື່ອມໂຍງ B2B ຕະຫຼອດ 24/7",
    leadTag: "ຄະນະນໍາ ແລະ ສະພາບໍລິຫານ",
    leadTitle: "ທີມງານຜູ້ນໍາບຸກເບີກ",
    leadTerm: "ວາລະ 2026 — 2030",
    featTag: "ລະບົບນິເວດຄຸນສົມບັດຄົບວົງຈອນ",
    featTitle: "ສິດທິປະໂຫຍດ ແລະ ຄຸນສົມບັດສະເພາະສໍາລັບສະມາຊິກ",
    featDesc: "ແພລັດຟອມດິຈິທັອນລະດັບສູງ ມອບປະສົບການເຊື່ອມໂຍງທີ່ດີເລີດສໍາລັບຜູ້ນໍາທຸລະກິດ.",
    f1Title: "ບັດສະມາຊິກ VIP ດິຈິທັອນ & NFC",
    f1Desc: "ລະບຸຕົວຕົນທຸລະກິດມາດຕະຖານສາກົນ, ປະສົມປະສານ QR ແບບໄດນາມິກ, ຊິບ NFC ແລະ ຊິ້ງກັບ Apple / Google Wallet.",
    f2Title: "ຕະຫຼາດການຄ້າ B2B & ການຈັບຄູ່ທຸລະກິດ",
    f2Desc: "ໂພສຄວາມຕ້ອງການຊື້-ຂາຍ-ຮ່ວມມື. AI ອັດສະລິຍະແນະນໍາຄູ່ຮ່ວມງານທີ່ເໝາະສົມທີ່ສຸດໂດຍອັດຕະໂນມັດ.",
    f3Title: "ງານກິດຈະກໍາ & Check-in ດ້ວຍ QR ຢ່າງວ່ອງໄວ",
    f3Desc: "ຈອງປີ້ເຂົ້າຮ່ວມກອງປະຊຸມ, ງານສົ່ງເສີມການຄ້າ, ງານລ້ຽງ ແລະ Check-in ພາຍໃນ 1 ວິນາທີຜ່ານ QR ທີ່ປອດໄພ.",
    f4Title: "ສິດທິພິເສດ & ຂໍ້ສະເໜີຈາກພັນທະມິດ",
    f4Desc: "ຄັງສິດທິປະໂຫຍດສະເພາະ, ບັດສ່ວນຫຼຸດໂຮງແຮມ, ຮ້ານອາຫານ, ການເງິນ ແລະ ໂລຈິສຕິກ.",
    evTag: "ງານກິດຈະກໍາ & ຕາຕະລາງການເຄື່ອນໄຫວ",
    evTitle: "ເວທີສົນທະນາທຸລະກິດ & ກອງປະຊຸມສົ່ງເສີມການຄ້າ",
    evAll: "ເບິ່ງງານທັງໝົດ",
    evRegister: "ຈອງປີ້ & Check-in",
    oppTag: "ໂອກາດທາງທຸລະກິດ",
    oppTitle: "ໂອກາດການຄ້າ B2B ທີ່ໂດດເດັ່ນ",
    oppPost: "ໂພສຄວາມຕ້ອງການໃໝ່",
    oppMatch: "ເຊື່ອມຕໍ່ການຄ້າ",
    prodTag: "ສິນຄ້າ & ການບໍລິການ",
    prodTitle: "ບູດວາງສະແດງສິນຄ້າຂອງວິສາຫະກິດສະມາຊິກ",
    prodAll: "ເບິ່ງສິນຄ້າທັງໝົດ",
    prodDetail: "ເບິ່ງລາຍລະອຽດ & ໃບສະເໜີລາຄາ",
    modTitle: "ສຳຫຼວດໂມດູນແອັບພລິເຄຊັນ",
    modDesc: "ເຂົ້າເຖິງໂມດູນການບໍລິການໃນລະບົບນິເວດຢ່າງວ່ອງໄວ",
    modApp: "ເຂົ້າສູ່ແອັບ",
  },
  my: {
    heroBadge: "စီးပွားရေးလုပ်ငန်းရှင်များအသင်း ဒစ်ဂျစ်တယ်ပလက်ဖောင်း",
    heroTagline: "စီးပွားရေးခေါင်းဆောင်များ ချိတ်ဆက်ခြင်း — လုပ်ငန်းတန်ဖိုးမြှင့်တင်ခြင်း",
    heroDesc: "စီးပွားရေးချိတ်ဆက်မှု၊ ရင်းနှီးမြှုပ်နှံမှု ပူးပေါင်းဆောင်ရွက်မှုနှင့် ရေရှည်တည်တံ့သော စီမံခန့်ခွဲမှုအသိပညာ မျှဝေခြင်းအတွက် ထိပ်တန်းဂေဟစနစ်။ စမတ်ဒစ်ဂျစ်တယ်ကတ်၊ B2B လုပ်ငန်းလမ်းညွှန်နှင့် သီးသန့်အခွင့်အရေးများ ပါဝင်သော အသင်းဝင်အက်ပ်ကို အသုံးပြုလိုက်ပါ။",
    ctaOpen: "အသင်းဝင်အက်ပ် ဖွင့်ပါ",
    ctaContact: "အတွင်းရေးမှူးရုံး ဆက်သွယ်ရန်",
    ctaSignIn: "အကောင့်ဝင်ပါ",
    passTitle: "အက်ပ်ထည့်သွင်းရန် QR ကုဒ်ကို စကင်ဖတ်ပါ",
    passSubtitle: "iOS, Android နှင့် ကွန်ပျူတာတို့တွင် ချက်ချင်း အသုံးပြုနိုင်သည်",
    passDirect: "ဘရောက်ဆာတွင် တိုက်ရိုက်ဖွင့်ပါ",
    stat1: "တရားဝင်အသင်းဝင်များ",
    stat2: "နှစ်စဉ်ပွဲများ",
    stat3: "ဒစ်ဂျစ်တယ်ကတ်နှင့် လိပ်စာကတ်",
    stat4: "၂၄/၇ B2B ကုန်သွယ်မှုချိတ်ဆက်မှု",
    leadTag: "ခေါင်းဆောင်မှုနှင့် အလုပ်အမှုဆောင်အဖွဲ့",
    leadTitle: "ရှေ့ဆောင်ခေါင်းဆောင်မှုအဖွဲ့",
    leadTerm: "သက်တမ်း ၂၀၂၆ — ၂၀၃၀",
    featTag: "ဘက်စုံစွမ်းဆောင်ရည် ဂေဟစနစ်",
    featTitle: "အသင်းဝင်များအတွက် သီးသန့်ခံစားခွင့်များနှင့် လုပ်ဆောင်ချက်များ",
    featDesc: "စီးပွားရေးခေါင်းဆောင်များအတွက် အကောင်းဆုံးချိတ်ဆက်မှု အတွေ့အကြုံကို ပေးစွမ်းနိုင်သော ခေတ်မီဒစ်ဂျစ်တယ်ပလက်ဖောင်း။",
    f1Title: "VIP ဒစ်ဂျစ်တယ်အသင်းဝင်ကတ်နှင့် NFC",
    f1Desc: "နိုင်ငံတကာအဆင့် စီးပွားရေးလိပ်စာကတ်၊ dynamic QR ကုဒ်၊ NFC ချစ်ပ်နှင့် Apple/Google Wallet ချိတ်ဆက်မှု။",
    f2Title: "B2B ကုန်သွယ်မှုနှင့် လုပ်ငန်းချိတ်ဆက်ရေး",
    f2Desc: "ဝယ်ယူခြင်း၊ ရောင်းချခြင်းနှင့် ပူးပေါင်းဆောင်ရွက်ခြင်း လိုအပ်ချက်များကို တင်ပြပါ။ AI စနစ်က သင့်တော်သော မိတ်ဖက်များကို အလိုအလျောက် အကြံပြုပေးပါသည်။",
    f3Title: "ပွဲများနှင့် လျင်မြန်သော QR Check-in",
    f3Desc: "ဖိုရမ်များ၊ ကုန်သွယ်မှုမြှင့်တင်ရေးညီလာခံများ၊ ညစာစားပွဲများအတွက် လက်မှတ်ရယူပြီး လုံခြုံစိတ်ချရသော QR ဖြင့် ၁ စက္ကန့်အတွင်း Check-in ဝင်ရောက်နိုင်သည်။",
    f4Title: "မိတ်ဖက်များထံမှ သီးသန့်အခွင့်အရေးများ",
    f4Desc: "ဟိုတယ်၊ စားသောက်ဆိုင်၊ ဘဏ္ဍာရေးနှင့် ထောက်ပံ့ပို့ဆောင်ရေးဆိုင်ရာ သီးသန့်လျှော့စျေးများနှင့် အထူးအခွင့်အရေးများ။",
    evTag: "ပွဲများနှင့် လှုပ်ရှားမှုအစီအစဉ်",
    evTitle: "စီးပွားရေးဖိုရမ်နှင့် ကုန်သွယ်မှုမြှင့်တင်ရေးညီလာခံ",
    evAll: "ပွဲအားလုံး ကြည့်ပါ",
    evRegister: "လက်မှတ်ရယူပြီး Check-in ဝင်ပါ",
    oppTag: "စီးပွားရေးအခွင့်အလမ်းများ",
    oppTitle: "ထင်ရှားသော B2B ကုန်သွယ်မှုအခွင့်အလမ်းများ",
    oppPost: "လိုအပ်ချက်အသစ် တင်ပါ",
    oppMatch: "ချိတ်ဆက်မေးမြန်းပါ",
    prodTag: "ထုတ်ကုန်များနှင့် ဝန်ဆောင်မှုများ",
    prodTitle: "အသင်းဝင်လုပ်ငန်းများ၏ ထုတ်ကုန်ပြခန်း",
    prodAll: "ထုတ်ကုန်အားလုံး ကြည့်ပါ",
    prodDetail: "အသေးစိတ်နှင့် ဈေးနှုန်းကြည့်ရန်",
    modTitle: "အက်ပ်စနစ်များကို လေ့လာပါ",
    modDesc: "ဂေဟစနစ်အတွင်းရှိ လုပ်ငန်းဝန်ဆောင်မှုစနစ်များသို့ လျင်မြန်စွာ ဝင်ရောက်ပါ",
    modApp: "အက်ပ်သို့ ဝင်ပါ",
  },
};

import { Ceo1983Landing } from "./Ceo1983Landing";

/** Shared public landing UI for an association, used by /h/:slug and hostname routing. */
export function AssociationLandingView({ a }: { a: PublicAssociation }) {
  const { lang } = useLang();
  const [appUrl, setAppUrl] = useState("/m");

  const l = (LAND_I18N as any)[lang] || LAND_I18N.vi;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(`${window.location.origin}/m?slug=${encodeURIComponent(a.slug || "")}`);
    }
  }, [a.slug]);

  if (
    a.slug === "ceo1983" ||
    a.slug === "ceo-1983" ||
    a.slug === "clb-ceo-1983" ||
    a.slug?.includes("1983") ||
    a.name?.toLowerCase().includes("1983")
  ) {
    return <Ceo1983Landing />;
  }

  const isCeo1983 = false;

  const leaders = isCeo1983
    ? [
        {
          name: "Lê Hoàng Long",
          role: lang === "vi" ? "Chủ tịch CLB CEO 1983" : lang === "en" ? "President of CEO 1983 Club" : lang === "ja" ? "CEO 1983 クラブ 会長" : lang === "ko" ? "CEO 1983 클럽 회장" : "CEO 1983 俱乐部会长",
          company: "Long Tech Solutions",
          title: lang === "vi" ? "Tổng Giám Đốc" : "CEO & Founder",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        },
        {
          name: "Trần Thị Mai Lan",
          role: lang === "vi" ? "Phó Chủ tịch kiêm Tổng Thư ký" : lang === "en" ? "Vice President & Secretary General" : lang === "ja" ? "副会長 兼 事務総長" : lang === "ko" ? "부회장 겸 사무총장" : "副会长兼秘书长",
          company: "Mai Lan Logistics",
          title: lang === "vi" ? "Chủ tịch HĐQT" : "Chairwoman",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        },
        {
          name: "Phạm Đức Minh",
          role: lang === "vi" ? "Phó Chủ tịch ban Xúc tiến TM" : lang === "en" ? "VP of Trade Promotion" : lang === "ja" ? "貿易促進担当 副会長" : lang === "ko" ? "무역진흥 부회장" : "贸易促进副会长",
          company: "Minh Capital Investment",
          title: "Managing Partner",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        },
        {
          name: "Vũ Thu Trang",
          role: lang === "vi" ? "Trưởng ban Truyền thông & Sự kiện" : lang === "en" ? "Head of Media & Events" : lang === "ja" ? "広報＆イベント部長" : lang === "ko" ? "미디어 & 이벤트 위원장" : "媒体与活动部部长",
          company: "Trang Media & Events",
          title: lang === "vi" ? "Giám đốc Điều hành" : "Managing Director",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        },
      ]
    : [
        {
          name: "Trần Đăng Khoa",
          role: lang === "vi" ? "Chủ tịch Hội HanoiBA" : lang === "en" ? "President of HanoiBA" : lang === "ja" ? "HanoiBA 会長" : lang === "ko" ? "HanoiBA 회장" : "HanoiBA 会长",
          company: "Khoa Vàng Tech Group",
          title: lang === "vi" ? "Chủ tịch HĐQT" : "Chairman of the Board",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        },
        {
          name: "Lê Minh Hưng",
          role: lang === "vi" ? "Phó Chủ tịch Hội" : lang === "en" ? "Vice President" : lang === "ja" ? "副会長" : lang === "ko" ? "부회장" : "副会长",
          company: "Hưng Thịnh Real Estate",
          title: lang === "vi" ? "Phó Chủ tịch HĐQT" : "Vice Chairman",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        },
        {
          name: "Nguyễn Thị Bích Ngọc",
          role: lang === "vi" ? "Phó Chủ tịch kiêm Tổng Thư ký" : lang === "en" ? "Vice President & Secretary General" : lang === "ja" ? "副会長 兼 事務総長" : lang === "ko" ? "부회장 겸 사무총장" : "副会长兼秘书长",
          company: "Bích Ngọc Global Trade",
          title: lang === "vi" ? "Tổng Giám Đốc" : "General Director",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        },
        {
          name: "Phạm Hải Đăng",
          role: lang === "vi" ? "Ủy viên BCH - Trưởng ban XTTM" : lang === "en" ? "Board Member - Head of Trade" : lang === "ja" ? "理事・貿易促進委員長" : lang === "ko" ? "이사회 이사 - 무역진흥위원장" : "理事·贸易促进部长",
          company: "Đăng Quang Logistics",
          title: lang === "vi" ? "Chủ tịch HĐQT" : "Chairman of the Board",
          avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        },
      ];

  const events = isCeo1983
    ? [
        {
          day: "18",
          month: lang === "vi" ? "THÁNG 9" : "SEP",
          title: lang === "vi" ? "Đại Hội Kết Nối Giao Thương CEO 1983 - Quý III/2026" : "CEO 1983 Business Matchmaking Summit - Q3/2026",
          time: "18:00 - 21:30",
          location: "JW Marriott Hotel, Hanoi",
          type: "Gala & Summit",
        },
        {
          day: "25",
          month: lang === "vi" ? "THÁNG 9" : "SEP",
          title: lang === "vi" ? "Tọa Đàm: Quản Trị Dữ Liệu & Thẻ Hội Viên Số Doanh Nghiệp" : "Executive Workshop: Enterprise Data & Digital Member Identity",
          time: "08:30 - 11:30",
          location: "Lotte International Convention Center, Hanoi",
          type: "Workshop",
        },
        {
          day: "05",
          month: lang === "vi" ? "THÁNG 10" : "OCT",
          title: lang === "vi" ? "Giải Golf Kỷ Niệm Thành Lập CLB CEO 1983" : "CEO 1983 Anniversary Golf Championship",
          time: "06:00 - 15:00",
          location: "Long Bien Golf Course, Hanoi",
          type: "Sports & Networking",
        },
      ]
    : [
        {
          day: "15",
          month: lang === "vi" ? "THÁNG 9" : "SEP",
          title: lang === "vi" ? "Diễn Đàn Doanh Nghiệp Trẻ Thủ Đô 2026: Đột Phá AI & Chuyển Đổi Xanh" : "Hanoi Young Entrepreneurs Forum 2026: AI & Green Transition",
          time: "08:00 - 17:00",
          location: "National Convention Center, Hanoi",
          type: "Summit",
        },
        {
          day: "28",
          month: lang === "vi" ? "THÁNG 9" : "SEP",
          title: lang === "vi" ? "Đại Hội Hội Doanh Nghiệp Trẻ Hà Nội Khóa IX (2026 - 2030)" : "HanoiBA 9th General Assembly (2026 - 2030)",
          time: "13:30 - 21:00",
          location: "Melia Hotel, Hoan Kiem, Hanoi",
          type: "Congress",
        },
        {
          day: "12",
          month: lang === "vi" ? "THÁNG 10" : "OCT",
          title: lang === "vi" ? "Giải Golf HanoiBA Open 2026 & Kết Nối Giao Thương B2B" : "HanoiBA Open 2026 Golf Championship & B2B Matchmaking",
          time: "06:00 - 18:00",
          location: "BRG Kings Island Golf Resort, Son Tay",
          type: "Golf Championship",
        },
      ];

  const opportunities = isCeo1983
    ? [
        {
          tag: lang === "vi" ? "CẦN TÌM ĐỐI TÁC" : "PARTNER SEARCH",
          tagColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          title: lang === "vi" ? "Tìm đối tác cung ứng vật liệu xây dựng & thép kết cấu cho dự án nghỉ dưỡng" : "Seeking supplier for structural steel and construction materials for resort project",
          company: "Bảo Gia Construction",
          budget: "5.000.000.000 đ",
        },
        {
          tag: lang === "vi" ? "HỢP TÁC ĐẦU TƯ" : "INVESTMENT",
          tagColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          title: lang === "vi" ? "Hợp tác phát triển giải pháp ERP và CRM cho chuỗi 30 nhà hàng ẩm thực" : "Cooperation to deploy cloud ERP & CRM for 30 restaurant franchise chain",
          company: "Yến Ngọc Hospitality",
          budget: "800.000.000 đ",
        },
      ]
    : [
        {
          tag: lang === "vi" ? "CẦN TÌM ĐỐI TÁC" : "PARTNER SEARCH",
          tagColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          title: lang === "vi" ? "Tìm đối tác phát triển nền tảng AI ERP & CRM tự động hóa cho chuỗi bán lẻ" : "Seeking AI ERP & CRM automation solution partner for retail chain",
          company: "Khoa Vàng Tech Group",
          budget: "2.000.000.000 đ",
        },
        {
          tag: lang === "vi" ? "CUNG ỨNG DỊCH VỤ" : "SERVICE SUPPLY",
          tagColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          title: lang === "vi" ? "Cung cấp giải pháp kho vận thông minh và trung tâm logistics ngoại thành Hà Nội" : "Smart warehousing and suburban logistics hub solutions provider",
          company: "Đăng Quang Logistics",
          budget: "500.000.000 đ",
        },
      ];

  const products = isCeo1983
    ? [
        {
          name: lang === "vi" ? "Vật Liệu Xây Dựng & Thép Kết Cấu Tiêu Chuẩn Cao" : "High-Standard Structural Steel & Construction Materials",
          category: lang === "vi" ? "Xây dựng & Bất động sản" : "Construction & Real Estate",
          price: "18.500.000 đ / tấn",
          seller: "Bảo Gia Construction",
          icon: "🏗️",
        },
        {
          name: lang === "vi" ? "Phần Mềm Quản Trị Khách Sạn & Nhà Hàng Cloud POS" : "Cloud POS & Hotel Management ERP Suite",
          category: lang === "vi" ? "Công nghệ & Phần mềm" : "Technology & Software",
          price: "12.000.000 đ / năm",
          seller: "Long Tech Solutions",
          icon: "💻",
        },
        {
          name: lang === "vi" ? "Hộp Yến Sào Hoàng Gia Thượng Hạng CEO 1983" : "CEO 1983 Royal Bird's Nest Luxury Gift Box",
          category: lang === "vi" ? "Quà tặng & Sức khỏe" : "Gifts & Wellness",
          price: "3.200.000 đ / hộp",
          seller: "Yến Ngọc Hospitality",
          icon: "🪺",
        },
      ]
    : [
        {
          name: lang === "vi" ? "Gói Chuyển Đổi Số Doanh Nghiệp ViOne Enterprise AI" : "ViOne Enterprise AI Digital Transformation Package",
          category: lang === "vi" ? "Công nghệ & Phần mềm" : "Technology & AI",
          price: "45.000.000 đ / gói",
          seller: "Khoa Vàng Tech Group",
          icon: "🚀",
        },
        {
          name: lang === "vi" ? "Dịch Vụ Kho Vận & Phân Phối Hàng Hóa Nhanh 24/7" : "24/7 Express Warehousing & Freight Logistics",
          category: lang === "vi" ? "Vận tải & Logistics" : "Logistics & Transport",
          price: lang === "vi" ? "Liên hệ báo giá" : "Contact for Quote",
          seller: "Đăng Quang Logistics",
          icon: "🚚",
        },
        {
          name: lang === "vi" ? "Hộp Quà Tặng Nông Sản Hữu Cơ Cao Cấp HanoiBA" : "HanoiBA Premium Organic Agricultural Gift Set",
          category: lang === "vi" ? "Quà tặng & Tiêu dùng" : "Gifts & Agriculture",
          price: "1.250.000 đ / hộp",
          seller: "Việt An Eco Food",
          icon: "🎁",
        },
      ];

  const stats = [
    { value: isCeo1983 ? "200+" : "1.000+", label: l.stat1 },
    { value: isCeo1983 ? "24+" : "50+", label: l.stat2 },
    { value: "100%", label: l.stat3 },
    { value: "24/7", label: l.stat4 },
  ];

  const features = [
    {
      icon: IdCard,
      title: l.f1Title,
      desc: l.f1Desc,
    },
    {
      icon: Handshake,
      title: l.f2Title,
      desc: l.f2Desc,
    },
    {
      icon: Calendar,
      title: l.f3Title,
      desc: l.f3Desc,
    },
    {
      icon: Crown,
      title: l.f4Title,
      desc: l.f4Desc,
    },
  ];

  return (
    <div
      className="vba-app relative min-h-screen w-full bg-[var(--vba-bg)] text-[var(--vba-text)] antialiased selection:bg-[var(--vba-gold)]/30 selection:text-white"
      style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
    >
      {/* Background Starry Mesh Overlay for Dark mode */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <img
          src={authBg}
          alt=""
          width={1024}
          height={640}
          className="pointer-events-none absolute inset-x-0 top-0 h-[800px] w-full select-none object-cover opacity-20 dark:opacity-40"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[var(--vba-bg)]/80 to-[var(--vba-bg)]"
        />
      </div>

      <div className="relative z-10">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 border-b border-[var(--vba-border-soft)] bg-[var(--vba-bg)]/85 px-4 py-3.5 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              {a.logoUrl ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--vba-gold)]/40 bg-[var(--vba-surface)] p-1 shadow-md">
                  <img src={a.logoUrl} alt={a.name} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl vba-gold-grad text-[15px] font-black text-[#0A111C]">
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vba-text-muted)]">
                  {lang === "vi" ? "HIỆP HỘI DOANH NGHIỆP" : lang === "en" ? "BUSINESS ASSOCIATION" : lang === "ja" ? "企業協会" : lang === "ko" ? "기업 협회" : "企业商会"}
                </div>
                <div className="max-w-[180px] truncate text-[15px] font-extrabold tracking-tight vba-gold-text sm:max-w-xs md:max-w-md">
                  {a.name}
                </div>
              </div>
            </div>

            {/* Controls: ThemeSwitcher + LangSwitcher + Action Buttons */}
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LangSwitcher showFullLabel={false} />

              <Link
                to="/m"
                className="hidden items-center gap-2 rounded-xl border border-[var(--vba-border)] bg-[var(--vba-surface)] px-4 py-2 text-xs font-bold text-[var(--vba-gold)] shadow-sm backdrop-blur-md transition hover:border-[var(--vba-gold)] sm:inline-flex"
              >
                <Smartphone className="h-4 w-4" /> {l.ctaOpen}
              </Link>
              <Link
                to="/auth"
                search={{ redirect: `/m?slug=${a.slug}` }}
                className="inline-flex items-center gap-1.5 rounded-xl vba-gold-grad px-4 py-2 text-xs font-extrabold text-[#0A111C] shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
              >
                {l.ctaSignIn} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pt-12">
          <section className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--vba-gold)]/30 bg-[var(--vba-gold-soft)] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-[var(--vba-gold)] shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[var(--vba-gold)]" />
                {l.heroBadge}
              </div>

              <h1 className="mt-5 text-3xl font-black leading-[1.12] tracking-tight text-[var(--vba-text)] sm:text-4xl md:text-5xl">
                {a.name}
              </h1>

              <div className="mt-3 text-xl font-bold vba-gold-text md:text-2xl">
                {a.tagline || l.heroTagline}
              </div>

              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[var(--vba-text-muted)] md:text-base">
                {a.about || l.heroDesc}
              </p>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/m"
                  className="inline-flex items-center gap-2 rounded-xl vba-gold-grad px-6 py-3.5 text-sm font-extrabold text-[#0A111C] shadow-[0_8px_24px_-4px_rgba(216,178,130,0.45)] transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Smartphone className="h-4 w-4 text-[#0A111C]" />
                  {l.ctaOpen} <ArrowRight className="h-4 w-4" />
                </Link>

                {a.contactEmail && (
                  <a
                    href={`mailto:${a.contactEmail}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--vba-border)] bg-[var(--vba-surface)] px-5 py-3.5 text-sm font-semibold text-[var(--vba-text)] backdrop-blur-md transition hover:border-[var(--vba-gold)]"
                  >
                    <Mail className="h-4 w-4 text-[var(--vba-gold)]" /> {l.ctaContact}
                  </a>
                )}
              </div>

              {/* Stats Bar */}
              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s, i) => (
                  <div key={i} className="vba-card p-3.5 text-center">
                    <div className="text-xl font-black vba-gold-text">{s.value}</div>
                    <div className="mt-1 text-[11px] font-semibold leading-tight text-[var(--vba-text-muted)]">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Hero: High Definition VIP Pass Card */}
            <div className="flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-sm">
                {/* Ambient glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#D8B282]/30 to-[#F0D5A8]/20 blur-xl" />

                <div className="vba-card relative overflow-hidden rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
                  <div className="flex items-center justify-between border-b border-[var(--vba-border-soft)] pb-4">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-[var(--vba-gold)]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--vba-gold)]">
                        VIP MEMBER PASS
                      </span>
                    </div>
                    <span className="rounded-md border border-[var(--vba-gold)]/40 bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--vba-gold)]">
                      VIONE APP
                    </span>
                  </div>

                  <div className="mt-5 text-center">
                    <div className="text-sm font-bold text-[var(--vba-text)]">
                      {l.passTitle}
                    </div>
                    <p className="mt-1 text-xs text-[var(--vba-text-muted)]">
                      {l.passSubtitle}
                    </p>

                    {/* Crisp High Resolution QR Code */}
                    <div className="my-5 flex justify-center">
                      <div className="rounded-2xl border-2 border-[var(--vba-gold)]/50 bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                        <QrCanvas
                          value={appUrl}
                          size={172}
                          dark="#050C15"
                          light="#FFFFFF"
                          logoUrl="/app-icon.png"
                          logoScale={0.22}
                        />
                      </div>
                    </div>

                    <Link
                      to="/m"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl vba-gold-grad py-3 text-xs font-bold text-[#0A111C] shadow-md transition hover:scale-[1.01]"
                    >
                      <Download className="h-4 w-4" /> {l.passDirect}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 1: Ban Lãnh Đạo & Ban Chấp Hành Hiệp Hội */}
          <section className="mt-20">
            <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--vba-gold)]">
                  <Award className="h-4 w-4" /> {l.leadTag}
                </div>
                <h2 className="mt-1 text-2xl font-extrabold text-[var(--vba-text)] sm:text-3xl">
                  {l.leadTitle}
                </h2>
              </div>
              <span className="text-xs text-[var(--vba-text-muted)]">{l.leadTerm}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {leaders.map((lead, idx) => (
                <div
                  key={idx}
                  className="vba-card flex flex-col items-center p-5 text-center transition hover:border-[var(--vba-gold)]/60"
                >
                  <div className="relative mb-3.5">
                    <img
                      src={lead.avatar}
                      alt={lead.name}
                      className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--vba-gold)]/70 ring-offset-2 ring-offset-[var(--vba-bg)] shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full vba-gold-grad text-[#0A111C] shadow">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--vba-text)]">{lead.name}</h3>
                  <div className="mt-1 text-xs font-bold text-[var(--vba-gold)]">{lead.role}</div>
                  <div className="mt-2 text-[11px] text-[var(--vba-text-muted)]">
                    {lead.title} · <span className="font-semibold text-[var(--vba-text)]">{lead.company}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Breakthrough 3D Interactive Slide Showcase */}
          <section className="mt-20">
            <LandingInteractiveShowcase />
          </section>

          {/* Section 2: Hệ Sinh Thái Quyền Lợi & Tính Năng Hội Viên */}
          <section className="mt-20">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vba-gold)]/30 bg-[var(--vba-gold-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--vba-gold)]">
                <ShieldCheck className="h-3.5 w-3.5" /> {l.featTag}
              </span>
              <h2 className="mt-3 text-2xl font-black text-[var(--vba-text)] sm:text-3xl md:text-4xl">
                {l.featTitle}
              </h2>
              <p className="mx-auto mt-2.5 max-w-2xl text-xs text-[var(--vba-text-muted)] sm:text-sm">
                {l.featDesc}
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="vba-card flex flex-col justify-between p-5 transition hover:border-[var(--vba-gold)]/50"
                  >
                    <div>
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)] shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-[var(--vba-text)]">{f.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--vba-text-muted)]">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Sự Kiện & Lịch Hoạt Động */}
          <section className="mt-20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--vba-gold)]">
                  <Calendar className="h-4 w-4" /> {l.evTag}
                </div>
                <h2 className="mt-1 text-2xl font-extrabold text-[var(--vba-text)] sm:text-3xl">
                  {l.evTitle}
                </h2>
              </div>
              <Link to="/m/events" className="flex items-center gap-1 text-xs font-bold text-[var(--vba-gold)] hover:underline">
                {l.evAll} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {events.map((ev, i) => (
                <div key={i} className="vba-card flex flex-col justify-between p-4 transition hover:border-[var(--vba-gold)]/50">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="rounded-xl vba-gold-grad px-3 py-1 text-center shadow-sm">
                        <div className="text-lg font-black leading-none text-[#0A111C]">{ev.day}</div>
                        <div className="text-[9px] font-bold uppercase text-[#0A111C]">{ev.month}</div>
                      </div>
                      <span className="rounded-full border border-[var(--vba-gold)]/30 bg-[var(--vba-gold-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--vba-gold)]">
                        {ev.type}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-sm font-bold text-[var(--vba-text)]">{ev.title}</h3>

                    <div className="mt-3 space-y-1.5 text-xs text-[var(--vba-text-muted)]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[var(--vba-gold)]" /> {ev.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[var(--vba-gold)]" /> <span className="line-clamp-1">{ev.location}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/m/events"
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--vba-border)] bg-[var(--vba-surface)] py-2 text-xs font-bold text-[var(--vba-gold)] transition hover:bg-[var(--vba-gold-soft)]"
                  >
                    <QrCode className="h-3.5 w-3.5" /> {l.evRegister}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Sàn Giao Thương B2B & Cơ Hội Hợp Tác */}
          <section className="mt-20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--vba-gold)]">
                  <Handshake className="h-4 w-4" /> {l.oppTag}
                </div>
                <h2 className="mt-1 text-2xl font-extrabold text-[var(--vba-text)] sm:text-3xl">
                  {l.oppTitle}
                </h2>
              </div>
              <Link to="/m/opportunities" className="flex items-center gap-1 text-xs font-bold text-[var(--vba-gold)] hover:underline">
                {l.oppPost} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((op, i) => (
                <div key={i} className="vba-card flex flex-col justify-between p-4.5 transition hover:border-[var(--vba-gold)]/50">
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${op.tagColor}`}>
                        {op.tag}
                      </span>
                      <span className="text-[11px] font-bold text-[var(--vba-gold)]">{op.budget}</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold text-[var(--vba-text)]">{op.title}</h3>
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[var(--vba-text-muted)]">
                      <span>🏢</span> <span className="font-semibold text-[var(--vba-text)]">{op.company}</span>
                    </div>
                  </div>

                  <Link
                    to="/m/opportunities"
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl vba-gold-grad py-2 text-xs font-extrabold text-[#0A111C]"
                  >
                    {l.oppMatch} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Gian Hàng Sản Phẩm & Dịch Vụ Hội Viên */}
          <section className="mt-20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--vba-gold)]">
                  <Gift className="h-4 w-4" /> {l.prodTag}
                </div>
                <h2 className="mt-1 text-2xl font-extrabold text-[var(--vba-text)] sm:text-3xl">
                  {l.prodTitle}
                </h2>
              </div>
              <Link to="/m/products" className="flex items-center gap-1 text-xs font-bold text-[var(--vba-gold)] hover:underline">
                {l.prodAll} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p, i) => (
                <div key={i} className="vba-card flex flex-col justify-between p-4.5 transition hover:border-[var(--vba-gold)]/50">
                  <div>
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--vba-gold-soft)] text-2xl shadow-inner">
                      {p.icon}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vba-text-muted)]">
                      {p.category}
                    </div>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[var(--vba-text)]">{p.name}</h3>
                    <div className="mt-2 text-xs text-[var(--vba-text-muted)]">
                      {lang === "vi" ? "Đơn vị cung ứng: " : "Supplier: "}<span className="font-semibold text-[var(--vba-text)]">{p.seller}</span>
                    </div>
                    <div className="mt-3 text-sm font-black vba-gold-text">{p.price}</div>
                  </div>

                  <Link
                    to="/m/products"
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--vba-border)] bg-[var(--vba-surface)] py-2 text-xs font-bold text-[var(--vba-gold)] transition hover:bg-[var(--vba-gold-soft)]"
                  >
                    {l.prodDetail}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: Quick Access Navigation Menu */}
          <section className="vba-card mt-20 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--vba-border-soft)] pb-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-black vba-gold-text md:text-2xl">
                  {l.modTitle}
                </h3>
                <p className="mt-1 text-xs text-[var(--vba-text-muted)]">
                  {l.modDesc} {a.name}
                </p>
              </div>
              <Link
                to="/m"
                className="inline-flex items-center gap-2 rounded-xl vba-gold-grad px-5 py-2.5 text-xs font-bold text-[#0A111C]"
              >
                {l.modApp} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {[
                { label: lang === "vi" ? "Danh bạ hội viên" : "Members Directory", icon: Users, to: "/m/members" },
                { label: lang === "vi" ? "Sự kiện & Lịch họp" : "Events & Summits", icon: Calendar, to: "/m/events" },
                { label: lang === "vi" ? "Cơ hội giao thương" : "B2B Deals", icon: Handshake, to: "/m/opportunities" },
                { label: lang === "vi" ? "Sản phẩm & Dịch vụ" : "Products Showcase", icon: Gift, to: "/m/products" },
                { label: lang === "vi" ? "Tin tức & Thông báo" : "News & Notices", icon: Newspaper, to: "/m/news" },
                { label: lang === "vi" ? "Thư viện & Điều lệ" : "Library & Rules", icon: FolderOpen, to: "/m/library" },
              ].map((mod, idx) => {
                const ModIcon = mod.icon;
                return (
                  <Link
                    key={idx}
                    to={mod.to}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)]/60 p-4 text-center transition hover:border-[var(--vba-gold)]/60 hover:bg-[var(--vba-gold-soft)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
                      <ModIcon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-[var(--vba-text)]">{mod.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--vba-border-soft)] bg-[var(--vba-surface)]/40 py-10 text-center text-xs text-[var(--vba-text-muted)]">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-[var(--vba-gold)]" />
                <span className="font-bold text-[var(--vba-text)]">{a.name}</span>
                <span className="text-[var(--vba-text-muted)]">· Hệ điều hành kết nối ViOne Enterprise</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <Link to="/landing" className="text-[var(--vba-gold)] hover:underline">
                  Giới thiệu ViOne
                </Link>
                <Link to="/m" className="text-[var(--vba-gold)] hover:underline">
                  App Hội viên
                </Link>
                <Link to="/auth" className="text-[var(--vba-gold)] hover:underline">
                  Đăng nhập
                </Link>
              </div>
            </div>
            <div className="mt-6 border-t border-[var(--vba-border-soft)] pt-4 text-[11px] text-[var(--vba-text-muted)]">
              © {new Date().getFullYear()} {a.name}. Bảo lưu mọi quyền. Phát triển trên nền tảng ViOne Enterprise OS.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
