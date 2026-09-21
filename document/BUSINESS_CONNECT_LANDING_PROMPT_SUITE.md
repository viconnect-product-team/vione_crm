# BỘ SIÊU PROMPT MASTER: HỆ THỐNG LANDING PAGE B2B SAAS (BUSINESS CONNECT V1 - V8)
*Dành riêng cho Senior Frontend Engineer & UI/UX Director*
*Chuẩn hóa theo Tiêu chuẩn Thiết kế Đẳng cấp Doanh nghiệp & Tập đoàn Lớn*

---

## PHẦN 1: BỘ KHUNG KIẾN TRÚC & NỘI DUNG GỐC (BẮT BUỘC COPY)

### [SYSTEM RULE & TARGET AUDIENCE - CRITICAL]
- **Vai trò**: Đóng vai Senior Frontend Engineer & UI/UX Director. Code landing page B2B SaaS bằng React, Tailwind CSS và Framer Motion.
- **Khách hàng mục tiêu**: CEO, Chủ tịch, Giám đốc, Lãnh đạo Hiệp hội.
- **Triết lý Thiết kế (Premium B2B)**: Thiết kế phải toát lên sự SANG TRỌNG, NGHIÊM TÚC và ĐẲNG CẤP TẬP ĐOÀN. Tuyệt đối không thiết kế giống game hay web giải trí. Animation phải mượt mà, phục vụ mục đích tôn vinh dữ liệu.

### [QUY TẮC CẤU TRÚC DOM & TYPOGRAPHY]
- **Grid Cấu trúc thép**: Mọi `<section>` phải có padding lớn (`py-24`). Layout sử dụng CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) hoặc Flexbox với `gap-8`. Card phải có padding `p-8` vuông vức.
- **Typography Doanh nghiệp**: Headline (`h1`, `h2`) dùng font to, tracking chặt, in đậm. Subtext (`p`) dùng `text-lg`, độ tương phản cao, tuyệt đối không dùng chữ mờ nhạt khó đọc.
- **Visual Storytelling**: Tránh render "rừng chữ". Ở phần Vấn đề & Giải pháp, ưu tiên dùng Ảnh/GIF trực quan. Text mô tả chi tiết được giấu đi và chỉ hiển thị khi Hover/Click.

### [QUY TẮC BACKGROUND ẢNH 3 LỚP - BẮT BUỘC]
Tuyệt đối không dùng CSS Gradient chay làm nền. Phải cấu trúc Background thành 3 layer:
- **Layer 0 (Đáy)**: Ảnh thật chất lượng cao (Real Image) từ Unsplash, `z-index` thấp nhất.
- **Layer 1 (Overlay)**: Lớp phủ mờ/tối/sáng để đảm bảo text nổi bật.
- **Layer 2 (Animation)**: Lớp GIF động hoặc hiệu ứng Canvas/Framer Motion tương tác.

---

### [NỘI DUNG BẮT BUỘC SỬ DỤNG - CHÍNH XÁC 100% THEO ẢNH GỐC]

#### 1. Header:
`Giải pháp | Khách hàng | Câu chuyện | Bảng giá | Tài nguyên | Về chúng tôi || Đăng nhập | [Đặt demo ->]`

#### 2. Hero Section:
- **Tagline**: `NỀN TẢNG KẾT NỐI KINH DOANH THẾ HỆ MỚI`
- **Headline**: `Hiểu đúng người. Mở ra cơ hội thật.`
- **Subtext**: `Business Connect giúp các hiệp hội, tổ chức và doanh nhân quản lý mối quan hệ, kết nối đúng người, đúng thời điểm và tạo ra nhiều cơ hội kinh doanh hơn với sức mạnh của AI.`
- **Nút**: `[Đặt demo ngay ->]` | `[Xem video (2 phút)]`
- **Stats**:
  - `10,000+ Doanh nhân & Hội viên`
  - `300+ Hiệp hội & Tổ chức`
  - `50,000+ Kết nối được tạo`
  - `20+ Quốc gia & vùng lãnh thổ`

#### 3. Vấn đề (Problem Section):
- **Headline**: `Quản lý quan hệ kinh doanh vẫn còn nhiều thách thức`
- **5 Cột/Thẻ Bento**:
  1. `(1) Thông tin phân tán`: Khó tìm đúng người
  2. `(2) Khó duy trì quan hệ`: Thiếu công cụ nhắc nhở và theo dõi tương tác
  3. `(3) Bỏ lỡ cơ hội`: Không kịp nắm bắt cơ hội phù hợp
  4. `(4) Thiếu kết nối thực chất`: Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện
  5. `(5) Khó đo lường hiệu quả`: Không biết mối quan hệ mang lại giá trị gì

