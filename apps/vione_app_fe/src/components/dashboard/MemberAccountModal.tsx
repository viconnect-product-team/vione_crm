import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail, Search, UserCheck, UserPlus, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  assignMemberUserFn,
  createMemberUserFn,
  getMemberAccountFn,
  listAssignableUsersFn,
  listMemberAccountAuditFn,
  sendMemberInviteFn,
  unassignMemberUserFn,
  type AssignableUser,
  type AccountAuditEntry,
} from "@/lib/member-account.functions";
import type { TKey } from "@/lib/i18n";
import { History } from "lucide-react";

function resetRedirect() {
  return `${window.location.origin}/reset-password`;
}

type Props = {
  memberId: string;
  memberName: string;
  memberEmail?: string;
  onClose: () => void;
};

export function MemberAccountModal({ memberId, memberName, memberEmail, onClose }: Props) {
  const t = useT();
  const getAccountFn = useServerFn(getMemberAccountFn);
  const listUsersFn = useServerFn(listAssignableUsersFn);
  const assignFn = useServerFn(assignMemberUserFn);
  const createFn = useServerFn(createMemberUserFn);
  const unassignFn = useServerFn(unassignMemberUserFn);
  const inviteFn = useServerFn(sendMemberInviteFn);
  const auditFn = useServerFn(listMemberAccountAuditFn);

  const [tab, setTab] = useState<"assign" | "create" | "send">("assign");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);
  const [account, setAccount] = useState<{ email: string | null; fullName: string | null } | null>(
    null,
  );
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unassigned" | "assigned">("unassigned");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [email, setEmail] = useState(memberEmail ?? "");
  const [fullName, setFullName] = useState(memberName);
  const [password, setPassword] = useState("");
  const [audit, setAudit] = useState<AccountAuditEntry[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [acc, list, log] = await Promise.all([
        getAccountFn({ data: { memberId } }),
        listUsersFn(),
        auditFn({ data: { memberId } }),
      ]);
      setAccount(
        acc?.account ? { email: acc.account.email, fullName: acc.account.fullName } : null,
      );
      setUsers(list ?? []);
      setAudit(log ?? []);
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const filteredUsers = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "unassigned" && u.assignedMemberId) return false;
      if (filter === "assigned" && !u.assignedMemberId) return false;
      if (!ql) return true;
      return (
        (u.email ?? "").toLowerCase().includes(ql) || (u.fullName ?? "").toLowerCase().includes(ql)
      );
    });
  }, [users, q, filter]);

  const doAssign = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await assignFn({ data: { memberId, userId: selectedUser } });
      toast.success(t("macct.assigned"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const doCreate = async () => {
    setSubmitting(true);
    try {
      const res = await createFn({
        data: {
          memberId,
          email,
          fullName,
          password: sendInvite ? "" : password,
          sendInvite,
          redirectTo: resetRedirect(),
        },
      });
      toast.success(res?.invited ? t("macct.createInvited") : t("macct.created"));
      setPassword("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const doInvite = async () => {
    setSubmitting(true);
    try {
      await inviteFn({ data: { memberId, redirectTo: resetRedirect() } });
      toast.success(t("macct.inviteSent"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const doUnassign = async () => {
    setSubmitting(true);
    try {
      await unassignFn({ data: { memberId } });
      toast.success(t("macct.unassigned"));
      setSelectedUser(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-glow)]">
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">{t("macct.title")}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("macct.subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.cancel")}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Current account */}
          <div className="mb-5 rounded-xl border border-border bg-secondary/50 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("macct.current")}
            </div>
            {loading ? (
              <div className="mt-2 h-5 w-40 animate-pulse rounded bg-muted" />
            ) : account ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {account.fullName || t("macct.none")}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{account.email}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={doInvite}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {t("macct.invite")}
                  </button>
                  <button
                    onClick={doUnassign}
                    disabled={submitting}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {t("macct.unassign")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">{t("macct.none")}</div>
            )}
          </div>

          {/* Mode selector: assign / create / send */}
          <div className="mb-4 inline-flex rounded-lg border border-border bg-background p-1">
            <button
              onClick={() => setTab("assign")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                tab === "assign"
                  ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                  : "text-muted-foreground"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              {t("macct.tab.existing")}
            </button>
            <button
              onClick={() => setTab("create")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                tab === "create"
                  ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                  : "text-muted-foreground"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t("macct.tab.new")}
            </button>
            <button
              onClick={() => setTab("send")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                tab === "send"
                  ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                  : "text-muted-foreground"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              {t("macct.tab.send")}
            </button>
          </div>

          {tab === "assign" ? (
            <div>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("macct.searchUser")}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div className="mb-3 inline-flex flex-wrap gap-1.5">
                {(["unassigned", "all", "assigned"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      filter === f
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "bg-secondary text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t(`macct.filter.${f}` as TKey)}
                  </button>
                ))}
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                {filteredUsers.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("macct.noUsers")}
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.userId}
                      onClick={() => setSelectedUser(u.userId)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left ${
                        selectedUser === u.userId
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {u.email || u.userId}
                        </div>
                        {u.fullName && (
                          <div className="truncate text-xs text-muted-foreground">{u.fullName}</div>
                        )}
                      </div>
                      {u.assignedMemberId && (
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {t("macct.alreadyAssigned")}: {u.assignedMemberName}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={doAssign}
                  disabled={submitting || !selectedUser}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {t("macct.assign")}
                </button>
              </div>
            </div>
          ) : tab === "create" ? (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground">
                  {t("macct.f.fullName")}
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground">
                  {t("macct.f.email")}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-xs font-medium text-foreground">{t("macct.selfSet")}</span>
              </label>
              {!sendInvite && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-foreground">
                    {t("macct.setPassword")}
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </label>
              )}
              <div className="flex justify-end pt-1">
                <button
                  onClick={doCreate}
                  disabled={
                    submitting || !email || !fullName || (!sendInvite && password.length < 8)
                  }
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {sendInvite ? t("macct.create") : t("macct.create")}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="text-sm font-semibold text-foreground">{t("macct.send.title")}</div>
                <p className="mt-1 text-xs text-muted-foreground">{t("macct.send.desc")}</p>
              </div>
              {account ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {account.fullName || t("macct.none")}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{account.email}</div>
                  </div>
                  <button
                    onClick={doInvite}
                    disabled={submitting}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Mail className="h-4 w-4" />
                    {t("macct.send.button")}
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                  {t("macct.send.noAccount")}
                </div>
              )}
            </div>
          )}

          {/* Audit history */}
          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              {t("macct.history")}
            </div>
            {loading ? (
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            ) : audit.length === 0 ? (
              <div className="text-xs text-muted-foreground">{t("macct.history.empty")}</div>
            ) : (
              <ol className="space-y-2">
                {audit.map((a: any) => (
                  <li key={a.id} className="flex gap-2 text-xs">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">
                        {t(`macct.action.${a.action}` as TKey)}
                        {a.targetEmail ? ` · ${a.targetEmail}` : ""}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString("vi-VN")}
                        {a.actorEmail ? ` · ${t("macct.by")} ${a.actorEmail}` : ""}
                        {a.details ? ` · ${a.details}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
