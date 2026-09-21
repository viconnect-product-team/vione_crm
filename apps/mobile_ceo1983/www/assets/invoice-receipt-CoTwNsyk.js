function o(t){return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(t)}function h(t){const e=t.type==="income",a=e?"PHIẾU THU TIỀN":"PHIẾU CHI TIỀN",i=t.id,s=t.date||new Date().toISOString().slice(0,10),l=t.method==="cash"?"Tiền mặt":t.method==="bank"?"Chuyển khoản ngân hàng":"Thẻ ngân hàng",r=t.type==="expense"&&(t.advanceAmount||0)>0?(t.advanceAmount||0)-(t.refundAmount||0):t.amount,c=`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${a} - ${i}</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background: #f8fafc; padding: 40px 20px; color: #1e293b; margin: 0; }
    .voucher-card {
      max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 16px;
      padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 800; color: #004b91; letter-spacing: -0.5px; }
    .sub-brand { font-size: 12px; color: #64748b; margin-top: 4px; }
    .voucher-meta { text-align: right; }
    .voucher-no { font-size: 16px; font-weight: 700; color: ${e?"#059669":"#dc2626"}; font-family: monospace; }
    .voucher-date { font-size: 12px; color: #64748b; margin-top: 4px; }
    .title { text-align: center; font-size: 24px; font-weight: 800; color: #0f172a; margin: 20px 0 30px; letter-spacing: 0.5px; }
    .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .detail-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .detail-table td.label { width: 35%; font-weight: 600; color: #475569; background: #f8fafc; }
    .detail-table td.val { font-weight: 500; color: #0f172a; }
    .highlight-amount { font-size: 20px; font-weight: 800; color: ${e?"#059669":"#dc2626"}; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 48px; padding-top: 20px; }
    .sig-title { font-size: 13px; font-weight: 700; color: #334155; }
    .sig-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .sig-space { height: 70px; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 16px; }
    @media print {
      body { background: transparent; padding: 0; }
      .voucher-card { box-shadow: none; border: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="voucher-card">
    <div class="header">
      <div>
        <div class="brand">HIỆP HỘI DOANH NGHIỆP CEO 1983</div>
        <div class="sub-brand">Hệ thống Quản trị Tài chính & Kế toán ViOne CRM</div>
      </div>
      <div class="voucher-meta">
        <div class="voucher-no">Số: ${i}</div>
        <div class="voucher-date">Ngày: ${s}</div>
      </div>
    </div>

    <div class="title">${a}</div>

    <table class="detail-table">
      <tr>
        <td class="label">${e?"Người nộp tiền:":"Người nhận tiền:"}</td>
        <td class="val"><strong>${t.recipient||(e?"Hội viên / Khách hàng":"Cán bộ / Đơn vị thụ hưởng")}</strong></td>
      </tr>
      <tr>
        <td class="label">Nội dung ${e?"thu:":"chi:"}</td>
        <td class="val">${t.description}</td>
      </tr>
      <tr>
        <td class="label">Danh mục hạch toán:</td>
        <td class="val"><span style="display:inline-block; padding:3px 8px; border-radius:6px; background:#e2e8f0; font-size:12px; font-weight:600;">${t.category}</span></td>
      </tr>
      <tr>
        <td class="label">Hình thức thanh toán:</td>
        <td class="val"><strong>${l}</strong></td>
      </tr>
      ${t.type==="expense"&&(t.advanceAmount||0)>0?`<tr>
              <td class="label">Số tiền tạm ứng ban đầu:</td>
              <td class="val">${o(t.advanceAmount||0)}</td>
            </tr>
            <tr>
              <td class="label">Số tiền hoàn ứng thừa:</td>
              <td class="val" style="color:#059669;">- ${o(t.refundAmount||0)}</td>
            </tr>
            <tr>
              <td class="label">Số tiền thực chi ròng:</td>
              <td class="val highlight-amount">${o(r)}</td>
            </tr>`:`<tr>
              <td class="label">Tổng số tiền:</td>
              <td class="val highlight-amount">${o(t.amount)}</td>
            </tr>`}
      <tr>
        <td class="label">Trạng thái giao dịch:</td>
        <td class="val" style="color: ${t.status==="completed"?"#059669":"#d97706"}; font-weight: 700;">
          ${t.status==="completed"?"ĐÃ HOÀN TẤT (HỢP LỆ)":"CHỜ DUYỆT / TẠM THỜI"}
        </td>
      </tr>
    </table>

    <div class="signatures">
      <div>
        <div class="sig-title">Người lập phiếu</div>
        <div class="sig-hint">(Ký, họ tên)</div>
        <div class="sig-space"></div>
        <div style="font-size:12px; font-weight:600;">Ban Kế Toán</div>
      </div>
      <div>
        <div class="sig-title">Thủ quỹ / Kế toán trưởng</div>
        <div class="sig-hint">(Ký, họ tên)</div>
        <div class="sig-space"></div>
        <div style="font-size:12px; font-weight:600;">Trưởng Ban Tài Chính</div>
      </div>
      <div>
        <div class="sig-title">${e?"Người nộp tiền":"Chủ tịch / Tổng thư ký duyệt"}</div>
        <div class="sig-hint">(Ký, họ tên)</div>
        <div class="sig-space"></div>
        <div style="font-size:12px; font-weight:600;">Xác nhận số hóa</div>
      </div>
    </div>

    <div class="footer">
      Chứng từ điện tử được khởi tạo tự động từ hệ thống ViOne CRM - CEO 1983. Mã tra cứu: ${i}
    </div>
  </div>
  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #004b91; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">In hoặc Lưu file PDF</button>
  </div>
</body>
</html>`,p=new Blob([c],{type:"text/html;charset=utf-8"}),d=URL.createObjectURL(p),n=document.createElement("a");n.href=d,n.download=`HOA_DON_${i}.html`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(d)}export{h as d};
