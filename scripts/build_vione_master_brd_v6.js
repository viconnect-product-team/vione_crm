/**
 * SCRIPT BIÊN DỊCH VÀ XUẤT BẢN TÀI LIỆU BRD VIONE MASTER 6.5 TOÀN DIỆN
 * Tự động đọc file Markdown BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.md
 * và chuyển đổi thành tài liệu Word (.docx) chuẩn ISO/IEC/IEEE,
 * đồng bộ sang document/ và apps/vione_app_fe/public/docs/.
 */

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} = require('docx');

const FONT_FAMILY = 'Times New Roman';
const TOTAL_WIDTH = 9300; // DXA (khổ A4 trừ lề)
const BORDER_COLOR = 'CBD5E1';

const BORDER_THIN = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
};

function cleanMath(text) {
  return text
    .replace(/\$\\le\s*50\\text\{m\}\$/g, '≤ 50m')
    .replace(/\$\\rightarrow\$/g, '➔')
    .replace(/\$/g, '');
}

function parseTextRuns(rawText, baseOpts = {}) {
  const text = cleanMath(rawText);
  const runs = [];
  const parts = text.split(/(\*\*.*?\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: FONT_FAMILY,
          size: baseOpts.size || 23,
          color: baseOpts.boldColor || baseOpts.color || '0F172A',
          italics: baseOpts.italics || false,
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          bold: baseOpts.bold || false,
          font: FONT_FAMILY,
          size: baseOpts.size || 23,
          color: baseOpts.color || '334155',
          italics: baseOpts.italics || false,
        })
      );
    }
  }
  return runs.length ? runs : [new TextRun({ text: '', font: FONT_FAMILY })];
}

function createHeading1(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({
        text: cleanMath(title),
        font: FONT_FAMILY,
        size: 32, // 16pt
        bold: true,
        color: '0F172A', // Dark Navy
      }),
    ],
  });
}

function createHeading2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 90 },
    children: [
      new TextRun({
        text: cleanMath(title),
        font: FONT_FAMILY,
        size: 26, // 13pt
        bold: true,
        color: 'A67A47', // Champagne Gold / Bronze
      }),
    ],
  });
}

function createHeading3(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 70 },
    children: [
      new TextRun({
        text: cleanMath(title),
        font: FONT_FAMILY,
        size: 24, // 12pt
        bold: true,
        color: '1E293B',
      }),
    ],
  });
}

function createBulletParagraph(rawText, indentLevel = 0) {
  let text = rawText.trim();
  // Bỏ dấu bullet ban đầu (* hoặc -)
  if (text.startsWith('* ') || text.startsWith('- ')) {
    text = text.substring(2).trim();
  }
  const runs = parseTextRuns(text, { size: 23, color: '334155', boldColor: '0F172A' });
  // Thêm bullet symbol ở đầu
  const bulletSymbol = indentLevel === 0 ? '•  ' : '    ◦  ';
  runs.unshift(
    new TextRun({
      text: bulletSymbol,
      bold: true,
      font: FONT_FAMILY,
      size: 23,
      color: 'A67A47', // Gold bullet
    })
  );

  return new Paragraph({
    spacing: { before: 50, after: 50, line: 260 },
    indent: { left: indentLevel * 360 },
    children: runs,
  });
}

function createNumberedParagraph(rawText) {
  const match = rawText.match(/^(\d+\.)\s*(.*)$/);
  if (!match) return createRegularParagraph(rawText);
  const numStr = match[1] + ' ';
  const content = match[2];
  const runs = parseTextRuns(content, { size: 23, color: '334155', boldColor: '0F172A' });
  runs.unshift(
    new TextRun({
      text: numStr,
      bold: true,
      font: FONT_FAMILY,
      size: 23,
      color: '0F172A',
    })
  );

  return new Paragraph({
    spacing: { before: 60, after: 60, line: 270 },
    indent: { left: 360 },
    children: runs,
  });
}

function createRegularParagraph(rawText, opts = {}) {
  const runs = parseTextRuns(rawText, opts);
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: opts.spacing || { before: 70, after: 70, line: 276 },
    children: runs,
  });
}

