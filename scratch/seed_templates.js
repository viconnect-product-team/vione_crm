const { Client } = require('pg');

async function seedTemplates() {
  const client = new Client({
    connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true'
  });
  await client.connect();

  const assocs = [
    'c1983000-0000-4000-8000-000000001983',
    'b1000000-0000-4000-8000-000000000001'
  ];

  const templates = [
    {
      channel: 'email',
      label_vi: 'Xác nhận cuộc gặp kết nối 1-on-1',
      label_en: '1-on-1 Meeting Confirmation',
      subject_vi: 'Xác nhận lịch hẹn gặp kết nối & trao đổi cơ hội hợp tác',
      subject_en: 'Confirmation: Business Connect 1-on-1 Meeting',
      body_vi: 'Kính gửi {name},\n\nTôi rất vui được kết nối cùng Quý anh/chị. Tôi xin xác nhận lịch gặp gỡ kết nối 1-on-1 giữa chúng ta để trao đổi về cơ hội hợp tác và giao thương.\n\nThông tin chi tiết cuộc gặp đã được cập nhật trên hệ thống. Nếu có bất kỳ điều chỉnh nào về thời gian, anh/chị vui lòng phản hồi lại giúp tôi.\n\nTrân trọng,\n{card}',
      body_en: 'Dear {name},\n\nI am glad to connect with you. I would like to confirm our 1-on-1 business networking meeting.\n\nBest regards,\n{card}',
      priority: 10
    },
    {
      channel: 'phone',
      label_vi: 'Tin nhắn nhanh hẹn gặp giao thương (SMS/Zalo)',
      label_en: 'Quick Connect Message',
      subject_vi: null,
      subject_en: null,
      body_vi: 'Chào anh/chị {name}, tôi rất vui được kết nối qua Danh thiếp số Hiệp hội. Xin phép được gửi lời mời hẹn gặp giao thương 1-on-1 trong tuần này để trao đổi cơ hội hợp tác kinh doanh. Anh/chị xem chi tiết danh thiếp của tôi tại: {card}',
      body_en: 'Hello {name}, glad to connect with you via our Association digital card. Looking forward to our 1-on-1 meeting: {card}',
      priority: 20
    },
    {
      channel: 'email',
      label_vi: 'Thư mời tham dự sự kiện kết nối B2B',
      label_en: 'Invitation to B2B Networking Event',
      subject_vi: 'Thư mời tham dự chương trình Giao thương & Kết nối Doanh nghiệp',
      subject_en: 'Invitation: B2B Business Matching Event',
      body_vi: 'Kính gửi Quý Doanh nhân {name},\n\nBan Quản Trị trân trọng kính mời anh/chị tham dự buổi kết nối giao thương định kỳ của Hiệp hội. Đây là cơ hội tuyệt vời để gặp gỡ các chủ doanh nghiệp, mở rộng mạng lưới đối tác và tìm kiếm cơ hội cung ứng.\n\nTrân trọng kính mời,\nBan Quản Trị Hiệp Hội',
      body_en: 'Dear {name},\n\nWe cordially invite you to our upcoming B2B Networking Event.\n\nSincerely,\nExecutive Board',
      priority: 30
    },
    {
      channel: 'note',
      label_vi: 'Cảm ơn sau cuộc gặp kết nối & cam kết đồng hành',
      label_en: 'Thank You Note After Meeting',
      subject_vi: 'Cảm ơn buổi gặp gỡ kết nối ý nghĩa',
      subject_en: 'Thank you for our productive meeting',
      body_vi: 'Cảm ơn anh/chị {name} vì buổi gặp gỡ trao đổi rất cởi mở và giá trị hôm nay. Tôi sẽ sớm gửi thông tin chi tiết về các giải pháp và đề xuất hợp tác như đã thảo luận. Rất mong có cơ hội đồng hành lâu dài cùng doanh nghiệp của anh/chị!\n\nTrân trọng,\n{card}',
      body_en: 'Thank you {name} for our valuable discussion today. Looking forward to cooperating with you!\n\nBest regards,\n{card}',
      priority: 40
    }
  ];

  for (const assocId of assocs) {
    for (const t of templates) {
      await client.query(
        `INSERT INTO reply_templates (association_id, channel, label_vi, label_en, subject_vi, subject_en, body_vi, body_en, priority, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [assocId, t.channel, t.label_vi, t.label_en, t.subject_vi, t.subject_en, t.body_vi, t.body_en, t.priority]
      );
    }
  }

  const check = await client.query('SELECT COUNT(*) FROM reply_templates');
  console.log('Seeded successfully! Total count now:', check.rows[0].count);
  await client.end();
}

seedTemplates().catch(console.error);
