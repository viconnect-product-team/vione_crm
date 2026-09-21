const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'document');
const EVIDENCE_DIR = path.join(OUT_DIR, 'images', 'evidence');
const FE_DOCS_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs');

for (const d of [OUT_DIR, FE_DOCS_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function getImgBase64(imgRelPath) {
  const cleanName = path.basename(imgRelPath);
  const p = path.join(EVIDENCE_DIR, cleanName);
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

function convertMarkdownToHtml(mdText, docTitle, subtitle) {
  const lines = mdText.split('\n');
  let html = '';
  let inTable = false;
  let tableHeaderParsed = false;
  let inList = false;
  let listType = '';

  function closeList() {
    if (inList) {
      html += listType === 'ol' ? '</ol>\n' : '</ul>\n';
      inList = false;
      listType = '';
    }
  }

  function closeTable() {
    if (inTable) {
      html += '</tbody></table></div>\n';
      inTable = false;
      tableHeaderParsed = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trimEnd();

    // Phân tích đường kẻ ngang
    if (line.trim() === '---') {
      closeList();
      closeTable();
      html += '<hr />\n';
      continue;
    }

    // Phân tích bảng biểu Markdown
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      closeList();
      const cells = line.split('|').map(c => c.trim()).slice(1, -1);
      
      // Bỏ qua dòng phân cách |:---|---|:---:|
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        tableHeaderParsed = true;
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderParsed = false;
        html += '<div class="table-container"><table>\n';
      }

      if (!tableHeaderParsed) {
        html += '<thead><tr>' + cells.map(c => `<th>${formatInline(c)}</th>`).join('') + '</tr></thead><tbody>\n';
      } else {
        html += '<tr>' + cells.map(c => `<td>${formatInline(c)}</td>`).join('') + '</tr>\n';
      }
      continue;
    } else {
      closeTable();
    }

    // Phân tích danh sách không thứ tự (* hoặc -)
    const ulMatch = line.match(/^(\s*)[*-]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        html += '<ul>\n';
      }
      html += `<li>${formatInline(ulMatch[2])}</li>\n`;
      continue;
    }

    // Phân tích danh sách có thứ tự (1., 2.)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        html += '<ol>\n';
      }
      html += `<li>${formatInline(olMatch[2])}</li>\n`;
      continue;
    }

    closeList();

    // Phân tích hình ảnh ![caption](path)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const caption = imgMatch[1];
      const imgPath = imgMatch[2];
      const base64Data = getImgBase64(imgPath);
      html += `
        <div class="img-box">
          <img src="${base64Data || imgPath}" alt="${caption}" />
          <div class="img-caption">${caption}</div>
        </div>\n`;
      continue;
    }

    // Chú thích hình ảnh *Hình x.x: ...*
    if (line.startsWith('*Hình ') && line.endsWith('*')) {
      const cleanCap = line.slice(1, -1);
      html += `<p class="caption-line">${cleanCap}</p>\n`;
      continue;
    }

    // Phân tích Tiêu đề H1 - H4
    if (line.startsWith('# ')) {
      html += `<h1>${formatInline(line.slice(2))}</h1>\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      html += `<h2>${formatInline(line.slice(3))}</h2>\n`;
      continue;
    }
    if (line.startsWith('### ')) {
      html += `<h3>${formatInline(line.slice(4))}</h3>\n`;
      continue;
    }
    if (line.startsWith('#### ')) {
      html += `<h4>${formatInline(line.slice(5))}</h4>\n`;
      continue;
    }

    // Dòng trống
    if (line.trim() === '') {
      continue;
    }

    // Đoạn văn thông thường
    html += `<p>${formatInline(line)}</p>\n`;
  }

  closeList();
  closeTable();

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1E293B;
      line-height: 1.6;
      font-size: 10pt;
      background: #FFFFFF;
    }
    .cover-header {
      background: linear-gradient(135deg, #0A1A3A 0%, #003B95 100%);
      color: #FFFFFF;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      border-bottom: 4px solid #F59E0B;
    }
    .cover-header h1 {
      font-size: 18pt;
      color: #FFFFFF;
      margin-bottom: 8px;
      border-bottom: none;
      padding-bottom: 0;
    }
    .cover-header p {
      font-size: 10.5pt;
      color: #CBD5E1;
      margin-bottom: 4px;
    }
    .badge-org {
      display: inline-block;
      padding: 4px 12px;
      background: #F59E0B;
      color: #0A1A3A;
      font-weight: 700;
      font-size: 9pt;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 16pt;
      color: #003B95;
      border-bottom: 2px solid #F59E0B;
      padding-bottom: 6px;
      margin: 20px 0 12px 0;
      page-break-after: avoid;
    }
    h2 {
      font-size: 13pt;
      color: #003B95;
      background: #EFF6FF;
      border-left: 4px solid #003B95;
      padding: 6px 12px;
      margin: 18px 0 10px 0;
      page-break-after: avoid;
      border-radius: 0 4px 4px 0;
    }
    h3 {
      font-size: 11pt;
      color: #0A1A3A;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 4px;
      margin: 14px 0 8px 0;
      page-break-after: avoid;
    }
    h4 {
      font-size: 10.5pt;
      color: #334155;
      margin: 10px 0 6px 0;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 8px;
      text-align: justify;
    }
    .table-container {
      width: 100%;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    th {
      background: #003B95;
      color: #FFFFFF;
      padding: 7px 9px;
      text-align: left;
      border: 1px solid #002B70;
      font-weight: 700;
    }
    td {
      padding: 6px 9px;
      border: 1px solid #CBD5E1;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background: #F8FAFC;
    }
    .img-box {
      text-align: center;
      margin: 14px auto 6px auto;
      page-break-inside: avoid;
    }
    .img-box img {
      max-width: 92%;
      max-height: 360px;
      border: 1.5px solid #CBD5E1;
      border-radius: 6px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.06);
    }
    .img-caption {
      font-size: 8.5pt;
      font-style: italic;
      color: #64748B;
      margin-top: 5px;
      text-align: center;
    }
    .caption-line {
      font-size: 8.5pt;
      font-style: italic;
      color: #64748B;
      text-align: center;
      margin-bottom: 12px;
    }
    hr {
      border: none;
      border-top: 1px solid #E2E8F0;
      margin: 16px 0;
    }
    ul, ol {
      margin: 6px 0 10px 22px;
    }
    li {
      margin-bottom: 4px;
    }
    code {
      background: #F1F5F9;
      color: #0F172A;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 9pt;
      font-family: Consolas, monospace;
    }
    strong {
      color: #0F172A;
    }
  </style>
</head>
<body>
  <div class="cover-header">
    <div class="badge-org">CLB DOANH NHÂN CEO 1983 · HANOIBA</div>
    <h1>${docTitle}</h1>
    <p>${subtitle}</p>
    <p style="font-size: 9pt; color: #94A3B8; margin-top: 8px;">Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983 · Xuất bản: Năm 2026</p>
  </div>
  ${html}
</body>
</html>`;
}

