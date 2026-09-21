import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  ShieldCheck,
  ShieldAlert,
  Hash,
  CalendarClock,
  Building2,
  ArrowLeft,
  ShieldQuestion,
} from "lucide-react";
import { verifyMemberPassFn, type VerifyResult } from "@/lib/member-identity.functions";

const ceoLogo = "/ceo1983-official-logo.png";

type Search = { code?: string; t?: string };

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s.code === "string") out.code = s.code;
    if (typeof s.t === "string") out.t = s.t;
    return out;
  },
  loaderDeps: ({ search }) => ({ code: search.code, t: search.t }),
  loader: async ({ deps }) =>
    deps.code || deps.t ? verifyMemberPassFn({ data: { code: deps.code, token: deps.t } }) : null,
  head: () => ({
    meta: [
      { title: "Xác thực thẻ hội viên — CLB Doanh Nhân CEO 1983" },
      {
        name: "description",
        content: "Cổng xác thực điện tử thẻ hội viên chính thức CLB Doanh Nhân CEO 1983.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyScreen,
  errorComponent: ({ error }) => (
    <Shell>
      <div className="text-center text-slate-400">{error.message}</div>
    </Shell>
  ),
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="vba-app min-h-[100dvh] bg-[#0A0A0B] text-white px-4 py-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] p-4 border border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-3">
            <img
              src={ceoLogo}
              alt="CLB Doanh Nhân CEO 1983"
              className="h-10 w-auto object-contain"
              height={40}
            />
          </div>
          <div className="text-right">
            <div className="text-[12px] font-bold text-[#E6C687] uppercase tracking-wider">
              Xác thực hội viên
            </div>
            <div className="text-[9px] font-semibold text-slate-400">
              OFFICIAL VERIFICATION
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function VerifyScreen() {
  const result = Route.useLoaderData() as VerifyResult | null;
  const { code, t } = Route.useSearch();

  if (!code && !t) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3.5 p-8 text-center rounded-3xl bg-white/[0.04] border border-white/10 shadow-xl">
          <ShieldQuestion className="h-12 w-12 text-[#E6C687]" />
          <div className="text-[16px] font-bold text-white">Chưa có mã để xác thực</div>
          <p className="text-[13px] text-slate-400 max-w-xs">
            Vui lòng quét mã QR trên thẻ hội viên CEO 1983 để thực hiện xác thực thông tin.
          </p>
          <Link
            to="/association"
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-[#2E3192]/60 bg-[#2E3192] hover:bg-[#252876] px-5 py-3 text-[13px] font-bold text-white shadow-md transition"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang chủ Hiệp hội CEO 1983
          </Link>
        </div>
      </Shell>
    );
  }

  if (!result) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3.5 p-8 text-center rounded-3xl bg-white/[0.04] border border-white/10 shadow-xl">
          <ShieldAlert className="h-12 w-12 text-rose-500" />
          <div className="text-[16px] font-bold text-white">Không xác thực được</div>
          <p className="text-[13px] text-slate-400 max-w-xs">
            Mã thẻ không tồn tại hoặc đã hết hiệu lực trên hệ thống CLB Doanh Nhân CEO 1983.
          </p>
          <Link
            to="/association"
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 px-5 py-3 text-[13px] font-bold text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang chủ Hiệp hội CEO 1983
          </Link>
        </div>
      </Shell>
    );
  }

  const ok = result.verified;

  return (
    <Shell>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-2xl">
        {/* Verdict banner */}
        <div
          className={`flex items-center gap-3.5 px-6 py-4.5 border-b ${
            ok
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {ok ? (
            <ShieldCheck className="h-9 w-9 shrink-0 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-9 w-9 shrink-0 text-rose-400" />
          )}
          <div>
            <div className="text-[16px] font-black uppercase tracking-wide">
              {ok ? "Hội viên hợp lệ" : "Không hợp lệ"}
            </div>
            <div className="text-[12px] font-medium text-slate-300 mt-0.5">
              {ok ? "Thẻ chính thức đang hoạt động" : (result.reason ?? "Thẻ không hợp lệ hoặc đã thu hồi")}
            </div>
          </div>
        </div>

        <div className="space-y-3.5 p-6 divide-y divide-white/5">
          <Row icon={BadgeCheck} label="Hội viên" value={result.memberName || "—"} />
          <div className="pt-3.5">
            <Row icon={Building2} label="Tổ chức" value={result.associationName || "CLB Doanh Nhân CEO 1983"} />
          </div>
          <div className="pt-3.5">
            <Row icon={Hash} label="Mã hội viên" value={result.memberCode || "—"} accent />
          </div>
          <div className="pt-3.5">
            <Row icon={BadgeCheck} label="Hạng hội viên" value={result.membershipLevel || "Hội viên chính thức"} />
          </div>
          <div className="pt-3.5">
            <Row
              icon={CalendarClock}
              label="Hiệu lực đến"
              value={result.expiresAt ? new Date(result.expiresAt).toLocaleDateString("vi-VN") : "Vô thời hạn"}
            />
          </div>
        </div>
      </div>

      <Link
        to="/association"
        className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-[#2E3192]/60 bg-[#2E3192] hover:bg-[#252876] py-3.5 text-[14px] font-bold text-white shadow-xl shadow-[#2E3192]/25 transition active:scale-[0.99]"
      >
        <ArrowLeft className="h-4 w-4" /> Về trang chủ Hiệp hội CEO 1983
      </Link>
    </Shell>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#2E3192]/20 border border-[#2E3192]/30 text-blue-400">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-slate-400">{label}</div>
        <div
          className={`truncate text-[14px] font-bold ${
            accent ? "text-[#E6C687]" : "text-white"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
