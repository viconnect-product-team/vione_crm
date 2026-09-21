const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'en.json'), 'utf8'));
const vi = JSON.parse(fs.readFileSync(path.join(__dirname, 'vi.json'), 'utf8'));

// Common phrase maps for JA, KO, ZH
const jaGlossary = {
  "Đăng nhập": "ログイン",
  "Đăng ký": "新規登録",
  "Quên mật khẩu?": "パスワードをお忘れですか？",
  "Hội viên": "会員",
  "Hiệp hội": "協会",
  "Hiệp hội Doanh nghiệp": "企業協会",
  "Trang chủ": "ホーム",
  "Thông báo": "通知",
  "Tin nhắn": "メッセージ",
  "Cá nhân": "プロフィール",
  "Mã QR": "QRコード",
  "Thẻ hội viên": "会員証",
  "Mở App Hội Viên": "会員アプリを開く",
  "Bắt đầu ngay": "今すぐ開始",
  "Liên hệ ban thư ký": "事務局へのお問い合わせ",
  "Cơ hội giao thương": "ビジネス商談機会",
  "Sản phẩm & Dịch vụ": "製品・サービス",
  "Sự kiện & Lịch họp": "イベント・会議",
  "Danh bạ hội viên": "会員名簿",
  "Tin tức & Thông báo": "ニュース・お知らせ",
  "Thư viện & Điều lệ": "規約・ライブラリ",
  "Quyền lợi hội viên": "会員特典",
  "Quét mã để cài đặt & mở ứng dụng": "QRコードをスキャンしてアプリを開く",
  "Hỗ trợ nhanh trên cả iOS, Android & Máy tính": "iOS、Android、PCに完全対応",
  "Mở trực tiếp trên trình duyệt": "ブラウザで直接開く",
  "Đội Ngũ Lãnh Đạo Tiên Phong": "パイオニアリーダーシップチーム",
  "Quyền Lợi & Tiện Ích Dành Cho Hội Viên": "会員限定の特典と機能",
  "Diễn Đàn & Hội Nghị Xúc Tiến Thương Mại": "ビジネスフォーラム＆貿易促進会議",
  "Cơ Hội Giao Thương B2B Nổi Bật": "注目のB2Bビジネス商談",
  "Gian Hàng Doanh Nghiệp Hội Viên": "会員企業の製品ブース",
  "Khám Phá Các Phân Hệ Ứng Dụng": "アプリ機能モジュールを探索",
  "Vào ứng dụng": "アプリに入る",
  "Đăng nhu cầu mới": "新規ニーズを投稿",
  "Xem tất cả": "すべて見る",
  "Xem chi tiết & Báo giá": "詳細＆見積もりを見る",
  "Kết nối giao thương": "ビジネスマッチング",
  "Đăng ký vé & Check-in": "チケット予約＆チェックイン",
  "Tính năng nhanh": "クイック機能",
  "Khám phá ngay": "今すぐ探索",
  "Đăng ngay": "今すぐ投稿",
  "Xem ngay": "今すぐ確認",
  "Sự kiện nổi bật": "注目イベント",
  "Cài đặt ứng dụng": "アプリをインストール",
  "Tìm kiếm": "検索...",
  "Đang tải...": "読み込み中...",
  "Không có dữ liệu": "データがありません",
  "Chế độ sáng": "ライトモード",
  "Chế độ tối": "ダークモード",
  "Độ tương phản cao": "ハイコントラスト",
  "Giao diện": "外観テーマ",
  "Ngôn ngữ": "言語"
};

