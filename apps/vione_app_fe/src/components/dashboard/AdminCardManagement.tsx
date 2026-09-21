import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IdCard,
  ShieldCheck,
  ShieldOff,
  RefreshCw,
  RotateCcw,
  Wallet,
  Loader2,
  History,
  CalendarClock,
  Hash,
} from "lucide-react";
import {
  getMemberPassesFn,
  issueMemberPassFn,
  suspendMemberPassFn,
  renewMemberPassFn,
  replaceMemberPassFn,
  type AdminPass,
  type IdentityEvent,
} from "@/lib/member-identity.functions";

// Admin card lifecycle management. Rendered only for association managers; the
// server re-checks manager permission on every mutation, so this UI cannot be
// used to escalate. Destructive actions require a typed reason + confirmation.
export function AdminCardManagement({ memberId }: { memberId: string }) {
  const passesFn = useServerFn(getMemberPassesFn);
  const issueFn = useServerFn(issueMemberPassFn);
  const suspendFn = useServerFn(suspendMemberPassFn);
  const renewFn = useServerFn(renewMemberPassFn);
  const replaceFn = useServerFn(replaceMemberPassFn);
  const [busy, setBusy] = useState(false);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["member-passes", memberId],
    queryFn: () => passesFn({ data: { memberId } }),
  });

  const passes: AdminPass[] = data?.passes ?? [];
  const events: IdentityEvent[] = data?.events ?? [];
  const current = passes.find((p) => p.status === "active") ?? null;

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await action();
      toast.success(ok);
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
    } finally {
      setBusy(false);
    }
  }

  function askReason(label: string): string | null {
    const reason = window.prompt(`${label} — nhập lý do (bắt buộc):`)?.trim();
    if (!reason || reason.length < 3) {
      toast.error("Cần nhập lý do hợp lệ.");
      return null;
    }
    return reason;
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <IdCard className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Quản lý thẻ hội viên số</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : (
        <>
          {/* Current pass status */}
          {current ? (
            <div className="mb-4 rounded-xl border border-border bg-background p-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Field icon={Hash} label="Serial" value={current.serial} />
                <Field
                  icon={ShieldCheck}
                  label="Trạng thái"
                  value={`${current.effectiveStatus} · v${current.cardVersion}`}
                />
                <Field
                  icon={CalendarClock}
                  label="Hiệu lực đến"
                  value={
                    current.expiresAt
                      ? new Date(current.expiresAt).toLocaleDateString("vi-VN")
                      : "—"
                  }
                />
                <Field
                  icon={RefreshCw}
                  label="Ký gần nhất"
                  value={
                    current.lastSignedAt
                      ? new Date(current.lastSignedAt).toLocaleString("vi-VN")
                      : "—"
                  }
                />
                <Field
                  icon={ShieldCheck}
                  label="Xác thực gần nhất"
                  value={
                    current.lastVerifiedAt
                      ? new Date(current.lastVerifiedAt).toLocaleString("vi-VN")
                      : "—"
                  }
                />
                <Field
                  icon={Wallet}
                  label="Ví điện tử"
                  value={`Apple ${current.walletAppleAvailable ? "✓" : "✗"} · Google ${current.walletGoogleAvailable ? "✓" : "✗"}`}
                />
              </div>
            </div>
          ) : (
            <p className="mb-4 rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
              Hội viên chưa có thẻ số đang hoạt động.
            </p>
          )}

          {/* Lifecycle actions */}
          <div className="flex flex-wrap gap-2">
            {!current && (
              <Btn
                disabled={busy}
                onClick={() => run(() => issueFn({ data: { memberId } }), "Đã phát hành thẻ.")}
                icon={IdCard}
              >
                Phát hành thẻ
              </Btn>
            )}
            {current && (
              <>
                <Btn
                  disabled={busy}
                  onClick={() =>
                    run(() => renewFn({ data: { passId: current.id } }), "Đã gia hạn thẻ.")
                  }
                  icon={RefreshCw}
                >
                  Gia hạn
                </Btn>
                <Btn
                  disabled={busy}
                  variant="warn"
                  onClick={() => {
                    if (!window.confirm("Tạm ngưng thẻ này?")) return;
                    const reason = askReason("Tạm ngưng thẻ");
                    if (reason)
                      run(
                        () => suspendFn({ data: { passId: current.id, reason } }),
                        "Đã tạm ngưng thẻ.",
                      );
                  }}
                  icon={ShieldOff}
                >
                  Tạm ngưng
                </Btn>
                <Btn
                  disabled={busy}
                  variant="danger"
                  onClick={() => {
                    if (!window.confirm("Thay thế thẻ này bằng thẻ mới? Thẻ cũ sẽ bị thu hồi."))
                      return;
                    const reason = askReason("Thay thế thẻ");
                    if (reason)
                      run(
                        () => replaceFn({ data: { passId: current.id, reason } }),
                        "Đã thay thế thẻ.",
                      );
                  }}
                  icon={RotateCcw}
                >
                  Thay thế
                </Btn>
              </>
            )}
          </div>

          {/* Wallet minting (server-gated) */}
          {current && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn
                disabled={busy || !current.walletAppleAvailable}
                onClick={() =>
                  toast.info("Apple Wallet minting chạy ở phía máy chủ khi được cấu hình.")
                }
                icon={Wallet}
              >
                Mint Apple Wallet{!current.walletAppleAvailable ? " (chưa cấu hình)" : ""}
              </Btn>
              <Btn
                disabled={busy || !current.walletGoogleAvailable}
                onClick={() =>
                  toast.info("Google Wallet minting chạy ở phía máy chủ khi được cấu hình.")
                }
                icon={Wallet}
              >
                Mint Google Wallet{!current.walletGoogleAvailable ? " (chưa cấu hình)" : ""}
              </Btn>
            </div>
          )}

          {/* History */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="h-4 w-4 text-muted-foreground" /> Lịch sử thẻ
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có sự kiện.</p>
            ) : (
              <ul className="space-y-1.5">
                {events.map((e: any) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-foreground">{e.eventType}</span>
                    <span className="text-muted-foreground">
                      {e.reason ? `${e.reason} · ` : ""}
                      {new Date(e.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="truncate font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  icon: Icon,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warn" | "danger";
}) {
  const cls =
    variant === "danger"
      ? "border-destructive/40 text-destructive hover:bg-destructive/10"
      : variant === "warn"
        ? "border-warning/40 text-warning hover:bg-warning/10"
        : "border-border text-foreground hover:bg-muted";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
