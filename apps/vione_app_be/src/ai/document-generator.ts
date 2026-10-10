import * as JSZip from 'jszip';

/**
 * ViOne Document Generator Engine
 * Hỗ trợ tạo file Word (.docx) và PDF (.pdf) chuẩn format doanh nghiệp
 */

export interface DocGenerationOptions {
  title?: string;
  docCode?: string;
  category?: string;
  partyA?: string;
  partyB?: string;
  value?: number;
  details?: string;
  duration?: string;
  department?: string;
  signerName?: string;
  signerRole?: string;
}

export class DocumentGenerator {
  /**
   * Tạo tệp Word (.docx) chuẩn format Microsoft Word / Office 365
   */
  static async generateWordBuffer(type: string, options: DocGenerationOptions = {}): Promise<{ buffer: Buffer; filename: string }> {
    const zip = new (JSZip as any)();
    const docCode = options.docCode || `DOC-VIONE-${Date.now().toString().slice(-6)}`;
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const docTitle = options.title || (type.includes('meeting') ? 'BIÊN BẢN HỌP GIAO BAN ĐIỀU HÀNH' : type.includes('proposal') || type.includes('tờ trình') ? 'TỜ TRÌNH PHÊ DUYỆT NGÂN SÁCH' : 'HỢP ĐỒNG HỢP TÁC KINH DOANH VÀ DỊCH VỤ B2B');
    const partyA = options.partyA || 'Công Ty Cổ Phần Công Nghệ & Giải Pháp ViOne (MST: 0109988776)';
    const partyB = options.partyB || 'Doanh Nghiệp Đối Tác Hệ Sinh Thái ViOne';
    const formattedValue = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(options.value || 150000000);

    const filename = `VanBan_ViOne_${docCode}.docx`;

    // 1. [Content_Types].xml
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
    zip.file('[Content_Types].xml', contentTypesXml);

    // 2. _rels/.rels
    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    zip.folder('_rels')?.file('.rels', relsXml);

    // 3. word/_rels/document.xml.rels
    const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
    zip.folder('word')?.folder('_rels')?.file('document.xml.rels', docRelsXml);

    // 4. word/styles.xml
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="vi-VN"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;
    zip.folder('word')?.file('styles.xml', stylesXml);

    // 5. word/document.xml
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Quốc hiệu tiêu ngữ -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>Độc lập - Tự do - Hạnh phúc</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>-------------------o0o-------------------</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <!-- Tiêu đề văn bản -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="120"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="B45309"/></w:rPr><w:t>${docTitle.toUpperCase()}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr><w:t>Số: ${docCode}  |  Ngày lập: ${dateStr}</w:t></w:r>
    </w:p>

    <!-- Thông tin các bên -->
    <w:p>
      <w:pPr><w:spacing w:before="120"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t>BÊN A (BÊN CUNG CẤP NỀN TẢNG / ĐIỀU HÀNH):</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>• Đơn vị: ${partyA}</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Đại diện: Tổng Giám Đốc / Ban Điều Hành ViOne Platform 5.0</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Trụ sở: Tòa nhà ViOne Executive Hub, TP. Hà Nội</w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t>BÊN B (BÊN ĐỐI TÁC / DOANH NGHIỆP THÀNH VIÊN):</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>• Đơn vị: ${partyB}</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Đại diện: Giám Đốc Doanh Nghiệp</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Chi tiết hợp tác: ${options.details || 'Ứng dụng nền tảng CRM kết nối B2B, quản trị nhân sự và thẻ danh thiếp số 1-chạm'}</w:t></w:r></w:p>

    <!-- Điều khoản chính -->
    <w:p>
      <w:pPr><w:spacing w:before="240"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="B45309"/></w:rPr><w:t>CÁC ĐIỀU KHOẢN VÀ THỎA THUẬN CHÍNH:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>1. Phạm vi thực hiện: Triển khai giải pháp số hóa doanh nghiệp, tự động hóa quy trình nghiệp vụ BPMN và tích hợp Trợ lý AI Copilot 5.0.</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. Giá trị ngân sách / hợp đồng: ${formattedValue} (Đã bao gồm thuế GTGT và gói bảo trì công nghệ).</w:t></w:r></w:p>
    <w:p><w:r><w:t>3. Thời hạn thực hiện: ${options.duration || '12 tháng kể từ ngày ký kết văn bản'}.</w:t></w:r></w:p>
    <w:p><w:r><w:t>4. Quyền và nghĩa vụ: Hai bên cam kết tuân thủ nghiêm ngặt tiến độ, bảo mật thông tin kinh doanh và dữ liệu khách hàng theo tiêu chuẩn ISO/IEC 27001.</w:t></w:r></w:p>

    <!-- Chữ ký -->
    <w:p><w:pPr><w:spacing w:before="400"/></w:pPr><w:r><w:t></w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>ĐẠI DIỆN BÊN A</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/></w:rPr><w:t>(Ký, ghi rõ họ tên và đóng dấu)</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="720"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>BAN GIÁM ĐỐC VIONE</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>ĐẠI DIỆN BÊN B</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/></w:rPr><w:t>(Ký, ghi rõ họ tên và đóng dấu)</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="720"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${options.signerName || 'ĐẠI DIỆN DOANH NGHIỆP'}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
    zip.folder('word')?.file('document.xml', docXml);

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return { buffer, filename };
  }

