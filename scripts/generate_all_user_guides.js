const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = docx;

const DOCS_DIR = path.join(__dirname, '..', 'document');
const EVIDENCE_DIR = path.join(DOCS_DIR, 'images', 'evidence');
const PUBLIC_DOCS_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs');

if (!fs.existsSync(PUBLIC_DOCS_DIR)) {
  fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });
}

function getBase64Image(filename) {
  const p = path.join(EVIDENCE_DIR, filename);
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  console.warn(`[WARN] Image not found: ${filename}`);
  return '';
}

function getImageBuffer(filename) {
  const p = path.join(EVIDENCE_DIR, filename);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p);
  }
  console.warn(`[WARN] Image buffer not found: ${filename}`);
  return null;
}

// ----------------------------------------------------------------------------
// 1. GENERATE APP USER GUIDE MARKDOWN & HTML (HUONG_DAN_SU_DUNG_APP_HIEP_HOI)
// ----------------------------------------------------------------------------
function buildAppGuideMarkdown() {
  const p = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.md');
  return fs.readFileSync(p, 'utf8');
}

function buildCrmGuideMarkdown() {
  const p = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_CRM.md');
  return fs.readFileSync(p, 'utf8');
}

// ----------------------------------------------------------------------------
// 3. GENERATE BEAUTIFUL HTML FOR PDF EXPORT
// ----------------------------------------------------------------------------
function generateHtmlPage(title, mdContent) {
  // 1. Process inline markdown styles (bold, italic, code, link, image, hr)
  let raw = mdContent
    // Images
    .replace(/!\[(.*?)\]\(images\/evidence\/(.*?)\)/gim, (match, alt, filename) => {
      const b64 = getBase64Image(filename);
      if (b64) {
        return `<div class="img-container"><img src="${b64}" alt="${alt}" /><div class="img-caption">${alt}</div></div>`;
      }
      return `<div class="img-missing">[Hình ảnh: ${alt}]</div>`;
    })
    // Bold & Italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code class="inline-code">$1</code>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<span class="doc-link">$1</span>')
    // Horizontal rules
    .replace(/^---$/gim, '<hr class="divider"/>');

  const lines = raw.split('\n');
  const processed = [];
  let inTable = false;
  let tableRows = [];
  let listMode = null; // 'ol' | 'ul' | null

  function closeList() {
    if (listMode === 'ol') {
      processed.push('</ol>');
      listMode = null;
    } else if (listMode === 'ul') {
      processed.push('</ul>');
      listMode = null;
    }
  }

  function flushTable() {
    if (inTable) {
      inTable = false;
      let tblHtml = '<table class="data-table"><thead>';
      if (tableRows.length > 0) {
        tblHtml += '<tr>';
        tableRows[0].forEach(h => { tblHtml += `<th>${h}</th>`; });
        tblHtml += '</tr></thead><tbody>';
        for (let r = 1; r < tableRows.length; r++) {
          tblHtml += '<tr>';
          tableRows[r].forEach(c => { tblHtml += `<td>${c}</td>`; });
          tblHtml += '</tr>';
        }
      }
      tblHtml += '</tbody></table>';
      processed.push(tblHtml);
      tableRows = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) {
      flushTable();
      closeList();
      continue;
    }

    // Markdown Table row
    if (l.startsWith('|') && l.endsWith('|')) {
      closeList();
      if (l.includes('---')) continue; // Separator row
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = l.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Headings
    if (l.startsWith('# ')) {
      closeList();
      processed.push(`<h1 class="doc-title">${l.substring(2)}</h1>`);
    } else if (l.startsWith('## ')) {
      closeList();
      processed.push(`<h2 class="section-title">${l.substring(3)}</h2>`);
    } else if (l.startsWith('### ')) {
      closeList();
      processed.push(`<h3 class="sub-title">${l.substring(4)}</h3>`);
    } else if (l.startsWith('#### ')) {
      closeList();
      processed.push(`<h4 class="minor-title">${l.substring(5)}</h4>`);
    } else if (l === '<hr class="divider"/>') {
      closeList();
      processed.push(l);
    } else if (l.startsWith('<div class="img-container') || l.startsWith('<div class="img-missing')) {
      closeList();
      processed.push(l);
    } else if (/^(\d+)\.\s+(.*)$/.test(l)) {
      // Ordered Step Item
      const match = l.match(/^(\d+)\.\s+(.*)$/);
      if (listMode !== 'ol') {
        closeList();
        listMode = 'ol';
        processed.push('<ol class="steps-list">');
      }
      processed.push(`<li class="step-item"><span class="step-num">${match[1]}</span><div class="step-content">${match[2]}</div></li>`);
    } else if (/^[-*]\s+(.*)$/.test(l)) {
      // Unordered Bullet Item
      const match = l.match(/^[-*]\s+(.*)$/);
      if (listMode !== 'ul') {
        closeList();
        listMode = 'ul';
        processed.push('<ul class="bullet-list">');
      }
      processed.push(`<li class="bullet-item">${match[1]}</li>`);
    } else {
      closeList();
      processed.push(`<p class="doc-text">${l}</p>`);
    }
  }

  flushTable();
  closeList();

  const finalBody = processed.join('\n');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 8pt;
        color: #718096;
      }
      @bottom-left {
        content: "Hiệp Hội Doanh Nhân CEO 1983 · Hệ Thống Quản Trị CEO 1983";
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 8pt;
        color: #718096;
      }
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #1a202c;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-banner {
      background: linear-gradient(135deg, #0A1A3A 0%, #003B95 100%);
      color: #ffffff;
      padding: 24px 28px;
      border-radius: 8px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0, 59, 149, 0.2);
    }
    .header-banner h1 {
      color: #ffffff !important;
      margin: 0 0 8px 0 !important;
      font-size: 19pt !important;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header-banner p {
      margin: 0;
      font-size: 10pt;
      color: #F59E0B;
      font-weight: 600;
    }
    .doc-title {
      color: #0A1A3A;
      font-size: 18pt;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 12px;
      border-bottom: 2px solid #003B95;
      padding-bottom: 8px;
    }
    .section-title {
      color: #003B95;
      font-size: 13pt;
      font-weight: 700;
      margin-top: 26px;
      margin-bottom: 12px;
      padding-left: 10px;
      border-left: 4px solid #F59E0B;
      page-break-after: avoid;
    }
    .sub-title {
      color: #1E293B;
      font-size: 11.5pt;
      font-weight: 600;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    .minor-title {
      color: #475569;
      font-size: 10.5pt;
      font-weight: 600;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    p, .doc-text {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
      line-height: 1.65;
    }
    .steps-list {
      list-style-type: none;
      padding-left: 0;
      margin: 12px 0 16px 0;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      line-height: 1.6;
      page-break-inside: avoid;
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      height: 26px;
      background: #003B95;
      color: #ffffff;
      font-weight: 700;
      font-size: 9pt;
      border-radius: 6px;
      margin-right: 12px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-content {
      flex: 1;
    }
    .bullet-list {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 22px;
    }
    .bullet-item {
      margin-bottom: 6px;
      line-height: 1.6;
    }
    .inline-code {
      background: #F1F5F9;
      color: #003B95;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', monospace;
      font-size: 9.5pt;
      border: 1px solid #CBD5E1;
    }
    .divider {
      border: 0;
      height: 1px;
      background: #E2E8F0;
      margin: 22px 0;
    }
    .img-container {
      margin: 16px 0;
      text-align: center;
      page-break-inside: avoid;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
    }
    .img-container img {
      max-width: 94%;
      max-height: 480px;
      height: auto;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: inline-block;
    }
    .img-caption {
      font-size: 9pt;
      font-style: italic;
      color: #475569;
      margin-top: 8px;
      font-weight: 600;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    .data-table th, .data-table td {
      border: 1px solid #CBD5E1;
      padding: 8px 10px;
      text-align: left;
    }
    .data-table th {
      background: #003B95;
      color: #ffffff;
      font-weight: 700;
    }
    .data-table tr:nth-child(even) {
      background: #F8FAFC;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 600;
    }
    .badge-success { background: #DCFCE7; color: #166534; }
    .badge-info { background: #DBEAFE; color: #1E40AF; }
    .badge-warning { background: #FEF3C7; color: #92400E; }
  </style>
</head>
<body>
  <div class="header-banner">
    <h1>HỆ THỐNG QUẢN TRỊ & MẠNG LƯỚI DOANH NHÂN CEO 1983</h1>
    <p>Hiệp Hội Doanh Nhân CEO 1983 · Live Production Staging · Phiên bản v2.6.0 Pro</p>
  </div>
  ${finalBody}
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// 4. GENERATE DOCX FILE (Using 'docx' package)
// ----------------------------------------------------------------------------
function parseFormattedRuns(text, baseOpts = {}) {
  const runs = [];
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, ...baseOpts }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true, ...baseOpts }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({ text: part.slice(1, -1), font: "Consolas", color: "003B95", size: (baseOpts.size || 21) - 1 }));
    } else {
      runs.push(new TextRun({ text: part, ...baseOpts }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text, ...baseOpts })];
}

async function generateDocx(outputPath, title, mdContent) {
  console.log(`Generating DOCX: ${outputPath}`);
  const lines = mdContent.split('\n');
  const children = [];

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Hiệp hội Doanh nhân CEO 1983 — Hệ thống quản trị CEO 1983", italics: true, color: "003B95", bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) {
      if (inTable && tableRows.length > 0) {
        const docxRows = [
          new TableRow({
            tableHeader: true,
            children: tableRows[0].map(h => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })] })],
              shading: { fill: "003B95" },
              margins: { top: 100, bottom: 100, left: 120, right: 120 }
            }))
          }),
          ...tableRows.slice(1).map((r, rIdx) => new TableRow({
            children: r.map(c => new TableCell({
              children: [new Paragraph({ children: parseFormattedRuns(c, { size: 19 }) })],
              shading: { fill: rIdx % 2 === 1 ? "F8FAFC" : "FFFFFF" },
              margins: { top: 80, bottom: 80, left: 120, right: 120 }
            }))
          }))
        ];
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: docxRows
        }));
        children.push(new Paragraph({ spacing: { after: 120 } }));
        tableRows = [];
        inTable = false;
      }
      continue;
    }

    // Table rows
    if (l.startsWith('|') && l.endsWith('|')) {
      if (l.includes('---')) continue;
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = l.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      inTable = false;
      if (tableRows.length > 0) {
        const docxRows = [
          new TableRow({
            tableHeader: true,
            children: tableRows[0].map(h => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })] })],
              shading: { fill: "003B95" },
              margins: { top: 100, bottom: 100, left: 120, right: 120 }
            }))
          }),
          ...tableRows.slice(1).map((r, rIdx) => new TableRow({
            children: r.map(c => new TableCell({
              children: [new Paragraph({ children: parseFormattedRuns(c, { size: 19 }) })],
              shading: { fill: rIdx % 2 === 1 ? "F8FAFC" : "FFFFFF" },
              margins: { top: 80, bottom: 80, left: 120, right: 120 }
            }))
          }))
        ];
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: docxRows
        }));
        children.push(new Paragraph({ spacing: { after: 120 } }));
        tableRows = [];
      }
    }

    if (l.startsWith('# ')) {
      children.push(new Paragraph({
        text: l.substring(2),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 120 }
      }));
    } else if (l.startsWith('## ')) {
      children.push(new Paragraph({
        text: l.substring(3),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 }
      }));
    } else if (l.startsWith('### ')) {
      children.push(new Paragraph({
        text: l.substring(4),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 180, after: 80 }
      }));
    } else if (l.startsWith('#### ')) {
      children.push(new Paragraph({
        text: l.substring(5),
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 140, after: 60 }
      }));
    } else if (l === '---') {
      // Horizontal separator
      children.push(new Paragraph({
        spacing: { before: 140, after: 140 },
        border: { bottom: { color: "E2E8F0", space: 1, style: BorderStyle.SINGLE, size: 6 } }
      }));
    } else if (l.startsWith('![') && l.includes('images/evidence/')) {
      const match = l.match(/!\[(.*?)\]\(images\/evidence\/(.*?)\)/);
      if (match) {
        const alt = match[1];
        const filename = match[2];
        const imgBuffer = getImageBuffer(filename);
        if (imgBuffer) {
          try {
            children.push(new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: { width: 520, height: 290 }
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 140, after: 60 }
            }));
            children.push(new Paragraph({
              children: [
                new TextRun({ text: `Hình minh họa: ${alt}`, italics: true, size: 18, color: "555555" })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 140 }
            }));
          } catch(e) {
            console.warn(`Docx image insert failed for ${filename}:`, e.message);
          }
        }
      }
    } else if (/^(\d+)\.\s+(.*)$/.test(l)) {
      const match = l.match(/^(\d+)\.\s+(.*)$/);
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `Bước ${match[1]}: `, bold: true, color: "003B95", size: 21 }),
          ...parseFormattedRuns(match[2], { size: 21 })
        ],
        indent: { left: 400, hanging: 200 },
        spacing: { before: 80, after: 80 }
      }));
    } else if (/^[-*]\s+(.*)$/.test(l)) {
      const match = l.match(/^[-*]\s+(.*)$/);
      children.push(new Paragraph({
        children: parseFormattedRuns(match[1], { size: 21 }),
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 }
      }));
    } else {
      children.push(new Paragraph({
        children: parseFormattedRuns(l, { size: 21 }),
        spacing: { after: 100 }
      }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved DOCX successfully: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// ----------------------------------------------------------------------------
// 5. MAIN EXECUTION ROUTINE
// ----------------------------------------------------------------------------
async function main() {
  console.log('=== STARTING USER GUIDE GENERATION ===');

  // 1. Build Markdown contents
  const appMd = buildAppGuideMarkdown();
  const crmMd = buildCrmGuideMarkdown();

  // 2. Save Markdown files
  const appMdPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.md');
  const crmMdPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_CRM.md');
  fs.writeFileSync(appMdPath, appMd, 'utf8');
  fs.writeFileSync(crmMdPath, crmMd, 'utf8');
  console.log(`Saved Markdown: ${appMdPath} (${(appMd.length / 1024).toFixed(1)} KB)`);
  console.log(`Saved Markdown: ${crmMdPath} (${(crmMd.length / 1024).toFixed(1)} KB)`);

  // Also save copy to public/docs for web/app preview
  fs.writeFileSync(path.join(PUBLIC_DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.md'), appMd, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DOCS_DIR, 'HUONG_DAN_SU_DUNG_CRM.md'), crmMd, 'utf8');

  // 3. Build HTML pages
  const appHtml = generateHtmlPage("HƯỚNG DẪN SỬ DỤNG APP HIỆP HỘI DOANH NHÂN CEO 1983", appMd);
  const crmHtml = generateHtmlPage("HƯỚNG DẪN SỬ DỤNG HỆ THỐNG WEB CRM QUẢN TRỊ CLB CEO 1983", crmMd);

  const appHtmlPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.html');
  const crmHtmlPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_CRM.html');
  fs.writeFileSync(appHtmlPath, appHtml, 'utf8');
  fs.writeFileSync(crmHtmlPath, crmHtml, 'utf8');

  // 4. Generate PDFs using Playwright Chromium
  console.log('Launching Playwright browser with Google Chrome for high-resolution PDF printing...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    channel: !fs.existsSync(chromePath) ? 'msedge' : undefined,
    headless: true
  });
  
  // App PDF
  console.log('Rendering App Guide PDF...');
  const appPage = await browser.newPage();
  await appPage.setContent(appHtml, { waitUntil: 'load' });
  const appPdfPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.pdf');
  await appPage.pdf({
    path: appPdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '18mm', left: '15mm', right: '15mm' }
  });
  await appPage.close();
  console.log(`Rendered PDF: ${appPdfPath}`);

  // Copy to public/docs/HUONG_DAN_SU_DUNG_APP_HIEP_HOI.pdf and also default CEO1983 name
  fs.copyFileSync(appPdfPath, path.join(PUBLIC_DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.pdf'));
  fs.copyFileSync(appPdfPath, path.join(PUBLIC_DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf'));
  fs.copyFileSync(appPdfPath, path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf'));

  // CRM PDF
  console.log('Rendering CRM Guide PDF...');
  const crmPage = await browser.newPage();
  await crmPage.setContent(crmHtml, { waitUntil: 'load' });
  const crmPdfPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_CRM.pdf');
  await crmPage.pdf({
    path: crmPdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '18mm', left: '15mm', right: '15mm' }
  });
  await crmPage.close();
  console.log(`Rendered PDF: ${crmPdfPath}`);

  // Copy to public/docs/HUONG_DAN_SU_DUNG_CRM.pdf
  fs.copyFileSync(crmPdfPath, path.join(PUBLIC_DOCS_DIR, 'HUONG_DAN_SU_DUNG_CRM.pdf'));

  await browser.close();

  // 5. Generate Word DOCX files
  const appDocxPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI.docx');
  const crmDocxPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_CRM.docx');
  await generateDocx(appDocxPath, "HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG DI ĐỘNG HIỆP HỘI DOANH NHÂN CEO 1983", appMd);
  await generateDocx(crmDocxPath, "HƯỚNG DẪN SỬ DỤNG HỆ THỐNG WEB CRM QUẢN TRỊ CLB CEO 1983", crmMd);

  console.log('=== ALL USER GUIDES GENERATED SUCCESSFULLY ===');
  console.log('Summary of generated files:');
  console.log('1. document/HUONG_DAN_SU_DUNG_APP_HIEP_HOI.md');
  console.log('2. document/HUONG_DAN_SU_DUNG_APP_HIEP_HOI.pdf');
  console.log('3. document/HUONG_DAN_SU_DUNG_APP_HIEP_HOI.docx');
  console.log('4. document/HUONG_DAN_SU_DUNG_CRM.md');
  console.log('5. document/HUONG_DAN_SU_DUNG_CRM.pdf');
  console.log('6. document/HUONG_DAN_SU_DUNG_CRM.docx');
  console.log('7. apps/vione_app_fe/public/docs/ (PDF & MD synced for App In-App Viewer)');
}

main().catch(err => {
  console.error('Fatal error during guide generation:', err);
  process.exit(1);
});