#### 4. Giải pháp (Solution Section):
- **Headline**: `Quản lý kết nối. Tạo ra cơ hội.`
- **Subtext**: `Một nền tảng toàn diện giúp hiệp hội, tổ chức và doanh nhân hiểu khách hàng, kết nối đúng người, xây dựng quan hệ bền vững và biến mối quan hệ thành cơ hội kinh doanh thực chất.` | `[Khám phá tính năng ->]`
- **9 Tính năng doanh nghiệp**:
  1. `Quản lý hội viên` (Hồ sơ 360, phân nhóm thông minh...)
  2. `CRM & Quan hệ` (Theo dõi lịch sử, ghi chú, nhắc nhở...)
  3. `Cơ hội kinh doanh` (Quản lý pipeline, matching...)
  4. `Sự kiện` (Tổ chức, quản lý, kết nối trước - trong - sau...)
  5. `Cộng đồng & Nhóm` (Không gian kết nối theo ngành, chủ đề...)
  6. `Tri thức & Nội dung` (Chia sẻ chuyên gia, tài liệu...)
  7. `Báo cáo & Phân tích` (Đo lường hiệu quả kết nối và ROI...)
  8. `AI Copilot` (Tìm kiếm, gợi ý kết nối, tóm tắt...)
  9. `Tích hợp & Mở rộng` (Kết nối với hệ thống khác CRM, email, calendar...)

#### 5. Hệ sinh thái (Ecosystem Section):
- **Tagline**: `HỆ SINH THÁI KẾT NỐI KINH DOANH`
- **Headline**: `Cùng nhau tạo ra giá trị lớn hơn`
- **Subtext**: `Business Connect kết nối hội viên, hiệp hội, doanh nghiệp, chuyên gia, đối tác, nhà đầu tư và các tổ chức quốc tế trong một hệ sinh thái mở, để cùng chia sẻ tri thức, nguồn lực và cơ hội kinh doanh.` | `[Xem hệ sinh thái ->]`
- **Highlight**: `NHIỀU KẾT NỐI HƠN. NHIỀU CƠ HỘI HƠN. NHIỀU GIÁ TRỊ HƠN.`

#### 6. Khách hàng & Testimonial:
- **Header 1**: `ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP` -> `Những tổ chức tiên phong đã lựa chọn` | `[Xem tất cả khách hàng ->]`
- **Logos**: `VCCI`, `AmCham`, `EuroCham`, `KoCham`, `Singapore Business Federation`, `AusCham`.
- **Header 2**: `CÂU CHUYỆN THÀNH CÔNG` -> `Kết nối đúng. Tăng trưởng thật.`
- **3 Review cards**:
  1. `Nguyễn Thị Lan` - Chủ tịch Hiệp hội Du lịch VN
  2. `Trần Minh Quân` - CEO, Công ty Sản xuất Việt
  3. `Lê Hoàng Anh` - Doanh nhân, Hội viên VIP

#### 7. Footer:
`Sẵn sàng mở ra nhiều cơ hội hơn? Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn.` | `[Đặt demo ngay ->]` | `[Liên hệ tư vấn]`

---

## PHẦN 2: 7 PHIÊN BẢN CHUYÊN BIỆT (GHÉP VÀO PHẦN 1)

### V1: Executive Zen (Ẩn dụ Tu Tiên - Tối giản, Thông suốt, Tĩnh tại)
- **UI/UX & 3 Themes**:
  - *Light*: Phong cách Resort cao cấp. Nền Xám sương mù, chữ Than chì, điểm nhấn Vàng Champagne.
  - *Dark (`dark:`)*: Xám đen sâu, điểm nhấn Ánh kim.
  - *Contrast (`data-theme="contrast"`)*: Trắng/Đen thuần, viền mỏng sắc sảo.
  - *Theme-Switch (Cửa trượt)*: Đổi theme -> 2 khối màu từ hai lề màn hình đóng sập lại ở giữa, che khuất web, đổi theme, rồi mở toang ra.
- **Background 3 Lớp**:
  - *Layer 0*: Ảnh phong cảnh núi non sương mù hoặc thiền viện tĩnh lặng Unsplash (1/2 màn hình hoặc vát chéo).
  - *Layer 1*: Phủ màu Gradient Xám/Đen để làm mờ bức ảnh, tôn phần text lên.
  - *Layer 2*: Lớp GIF sương mù cuộn chảy (Flowing mist) siêu mờ `opacity-10`.
- **Chuyển cảnh & Hiệu ứng**:
  - *Transition*: "Zen Parallax" - Section cũ mờ đi, section mới bồng bềnh trồi lên nhẹ nhàng.
  - *Visuals*: Icon là các nét vẽ line-art. Viền thẻ Card có luồng sáng (Glow) chạy quanh cực chậm tượng trưng cho linh khí/luồng dữ liệu. Hover vào text hiện ra dạng mực ngấm (Ink reveal).

