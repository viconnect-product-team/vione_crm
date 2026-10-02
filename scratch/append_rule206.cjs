const fs = require('fs');

const rule206 = `
206. **Quy Chuẩn ViOne Enterprise Platform 5.0 (AI Copilot Đa Năng, Zero CRM Web Redirects Trên Mobile, Dữ Liệu Thực PostgreSQL & MinIO)**:
     - **Chuẩn Hóa Thuật Ngữ B2B Doanh Nghiệp (Enterprise Standard)**:
       * TUYỆT ĐỐI KHÔNG SỬ DỤNG các từ "hội viên", "hiệp hội", "câu lạc bộ", "CEO 1983" trong bất kỳ giao diện, API, schema, tài liệu, hay văn bản của ViOne.
       * Luôn sử dụng thuật ngữ chuẩn doanh nghiệp: "Doanh nghiệp", "Tổ chức", "Khách hàng B2B", "Nhân sự / Nhân viên", "Quản lý / Lãnh đạo", "Đối tác chiến lược".
     - **AI Copilot Doanh Nghiệp 5.0 Đa Năng (\`/ai\`, \`ai.service.ts\`)**:
       * Trí tuệ nhân tạo tương tác tự nhiên, thông minh, hỗ trợ giọng nói 2 chiều: Lắng nghe (Web Speech STT) và Trả lời phát âm tiếng Việt (Web Speech Synthesis TTS).
       * Nhận diện và Xử lý tệp Excel/CSV linh hoạt: Tự động phân tích cấu trúc cột, hiển thị modal xem trước (preview modal), cho phép xác nhận và nạp trực tiếp vào CSDL PostgreSQL (\`public.companies\`, \`public.members\`, \`public.business_opportunities\`, \`public.products\`, \`public.tasks\`).
       * Tự động soạn thảo văn bản hành chính doanh nghiệp chuẩn mực (Hợp đồng B2B, Biên bản cuộc họp HĐQT, Tờ trình thanh toán, Kế hoạch kinh doanh) với tính năng xem trước và xuất file Word (\`.doc\`), in/lưu PDF (\`.pdf\`), lưu trữ vào danh mục tài liệu.
     - **Tuyệt Đối Không Redirect Ra Web CRM Trên Mobile (Zero Out-of-App Web Redirects)**:
       * Các chức năng Vận hành doanh nghiệp (Chấm công GPS/FaceID, Quy trình Kanban/Checklist, Phê duyệt thanh toán 3 cấp) trên App ViOne (cả Responsive PWA \`/connect-app/*\` và React Native Mobile \`apps/mobile_vione\`) PHẢI được hiển thị qua In-App Native Sheets / Bottom Modals nội bộ.
       * TUYỆT ĐỐI KHÔNG dùng thẻ \`<Link to="/attendance">\` hay \`<Link to="/workflow">\` để điều hướng người dùng mobile ra màn hình CRM web desktop gây gãy vỡ trải nghiệm người dùng.
     - **Dữ Liệu Thực 100% Qua RESTful API, PostgreSQL & MinIO S3**:
       * Mọi dữ liệu hiển thị và thao tác trên CRM và Mobile App đều phải tương tác thông qua RESTful API kết nối trực tiếp CSDL PostgreSQL (\`vione_project\`) và MinIO S3 Object Storage (\`vione-standalone-bucket\`), TUYỆT ĐỐI KHÔNG dùng mock data tĩnh hoặc dữ liệu giả lập.
`;

fs.appendFileSync('.cursorrules', rule206, 'utf8');
console.log('Appended Rule 206 successfully');
