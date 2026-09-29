import { useEffect, useState, useMemo } from "react";
import {
  QrCode,
  Search,
  Check,
  CheckSquare,
  Square,
  X,
  Users,
  ShieldCheck,
  ChevronDown,
  Phone,
  Sparkles,
} from "lucide-react";
import { fetchNestApi } from "@/lib/api-client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type MemberStaff = {
  id: string;
  code: string;
  name: string;
  department?: string | null;
  executiveRole?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar?: string | null;
};

export function EventQrStaffSelector({
  value = [],
  onChange,
}: {
  value?: string[] | string;
  onChange: (staffList: string[]) => void;
}) {
  const [membersList, setMembersList] = useState<MemberStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Normalize selected value to array of strings
  const safeSelected = useMemo<string[]>(() => {
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === "object" && v !== null ? (v as any).name || (v as any).label || JSON.stringify(v) : String(v)));
    }
    if (typeof value === "string" && value.trim()) {
      if (value.startsWith("[")) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.map(String);
        } catch {}
      }
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  // Fetch members from API and filter those in Ban Truyền Thông
  useEffect(() => {
    let active = true;
    async function loadMembers() {
      try {
        const res = await fetchNestApi<MemberStaff[]>("/members");
        if (active && Array.isArray(res)) {
          setMembersList(res);
        }
      } catch (err) {
        console.error("[EventQrStaffSelector] Fetch members error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMembers();
    return () => {
      active = false;
    };
  }, []);

  // Filter members specifically belonging to "Ban Truyền Thông"
  const mediaMembers = useMemo(() => {
    const matched = membersList.filter((m) => {
      const dept = (m.department || "").toLowerCase();
      const role = (m.executiveRole || (m as any).executive_role || (m as any).role || "").toLowerCase();
      return (
        dept.includes("truyền thông") ||
        dept.includes("media") ||
        role.includes("truyền thông") ||
        role.includes("btt")
      );
    });
    // If matched, use media members; if empty, fallback to active members
    return matched.length > 0 ? matched : membersList;
  }, [membersList]);

  // Filtered by query
  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mediaMembers;
    return mediaMembers.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        (m.code && m.code.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
      );
    });
  }, [mediaMembers, query]);

  // Check if member is selected
  const isMemberSelected = (m: MemberStaff) => {
    return safeSelected.some((sel) => {
      const s = sel.toLowerCase();
      return s.includes(m.name.toLowerCase()) || (m.code && s.includes(m.code.toLowerCase())) || s === m.id;
    });
  };

  const getMemberIdentifier = (m: MemberStaff) => {
    return `${m.name} — ${m.code || "M1983"}${m.phone ? ` (${m.phone})` : ""}`;
  };

  // Toggle member
  const handleToggleMember = (m: MemberStaff) => {
    const ident = getMemberIdentifier(m);
    if (isMemberSelected(m)) {
      onChange(
        safeSelected.filter((sel) => {
          const s = sel.toLowerCase();
          return !s.includes(m.name.toLowerCase()) && (!m.code || !s.includes(m.code.toLowerCase())) && s !== m.id;
        })
      );
    } else {
      onChange([...safeSelected, ident]);
    }
  };

  // Remove tag
  const handleRemove = (ident: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(safeSelected.filter((s) => s !== ident));
  };

  // Select all media members
  const handleSelectAll = () => {
    const all = mediaMembers.map(getMemberIdentifier);
    onChange(Array.from(new Set([...safeSelected, ...all])));
  };

  // Clear all
  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-card/60 p-3.5 shadow-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <QrCode className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground">
                Ban Truyền Thông Quét Mã QR
              </span>
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.2 bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                <ShieldCheck className="h-3 w-3" /> Ban Truyền Thông
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Chỉ định các nhân sự thuộc Ban Truyền Thông làm người quét mã QR đón tiếp tại sự kiện
            </p>
          </div>
        </div>

        {safeSelected.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer shrink-0"
          >
            Bỏ chọn tất cả
          </button>
        )}
      </div>

      {/* Selected Members Chips Container (With TOOLTIP when > 1 item) */}
      <div className="min-h-[44px] rounded-xl border border-border bg-background/80 p-2 flex flex-wrap items-center gap-1.5">
        {safeSelected.length === 0 ? (
          <div
            onClick={() => setDropdownOpen(true)}
            className="text-xs text-muted-foreground italic px-1 flex items-center gap-1.5 cursor-pointer w-full"
          >
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Chưa phân công nhân sự nào. Bấm vào đây để chọn người thuộc Ban Truyền Thông...</span>
          </div>
        ) : (
          <>
            {safeSelected.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 shadow-xs"
              >
                <span className="max-w-[220px] truncate" title={item}>
                  {item}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(item, e)}
                  className="rounded-full p-0.5 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 transition cursor-pointer"
                  title="Gỡ nhân sự này"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* MANDATORY TOOLTIP: Khi vượt quá 1 tên ở multi-select là phải có Tooltip */}
            {safeSelected.length > 1 && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 text-xs font-bold cursor-help shadow-xs hover:bg-primary/25 transition">
                      <Sparkles className="h-3 w-3" />
                      +{safeSelected.length - 1} nhân sự khác (Rê chuột xem danh sách)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="z-50 max-w-sm rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl"
                  >
                    <div className="text-[11px] font-bold text-foreground mb-1.5 pb-1 border-b border-border flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                      <span>Danh sách {safeSelected.length} nhân sự Ban Truyền Thông quét mã:</span>
                    </div>
                    <ul className="text-xs space-y-1.5 max-h-48 overflow-y-auto">
                      {safeSelected.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                          <span className="font-semibold text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        )}
      </div>

      {/* Dropdown Toggle Button */}
      <div>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-primary/50 transition cursor-pointer shadow-xs"
        >
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            {safeSelected.length === 0
              ? "+ Chọn nhân sự Ban Truyền Thông quét mã QR..."
              : `Đã chọn ${safeSelected.length} nhân sự Ban Truyền Thông (Bấm để chọn thêm / bớt)`}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Checklist Box */}
        {dropdownOpen && (
          <div className="mt-2 rounded-xl border border-border bg-card p-2.5 shadow-xl space-y-2 animate-fade-in">
            {/* Search filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm nhân sự theo tên, số điện thoại, mã hội viên..."
                  className="h-8 w-full rounded-lg border border-border bg-muted/40 pl-8 pr-3 text-xs focus:border-ring focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
                >
                  Chọn tất cả BTT
                </button>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* List of Ban Truyền Thông members */}
            <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-border/60 p-1 divide-y divide-border/30">
              {loading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Đang tải danh sách nhân sự Ban Truyền Thông...
                </div>
              ) : filteredList.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground italic">
                  Không tìm thấy nhân sự phù hợp
                </div>
              ) : (
                filteredList.map((m) => {
                  const isChecked = isMemberSelected(m);
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMember(m)}
                      className={`flex items-center justify-between gap-3 p-2 rounded-lg text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-purple-500/10 border border-purple-500/30 text-purple-900 dark:text-purple-200 font-medium"
                          : "hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="shrink-0 text-purple-600">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground/60" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground truncate">{m.name}</span>
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                              {m.code || "M1983"}
                            </span>
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
                              Ban Truyền Thông
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 truncate">
                            {m.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5 shrink-0" />
                                {m.phone}
                              </span>
                            )}
                            {m.email && <span>• {m.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isChecked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600">
                            <Check className="h-3.5 w-3.5" /> Đã gán
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-muted-foreground hover:text-purple-600">
                            + Phân công
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom summary bar with Tooltip if > 1 selected */}
            <div className="flex justify-between items-center px-1 text-[11px] text-muted-foreground pt-1 border-t border-border">
              {safeSelected.length > 1 ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help font-semibold text-purple-600 underline decoration-dotted">
                        Đã chọn: <strong className="text-foreground">{safeSelected.length}</strong> nhân sự (Rê chuột xem tất cả)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-50 max-w-xs rounded-xl border border-border bg-popover p-2.5 text-popover-foreground shadow-2xl">
                      <div className="text-[11px] font-bold text-foreground mb-1 pb-1 border-b border-border">
                        Nhân sự Ban Truyền Thông quét mã:
                      </div>
                      <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                        {safeSelected.map((item, idx) => (
                          <div key={idx} className="truncate">
                            {idx + 1}. {item}
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span>Đã chọn: <strong className="text-foreground">{safeSelected.length}</strong> nhân sự</span>
              )}
              <span className="text-[10px] text-muted-foreground">
                Tổng cộng: {mediaMembers.length} nhân sự BTT
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