const koGlossary = {
  "Đăng nhập": "로그인",
  "Đăng ký": "회원가입",
  "Quên mật khẩu?": "비밀번호를 잊으셨나요?",
  "Hội viên": "회원",
  "Hiệp hội": "협회",
  "Hiệp hội Doanh nghiệp": "기업 협회",
  "Trang chủ": "홈",
  "Thông báo": "알림",
  "Tin nhắn": "메시지",
  "Cá nhân": "프로필",
  "Mã QR": "QR 코드",
  "Thẻ hội viên": "회원 카드",
  "Mở App Hội Viên": "회원 앱 열기",
  "Bắt đầu ngay": "지금 시작하기",
  "Liên hệ ban thư ký": "사무국 문의",
  "Cơ hội giao thương": "B2B 비즈니스 기회",
  "Sản phẩm & Dịch vụ": "제품 및 서비스",
  "Sự kiện & Lịch họp": "이벤트 및 일정",
  "Danh bạ hội viên": "회원 디렉토리",
  "Tin tức & Thông báo": "뉴스 및 공지사항",
  "Thư viện & Điều lệ": "라이브러리 및 정관",
  "Quyền lợi hội viên": "회원 특권",
  "Quét mã để cài đặt & mở ứng dụng": "QR 코드를 스캔하여 앱 열기",
  "Hỗ trợ nhanh trên cả iOS, Android & Máy tính": "iOS, Android 및 PC 완벽 지원",
  "Mở trực tiếp trên trình duyệt": "브라우저에서 바로 열기",
  "Đội Ngũ Lãnh Đạo Tiên Phong": "선도적인 리더십 팀",
  "Quyền Lợi & Tiện Ích Dành Cho Hội Viên": "회원 전용 특권 및 혜택",
  "Diễn Đàn & Hội Nghị Xúc Tiến Thương Mại": "포럼 및 무역 진흥 회의",
  "Cơ Hội Giao Thương B2B Nổi Bật": "주요 B2B 비즈니스 기회",
  "Gian Hàng Doanh Nghiệp Hội Viên": "회원사 제품 쇼케이스",
  "Khám Phá Các Phân Hệ Ứng Dụng": "앱 에코시스템 탐색",
  "Vào ứng dụng": "앱 시작하기",
  "Đăng nhu cầu mới": "새로운 기회 등록",
  "Xem tất cả": "전체 보기",
  "Xem chi tiết & Báo giá": "상세정보 및 견적 보기",
  "Kết nối giao thương": "비즈니스 매칭",
  "Đăng ký vé & Check-in": "티켓 등록 및 체크인",
  "Tính năng nhanh": "빠른 기능",
  "Khám phá ngay": "지금 탐색",
  "Đăng ngay": "지금 등록",
  "Xem ngay": "지금 보기",
  "Sự kiện nổi bật": "주요 이벤트",
  "Cài đặt ứng dụng": "앱 설치",
  "Tìm kiếm": "검색...",
  "Đang tải...": "로딩 중...",
  "Không có dữ liệu": "데이터가 없습니다",
  "Chế độ sáng": "라이트 모드",
  "Chế độ tối": "다크 모드",
  "Độ tương phản cao": "고대비 모드",
  "Giao diện": "테마 설정",
  "Ngôn ngữ": "언어"
};

