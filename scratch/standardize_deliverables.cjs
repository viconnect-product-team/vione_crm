const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../scripts/generate_vione_user_guide_pdf.js'),
  path.join(__dirname, '../scripts/generate_vione_srs_docx.js'),
  path.join(__dirname, '../scripts/generate_vione_slides_pdf.js'),
  path.join(__dirname, '../scripts/generate_vione_excel_deliverables.js'),
];

const replacements = [
  // CEO 1983 purges
  [/CEO\s*1983/gi, 'ViOne Enterprise Platform 5.0'],
  [/ceo1983/gi, 'vione_enterprise'],
  [/CLB Doanh Nhân 1983/gi, 'Hệ Sinh Thái Doanh Nghiệp ViOne'],
  [/CLB 1983/gi, 'ViOne Enterprise'],
  
  // Hội viên -> Doanh nghiệp / Thành viên doanh nghiệp
  [/hội viên doanh nhân/gi, 'thành viên doanh nghiệp & đối tác'],
  [/Hội Viên Doanh Nhân/gi, 'Thành Viên Doanh Nghiệp & Đối Tác'],
  [/hội viên chính thức/gi, 'thành viên doanh nghiệp chính thức'],
  [/Hội viên chính thức/gi, 'Thành viên doanh nghiệp chính thức'],
  [/hội viên/gi, 'thành viên doanh nghiệp'],
  [/Hội viên/gi, 'Thành viên doanh nghiệp'],
  [/HỘI VIÊN/gi, 'THÀNH VIÊN DOANH NGHIỆP'],
  
  // Hiệp hội -> Doanh nghiệp / Tổ chức
  [/hiệp hội/gi, 'doanh nghiệp'],
  [/Hiệp hội/gi, 'Doanh nghiệp'],
  [/HIỆP HỘI/gi, 'DOANH NGHIỆP'],
  
  // Hội phí -> Phí dịch vụ nền tảng / Phí giải pháp
  [/hội phí/gi, 'phí giải pháp doanh nghiệp'],
  [/Hội phí/gi, 'Phí giải pháp doanh nghiệp'],
  [/HỘI PHÍ/gi, 'PHÍ GIẢI PHÁP DOANH NGHIỆP'],
];

for (const file of targetFiles) {
  if (!fs.existsSync(file)) {
    console.warn(`File not found: ${file}`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  let changed = 0;
  for (const [regex, replacement] of replacements) {
    const matches = (content.match(regex) || []).length;
    if (matches > 0) {
      content = content.replace(regex, replacement);
      changed += matches;
    }
  }
  fs.writeFileSync(file, content, 'utf8');
  console.log(`[CLEANED] ${path.basename(file)}: ${changed} terminology replacements made.`);
}

console.log('=== All deliverable generator scripts standardized to 100% ViOne Enterprise! ===');
