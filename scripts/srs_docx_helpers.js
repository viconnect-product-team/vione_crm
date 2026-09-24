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
  TableLayoutType,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} = require('docx');

const FONT_FAMILY = 'Times New Roman';
const NAVY = '003B95';
const BLUE_ACCENT = '0084FF';
const GOLD = 'D97706';
const SLATE_DARK = '0F172A';
const BORDER_COLOR = 'CBD5E1';
const TOTAL_TABLE_WIDTH_DXA = 9200; // Chiều rộng chuẩn A4 (11906 - 2706 lề = 9200 twips/DXA)

const BORDER_THIN = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
};

function createPara(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: options.spacing || { before: 80, after: 80, line: 276 },
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: options.size || 24, // 12pt
        bold: options.bold || false,
        italics: options.italics || false,
        color: options.color || '1E293B',
      }),
    ],
  });
}

function createHeading1(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 260, after: 120 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 30, // 15pt
        bold: true,
        color: NAVY,
      }),
    ],
  });
}

function createHeading2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 26, // 13pt
        bold: true,
        color: BLUE_ACCENT,
      }),
    ],
  });
}

function createHeading3(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 140, after: 60 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 24, // 12pt
        bold: true,
        color: GOLD,
      }),
    ],
  });
}

function createCallout(title, text, type = 'info') {
  const borderColor = type === 'tip' ? GOLD : BLUE_ACCENT;
  const bgColor = type === 'tip' ? 'FEF3C7' : 'EFF6FF';
  return new Table({
    width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [TOTAL_TABLE_WIDTH_DXA],
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: title,
                    font: FONT_FAMILY,
                    bold: true,
                    size: 22,
                    color: borderColor,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0, line: 260 },
                children: [
                  new TextRun({
                    text: text,
                    font: FONT_FAMILY,
                    italics: true,
                    size: 22,
                    color: '334155',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createTable(headers, rowsData, widths = []) {
  const sum = widths && widths.length > 0 ? widths.reduce((a, b) => a + Number(b), 0) : 0;
  const colWidthsDxa = headers.map((_, i) => {
    if (sum > 0 && widths[i] !== undefined) {
      return Math.round((Number(widths[i]) / sum) * TOTAL_TABLE_WIDTH_DXA);
    }
    return Math.round(TOTAL_TABLE_WIDTH_DXA / headers.length);
  });

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => {
      return new TableCell({
        width: { size: colWidthsDxa[i], type: WidthType.DXA },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        borders: BORDER_THIN,
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: h,
                font: FONT_FAMILY,
                bold: true,
                size: 20, // 10pt
                color: 'FFFFFF',
              }),
            ],
          }),
        ],
      });
    }),
  });

  const bodyRows = rowsData.map((row, rIdx) => {
    const isEven = rIdx % 2 === 0;
    return new TableRow({
      children: row.map((cellText, cIdx) => {
        const textVal = cellText !== undefined && cellText !== null ? String(cellText) : '';
        const lines = textVal.split('\n');
        const textRuns = [];
        lines.forEach((line, lIdx) => {
          textRuns.push(
            new TextRun({
              text: line,
              break: lIdx > 0 ? 1 : 0,
              font: FONT_FAMILY,
              size: 19, // 9.5pt
              color: '1E293B',
            })
          );
        });

        const cWidth = colWidthsDxa[cIdx] || Math.round(TOTAL_TABLE_WIDTH_DXA / headers.length);
        return new TableCell({
          width: { size: cWidth, type: WidthType.DXA },
          shading: { fill: isEven ? 'FFFFFF' : 'F8FAFC', type: ShadingType.CLEAR },
          borders: BORDER_THIN,
          margins: { top: 90, bottom: 90, left: 120, right: 120 },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0, line: 240 },
              children: textRuns,
            }),
          ],
        });
      }),
    });
  });

  return new Table({
    width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: colWidthsDxa,
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...bodyRows],
  });
}

function createHeaderFooter(systemTitle) {
  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `HỆ SINH THÁI DOANH NHÂN VIONE CONNECT & CEO 1983 — ${systemTitle}`,
                font: FONT_FAMILY,
                size: 16,
                color: '64748B',
                italics: true,
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
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Trang ',
                font: FONT_FAMILY,
                size: 18,
                color: '64748B',
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: FONT_FAMILY,
                size: 18,
                color: '64748B',
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
                color: '64748B',
              }),
            ],
          }),
        ],
      }),
    },
  };
}

module.exports = {
  createPara,
  createHeading1,
  createHeading2,
  createHeading3,
  createCallout,
  createTable,
  createHeaderFooter,
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
};