const zhGlossary = {
  "Đăng nhập": "登录",
  "Đăng ký": "注册",
  "Quên mật khẩu?": "忘记密码？",
  "Hội viên": "会员",
  "Hiệp hội": "商会",
  "Hiệp hội Doanh nghiệp": "企业商会",
  "Trang chủ": "首页",
  "Thông báo": "通知",
  "Tin nhắn": "消息",
  "Cá nhân": "个人中心",
  "Mã QR": "二维码",
  "Thẻ hội viên": "会员卡",
  "Mở App Hội Viên": "打开会员App",
  "Bắt đầu ngay": "立即开始",
  "Liên hệ ban thư ký": "联系秘书处",
  "Cơ hội giao thương": "商务合作机会",
  "Sản phẩm & Dịch vụ": "产品与服务",
  "Sự kiện & Lịch họp": "活动与会议",
  "Danh bạ hội viên": "会员名录",
  "Tin tức & Thông báo": "新闻与公告",
  "Thư viện & Điều lệ": "章程与文库",
  "Quyền lợi hội viên": "会员专属权益",
  "Quét mã để cài đặt & mở ứng dụng": "扫码安装并打开应用程序",
  "Hỗ trợ nhanh trên cả iOS, Android & Máy tính": "全面支持 iOS、Android 和电脑",
  "Mở trực tiếp trên trình duyệt": "在浏览器中直接打开",
  "Đội Ngũ Lãnh Đạo Tiên Phong": "卓越领导团队",
  "Quyền Lợi & Tiện Ích Dành Cho Hội Viên": "会员尊享特权与服务",
  "Diễn Đàn & Hội Nghị Xúc Tiến Thương Mại": "高端论坛与贸易促进大会",
  "Cơ Hội Giao Thương B2B Nổi Bật": "精选 B2B 商机对接",
  "Gian Hàng Doanh Nghiệp Hội Viên": "会员企业产品展厅",
  "Khám Phá Các Phân Hệ Ứng Dụng": "探索应用生态系统",
  "Vào ứng dụng": "进入应用",
  "Đăng nhu cầu mới": "发布新需求",
  "Xem tất cả": "查看全部",
  "Xem chi tiết & Báo giá": "查看详情与报价",
  "Kết nối giao thương": "商务对接",
  "Đăng ký vé & Check-in": "报名购票与签到",
  "Tính năng nhanh": "快捷功能",
  "Khám phá ngay": "立即探索",
  "Đăng ngay": "立即发布",
  "Xem ngay": "立即查看",
  "Sự kiện nổi bật": "精选活动",
  "Cài đặt ứng dụng": "安装应用",
  "Tìm kiếm": "搜索...",
  "Đang tải...": "加载中...",
  "Không có dữ liệu": "暂无数据",
  "Chế độ sáng": "浅色模式",
  "Chế độ tối": "深色模式",
  "Độ tương phản cao": "高对比度",
  "Giao diện": "外观主题",
  "Ngôn ngữ": "语言"
};

function translateKey(k, valEn, valVi, glossary) {
  // Check direct glossary
  if (glossary[valVi]) return glossary[valVi];
  
  // Specific key patterns
  if (k === 'theme.light') return glossary['Chế độ sáng'];
  if (k === 'theme.dark') return glossary['Chế độ tối'];
  if (k === 'theme.contrast') return glossary['Độ tương phản cao'];
  if (k === 'theme.label') return glossary['Giao diện'];
  if (k === 'lang.label') return glossary['Ngôn ngữ'];

  if (k.startsWith('m.shell.')) {
    if (k.includes('tab_home')) return glossary['Trang chủ'];
    if (k.includes('tab_notifications')) return glossary['Thông báo'];
    if (k.includes('tab_qr')) return glossary['Mã QR'];
    if (k.includes('tab_messages')) return glossary['Tin nhắn'];
    if (k.includes('tab_profile')) return glossary['Cá nhân'];
  }

  if (k.startsWith('m.index.')) {
    if (k.includes('qaCard')) return glossary['Thẻ hội viên'];
    if (k.includes('qaMembers')) return glossary['Danh bạ hội viên'];
    if (k.includes('qaEvents')) return glossary['Sự kiện & Lịch họp'];
    if (k.includes('qaNews')) return glossary['Tin tức & Thông báo'];
    if (k.includes('qaLibrary')) return glossary['Thư viện & Điều lệ'];
    if (k.includes('qaPerks')) return glossary['Quyền lợi hội viên'];
    if (k.includes('qaOffers')) return glossary['Quyền lợi hội viên'];
    if (k.includes('exploreNow')) return glossary['Khám phá ngay'];
    if (k.includes('postNow')) return glossary['Đăng ngay'];
    if (k.includes('viewNow')) return glossary['Xem ngay'];
    if (k.includes('viewAll')) return glossary['Xem tất cả'];
  }

  return valEn || valVi;
}

const ja = {};
const ko = {};
const zh = {};

for (const k of Object.keys(en)) {
  const valEn = en[k] || '';
  const valVi = vi[k] || '';
  ja[k] = translateKey(k, valEn, valVi, jaGlossary);
  ko[k] = translateKey(k, valEn, valVi, koGlossary);
  zh[k] = translateKey(k, valEn, valVi, zhGlossary);
}

fs.writeFileSync(path.join(__dirname, 'ja.json'), JSON.stringify(ja, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'ko.json'), JSON.stringify(ko, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'zh.json'), JSON.stringify(zh, null, 2), 'utf8');

console.log('Successfully generated ja.json, ko.json, zh.json with', Object.keys(ja).length, 'keys');
