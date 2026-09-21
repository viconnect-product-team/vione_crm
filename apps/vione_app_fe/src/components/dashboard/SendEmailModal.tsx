import { useEffect, useState } from "react";
import { Mail, X, Send, Copy, ExternalLink, Sparkles, CheckCircle2, User } from "lucide-react";
import { toast } from "sonner";

export interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  recipientName: string;
  recipientEmail?: string | null;
  defaultSubject?: string;
}

const TEMPLATES: { id: string; label: string; subject: string; body: (name: string) => string }[] = [
  {
    id: "custom",
    label: "Tùy chỉnh (Soạn mới)",
    subject: "",
    body: (name) => `Kính gửi ${name},\n\n`,
  },
  {
    id: "intro",
    label: "Giới thiệu & Kết nối kinh doanh",
    subject: "Thư chào mừng & Đề xuất kết nối giao thương — ViOne",
    body: (name) =>
      `Kính gửi ${name},\n\nThay mặt Hiệp hội Doanh nghiệp ViOne, chúng tôi rất vui được kết nối với Quý đơn vị.\n\nChúng tôi mong muốn tìm hiểu thêm về các sản phẩm/dịch vụ của ${name} để thúc đẩy cơ hội hợp tác và kết nối giao thương giữa các hội viên.\n\nTrân trọng cảm ơn,\nBan Thư ký ViOne`,
  },
  {
    id: "event",
    label: "Mời tham dự sự kiện hiệp hội",
    subject: "Thư mời tham dự sự kiện giao thương & xúc tiến kinh doanh",
    body: (name) =>
      `Kính gửi ${name},\n\nHiệp hội trân trọng kính mời đại diện Quý doanh nghiệp tham dự chương trình giao lưu, kết nối hội viên và xúc tiến thương mại sắp tới.\n\nThời gian & địa điểm chi tiết xin vui lòng xem tại cổng thông tin hoặc phản hồi email này để nhận vé mời chính thức.\n\nRất mong được đón tiếp Quý đơn vị!`,
  },
  {
    id: "renewal",
    label: "Thông báo hội phí & Gia hạn hội viên",
    subject: "Thông báo về việc gia hạn quyền lợi hội viên hiệp hội",
    body: (name) =>
      `Kính gửi ${name},\n\nHiệp hội xin gửi lời cảm ơn chân thành đến Quý đơn vị đã đồng hành cùng cộng đồng doanh nghiệp trong suốt thời gian qua.\n\nKỳ hội phí tiếp theo đã đến hạn, kính mời Quý doanh nghiệp kiểm tra thông tin thanh toán và tiến hành gia hạn để tiếp tục nhận đầy đủ các quyền lợi đặc quyền của hội viên.\n\nTrân trọng,\nBan Tài chính ViOne`,
  },
  {
    id: "partnership",
    label: "Đề xuất hợp tác đối tác chiến lược",
    subject: "Đề xuất hợp tác thương mại & trao đổi cơ hội kinh doanh",
    body: (name) =>
      `Kính gửi ${name},\n\nChúng tôi nhận thấy nhiều tiềm năng hợp tác chiến lược giữa hai bên và mong muốn được sắp xếp một buổi trao đổi chi tiết hơn.\n\nQuý đơn vị vui lòng cho biết thời gian thuận tiện để chúng tôi liên hệ hoặc gửi tài liệu giới thiệu chi tiết.\n\nTrân trọng,\nViOne Business Network`,
  },
];

export function SendEmailModal({
  open,
  onClose,
  recipientName,
  recipientEmail,
  defaultSubject,
}: SendEmailModalProps) {
  const [email, setEmail] = useState(recipientEmail || "");
  const [templateId, setTemplateId] = useState("intro");
  const [subject, setSubject] = useState(defaultSubject || TEMPLATES[1].subject);
  const [body, setBody] = useState(TEMPLATES[1].body(recipientName || "Quý đối tác"));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(recipientEmail || "");
      const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
      if (templateId !== "custom") {
        setSubject(defaultSubject || tpl.subject);
        setBody(tpl.body(recipientName || "Quý đối tác"));
      }
    }
  }, [open, recipientName, recipientEmail, defaultSubject, templateId]);

  if (!open) return null;

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      if (id !== "custom") {
        setSubject(tpl.subject);
        setBody(tpl.body(recipientName || "Quý đối tác"));
      }
    }
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSendMailto = () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      toast.error("Vui lòng nhập địa chỉ email người nhận.");
      return;
    }
    if (!validateEmail(targetEmail)) {
      toast.error("Địa chỉ email không đúng định dạng.");
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    toast.success("Đã mở trình gửi email trên thiết bị của bạn.");
    onClose();
  };

  const handleDirectSend = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      toast.error("Vui lòng nhập địa chỉ email người nhận.");
      return;
    }
    if (!validateEmail(targetEmail)) {
      toast.error("Địa chỉ email không đúng định dạng.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Vui lòng nhập tiêu đề thư.");
      return;
    }
    if (!body.trim()) {
      toast.error("Vui lòng nhập nội dung thư.");
      return;
    }

    setSending(true);
    try {
      // Giả lập gửi trực tiếp & lưu hoạt động
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Đã gửi email thành công tới ${targetEmail}!`);
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra khi gửi email.");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    const text = `To: ${email.trim() || recipientName}\nSubject: ${subject}\n\n${body}`;
    void navigator.clipboard.writeText(text);
    toast.success("Đã sao chép nội dung thư vào clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-glow)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Gửi email liên hệ</h3>
              <p className="text-xs text-muted-foreground">
                Gửi tới: <strong className="text-foreground">{recipientName || "Doanh nghiệp"}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6 text-sm">
          {/* Email input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Địa chỉ nhận (Email) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email người nhận (ví dụ: contact@company.com)..."
                className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Template select */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Mẫu email gợi ý
            </label>
            <select
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Tiêu đề thư <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nhập tiêu đề email..."
              className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Body */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Nội dung email <span className="text-destructive">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">{body.length} ký tự</span>
            </div>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Soạn thảo nội dung thư tại đây..."
              className="w-full rounded-xl border border-border bg-background p-3.5 text-sm leading-relaxed text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/20 px-6 py-4">
          <button
            type="button"
            onClick={handleCopy}
            title="Sao chép nội dung"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" />
            Sao chép
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSendMailto}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Mở ứng dụng Mail
            </button>

            <button
              type="button"
              onClick={handleDirectSend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Đang gửi..." : "Gửi thư"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
