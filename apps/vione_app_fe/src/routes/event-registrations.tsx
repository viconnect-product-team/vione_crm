import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileText,
  MapPin,
  QrCode,
  Search,
  Tag,
  Ticket,
  Users,
  Utensils,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, Pill, StatCard, TableShell } from "@/components/dashboard/PageKit";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import {
  listEventsWithRegistrationsFn,
  recordWalkInCashPaymentFn,
  sendPaymentReminderFn,
  updateRegistrationSeatingFn,
  type EventItem,
  type Registration,
} from "@/lib/events.functions";
import { useFmt, useT } from "@/lib/i18n";
import { CinemaSeatingMap } from "@/components/dashboard/CinemaSeatingMap";

export const Route = createFileRoute("/event-registrations")({
  ssr: false,
  loader: () => listEventsWithRegistrationsFn(),
  component: RegPage,
});

export function RegPage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const { events: EVENTS, registrations: REGISTRATIONS } = Route.useLoaderData() as {
    events: EventItem[];
    registrations: Registration[];
  };

  const updateSeating = useServerFn(updateRegistrationSeatingFn);
  const recordCash = useServerFn(recordWalkInCashPaymentFn);
  const sendReminder = useServerFn(sendPaymentReminderFn);

  const [q, setQ] = useState("");
  const [eventId, setEventId] = useState("all");
  const [status, setStatus] = useState<Registration["status"] | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "pending">("all");

  // Seating Modal state
  const [seatingModalOpen, setSeatingModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [seatInput, setSeatInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Map of occupied seats for Cinema seating visual chart
  const occupiedSeatsMap = useMemo(() => {
    const map: Record<string, { attendeeName: string; attendeeCode?: string }> = {};
    REGISTRATIONS.forEach((r) => {
      if (r.seatAssignment && r.id !== selectedReg?.id) {
        map[r.seatAssignment] = { attendeeName: r.memberName, attendeeCode: r.memberCode };
        const match = r.seatAssignment.match(/[A-Z]+-\d{2}|T\d+-\d{2}|SK-\d{2}/i);
        if (match) {
          map[match[0].toUpperCase()] = { attendeeName: r.memberName, attendeeCode: r.memberCode };
        }
      }
    });
    return map;
  }, [REGISTRATIONS, selectedReg]);

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrReg, setQrReg] = useState<Registration | null>(null);

  // Google Form Survey Modal state
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [selectedSurveyReg, setSelectedSurveyReg] = useState<any | null>(null);

  const handleOpenFormSurvey = (r: any) => {
    setSelectedSurveyReg(r);
    setSurveyModalOpen(true);
  };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return REGISTRATIONS.filter((r) => (eventId === "all" ? true : r.eventId === eventId))
      .filter((r) => (status === "all" ? true : r.status === status))
      .filter((r) => {
        if (paymentFilter === "all") return true;
        return (r.paymentStatus || "pending") === paymentFilter;
      })
      .filter(
        (r) =>
          !ql ||
          r.memberName.toLowerCase().includes(ql) ||
          r.memberCode.toLowerCase().includes(ql) ||
          r.email.toLowerCase().includes(ql) ||
          (r.seatAssignment && r.seatAssignment.toLowerCase().includes(ql)),
      );
  }, [q, eventId, status, paymentFilter, REGISTRATIONS]);

  const tc = useTableControls<Registration>(
    filtered,
    {
      code: (r) => r.id,
      member: (r) => r.memberName,
      ticket: (r) => r.ticketType,
      regDate: (r) => r.registeredAt,
      status: (r) => r.status,
    },
    { initialSortKey: "regDate", initialSortDir: "desc", initialPageSize: 20 },
  );

  const confirmed = REGISTRATIONS.filter((r) => r.status === "confirmed").length;
  const paidCount = REGISTRATIONS.filter((r) => r.paymentStatus === "paid").length;
  const pendingCount = REGISTRATIONS.filter((r) => r.paymentStatus !== "paid" && r.status !== "cancelled").length;
  const cancelled = REGISTRATIONS.filter((r) => r.status === "cancelled").length;

  const handleOpenSeating = (r: Registration) => {
    setSelectedReg(r);
    setSeatInput(r.seatAssignment || "Bàn VIP 01 - Ghế 01");
    setSeatingModalOpen(true);
  };

  const handleSaveSeating = async () => {
    if (!selectedReg || !seatInput.trim()) return;
    setSubmitting(true);
    try {
      await updateSeating({
        data: {
          registrationId: selectedReg.id,
          seatAssignment: seatInput.trim(),
        },
      });
      toast.success(`Đã xếp chỗ cho ${selectedReg.memberName}: ${seatInput.trim()}`);
      setSeatingModalOpen(false);
      await router.invalidate();
    } catch {
      toast.error("Lỗi khi lưu vị trí chỗ ngồi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWalkInCashPayment = async (r: Registration) => {
    if (
      !window.confirm(
        `Xác nhận thu tiền mặt tại chỗ cho khách: ${r.memberName}?\nSố tiền: ${fmt.money(
          r.paymentAmount || 500000,
        )}\nHệ thống sẽ tự động hạch toán vào Quản lý thu - Tiền mặt.`,
      )
    ) {
      return;
    }

    try {
      await recordCash({
        data: {
          registrationId: r.id,
          amount: r.paymentAmount || 500000,
        },
      });
      toast.success(`Đã thu tiền mặt thành công! Đã cập nhật Quản lý thu.`);
      await router.invalidate();
    } catch {
      toast.error("Lỗi khi xử lý thu tiền mặt");
    }
  };

  const handleSendReminder = async (r: Registration) => {
    try {
      const res: any = await sendReminder({
        data: { registrationId: r.id },
      });
      toast.success(res.message || "Đã gửi thông báo nhắc nhở");
      await router.invalidate();
    } catch {
      toast.error("Lỗi khi gửi thông báo nhắc nhở");
    }
  };

  const handleOpenQr = (r: Registration) => {
    setQrReg(r);
    setQrModalOpen(true);
  };

  return (
    <AppShell>
      <PageHeader
        title="Quản Lý Đăng Ký & Xếp Chỗ Sự Kiện"
        subtitle="Quản lý hội viên tham dự, xếp chỗ VIP/bàn tiệc, theo dõi thanh toán 3 ngày & thu tiền mặt tại chỗ"
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted">
              <Download className="h-4 w-4 text-muted-foreground" />
              {t("common.exportExcel")}
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng Số Người Đăng Ký"
          value={REGISTRATIONS.length}
          icon={<Ticket className="h-4 w-4" />}
        />
        <StatCard
          label="Đã Thanh Toán Phí"
          value={paidCount}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Chờ Thanh Toán (Hạn 3 Ngày)"
          value={pendingCount}
          tone="warning"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Đã Hủy / Quá Hạn Nhắc"
          value={cancelled}
          tone="danger"
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      {/* Filter Bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên, mã hội viên, email, số bàn ghế..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">{t("reg.allEvents")}</option>
          {EVENTS.map((e: any) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as "all" | "paid" | "pending")}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">Tất cả thanh toán</option>
          <option value="paid">Đã thanh toán (Paid)</option>
          <option value="pending">Chờ thanh toán (Pending)</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Registration["status"] | "all")}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">{t("common.allStatuses")}</option>
          <option value="confirmed">{t("reg.status.confirmed")}</option>
          <option value="waitlist">{t("reg.status.waitlist")}</option>
          <option value="cancelled">{t("reg.status.cancelled")}</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="relative overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="sticky left-0 z-20 w-14 bg-secondary/90 px-3 py-3 text-center text-xs font-bold border-b border-border">STT</th>
                <th className="sticky left-[56px] z-20 bg-secondary/90 px-4 py-3 text-xs font-bold border-b border-border">Mã ĐK</th>
                <th className="px-4 py-3 border-b border-border">Người tham gia</th>
                <th className="px-4 py-3 border-b border-border">Chỗ ngồi / Bàn VIP</th>
                <th className="px-4 py-3 border-b border-border">Hạng vé</th>
                <th className="px-4 py-3 border-b border-border">Thanh toán & Phí</th>
                <th className="px-4 py-3 border-b border-border">Check-in</th>
                <th className="px-4 py-3 border-b border-border">Trạng thái</th>
                <th className="sticky right-0 z-20 bg-secondary/90 px-4 py-3 text-right text-xs font-bold border-b border-border">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tc.pageRows.map((r: any, idx: number) => {
                const isPaid = r.paymentStatus === "paid";
                const isCancelled = r.status === "cancelled";
                const reminderCount = Number(r.reminderCount || 0);

                return (
                  <tr key={r.id} className="group border-b border-border/50 transition hover:bg-secondary/40">
                    <td className="sticky left-0 z-10 bg-card px-3 py-3 text-center font-mono text-xs font-semibold text-muted-foreground group-hover:bg-muted/70 border-b border-border/50">
                      {(tc.page - 1) * tc.pageSize + idx + 1}
                    </td>
                    <td className="sticky left-[56px] z-10 bg-card px-4 py-3 font-mono text-[12px] font-bold text-primary group-hover:bg-muted/70 border-b border-border/50">
                      {r.id}
                    </td>
                    <td className="px-4 py-3 border-b border-border/50">
                      <div className="font-semibold text-foreground">{r.memberName}</div>
                      <div className="text-[11px] text-muted-foreground">{r.email} · {r.memberCode}</div>
                    </td>

                    {/* Chỗ ngồi / Bàn VIP */}
                    <td className="px-4 py-3 border-b border-border/50">
                      {r.seatAssignment ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                          <MapPin className="h-3.5 w-3.5" />
                          {r.seatAssignment}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Chưa xếp chỗ</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenSeating(r)}
                        className="ml-2 text-[11px] text-primary underline hover:opacity-80 cursor-pointer"
                      >
                        {r.seatAssignment ? "Đổi" : "+ Xếp"}
                      </button>
                    </td>

                    <td className="px-4 py-3 border-b border-border/50">
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                        <Tag className="h-3 w-3" />
                        {r.ticketType || "VIP Pass"}
                      </span>
                    </td>

                    {/* Thanh toán & Phí */}
                    <td className="px-4 py-3 border-b border-border/50">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              isPaid
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {isPaid ? "Đã nộp" : "Chờ thanh toán"}
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {fmt.money(r.paymentAmount || 500000)}
                          </span>
                        </div>
                        {!isPaid && !isCancelled && (
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            Nhắc: {reminderCount}/3 lần {reminderCount >= 2 && <span className="text-rose-600 font-bold">(Sắp hủy)</span>}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Checkin status */}
                    <td className="px-4 py-3 border-b border-border/50">
                      {r.checkedInAt ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã check-in
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Chưa đến</span>
                      )}
                    </td>

                    <td className="px-4 py-3 border-b border-border/50">
                      <Pill color={isPaid ? "success" : isCancelled ? "danger" : "warning"}>
                        {isCancelled ? "Đã hủy" : isPaid ? "Hợp lệ" : "Chờ phí"}
                      </Pill>
                    </td>

                    {/* Action Buttons */}
                    <td className="sticky right-0 z-10 bg-card px-4 py-3 group-hover:bg-muted/70 border-b border-border/50">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Xem QR checkin */}
                        <button
                          onClick={() => handleOpenQr(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary cursor-pointer"
                          title="Xem mã QR Check-in"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          QR
                        </button>

                        {/* Xem khảo sát Google Form */}
                        <button
                          onClick={() => handleOpenFormSurvey(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-500/20 dark:text-purple-300 cursor-pointer"
                          title="Xem phiếu thông tin & khảo sát Google Form"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Form
                        </button>

                        {/* Thu tiền mặt tại chỗ nếu chưa nộp */}
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => handleWalkInCashPayment(r)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 cursor-pointer"
                            title="Thu tiền mặt tại bàn tiếp đón và tự động lưu Quản lý thu"
                          >
                            <Coins className="h-3.5 w-3.5" />
                            Thu tiền mặt
                          </button>
                        )}

                        {/* Nhắc nhở thanh toán 3 ngày */}
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => handleSendReminder(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-400 cursor-pointer"
                            title="Gửi thông báo nhắc nhở thanh toán theo luồng đếm ngược"
                          >
                            <Bell className="h-3.5 w-3.5" />
                            Nhắc
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tc.total === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Không tìm thấy đăng ký nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={tc.page}
          pageCount={tc.pageCount}
          pageSize={tc.pageSize}
          total={tc.total}
          from={tc.from}
          to={tc.to}
          onPage={tc.setPage}
          onPageSize={tc.setPageSize}
        />
      </div>

      {/* Seating Assignment Modal with Cinema-Style Graphical Map */}
      {seatingModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl my-auto max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Sơ Đồ Xếp Chỗ Sự Kiện (Hội Trường / Bàn Tiệc Gala)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đang xếp chỗ cho: <strong className="text-foreground font-semibold">{selectedReg.memberName}</strong> ({selectedReg.memberCode}) · Vé: {selectedReg.ticketType || "VIP"}
                </p>
              </div>
              <button
                onClick={() => setSeatingModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Interactive Seating Studio Map */}
            <div className="mb-4">
              <CinemaSeatingMap
                currentSeat={seatInput}
                occupiedSeats={occupiedSeatsMap}
                onSelectSeat={(seatLabel) => setSeatInput(seatLabel)}
              />
            </div>

            {/* Selected Seat Text & Quick Overrides */}
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Vị trí đã chọn (Tự động hiển thị khi quét QR check-in):
                </label>
                <input
                  type="text"
                  value={seatInput}
                  onChange={(e) => setSeatInput(e.target.value)}
                  placeholder="Click vào ghế trên sơ đồ hoặc nhập trực tiếp..."
                  className="w-full sm:w-80 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-medium text-muted-foreground">Chọn nhanh:</span>
                {[
                  "Hàng VIP A - Ghế A-01",
                  "Hàng VIP B - Ghế B-02",
                  "Bàn VIP 01 - Ban Chủ Tọa - Ghế 1",
                  "Bàn VIP 02 - Khách Mời Danh Dự - Ghế 1",
                  "Bàn 03 - Ban Xúc Tiến B2B - Ghế 1",
                  "Bàn 04 - Hội Viên CEO 1983 - Ghế 1",
                  "Khu Khách Mời Tự Do",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSeatInput(preset)}
                    className="rounded-lg border border-border bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-foreground hover:border-primary hover:bg-secondary cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setSeatingModalOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSeating}
                disabled={submitting}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : "Xác Nhận Xếp Chỗ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Preview Modal */}
      {qrModalOpen && qrReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Mã QR Check-In</span>
              <button
                onClick={() => setQrModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  qrReg.qrPayload || JSON.stringify({ id: qrReg.id, name: qrReg.memberName, seat: qrReg.seatAssignment }),
                )}`}
                alt="QR Checkin"
                className="h-full w-full object-contain"
              />
            </div>

            <h4 className="mt-4 text-base font-bold text-foreground">{qrReg.memberName}</h4>
            <p className="text-xs text-muted-foreground">{qrReg.id} · {qrReg.ticketType || "VIP Pass"}</p>

            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
              <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Vị trí chỗ ngồi đã xếp:</div>
              <div className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                {qrReg.seatAssignment || "Khu vực tự do"}
              </div>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-5 w-full rounded-xl border border-border bg-secondary py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Google Form Survey Response Details Modal */}
      {surveyModalOpen && selectedSurveyReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FileText className="h-5 w-5" />
                <h3 className="text-base font-bold text-foreground">
                  Dữ Liệu Khảo Sát Google Form Của Đại Biểu
                </h3>
              </div>
              <button
                onClick={() => setSurveyModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3.5">
                <p className="text-sm font-bold text-foreground">{selectedSurveyReg.memberName}</p>
                <p className="text-muted-foreground mt-0.5">
                  Email: {selectedSurveyReg.email} · Mã: {selectedSurveyReg.id}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Doanh nghiệp: <strong>{selectedSurveyReg.company || "Công ty Hội Viên Hiệp Hội"}</strong>
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground">Nhu cầu kết nối giao thương B2B (Matchmaking):</span>
                <p className="text-muted-foreground bg-secondary/40 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                  Tìm kiếm đối tác sản xuất bao bì sinh học, giải pháp chuyển đổi xanh ESG và các quỹ tín dụng hỗ trợ vốn lưu động lãi suất ưu đãi.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground">Câu hỏi đặt trước cho Ban Tổ Chức / Diễn Giả:</span>
                <p className="text-muted-foreground bg-secondary/40 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                  Kế hoạch hỗ trợ các doanh nghiệp hội viên tham gia hội chợ xúc tiến thương mại quốc tế trong năm 2026?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">Bàn tiệc Gala đăng ký:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedSurveyReg.seatAssignment || "Bàn Tiệc VIP Gala 02"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">Chế độ ẩm thực:</span>
                  <p className="font-bold text-foreground">Tiệc mặn tiêu chuẩn</p>
                </div>
              </div>

              <div className="pt-1">
                <span className="font-bold text-foreground block mb-1">Hồ sơ năng lực đính kèm:</span>
                <a
                  href="https://vione.app/docs/company-profile.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> Xem hồ sơ năng lực (Profile PDF)
                </a>
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  onClick={() => setSurveyModalOpen(false)}
                  className="rounded-xl bg-secondary px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