  /**
   * Tạo tệp PDF (.pdf) chuẩn format PDF-1.4
   */
  static generatePdfBuffer(type: string, options: DocGenerationOptions = {}): { buffer: Buffer; filename: string } {
    const docCode = options.docCode || `PDF-VIONE-${Date.now().toString().slice(-6)}`;
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const docTitle = options.title || 'BÁO CÁO ĐIỀU HÀNH DOANH NGHIỆP VÀ QUẢN TRỊ TỔNG HỢP';
    const filename = `BaoCao_ViOne_${docCode}.pdf`;

    // Chuẩn bị các dòng nội dung (ASCII/Hex safe cho PDF Type1 Font)
    const partyA = options.partyA || 'VIONE ENTERPRISE SYSTEM';
    const partyB = options.partyB || 'CORPORATE PARTNER';
    const valueStr = options.value ? `${options.value.toLocaleString('vi-VN')} VND` : '150,000,000 VND';

    // Xây dựng PDF Stream thuần chuẩn PDF-1.4
    const contentStream = `
BT
/F1 18 Tf
50 780 Td
(${escapePdfString(docTitle)}) Tj
/F2 10 Tf
0 -20 Td
(Document Code: ${docCode}  |  Date: ${dateStr}  |  Generated by ViOne AI Copilot 5.0) Tj
0 -30 Td
/F1 12 Tf
(I. GENERAL INFORMATION) Tj
/F2 10 Tf
0 -18 Td
(Organization A: ${escapePdfString(partyA)}) Tj
0 -16 Td
(Organization B: ${escapePdfString(partyB)}) Tj
0 -16 Td
(Total Transaction Value: ${escapePdfString(valueStr)}) Tj
0 -16 Td
(Scope: ${escapePdfString(options.details || 'Enterprise management, automated tasks and CRM intelligence')}) Tj
0 -30 Td
/F1 12 Tf
(II. EXECUTIVE SUMMARY & KEY METRICS) Tj
/F2 10 Tf
0 -18 Td
(1. System Status: All modules operational with 99.98% uptime and instant cloud sync.) Tj
0 -16 Td
(2. Task Workflow: Realtime delegation, automated tracking, and multi-tier approval active.) Tj
0 -16 Td
(3. Security & Governance: RBAC matrix strictly enforced, audit trail fully logged.) Tj
0 -30 Td
/F1 12 Tf
(III. VERIFICATION & SIGNATURES) Tj
/F2 10 Tf
0 -18 Td
(Verified by ViOne Executive AI Engine - Digital Tamper-proof Certified) Tj
0 -60 Td
(Representative A                                          Representative B) Tj
0 -15 Td
([DIGITALLY SIGNED & VERIFIED]                            [APPROVED & SIGNED]) Tj
ET
`;

    const streamLength = Buffer.byteLength(contentStream, 'utf8');

    // Cấu trúc PDF Objects
    const pdfParts = [
      '%PDF-1.4\n',
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
      `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    ];

    // Tính xref table
    let currentOffset = 0;
    const offsets: number[] = [];
    let fullPdfString = '';

    for (const part of pdfParts) {
      offsets.push(currentOffset);
      fullPdfString += part;
      currentOffset += Buffer.byteLength(part, 'utf8');
    }

    const xrefOffset = currentOffset;
    let xref = `xref\n0 7\n0000000000 65535 f \n`;
    for (let i = 1; i <= 6; i++) {
      const off = String(offsets[i]).padStart(10, '0');
      xref += `${off} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    fullPdfString += xref + trailer;

    const buffer = Buffer.from(fullPdfString, 'utf8');
    return { buffer, filename };
  }
}

function escapePdfString(str: string): string {
  // Loại bỏ ký tự tiếng Việt có dấu cho Type1 PDF font cơ bản để tránh lỗi encoding
  const ascii = removeVietnameseTones(str);
  return ascii.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function removeVietnameseTones(str: string): string {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}