---

### V2: Heritage & Trust (Ẩn dụ Cổ Tích - Di sản, Minh triết, Tin cậy)
- **UI/UX & 3 Themes**:
  - *Light*: Private Banking/Luật. Nền Be nhạt (Parchment), font chữ Serif sang trọng (`Merriweather` / `Playfair`).
  - *Dark (`dark:`)*: Xanh Navy thẫm (`#0B132B`), chữ Vàng ánh kim (`#F59E0B`).
  - *Contrast (`data-theme="contrast"`)*: Báo chí cổ điển, Trắng/Đen tương phản cao.
  - *Theme-Switch (Lật sách)*: Đổi theme -> Toàn bộ màn hình bị lật ngang qua như lật một trang sách 3D (`rotateY`).
- **Background 3 Lớp**:
  - *Layer 0*: Ảnh chụp vĩ mô bề mặt giấy da cổ hoặc thư viện sang trọng (chiếm toàn màn hình).
  - *Layer 1*: Overlay màu Xanh Navy/Be `opacity-80` để tạo không gian đọc.
  - *Layer 2*: Hạt ánh sáng vàng kim (Gold Particles) bay lơ lửng chậm chạp.
- **Chuyển cảnh & Hiệu ứng**:
  - *Transition*: "Legacy Reveal" - Section mới trượt lên như lật mở hồ sơ.
  - *Visuals*: Thẻ thiết kế như tài liệu mạ vàng. Phần Vấn đề hiển thị dạng lọ thuốc/con dấu tĩnh, hover vào sủi bọt/nổi lên hé lộ text. Con trỏ chuột có bụi sao (Stardust).

---

### V3: Premium Editorial (Ẩn dụ Comic - Đột phá, Mạnh mẽ, Sắc nét)
- **UI/UX & 3 Themes**:
  - *Light*: Trắng tinh, Đen nhám. Viền cứng, Brutalism doanh nghiệp.
  - *Dark (`dark:`)*: Đen huyền bí, điểm nhấn Cam Neon (`#FF5500` / `#F97316`).
  - *Contrast (`data-theme="contrast"`)*: Trắng/Đen thuần, outline dày 2px.
  - *Theme-Switch (Màn trập)*: Đổi theme -> 5 dải màu sập xuống từ trần nhà che kín màn hình, đổi theme, rồi cuộn ngược lên biến mất.
- **Background 3 Lớp**:
  - *Layer 0*: Ảnh Abstract kiến trúc (tòa nhà kính cắt xẻ) dạng Grayscale Unsplash.
  - *Layer 1*: Lớp Overlay họa tiết lưới kẻ ô vuông (Grid pattern).
  - *Layer 2*: Hắt sáng Gradient từ viền màn hình vào trong.
- **Chuyển cảnh & Hiệu ứng**:
  - *Transition*: "Snap & Slide" - Cuộn trang dứt khoát, khối thông tin trượt vào với gia tốc nhanh và hãm phanh mượt (`easeOut`).
  - *Visuals*: Thẻ Giải pháp có bóng đổ Offset shadow cứng. Text to, đậm. Thay vì BAM/POW lố lăng, dùng hiệu ứng đẩy khối vật lý (Push down) dứt khoát khi Click/Hover.

---

### V4: Executive Glass Dashboard (Ẩn dụ Mưa Kính - Độ sâu, Đa tầng)
- **UI/UX & 3 Themes**:
  - *Light*: Kính mờ trên nền Bạc sáng (`backdrop-blur-xl`).
  - *Dark (`dark:`)*: Kính đen (Smoked glass) trên Gradient Xanh/Tím tối.
  - *Contrast (`data-theme="contrast"`)*: Giao diện phẳng, bỏ hiệu ứng kính mờ.
  - *Theme-Switch (Wipe Fog)*: Đổi theme -> Màn hình blur mờ đục 100%, sau đó một thanh gạt nước quét ngang làm trong vắt lại với Theme mới.
- **Background 3 Lớp**:
  - *Layer 0*: Ảnh Trung tâm tài chính ban đêm fixed `inset-0` Unsplash.
  - *Layer 1*: Blur ảnh gốc cực mạnh (`blur-3xl`) + lớp phủ `bg-black/40`.
  - *Layer 2*: Hiệu ứng nước mưa ròng ròng trên kính ở `opacity-20`.
