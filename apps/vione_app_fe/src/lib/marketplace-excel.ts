import ExcelJS from "exceljs";
import type { ProductCategoryKey } from "./marketplace-data";

export interface ParsedProductItem {
  id?: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  memberPrice?: number;
  unit: string;
  category: ProductCategoryKey;
  categoryName: string;
  company: string;
  sellerName: string;
  sellerPhone: string;
  websiteUrl: string;
  imageUrl?: string;
  isValid: boolean;
  error?: string;
}

export function mapCategoryStringToKey(raw: string): { key: ProductCategoryKey; label: string } {
  const norm = (raw || "").toLowerCase().trim();
  if (norm.includes("công nghệ") || norm.includes("phần mềm") || norm.includes("tech")) {
    return { key: "mk.cat.tech", label: "Công nghệ & Phần mềm" };
  }
  if (norm.includes("bất động sản") || norm.includes("xây dựng") || norm.includes("nhà đất") || norm.includes("real")) {
    return { key: "mk.cat.realestate", label: "Bất động sản & Xây dựng" };
  }
  if (norm.includes("tư vấn") || norm.includes("tài chính") || norm.includes("đầu tư") || norm.includes("consult")) {
    return { key: "mk.cat.consult", label: "Tài chính & Tư vấn" };
  }
  if (norm.includes("dịch vụ") || norm.includes("du lịch") || norm.includes("service")) {
    return { key: "mk.cat.service", label: "Dịch vụ & Du lịch" };
  }
  if (norm.includes("sản xuất") || norm.includes("tiêu dùng") || norm.includes("bán lẻ") || norm.includes("sản phẩm") || norm.includes("product")) {
    return { key: "mk.cat.product", label: "Sản phẩm & Tiêu dùng" };
  }
  return { key: "mk.cat.other", label: raw.trim() || "Khác" };
}

export function parseNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Remove non-digits except decimals/commas
  const str = String(val).replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

/**
 * Parses an Excel file (.xlsx, .xls, .csv) into ParsedProductItem list
 */
export async function parseProductsFromExcel(file: File): Promise<{
  items: ParsedProductItem[];
  validCount: number;
  invalidCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Không tìm thấy trang tính trong file Excel.");
  }

  // Find header row (scan first 5 rows)
  let headerRowIndex = 1;
  let headerMap: Record<string, number> = {};

  for (let r = 1; r <= Math.min(10, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    const rowValues = (row.values as any[]) || [];
    const hasNameCol = rowValues.some((v) => {
      const s = String(v || "").toLowerCase().trim();
      return (
        s.includes("tên sản phẩm") ||
        s.includes("tên dịch vụ") ||
        s.includes("ten san pham") ||
        s.includes("tên") ||
        s.includes("title") ||
        s.includes("product name")
      );
    });

    if (hasNameCol) {
      headerRowIndex = r;
      row.eachCell((cell, colNumber) => {
        const headerName = String(cell.value || "").toLowerCase().trim();
        headerMap[headerName] = colNumber;
      });
      break;
    }
  }

  // Helper to find column index matching keywords
  const findCol = (...keywords: string[]): number | undefined => {
    for (const [name, col] of Object.entries(headerMap)) {
      for (const kw of keywords) {
        if (name.includes(kw.toLowerCase())) return col;
      }
    }
    return undefined;
  };

  const colTitle = findCol("tên sản phẩm", "ten san pham", "tên dịch vụ", "tên", "title", "product");
  const colCategory = findCol("danh mục", "danh muc", "category", "ngành nghề", "nganh");
  const colPrice = findCol("giá bán", "gia ban", "giá ưu đãi", "giá", "price");
  const colOrigPrice = findCol("giá gốc", "gia goc", "giá niêm yết", "original price");
  const colUnit = findCol("đơn vị", "don vi", "unit", "dvt");
  const colDesc = findCol("mô tả", "mo ta", "description", "chi tiết", "nội dung");
  const colCompany = findCol("công ty", "cong ty", "doanh nghiệp", "company");
  const colSeller = findCol("người bán", "người liên hệ", "nguoi ban", "seller", "đại diện", "author");
  const colPhone = findCol("số điện thoại", "điện thoại", "sđt", "sdt", "phone", "hotline");
  const colWebsite = findCol("website", "trang web", "link web", "url");
  const colImage = findCol("hình ảnh", "hinh anh", "ảnh", "image", "photo");

  const items: ParsedProductItem[] = [];

  for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    // Ignore empty rows
    const hasValues = row.actualCellCount > 0;
    if (!hasValues) continue;

    const getVal = (col?: number): string => {
      if (!col) return "";
      const cell = row.getCell(col);
      if (!cell || cell.value === null || cell.value === undefined) return "";
      if (typeof cell.value === "object" && "text" in (cell.value as any)) {
        return String((cell.value as any).text || "").trim();
      }
      return String(cell.value).trim();
    };

    const title = getVal(colTitle);
    if (!title && !row.getCell(1).value && !row.getCell(2).value) {
      continue;
    }

    const rawCategory = getVal(colCategory);
    const { key: categoryKey, label: categoryLabel } = mapCategoryStringToKey(rawCategory);
    const rawPrice = getVal(colPrice);
    const price = parseNumber(rawPrice);
    const rawOrigPrice = getVal(colOrigPrice);
    const originalPrice = rawOrigPrice ? parseNumber(rawOrigPrice) : undefined;
    const unit = getVal(colUnit) || "Gói";
    const description = getVal(colDesc) || title;
    const company = getVal(colCompany);
    const sellerName = getVal(colSeller);
    const sellerPhone = getVal(colPhone);
    const websiteUrl = getVal(colWebsite);
    const imageUrl = getVal(colImage);

    const errors: string[] = [];
    if (!title) errors.push("Thiếu tên sản phẩm");
    if (!price || price <= 0) errors.push("Giá sản phẩm không hợp lệ");

    items.push({
      title,
      description,
      price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      memberPrice: price,
      unit,
      category: categoryKey,
      categoryName: categoryLabel,
      company,
      sellerName,
      sellerPhone,
      websiteUrl,
      imageUrl: imageUrl || undefined,
      isValid: errors.length === 0,
      error: errors.join(", "),
    });
  }

  const validCount = items.filter((i) => i.isValid).length;
  const invalidCount = items.length - validCount;

  return { items, validCount, invalidCount };
}

