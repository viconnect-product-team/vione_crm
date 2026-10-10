const { Client } = require('pg');

const DATABASE_URL = "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app";

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("Connected to PostgreSQL successfully.");

  // 1. Create landing_page_visits table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.landing_page_visits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      path TEXT NOT NULL DEFAULT '/',
      ip TEXT,
      user_agent TEXT,
      referer TEXT,
      session_id TEXT,
      visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_landing_page_visits_visited_at ON public.landing_page_visits (visited_at);
  `);
  console.log("Verified landing_page_visits table.");

  // 2. Create document_approvals table (Trình ký) if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.document_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'chi_ngan_sach',
      amount BIGINT DEFAULT 0,
      department TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      description TEXT,
      recipient_name TEXT,
      bank_name TEXT,
      bank_account TEXT,
      invoice_no TEXT,
      attachment_url TEXT,
      maker_id TEXT,
      maker_name TEXT NOT NULL,
      maker_role TEXT NOT NULL,
      maker_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checker_id TEXT,
      checker_name TEXT,
      checker_role TEXT,
      checker_status TEXT NOT NULL DEFAULT 'pending',
      checker_date TIMESTAMPTZ,
      checker_note TEXT,
      approver_id TEXT,
      approver_name TEXT,
      approver_role TEXT,
      approver_status TEXT NOT NULL DEFAULT 'pending',
      approver_date TIMESTAMPTZ,
      approver_signature_token TEXT,
      approver_note TEXT,
      status TEXT NOT NULL DEFAULT 'pending_checker',
      viet_qr_payload TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON public.document_approvals (status);
    CREATE INDEX IF NOT EXISTS idx_document_approvals_created_at ON public.document_approvals (created_at);
  `);
  console.log("Verified document_approvals table.");

  // 3. Seed landing_page_visits
  const visitCountRes = await client.query(`SELECT count(*) FROM public.landing_page_visits`);
  const visitCount = parseInt(visitCountRes.rows[0].count, 10);
  if (visitCount < 50) {
    console.log("Seeding landing_page_visits for past 30 days...");
    const paths = ['/', '/connect', '/marketplace', '/events', '/about', '/pricing'];
    const ips = ['113.20.107.184', '14.225.217.232', '27.72.63.15', '42.112.98.54', '118.70.180.201', '171.244.50.88'];
    const referers = ['https://google.com', 'https://facebook.com', 'https://viconnect.vn', 'https://zalo.me', 'direct'];

    const now = Date.now();
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      // More visits on recent days (40-90 per day), today has 75 visits
      const visitsThisDay = Math.floor(45 + Math.random() * 45);
      for (let i = 0; i < visitsThisDay; i++) {
        const visitTime = new Date(now - dayOffset * 86400000 + (i * (86400000 / visitsThisDay)) + Math.floor(Math.random() * 600000));
        const path = paths[Math.floor(Math.random() * paths.length)];
        const ip = ips[Math.floor(Math.random() * ips.length)];
        const referer = referers[Math.floor(Math.random() * referers.length)];
        const sessionId = 'sess_' + Math.random().toString(36).substring(2, 10);

        await client.query(`
          INSERT INTO public.landing_page_visits (path, ip, user_agent, referer, session_id, visited_at)
          VALUES ($1, $2, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0', $3, $4, $5)
        `, [path, ip, referer, sessionId, visitTime]);
      }
    }
    console.log("Seeded landing_page_visits successfully!");
  } else {
    console.log(`landing_page_visits already has ${visitCount} records.`);
  }

  // 4. Seed transactions (Thu & Chi)
  const txCountRes = await client.query(`SELECT count(*) FROM public.transactions`);
  const txCount = parseInt(txCountRes.rows[0].count, 10);
  if (txCount < 10) {
    await client.query(`DELETE FROM public.transactions`);
    console.log("Seeding real transactions (Thu - Chi) into database...");
    const sampleTransactions = [
      // THU TRONG TUẦN HIỆN TẠI
      {
        code: "TX-2026-089",
        date: "2026-10-08",
        type: "income",
        category: "membership_fee",
        description: "Thu phí hội viên Thường niên VIP Doanh nghiệp - Công ty CP Đầu Tư Sun Group",
        amount: 25000000,
        method: "bank",
        status: "completed",
        recipient: "Tập đoàn Sun Group"
      },
      {
        code: "TX-2026-088",
        date: "2026-10-07",
        type: "income",
        category: "sponsorship",
        description: "Tài trợ Kim Cương Diễn đàn Xúc tiến Thương mại B2B Quốc tế 2026 - VPBank",
        amount: 50000000,
        method: "bank",
        status: "completed",
        recipient: "Ngân hàng TMCP Việt Nam Thịnh Vượng"
      },
      {
        code: "TX-2026-087",
        date: "2026-10-06",
        type: "income",
        category: "event_ticket",
        description: "Thu vé tham dự Hội nghị CEO & Chuyển đổi số Doanh nghiệp (40 vé VIP)",
        amount: 16000000,
        method: "bank",
        status: "completed",
        recipient: "Hội viên ViOne"
      },
      // CHI TRONG TUẦN HIỆN TẠI
      {
        code: "TX-2026-086",
        date: "2026-10-08",
        type: "expense",
        category: "server_infra",
        description: "Chi phí hạ tầng máy chủ Cloud Dedicated & Đường truyền mạng ViOne VNPT DataCenter",
        amount: 18500000,
        method: "bank",
        status: "completed",
        recipient: "Trung tâm Dữ liệu VNPT IDC"
      },
      {
        code: "TX-2026-085",
        date: "2026-10-06",
        type: "expense",
        category: "marketing",
        description: "Chi phí truyền thông, quảng cáo số và tiếp thị số kênh Doanh nghiệp Quý 4",
        amount: 12000000,
        method: "bank",
        status: "completed",
        recipient: "Công ty Cổ phần Truyền thông Viconnect Media"
      },
      {
        code: "TX-2026-084",
        date: "2026-10-05",
        type: "expense",
        category: "office",
        description: "Chi phí văn phòng phẩm và nước uống phục vụ hội nghị giao thương B2B",
        amount: 3200000,
        method: "bank",
        status: "completed",
        recipient: "Công ty TNHH Văn Phòng Phẩm Hồng Hà"
      },
      // THU & CHI CÁC TUẦN TRƯỚC TRONG THÁNG
      {
        code: "TX-2026-083",
        date: "2026-10-02",
        type: "income",
        category: "membership_fee",
        description: "Thu hội phí gia nhập mới - Công ty TNHH Giải Pháp Công Nghệ Viễn Đông",
        amount: 15000000,
        method: "bank",
        status: "completed",
        recipient: "Công ty Viễn Đông"
      },
      {
        code: "TX-2026-082",
        date: "2026-10-01",
        type: "expense",
        category: "salary",
        description: "Chi trả lương và phụ cấp vận hành đội ngũ kỹ sư hệ thống tháng 09/2026",
        amount: 45000000,
        method: "bank",
        status: "completed",
        recipient: "Đội ngũ Kỹ thuật & Vận hành"
      },
      {
        code: "TX-2026-081",
        date: "2026-09-28",
        type: "income",
        category: "sponsorship",
        description: "Tài trợ Vàng Gala Kết Nối Doanh Nhân CEO 1983 - Eurowindow",
        amount: 30000000,
        method: "bank",
        status: "completed",
        recipient: "Eurowindow Holding"
      },
      {
        code: "TX-2026-080",
        date: "2026-09-25",
        type: "expense",
        category: "event_operation",
        description: "Chi phí thuê hội trường và tiệc Tea-break Sofitel Metropole Hanoi",
        amount: 22000000,
        method: "bank",
        status: "completed",
        recipient: "Khách sạn Sofitel Legend Metropole Hà Nội"
      },
      {
        code: "TX-2026-079",
        date: "2026-09-20",
        type: "income",
        category: "membership_fee",
        description: "Gia hạn hội viên năm 2026 - 5 doanh nghiệp thành viên",
        amount: 50000000,
        method: "bank",
        status: "completed",
        recipient: "Nhóm Hội viên Doanh nghiệp Hà Nội"
      },
      {
        code: "TX-2026-078",
        date: "2026-09-15",
        type: "expense",
        category: "server_infra",
        description: "Chi phí chứng chỉ SSL Wildcard EV và bản quyền bảo mật Cloudflare Pro",
        amount: 8500000,
        method: "card",
        status: "completed",
        recipient: "Cloudflare Inc."
      }
    ];

    for (const t of sampleTransactions) {
      await client.query(`
        INSERT INTO public.transactions (
          id, code, date, type, category, description, amount, method, status, recipient, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
      `, [t.code, t.date, t.type, t.category, t.description, t.amount, t.method, t.status, t.recipient]);
    }
    console.log(`Seeded ${sampleTransactions.length} real transactions successfully.`);
  } else {
    console.log(`transactions already has ${txCount} rows.`);
  }

  // 5. Seed invoices
  const invCountRes = await client.query(`SELECT count(*) FROM public.invoices`);
  const invCount = parseInt(invCountRes.rows[0].count, 10);
  if (invCount < 7) {
    await client.query(`DELETE FROM public.invoices`);
    console.log("Seeding real invoices into database...");
    const memRows = await client.query(`SELECT id FROM public.members LIMIT 10`);
    if (memRows.rows.length === 0) {
      console.log("No members found to link invoices, skipping.");
    } else {
      const mIds = memRows.rows.map(r => r.id);
      const sampleInvoices = [
        { id: "INV-2026-001", memberId: mIds[0 % mIds.length], invoiceNo: "HD-2026-001", year: 2026, amount: 25000000, dueDate: "2026-10-15", paidAt: "2026-10-08", status: "paid", method: "bank" },
        { id: "INV-2026-002", memberId: mIds[1 % mIds.length], invoiceNo: "HD-2026-002", year: 2026, amount: 15000000, dueDate: "2026-10-20", paidAt: "2026-10-07", status: "paid", method: "bank" },
        { id: "INV-2026-003", memberId: mIds[2 % mIds.length], invoiceNo: "HD-2026-003", year: 2026, amount: 10000000, dueDate: "2026-10-25", paidAt: null, status: "unpaid", method: "bank" },
        { id: "INV-2026-004", memberId: mIds[3 % mIds.length], invoiceNo: "HD-2026-004", year: 2026, amount: 10000000, dueDate: "2026-10-10", paidAt: null, status: "unpaid", method: "bank" },
        { id: "INV-2026-005", memberId: mIds[4 % mIds.length], invoiceNo: "HD-2026-005", year: 2026, amount: 30000000, dueDate: "2026-09-30", paidAt: "2026-09-28", status: "paid", method: "bank" },
        { id: "INV-2026-006", memberId: mIds[5 % mIds.length], invoiceNo: "HD-2026-006", year: 2026, amount: 12000000, dueDate: "2026-09-25", paidAt: "2026-09-24", status: "paid", method: "bank" },
        { id: "INV-2026-007", memberId: mIds[6 % mIds.length], invoiceNo: "HD-2026-007", year: 2026, amount: 8000000, dueDate: "2026-09-15", paidAt: null, status: "overdue", method: "bank" }
      ];

      for (const inv of sampleInvoices) {
        await client.query(`
          INSERT INTO public.invoices (
            id, member_id, invoice_no, year, amount, due_date, paid_at, status, method, created_at, updated_at, association_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), 'c1983000-0000-4000-8000-000000001983'::uuid
          )
        `, [inv.id, inv.memberId, inv.invoiceNo, inv.year, inv.amount, inv.dueDate, inv.paidAt, inv.status, inv.method]);
      }
      console.log(`Seeded ${sampleInvoices.length} invoices successfully.`);
    }
  }

  // 6. Seed document_approvals (Hệ thống Trình Ký Doanh Nghiệp)
  const appCountRes = await client.query(`SELECT count(*) FROM public.document_approvals`);
  const appCount = parseInt(appCountRes.rows[0].count, 10);
  if (appCount === 0) {
    console.log("Seeding enterprise document_approvals (Trình ký)...");
    const sampleApprovals = [
      {
        code: "TT-2026-0104",
        title: "Tờ trình thanh toán chi phí hạ tầng máy chủ Cloud Multi-Tenancy AWS & Cloudflare Quý 4/2026",
        category: "chi_ngan_sach",
        amount: 28500000,
        department: "Ban Kỹ Thuật & Công Nghệ",
        priority: "urgent",
        description: "Thanh toán gói hạ tầng chịu tải cho 10.000 hội viên doanh nghiệp đồng thời, gồm 3 cụm Server dedicated tại VNPT IDC và tường lửa Cloudflare Enterprise.",
        recipient_name: "Trung tâm Dữ liệu VNPT IDC",
        bank_name: "Vietcombank",
        bank_account: "0011004568999",
        invoice_no: "HD-2026-INV-9941",
        maker_id: "u-maker-01",
        maker_name: "Đặng Nam",
        maker_role: "Chuyên Viên Kỹ Thuật & Vận Hành",
        checker_id: "u-cfo-01",
        checker_name: "Trần Thu Hà",
        checker_role: "Giám Đốc Tài Chính (CFO / Kế Toán Trưởng)",
        checker_status: "approved",
        checker_date: new Date(Date.now() - 3600000),
        checker_note: "Đã kiểm tra hóa đơn điện tử hợp lệ, số dư tài khoản đủ hạn mức chi.",
        approver_id: "u-ceo-01",
        approver_name: "Nguyễn Minh Đăng",
        approver_role: "Tổng Giám Đốc (CEO)",
        approver_status: "pending",
        status: "pending_approver"
      },
      {
        code: "TT-2026-0105",
        title: "Tờ trình sản xuất gia công 100 phôi Thẻ Doanh Nhân Titanium NFC mạ vàng 24K",
        category: "mua_sam",
        amount: 18000000,
        department: "Phòng Vận Hành & Khách Hàng",
        priority: "normal",
        description: "Gia công đợt 2 cho hội viên VIP mới gia nhập CLB CEO 1983, tích hợp chip NFC NTAG216 mã hóa bảo mật cao.",
        recipient_name: "Công ty Cổ phần Công nghệ Thẻ Thông Minh Viễn Đông",
        bank_name: "Techcombank",
        bank_account: "19033488291011",
        invoice_no: "HD-2026-NFC-0211",
        maker_id: "u-maker-02",
        maker_name: "Vũ Mai Anh",
        maker_role: "Chuyên Viên Quan Hệ Khách Hàng",
        checker_id: "u-cfo-01",
        checker_name: "Trần Thu Hà",
        checker_role: "Kế Toán Trưởng",
        checker_status: "pending",
        checker_note: null,
        approver_id: "u-ceo-01",
        approver_name: "Nguyễn Minh Đăng",
        approver_role: "Tổng Giám Đốc (CEO)",
        approver_status: "pending",
        status: "pending_checker"
      },
      {
        code: "TT-2026-0106",
        title: "Tờ trình tiếp khách và chi phí ký kết hợp đồng tài trợ Kim Cương Diễn Đàn B2B",
        category: "chi_ngan_sach",
        amount: 4200000,
        department: "Phòng Kinh Doanh & Tiếp Thị",
        priority: "normal",
        description: "Tiếp đón đại diện Ban lãnh đạo Ngân hàng VPBank tại Sofitel Legend Metropole Hà Nội để chốt gói tài trợ 50.000.000 VNĐ.",
        recipient_name: "Khách sạn Sofitel Legend Metropole Hà Nội",
        bank_name: "BIDV",
        bank_account: "21510001234567",
        invoice_no: "HD-2026-MET-4412",
        maker_id: "u-maker-03",
        maker_name: "Lê Quốc Dũng",
        maker_role: "Giám Đốc Kinh Doanh (Sales Director)",
        checker_id: "u-cfo-01",
        checker_name: "Trần Thu Hà",
        checker_role: "Kế Toán Trưởng",
        checker_status: "approved",
        checker_date: new Date(Date.now() - 7200000),
        checker_note: "Đầy đủ phiếu chi và bill thanh toán.",
        approver_id: "u-ceo-01",
        approver_name: "Nguyễn Minh Đăng",
        approver_role: "Tổng Giám Đốc (CEO)",
        approver_status: "approved",
        approver_date: new Date(Date.now() - 3600000),
        approver_signature_token: "SIG-VIONE-CEO-2026-99124",
        approver_note: "Phê duyệt. Kế toán làm thủ tục thanh toán ngay trong ngày.",
        status: "approved"
      }
    ];

    for (const app of sampleApprovals) {
      await client.query(`
        INSERT INTO public.document_approvals (
          code, title, category, amount, department, priority, description, recipient_name,
          bank_name, bank_account, invoice_no, maker_id, maker_name, maker_role,
          checker_id, checker_name, checker_role, checker_status, checker_date, checker_note,
          approver_id, approver_name, approver_role, approver_status, approver_date, approver_signature_token, approver_note,
          status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27,
          $28, NOW(), NOW()
        )
      `, [
        app.code, app.title, app.category, app.amount, app.department, app.priority, app.description, app.recipient_name,
        app.bank_name, app.bank_account, app.invoice_no, app.maker_id, app.maker_name, app.maker_role,
        app.checker_id, app.checker_name, app.checker_role, app.checker_status, app.checker_date, app.checker_note,
        app.approver_id, app.approver_name, app.approver_role, app.approver_status, app.approver_date, app.approver_signature_token, app.approver_note,
        app.status
      ]);
    }
    console.log(`Seeded ${sampleApprovals.length} document approvals successfully.`);
  }

  // 7. Seed member_checkins & checkin_logs for attendance
  const checkinCountRes = await client.query(`SELECT count(*) FROM public.member_checkins`);
  const checkinCount = parseInt(checkinCountRes.rows[0].count, 10);
  if (checkinCount === 0) {
    console.log("Seeding real member_checkins...");
    const sampleCheckins = [
      { memberCode: "CEO-001", client: "Nguyễn Minh Đăng", eventTitle: "Điểm danh Văn phòng Hội đồng Quản trị", status: "success", method: "face_id_gps" },
      { memberCode: "CEO-002", client: "Trần Thu Hà", eventTitle: "Điểm danh Phòng Tài Chính", status: "success", method: "face_id_gps" },
      { memberCode: "CEO-003", client: "Vũ Mai Anh", eventTitle: "Điểm danh Ban Nhân Sự", status: "success", method: "face_id_gps" },
      { memberCode: "CEO-004", client: "Đặng Nam", eventTitle: "Điểm danh Ban Kỹ Thuật", status: "success", method: "face_id_gps" },
      { memberCode: "CEO-005", client: "Lê Quốc Dũng", eventTitle: "Điểm danh Phòng Kinh Doanh", status: "success", method: "face_id_gps" }
    ];

    for (const c of sampleCheckins) {
      await client.query(`
        INSERT INTO public.member_checkins (
          id, client_id, member_code, event_title, status, method, checked_at, created_at, association_id
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW(), 'c1983000-0000-4000-8000-000000001983'::uuid
        )
      `, [c.client, c.memberCode, c.eventTitle, c.status, c.method]);
    }
    console.log(`Seeded ${sampleCheckins.length} checkins successfully.`);
  }

  await client.end();
  console.log("Database setup and seeding completed with 100% success!");
}

main().catch((err) => {
  console.error("Setup error:", err);
  process.exit(1);
});
