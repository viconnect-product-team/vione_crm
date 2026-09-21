import type { AiCapability } from "@/lib/ai-capability-router";
import type { ContextBundle } from "@/lib/ai-context-builder";
import type { ContextSource, SuggestedAction } from "@/lib/ai-context-providers";

/**
 * AI Mock Answer Engine — Phase 10, Step 4.
 *
 * Deterministic, offline answer generation. NO LLM / provider calls. Answers
 * are derived strictly from the ContextBundle so the assistant never invents
 * data. Same input → same output.
 */

export type MockAnswer = {
  answer: string;
  reasoningSummary: string;
  evidence: ContextSource[];
  limitations: string[];
  suggestedActions: SuggestedAction[];
};

function metricNum(bundle: ContextBundle, key: string): number | undefined {
  const v = bundle.metrics[key];
  return typeof v === "number" ? v : undefined;
}

function noData(bundle: ContextBundle): boolean {
  return bundle.sources.length === 0 && Object.keys(bundle.metrics).length === 0;
}

function composeAnswer(capability: AiCapability, bundle: ContextBundle): string {
  // Permission-denied bundles carry only a limitation and no data.
  if (bundle.limitations.some((l: any) => l.includes("chưa có quyền")) && noData(bundle)) {
    return "Anh/chị chưa có quyền truy cập dữ liệu này.";
  }

  if (noData(bundle) && capability !== "announcement_draft") {
    return "Em chưa tìm thấy dữ liệu phù hợp trong phạm vi quyền truy cập của anh/chị.";
  }

  const count = bundle.sources.length;
  switch (capability) {
    case "document_qa":
      return `Em tìm thấy ${metricNum(bundle, "total") ?? count} tài liệu phù hợp. Hiện hệ thống mới có metadata, vì vậy em chỉ có thể tóm tắt theo tiêu đề, loại tài liệu và ngày cập nhật.`;
    case "member_search":
      return `Em tìm thấy ${metricNum(bundle, "total") ?? count} hội viên phù hợp trong phạm vi quyền của anh/chị. Danh sách nổi bật được liệt kê ở phần dẫn chứng.`;
    case "networking":
      return `Em gợi ý ${metricNum(bundle, "candidates") ?? count} hội viên có thể kết nối dựa trên ngành và khu vực. Xem chi tiết ở phần dẫn chứng.`;
    case "fee_analysis": {
      const outstanding = metricNum(bundle, "outstanding");
      const overdue = metricNum(bundle, "overdue");
      const rate = bundle.metrics["collectionRate"];
      if (outstanding != null || overdue != null || rate != null) {
        const parts: string[] = [];
        if (outstanding != null) parts.push(`${outstanding} khoản chưa thu`);
        if (overdue != null) parts.push(`${overdue} khoản quá hạn`);
        let s = parts.length ? `Hiện có ${parts.join(", trong đó ")}.` : "";
        if (rate != null) s += ` Tỷ lệ thu đạt ${rate}.`;
        return s.trim();
      }
      return "Đây là tình hình hội phí theo phạm vi quyền của anh/chị (xem số liệu tổng hợp).";
    }
    case "event_summary":
      return `Em tổng hợp ${metricNum(bundle, "upcoming") ?? count} sự kiện sắp diễn ra trong phạm vi quyền của anh/chị.`;
    case "marketplace":
      return `Em tìm thấy ${metricNum(bundle, "total") ?? count} tin đăng phù hợp trên Marketplace. Chi tiết ở phần dẫn chứng.`;
    case "notification_summary": {
      const unread = metricNum(bundle, "unread");
      return `Anh/chị có ${unread ?? 0} thông báo chưa đọc trong tổng số ${metricNum(bundle, "total") ?? count}.`;
    }
    case "executive_report": {
      const parts: string[] = [];
      const m = bundle.metrics;
      if (m.members != null) parts.push(`hội viên: ${m.members}`);
      if (m.fees != null) parts.push(`hội phí: ${m.fees}`);
      if (m.events != null) parts.push(`sự kiện: ${m.events}`);
      if (m.opportunities != null) parts.push(`cơ hội: ${m.opportunities}`);
      return parts.length
        ? `Tóm tắt điều hành (số liệu tổng hợp) — ${parts.join(", ")}.`
        : "Đây là báo cáo điều hành tổng hợp theo quyền của anh/chị.";
    }
    case "announcement_draft":
      return [
        "Bản nháp thông báo:",
        "",
        "Tiêu đề: [Thông báo từ Ban điều hành Hiệp hội]",
        "",
        "Kính gửi Quý hội viên,",
        "Ban điều hành trân trọng thông báo tới Quý hội viên nội dung sau đây. [Điền nội dung cụ thể].",
        "Trân trọng.",
        "",
        "⚠️ Bản nháp cần được kiểm tra trước khi gửi.",
      ].join("\n");
    case "general":
    default:
      return "Em cần thêm thông tin để hỗ trợ chính xác. Anh/chị có thể nêu rõ là về tài liệu, hội viên, hội phí, sự kiện hay thông báo không?";
  }
}

function composeReasoning(capability: AiCapability, bundle: ContextBundle): string {
  const sourceCount = bundle.sources.length;
  return `Em định tuyến câu hỏi tới năng lực "${capability}", xây dựng bối cảnh an toàn từ ${sourceCount} nguồn dữ liệu bạn có quyền xem (quyền: ${bundle.permissionLevel}). Câu trả lời chỉ dựa trên dữ liệu này, không suy đoán.`;
}

export function generateMockAnswer(
  message: string,
  capability: AiCapability,
  bundle: ContextBundle,
): MockAnswer {
  return {
    answer: composeAnswer(capability, bundle),
    reasoningSummary: composeReasoning(capability, bundle),
    evidence: bundle.sources,
    limitations: bundle.limitations,
    suggestedActions: bundle.suggestedActions,
  };
}