- **Chuyển cảnh & Hiệu ứng**:
  - *Transition*: "Z-Index Stack" - Cuộn trang, các lớp kính đè lấp lên nhau.
  - *Visuals*: Layout nằm trong các Glass Cards. Hiệu ứng Lau kính: Chuột đi tới đâu, mặt kính rõ nét tới đó để lộ nội dung. Icon dạng khối kính lồi (Thấu kính giọt nước).

---

### V5: Deep Tech Data (Ẩn dụ Cyberpunk - Công nghệ lõi, Xử lý Tốc độ cao)
- **UI/UX & 3 Themes**:
  - *Light*: Nhôm nguyên khối, viền Bạc.
  - *Dark (`dark:`)*: Đen thuần, viền `white/10`, Neon Xanh dương (`#00F0FF`).
  - *Contrast (`data-theme="contrast"`)*: Terminal Xanh lá/Đen (`#00FF66`).
  - *Theme-Switch (Glitch Matrix)*: Đổi theme -> Giao diện giật nhiễu RGB 0.2s, mưa ký tự số rơi che kín, sau đó tan biến lộ Theme mới.
- **Background 3 Lớp**:
  - *Layer 0*: Ảnh Data Center hoặc Macro Chip vi xử lý Unsplash.
  - *Layer 1*: Lớp phủ che 90% ảnh, chỉ chừa lại ánh đèn server ở góc.
  - *Layer 2*: Họa tiết bo mạch (Circuit board) siêu mờ.
- **Chuyển cảnh & Hiệu ứng**:
  - *Transition*: "Scanline Wipe" - Section mới hiện ra theo dạng quét dòng tia laser từ trên xuống.
  - *Visuals*: Quầng sáng bám chuột (Spotlight) rọi rõ chi tiết bo mạch trên thẻ Card. Text hiện ra kiểu mã hóa/giải mã (Terminal typing).

---

### V6: Corporate Monument (Ẩn dụ Kim tự tháp - Vững chãi, Quyền uy, Trường tồn)
- **UI/UX & 3 Themes**:
  - *Light*: Đá cẩm thạch (Marble White) hoặc Cát ấm.
  - *Dark (`dark:`)*: Đen Obsidian, Vàng đồng (Bronze).
  - *Contrast (`data-theme="contrast"`)*: Khối Trắng/Đen cắt mạnh, không gradient.
  - *Theme-Switch (Đá Sập)*: Đổi theme -> 2 phiến đá từ trần nhà và mặt đất trượt đập vào nhau ở giữa màn hình (rung nhẹ), rồi mở toang ra dọc.
- **Background 3 Lớp**:
  - *Layer 0*: Ảnh bề mặt Đá cẩm thạch nguyên khối hoặc đền đài cổ (vát 2/3) Unsplash.
  - *Layer 1*: Overlay Multiply để hòa trộn vân đá với màu nền theme.
  - *Layer 2*: Lớp bão cát (Sandstorm) thổi ngang qua.
- **Chuyển cảnh & Hiệu ứng**:
  - *Transition*: "Solid Block" - Khối nội dung trồi lên như trụ đá vững chãi. Cắt vát chéo (Diagonal slice).
  - *Visuals*: Thẻ thiết kế như phiến đá nguyên khối 3D. Icon Minimalist dập chìm lên đá. Hover đổ bóng thay đổi theo hướng sáng.

---

### V7: Fluid Analytics (Ẩn dụ Bong bóng - Linh hoạt, Hợp nhất, Trôi chảy)
- **UI/UX & 3 Themes**:
  - *Light*: Trắng sứ, mây pastel.
  - *Dark (`dark:`)*: Xanh đại dương, Gradient luân chuyển mềm.
  - *Contrast (`data-theme="contrast"`)*: Vector Solid rõ nét.
  - *Theme-Switch (Giọt nước)*: Đổi theme -> Hình tròn màu bùng nổ từ vị trí chuột, scale 100vw nuốt trọn màn hình sang Theme mới.
- **Background 3 Lớp**:
  - *Layer 0*: Ảnh bầu trời mây mềm mại hoặc Studio không gian tĩnh Unsplash.
  - *Layer 1*: Lớp Glass mờ `backdrop-blur-md` phủ lên ảnh.
  - *Layer 2*: Mesh Gradient hòa quyện như chất lỏng (Fluid animation) trôi lơ lửng.
- **Chuyển cảnh & Hiệu ứng**:
  - *Transition*: "Fluid Morph" - Ranh giới section là các đường cong dẻo uốn lượn khi cuộn.
  - *Visuals*: Thẻ Card bo tròn góc lớn (`rounded-3xl`). Hover có độ nảy đàn hồi (Jelly bounce). Nội dung bên trong thẻ hiển thị cực kỳ to, rõ, không bị bóp méo dẻo quẹo gây khó đọc.