function createTableFromMarkdownLines(tableLines) {
  const validLines = tableLines.filter((l) => !l.match(/^\|\s*:?-+:?\s*\|/));
  if (validLines.length === 0) return null;

  const parsedRows = validLines.map((line) => {
    return line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
  });

  const numCols = Math.max(...parsedRows.map((r) => r.length));
  const colWidth = Math.floor(TOTAL_WIDTH / numCols);

  const tableRows = parsedRows.map((rowCells, rowIndex) => {
    const isHeader = rowIndex === 0;
    const cells = rowCells.map((cellText) => {
      const runs = parseTextRuns(cellText, {
        size: isHeader ? 22 : 21,
        bold: isHeader,
        color: isHeader ? 'DFB76C' : '1E293B',
        boldColor: isHeader ? 'DFB76C' : '0F172A',
      });

      return new TableCell({
        width: { size: colWidth, type: WidthType.DXA },
        borders: BORDER_THIN,
        shading: {
          type: ShadingType.CLEAR,
          fill: isHeader ? '0B0F17' : rowIndex % 2 === 1 ? 'FFFFFF' : 'F8FAFC',
        },
        children: [
          new Paragraph({
            alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { before: 60, after: 60, line: 240 },
            children: runs,
          }),
        ],
      });
    });

    return new TableRow({
      children: cells,
    });
  });

  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    rows: tableRows,
  });
}

async function convertMarkdownToDocx(mdFilePath, outputPathList) {
  console.log('>>> [BRD BUILDER] Doc noi dung tu:', mdFilePath);
  const content = fs.readFileSync(mdFilePath, 'utf8');
  const lines = content.split('\n');

  const children = [];

  let inTable = false;
  let currentTableLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Kiem tra table markdown
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      currentTableLines.push(trimmed);
      continue;
    } else if (inTable) {
      inTable = false;
      const tableObj = createTableFromMarkdownLines(currentTableLines);
      if (tableObj) {
        children.push(tableObj);
        children.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
      }
      currentTableLines = [];
    }

    if (!trimmed) {
      continue;
    }

    // Divider line
    if (trimmed === '---') {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 140 },
          children: [
            new TextRun({
              text: '—'.repeat(45),
              font: FONT_FAMILY,
              size: 18,
              color: 'CBD5E1',
            }),
          ],
        })
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      children.push(createHeading3(trimmed.substring(5)));
    } else if (trimmed.startsWith('### ')) {
      children.push(createHeading2(trimmed.substring(4)));
    } else if (trimmed.startsWith('## ')) {
      children.push(createHeading1(trimmed.substring(3)));
    } else if (trimmed.startsWith('# ')) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 360, after: 160 },
          children: [
            new TextRun({
              text: trimmed.substring(2),
              font: FONT_FAMILY,
              size: 36, // 18pt
              bold: true,
              color: '0B0F17',
            }),
          ],
        })
      );
    }
    // Bullet points (cap 1 va cap 2)
    else if (line.startsWith('  * ') || line.startsWith('  - ')) {
      children.push(createBulletParagraph(trimmed, 1));
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      children.push(createBulletParagraph(trimmed, 0));
    }
    // Numbered list
    else if (/^\d+\.\s+/.test(trimmed)) {
      children.push(createNumberedParagraph(trimmed));
    }
    // Regular paragraph
    else {
      children.push(createRegularParagraph(trimmed));
    }
  }

  // Xu ly table con lai neu o cuoi file
  if (inTable && currentTableLines.length > 0) {
    const tableObj = createTableFromMarkdownLines(currentTableLines);
    if (tableObj) {
      children.push(tableObj);
    }
  }

  console.log(`>>> [BRD BUILDER] Da xu ly xong ${children.length} thanh phan van ban.`);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: 24, // 12pt
            color: '1E293B',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 dxa
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: 'VIO CONNECT — HỆ ĐIỀU HÀNH DOANH NGHIỆP TOÀN DIỆN VIONE & CONNECT',
                    font: FONT_FAMILY,
                    size: 16, // 8pt
                    bold: true,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'TÀI LIỆU BẢO MẬT NỘI BỘ — Trang ',
                    font: FONT_FAMILY,
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_FAMILY,
                    size: 18,
                    bold: true,
                    color: 'A67A47',
                  }),
                  new TextRun({
                    text: ' / ',
                    font: FONT_FAMILY,
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONT_FAMILY,
                    size: 18,
                    bold: true,
                    color: 'A67A47',
                  }),
                ],
              }),
            ],
          }),
        },
        children: children,
      },
    ],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  for (const outPath of outputPathList) {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outPath, docxBuffer);
    console.log(`  -> Da xuat ban tep Word (.docx) thanh cong: ${outPath} (${docxBuffer.length} bytes)`);
  }
}

async function run() {
  const mdPath = path.join(__dirname, '../document/BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.md');
  const outputs = [
    path.join(__dirname, '../document/BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.docx'),
    path.join(__dirname, '../apps/vione_app_fe/public/docs/BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.docx'),
  ];
  await convertMarkdownToDocx(mdPath, outputs);
  console.log('>>> [BRD BUILDER] HOAN TAT 100%!');
}

run().catch((err) => {
  console.error('Loi khi sinh file docx:', err);
  process.exit(1);
});