/**
 * Downloads a sample Excel file template for users to fill in
 */
export async function downloadProductTemplateExcel(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ViOne Connect - B2B Marketplace";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Mau_Nhap_San_Pham", {
    views: [{ showGridLines: true }],
  });

  // Headers
  worksheet.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Tên sản phẩm / Dịch vụ (*)", key: "title", width: 35 },
    { header: "Danh mục ngành nghề (*)", key: "category", width: 26 },
    { header: "Giá bán / Giá ưu đãi (VNĐ) (*)", key: "price", width: 28 },
    { header: "Giá gốc niêm yết (VNĐ)", key: "originalPrice", width: 25 },
    { header: "Đơn vị tính", key: "unit", width: 16 },
    { header: "Tên công ty / Doanh nghiệp", key: "company", width: 30 },
    { header: "Người liên hệ", key: "sellerName", width: 22 },
    { header: "Số điện thoại liên hệ", key: "sellerPhone", width: 22 },
    { header: "Mô tả chi tiết sản phẩm / dịch vụ", key: "description", width: 45 },
    { header: "Website", key: "websiteUrl", width: 28 },
    { header: "Link ảnh đại diện (URL)", key: "imageUrl", width: 35 },
  ];

  // Header row styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF003B95" }, // Deep Navy Blue
    };
    cell.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF0A2540" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // Sample data
  const sampleData = [
    {
      stt: 1,
      title: "Phần mềm Quản lý Doanh nghiệp ViOne ERP Cloud",
      category: "Công nghệ & Phần mềm",
      price: 25000000,
      originalPrice: 35000000,
      unit: "Năm",
      company: "Tập đoàn Công nghệ ViOne Tech",
      sellerName: "Nguyễn Văn An",
      sellerPhone: "0912345678",
      description: "Giải pháp chuyển đổi số toàn diện: HRM, CRM, Tài chính và Quản trị dự án cho doanh nghiệp B2B.",
      websiteUrl: "https://vione.vn",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
    },
    {
      stt: 2,
      title: "Gói Tư vấn Tối ưu Pháp lý & Thuế Doanh nghiệp",
      category: "Tài chính & Tư vấn",
      price: 15000000,
      originalPrice: 20000000,
      unit: "Gói",
      company: "Công ty Luật & Tư vấn Đầu tư Quốc tế",
      sellerName: "Trần Thị Mai",
      sellerPhone: "0987654321",
      description: "Tư vấn rà soát hợp đồng kinh tế, cấu trúc thuế và bảo vệ quyền sở hữu trí tuệ cho chủ doanh nghiệp.",
      websiteUrl: "https://vione.vn/consulting",
      imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600",
    },
    {
      stt: 3,
      title: "Văn phòng ảo & Không gian làm việc Coworking Space",
      category: "Bất động sản & Xây dựng",
      price: 1200000,
      originalPrice: 1800000,
      unit: "Tháng",
      company: "Tổ hợp Văn phòng Hạng A CEO Space",
      sellerName: "Lê Hoàng Nam",
      sellerPhone: "0903123456",
      description: "Địa chỉ đăng ký kinh doanh đắc địa trung tâm Hà Nội, lễ tân chuyên nghiệp, phòng họp tiêu chuẩn 5 sao.",
      websiteUrl: "https://vione.vn/space",
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600",
    },
  ];

  sampleData.forEach((item) => {
    const row = worksheet.addRow(item);
    row.height = 24;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 1 ? "center" : colNumber === 4 || colNumber === 5 ? "right" : "left",
      };
      if (colNumber === 4 || colNumber === 5) {
        cell.numFmt = "#,##0";
      }
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // Instructions sheet
  const guideSheet = workbook.addWorksheet("Hướng dẫn nhập");
  guideSheet.columns = [
    { header: "Cột", key: "col", width: 25 },
    { header: "Bắt buộc", key: "required", width: 14 },
    { header: "Ghi chú & Định dạng", key: "note", width: 60 },
  ];
  const gHeader = guideSheet.getRow(1);
  gHeader.height = 28;
  gHeader.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    c.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    c.alignment = { vertical: "middle", horizontal: "center" };
  });

  const guides = [
    { col: "Tên sản phẩm / Dịch vụ", required: "Bắt buộc", note: "Nhập tên rõ ràng, súc tích (ví dụ: Phần mềm Kế toán Cloud)" },
    { col: "Danh mục ngành nghề", required: "Bắt buộc", note: "Chọn 1 trong: Công nghệ, Bất động sản, Tài chính & Tư vấn, Dịch vụ, Sản phẩm" },
    { col: "Giá bán / Ưu đãi (VNĐ)", required: "Bắt buộc", note: "Chỉ nhập số nguyên, ví dụ: 25000000 (không kèm chữ đ hoặc vnđ)" },
    { col: "Giá gốc niêm yết (VNĐ)", required: "Tùy chọn", note: "Giá gốc trước giảm giá (nếu có), ví dụ: 30000000" },
    { col: "Đơn vị tính", required: "Tùy chọn", note: "Ví dụ: Gói, Tháng, Năm, Bộ, Chiếc, Dự án..." },
    { col: "Tên công ty", required: "Tùy chọn", note: "Tên công ty / Doanh nghiệp của bạn" },
    { col: "Người liên hệ & SĐT", required: "Tùy chọn", note: "Thông tin liên hệ trực tiếp cho khách hàng quan tâm" },
    { col: "Mô tả sản phẩm", required: "Tùy chọn", note: "Đặc điểm nổi bật, chính sách bảo hành, cam kết chất lượng..." },
    { col: "Link ảnh đại diện", required: "Tùy chọn", note: "Đường link ảnh online (https://...) hiển thị trên sàn" },
  ];

  guides.forEach((g) => {
    const row = guideSheet.addRow(g);
    row.height = 22;
    row.eachCell((c, colNumber) => {
      c.font = { name: "Arial", size: 10 };
      c.alignment = { vertical: "middle", horizontal: colNumber === 2 ? "center" : "left" };
      if (colNumber === 2 && g.required === "Bắt buộc") {
        c.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFE11D48" } };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Mau_Nhap_San_Pham_Marketplace.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports all products to an Excel file with clean formatting
 */
export async function exportProductsToExcel(
  products: any[],
  filenamePrefix = "Danh_sach_san_pham_Marketplace",
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ViOne Connect - B2B Marketplace";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Sản phẩm Marketplace", {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Tên sản phẩm / Dịch vụ", key: "title", width: 36 },
    { header: "Danh mục", key: "category", width: 24 },
    { header: "Giá bán (VNĐ)", key: "price", width: 22 },
    { header: "Giá gốc (VNĐ)", key: "originalPrice", width: 20 },
    { header: "Đơn vị tính", key: "unit", width: 14 },
    { header: "Công ty cung cấp", key: "company", width: 30 },
    { header: "Người bán / Liên hệ", key: "sellerName", width: 24 },
    { header: "Số điện thoại", key: "sellerPhone", width: 20 },
    { header: "Mô tả sản phẩm", key: "description", width: 45 },
    { header: "Website", key: "websiteUrl", width: 26 },
    { header: "Trạng thái", key: "status", width: 15 },
    { header: "Lượt xem", key: "views", width: 14 },
    { header: "Ngày đăng", key: "createdAt", width: 18 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0A2540" },
    };
    cell.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF003B95" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  const statusLabel = (s: string) => {
    if (s === "active") return "Đang mở bán";
    if (s === "sold") return "Đã giao dịch";
    if (s === "draft") return "Bản nháp";
    return s || "Đang mở bán";
  };

  products.forEach((p, idx) => {
    const title = p.title || p.name || "Sản phẩm";
    const price = Number(p.price || p.memberPrice || 0);
    const origPrice = p.originalPrice ? Number(p.originalPrice) : null;
    const category = p.categoryName || p.category || "Dịch vụ";
    const company = p.company || "";
    const sellerName = p.sellerName || "";
    const sellerPhone = p.sellerPhone || "";
    const description = p.description || "";
    const websiteUrl = p.websiteUrl || p.website || "";
    const unit = p.unit || "Gói";
    const status = statusLabel(p.status);
    const views = Number(p.views || 0);
    const createdAt = p.createdAt || p.time || "";
    const dateFormatted = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : "";

    const row = worksheet.addRow({
      stt: idx + 1,
      title,
      category,
      price,
      originalPrice: origPrice,
      unit,
      company,
      sellerName,
      sellerPhone,
      description,
      websiteUrl,
      status,
      views,
      createdAt: dateFormatted,
    });

    row.height = 24;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal:
          colNumber === 1 || colNumber === 12 || colNumber === 13 || colNumber === 14
            ? "center"
            : colNumber === 4 || colNumber === 5
            ? "right"
            : "left",
      };
      if (colNumber === 4 || colNumber === 5) {
        cell.numFmt = "#,##0";
      }
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}_${nowStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