function formatInline(str) {
  return str
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

async function renderPdf(htmlContent, outputPath, title, headerLabel) {
  console.log(`>>> Đang xuất bản PDF: ${outputPath}...`);
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'load' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '14mm',
      right: '14mm'
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width: 100%; font-size: 8pt; color: #64748B; font-family: sans-serif; padding: 0 14mm; display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
        <span>${headerLabel} · CLB Doanh Nhân CEO 1983</span>
        <span>Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)</span>
      </div>
    `,
    footerTemplate: `
      <div style="width: 100%; font-size: 8pt; color: #64748B; font-family: sans-serif; padding: 0 14mm; display: flex; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 4px;">
        <span>Bản quyền tài liệu © 2026 CLB Doanh Nhân CEO 1983</span>
        <span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();
  const sizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Xuất bản thành công: ${outputPath} (${sizeMb} MB)`);
}

async function main() {
  console.log('=== BẮT ĐẦU XUẤT BẢN FILE PDF HƯỚNG DẪN SỬ DỤNG CHUẨN IN ẤN A4 ===');

  // 1. PDF Hướng dẫn App Hiệp Hội
  const appMdPath = path.join(OUT_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.md');
  const appMd = fs.readFileSync(appMdPath, 'utf8');
  const appHtml = convertMarkdownToHtml(
    appMd,
    'HƯỚNG DẪN THAO TÁC & VẬN HÀNH ỨNG DỤNG HIỆP HỘI DOANH NHÂN CEO 1983',
    'Phân hệ Di động (Mobile App iOS & Android) & Cổng Đăng Ký Hội Viên Trực Tuyến'
  );
  const outPdfApp = path.join(OUT_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.pdf');
  await renderPdf(appHtml, outPdfApp, 'Hướng Dẫn Sử Dụng App Hiệp Hội', 'Ứng Dụng Di Động Hội Viên');
  fs.copyFileSync(outPdfApp, path.join(FE_DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.pdf'));

  // 2. PDF Hướng dẫn CRM Quản Trị
  const crmMdPath = path.join(OUT_DIR, 'HUONG_DAN_SU_DUNG_CRM.md');
  const crmMd = fs.readFileSync(crmMdPath, 'utf8');
  const crmHtml = convertMarkdownToHtml(
    crmMd,
    'HƯỚNG DẪN THAO TÁC & VẬN HÀNH HỆ THỐNG WEB CRM QUẢN TRỊ CLB CEO 1983',
    'Phân hệ Web CRM Admin Portal — Trung Tâm Chỉ Huy & Điều Hành Số Hóa Hiệp Hội'
  );
  const outPdfCrm = path.join(OUT_DIR, 'HUONG_DAN_SU_DUNG_CRM.pdf');
  await renderPdf(crmHtml, outPdfCrm, 'Hướng Dẫn Sử Dụng Web CRM Quản Trị', 'Hệ Thống Web CRM Quản Trị');
  fs.copyFileSync(outPdfCrm, path.join(FE_DOCS_DIR, 'HUONG_DAN_SU_DUNG_CRM.pdf'));

  console.log('=== HOÀN TẤT XUẤT BẢN 2 FILE PDF CHUẨN ĐẸP 100% ===');
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
