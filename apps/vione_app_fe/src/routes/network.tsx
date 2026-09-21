import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  Package,
  Search,
  Send,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard, Card, Pill } from "@/components/dashboard/PageKit";
import { useFmt, useT } from "@/lib/i18n";
import { MEMBERS, hydrateMembers, type Member } from "@/lib/members-data";
import { type Product } from "@/lib/marketplace-data";
import { listProductsFn } from "@/lib/marketplace.functions";
import { listPeersFn } from "@/lib/members.functions";
import {
  CURRENT_USER_ID,
  acceptRequest,
  cancelRequest,
  declineRequest,
  deleteMessage,
  disconnect,
  getStatus,
  getStatusTime,
  getThread,
  hydrateNetwork,
  refreshFromDb,
  lastMessageWith,
  markThreadRead,
  unreadCountWith,
  listConnections,
  listIncoming,
  listOutgoing,
  listSuggestions,
  sendMessage,
  sendRequest,
  subscribe,
  type ChatMessage,
  type ConnectionStatus,
} from "@/lib/networking-data";
import { getNetworkStateFn } from "@/lib/networking.functions";

type NetworkSearch = { peer?: string; product?: string };

export const Route = createFileRoute("/network")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): NetworkSearch => {
    const out: NetworkSearch = {};
    if (typeof search.peer === "string") out.peer = search.peer;
    if (typeof search.product === "string") out.product = search.product;
    return out;
  },
  loader: async () => {
    const [products, network, members] = await Promise.all([
      listProductsFn(),
      getNetworkStateFn(),
      listPeersFn(),
    ]);
    hydrateMembers(members ?? []);
    return { products: products ?? [], network };
  },
  component: NetworkPage,
});

type Tab = "connections" | "requests" | "discover" | "messages";

function useNetworkTick() {
  const [, setN] = useState(0);
  useEffect(() => {
    const unsub = subscribe(() => setN((x) => x + 1));
    return () => {
      unsub();
    };
  }, []);
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function Avatar({ member, size = 40 }: { member: Member; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-primary-foreground"
      style={{
        width: size,
        height: size,
        background: "var(--gradient-primary)",
        fontSize: size * 0.36,
      }}
    >
      {initials(member.name)}
    </div>
  );
}

function MemberMeta({ member }: { member: Member }) {
  const t = useT();
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        {member.type === "company" ? (
          <Building2 className="h-3 w-3" />
        ) : (
          <User className="h-3 w-3" />
        )}
        {t(member.industry)}
      </span>
      <span className="opacity-50">•</span>
      <span>{t(member.region)}</span>
    </div>
  );
}

// Shows when a connection invite was sent/received/accepted, read from DB.
function StatusTime({ member }: { member: Member }) {
  const t = useT();
  const fmt = useFmt();
  const iso = getStatusTime(member.id);
  if (!iso) return null;
  const status = getStatus(member.id);
  const when = `${fmt.date(iso)} · ${fmt.rel(iso)}`;
  const key =
    status === "connected"
      ? "net.ts.connected"
      : status === "pending_incoming"
        ? "net.ts.received"
        : "net.ts.sent";
  return (
    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>{t(key, { d: when })}</span>
    </div>
  );
}

function StatusChip({ member }: { member: Member }) {
  const t = useT();
  const status = getStatus(member.id);
  if (status === "none") return null;
  const color =
    status === "connected" ? "success" : status === "pending_incoming" ? "warning" : "info";
  const Icon = status === "connected" ? UserCheck : Clock;
  return (
    <Pill color={color as never}>
      <Icon className="mr-1 inline h-3 w-3" />
      {t(`net.chip.${status}` as never)}
    </Pill>
  );
}

function MemberCard({
  member,
  rightSlot,
  bottomLabel,
}: {
  member: Member;
  rightSlot?: React.ReactNode;
  bottomLabel?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar member={member} size={48} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{member.name}</div>
          <MemberMeta member={member} />
          {bottomLabel && <div className="mt-2">{bottomLabel}</div>}
        </div>
      </div>
      {rightSlot && <div className="mt-3 flex flex-wrap gap-2">{rightSlot}</div>}
    </Card>
  );
}

function PrimaryBtn({
  onClick,
  icon: Icon,
  children,
  disabled,
  loading,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: "var(--gradient-primary)" }}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      {children}
    </button>
  );
}

function GhostBtn({
  onClick,
  icon: Icon,
  children,
  tone = "neutral",
  disabled,
  loading,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const cls =
    tone === "danger"
      ? "border-destructive/30 text-destructive hover:bg-destructive/10"
      : "border-border text-foreground hover:bg-secondary";
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${cls} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      {children}
    </button>
  );
}

function CancelRequestDialog({ member, trigger }: { member: Member; trigger: React.ReactNode }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = member.name;
  const handleConfirm = () => {
    setBusy(true);
    void cancelRequest(member.id)
      .then(() => {
        toast.success(t("net.toast.cancelled", { name }));
        setOpen(false);
      })
      .catch((err) => {
        const detail = err instanceof Error ? err.message : String(err);
        toast.error(t("net.toast.cancelFailed"), { description: detail });
      })
      .finally(() => setBusy(false));
  };
  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
      <AlertDialogTrigger asChild disabled={busy}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("net.confirm.cancel.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("net.confirm.cancel.desc", { name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("net.confirm.cancel.keep")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("net.action.canceling")}
              </>
            ) : (
              t("net.confirm.cancel.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConnectActions({
  member,
  onMessage,
}: {
  member: Member;
  onMessage: (id: string) => void;
}) {
  const t = useT();
  const [isSending, setIsSending] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Non-members (admins/platform admins without a member profile) can browse
  // peers but cannot perform connection/chat actions.
  if (!CURRENT_USER_ID) return null;
  const status = getStatus(member.id);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await sendRequest(member.id);
    } catch {
      toast.error(t("net.toast.actionFailed"));
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptRequest(member.id);
      toast.success(t("net.toast.accepted", { name: member.name }));
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      toast.error(t("net.toast.acceptFailed"), { description: detail });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      await declineRequest(member.id);
      toast.success(t("net.toast.declined", { name: member.name }));
    } catch {
      toast.error(t("net.toast.actionFailed"));
    }
  };

  if (status === "connected") {
    return (
      <>
        <PrimaryBtn icon={MessageSquare} onClick={() => onMessage(member.id)}>
          {t("net.action.message")}
        </PrimaryBtn>
        <GhostBtn icon={UserX} tone="danger" onClick={() => disconnect(member.id)}>
          {t("net.action.disconnect")}
        </GhostBtn>
      </>
    );
  }
  if (status === "pending_outgoing") {
    return (
      <CancelRequestDialog
        member={member}
        trigger={
          <GhostBtn icon={X} onClick={() => {}}>
            {t("net.action.cancel")}
          </GhostBtn>
        }
      />
    );
  }
  if (status === "pending_incoming") {
    return (
      <>
        <PrimaryBtn
          icon={Check}
          onClick={handleAccept}
          loading={isAccepting}
          disabled={isAccepting}
        >
          {isAccepting ? t("net.action.accepting") : t("net.action.accept")}
        </PrimaryBtn>
        <GhostBtn icon={X} tone="danger" onClick={handleDecline} disabled={isAccepting}>
          {t("net.action.decline")}
        </GhostBtn>
        <CancelRequestDialog
          member={member}
          trigger={
            <GhostBtn icon={Trash2} onClick={() => {}} disabled={isAccepting}>
              {t("net.action.cancel")}
            </GhostBtn>
          }
        />
      </>
    );
  }
  return (
    <PrimaryBtn icon={UserPlus} onClick={handleSend} loading={isSending} disabled={isSending}>
      {t("net.action.connect")}
    </PrimaryBtn>
  );
}

function ChatPanel({
  peerId,
  product,
  initialDraft,
  onClose,
  onClearProduct,
}: {
  peerId: string | null;
  product?: Product;
  initialDraft?: string;
  onClose: () => void;
  onClearProduct?: () => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const [text, setText] = useState("");
  const lastDraftRef = useRef<string | undefined>(undefined);

  // Apply prefilled draft when peer/product context arrives
  useEffect(() => {
    if (initialDraft && initialDraft !== lastDraftRef.current) {
      lastDraftRef.current = initialDraft;
      setText(initialDraft);
    }
  }, [initialDraft]);

  const peer = peerId ? MEMBERS.find((m) => m.id === peerId) : undefined;
  const thread = peerId ? getThread(peerId) : [];

  // Mark incoming messages as read whenever the open thread changes.
  useEffect(() => {
    if (peerId) markThreadRead(peerId);
  }, [peerId, thread.length]);

  // Last message I sent that the peer has already read (for the receipt).
  const lastReadMineId = [...thread]
    .reverse()
    .find((m) => m.fromId === CURRENT_USER_ID && m.readAt)?.id;

  if (!peer) {
    return (
      <Card className="flex h-[560px] items-center justify-center p-6 text-sm text-muted-foreground">
        {t("net.empty.thread")}
      </Card>
    );
  }

  const submit = () => {
    if (!text.trim()) return;
    sendMessage(peer.id, text);
    setText("");
  };

  return (
    <Card className="flex h-[560px] flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar member={peer} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{peer.name}</div>
          <MemberMeta member={peer} />
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {product && (
        <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-lg">
            {product.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Package className="mr-1 inline h-3 w-3" />
              {t("net.context.product")}
            </div>
            <div className="truncate text-xs font-semibold text-foreground">
              {product.title} · {fmt.money(product.price)}
            </div>
          </div>
          <Link
            to="/marketplace/$productId"
            params={{ productId: product.id }}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary"
          >
            <ExternalLink className="h-3 w-3" />
            {t("net.context.view")}
          </Link>
          {onClearProduct && (
            <button
              onClick={onClearProduct}
              className="rounded-lg p-1 text-muted-foreground hover:bg-card hover:text-foreground"
              title={t("net.context.dismiss")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {thread.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("net.empty.messages")}
          </div>
        )}
        {thread.map((m) => {
          const mine = m.fromId === CURRENT_USER_ID;
          return (
            <div
              key={m.id}
              className={`group flex items-center gap-1.5 ${mine ? "justify-end" : "justify-start"}`}
            >
              {mine && (
                <button
                  onClick={() => {
                    if (window.confirm(t("net.msg.delete") + "?")) deleteMessage(m.id);
                  }}
                  title={t("net.msg.delete")}
                  className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                  mine
                    ? "rounded-br-sm text-primary-foreground"
                    : "rounded-bl-sm bg-secondary text-foreground"
                }`}
                style={mine ? { background: "var(--gradient-primary)" } : undefined}
              >
                <div>{m.text}</div>
                <div
                  className={`mt-1 flex items-center gap-1 text-[10px] ${
                    mine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  <span>
                    {fmt.date(m.at)} ·{" "}
                    {new Date(m.at).toLocaleTimeString(fmt.locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {mine && m.id === lastReadMineId && (
                    <span className="font-semibold">· {t("net.msg.seen")}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t("net.compose.placeholder")}
          className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Send className="h-4 w-4" />
          {t("net.compose.send")}
        </button>
      </div>
    </Card>
  );
}

function NetworkPage() {
  useNetworkTick();
  const t = useT();
  const fmt = useFmt();
  const navigate = useNavigate();

  const search = Route.useSearch();
  const { products, network } = Route.useLoaderData() as {
    products: Product[];
    network: {
      currentMemberId: string | null;
      statuses: Record<string, ConnectionStatus>;
      timestamps: Record<string, string>;
      messages: ChatMessage[];
    };
  };
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Hydrate the local network store from server data
  useEffect(() => {
    hydrateNetwork(
      network?.currentMemberId ?? null,
      network?.statuses ?? {},
      network?.messages ?? [],
      network?.timestamps ?? {},
    );
  }, [network]);

  // Realtime: when messages/connections change in the DB, re-sync only the
  // network state (statuses, timestamps, messages) instead of re-running the
  // Polling: refresh messages and connections every 20 s (replaces Supabase realtime channel)
  useEffect(() => {
    const id = setInterval(() => void refreshFromDb(), 20_000);
    return () => clearInterval(id);
  }, []);


  const [tab, setTab] = useState<Tab>("connections");
  const [query, setQuery] = useState("");
  const [activePeer, setActivePeer] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState<string | undefined>(undefined);

  // React to ?peer=&product= deep links from Marketplace
  useEffect(() => {
    if (!search.peer) return;
    // Open the chat with this peer (messaging works regardless of status).
    setTab("messages");
    setActivePeer(search.peer);
    if (search.product) {
      const p = productsById.get(search.product);
      setActiveProduct(search.product);
      if (p) {
        setDraft(t("mk.chat.prefill", { title: p.title, price: fmt.money(p.price) }));
      }
    } else {
      setActiveProduct(undefined);
      setDraft(undefined);
    }
    // Clean URL so refresh doesn't re-prefill
    navigate({
      to: "/network",
      search: {},
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.peer, search.product]);

  const connections = listConnections();
  const incoming = listIncoming();
  const outgoing = listOutgoing();
  const suggestions = listSuggestions();

  const matches = (m: Member, q: string) =>
    !q ||
    m.name.toLowerCase().includes(q) ||
    (m.contact ?? "").toLowerCase().includes(q) ||
    m.code.toLowerCase().includes(q) ||
    t(m.industry).toLowerCase().includes(q) ||
    t(m.region).toLowerCase().includes(q);

  const filter = (list: Member[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => matches(m, q));
  };

  // Discover: search by name/company + sort + paginate (no full-list dump)
  const PER_PAGE = 12;
  const [sort, setSort] = useState<"name-asc" | "name-desc" | "code-asc">("name-asc");
  const [page, setPage] = useState(1);

  const discoverFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = suggestions.filter((m) => matches(m, q));
    const sorted = [...list].sort((a, b) => {
      if (sort === "code-asc") return a.code.localeCompare(b.code);
      const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      return sort === "name-desc" ? -cmp : cmp;
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions, query, sort]);

  const discoverPages = Math.max(1, Math.ceil(discoverFiltered.length / PER_PAGE));
  const safePage = Math.min(page, discoverPages);
  const discoverPaged = discoverFiltered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // Reset to first page when the query, sort, or tab changes
  useEffect(() => {
    setPage(1);
  }, [query, sort, tab]);

  const messageList = useMemo(
    () =>
      connections
        .map((m) => ({ member: m, last: lastMessageWith(m.id) }))
        .sort((a, b) => (b.last?.at ?? "").localeCompare(a.last?.at ?? "")),
    [connections],
  );

  const openChat = (id: string) => {
    setTab("messages");
    setActivePeer(id);
    setActiveProduct(undefined);
    setDraft(undefined);
  };
  const selectPeer = (id: string) => {
    setActivePeer(id);
    setActiveProduct(undefined);
    setDraft(undefined);
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "connections", label: t("net.tab.connections"), count: connections.length },
    { key: "requests", label: t("net.tab.requests"), count: incoming.length + outgoing.length },
    { key: "discover", label: t("net.tab.discover") },
    { key: "messages", label: t("net.tab.messages"), count: messageList.length },
  ];

  return (
    <AppShell>
      <PageHeader title={t("net.title")} subtitle={t("net.subtitle")} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("net.kpi.connections")}
          value={fmt.num(connections.length)}
          tone="primary"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label={t("net.kpi.incoming")}
          value={fmt.num(incoming.length)}
          tone="warning"
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatCard
          label={t("net.kpi.outgoing")}
          value={fmt.num(outgoing.length)}
          tone="info"
          icon={<UserCheck className="h-4 w-4" />}
        />
        <StatCard
          label={t("net.kpi.threads")}
          value={fmt.num(messageList.length)}
          tone="success"
          icon={<MessageSquare className="h-4 w-4" />}
        />
      </div>

      {!network.currentMemberId && (
        <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground shadow-[var(--shadow-card)]">
          <div className="font-semibold">{t("net.notMember.title")}</div>
          <div className="mt-0.5 text-muted-foreground">{t("net.notMember.desc")}</div>
        </div>
      )}

      {/* Tabs */}

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border">
        {TABS.map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tb.label}
              {tb.count != null && tb.count > 0 && (
                <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                  {tb.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab !== "messages" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-card)]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("net.search")}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      )}

      {tab === "connections" && (
        <>
          {connections.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              {t("net.empty.connections")}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filter(connections).map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  bottomLabel={
                    <>
                      <StatusChip member={m} />
                      <StatusTime member={m} />
                    </>
                  }
                  rightSlot={<ConnectActions member={m} onMessage={openChat} />}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "requests" && (
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("net.tab.requests")} · {incoming.length}
            </div>
            {incoming.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">{t("net.empty.incoming")}</Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filter(incoming).map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    bottomLabel={
                      <>
                        <Pill color="warning">{t("net.incoming.label")}</Pill>
                        <StatusTime member={m} />
                      </>
                    }
                    rightSlot={<ConnectActions member={m} onMessage={openChat} />}
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("net.kpi.outgoing")} · {outgoing.length}
            </div>
            {outgoing.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">{t("net.empty.outgoing")}</Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filter(outgoing).map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    bottomLabel={
                      <>
                        <Pill color="info">{t("net.outgoing.label")}</Pill>
                        <StatusTime member={m} />
                      </>
                    }
                    rightSlot={<ConnectActions member={m} onMessage={openChat} />}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "discover" && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {t("net.page.count", { count: fmt.num(discoverFiltered.length) })}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("net.sort.label")}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="rounded-lg border border-input bg-card px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="name-asc">{t("net.sort.nameAsc")}</option>
                <option value="name-desc">{t("net.sort.nameDesc")}</option>
                <option value="code-asc">{t("net.sort.codeAsc")}</option>
              </select>
            </label>
          </div>

          {discoverFiltered.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              {t("net.empty.discover")}
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {discoverPaged.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    bottomLabel={
                      getStatus(m.id) === "none" ? (
                        <Pill color="primary">{t("net.suggested.label")}</Pill>
                      ) : (
                        <StatusChip member={m} />
                      )
                    }
                    rightSlot={<ConnectActions member={m} onMessage={openChat} />}
                  />
                ))}
              </div>

              {discoverPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-40"
                  >
                    {t("net.page.prev")}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {t("net.page.info", { page: safePage, total: discoverPages })}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(discoverPages, p + 1))}
                    disabled={safePage >= discoverPages}
                    className="rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-40"
                  >
                    {t("net.page.next")}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "messages" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="flex h-[560px] flex-col overflow-hidden">
            <div className="border-b border-border p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("net.tab.messages")}
            </div>
            <div className="flex-1 overflow-y-auto">
              {messageList.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground">
                  {t("net.empty.connections")}
                </div>
              )}
              {messageList.map(({ member, last }) => {
                const active = activePeer === member.id;
                const unread = active ? 0 : unreadCountWith(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => selectPeer(member.id)}
                    className={`flex w-full items-start gap-3 border-b border-border p-3 text-left transition ${
                      active ? "bg-secondary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <Avatar member={member} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {member.name}
                        </div>
                        {last && (
                          <div className="shrink-0 text-[10px] text-muted-foreground">
                            {new Date(last.at).toLocaleDateString(fmt.locale)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`truncate text-xs ${unread > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                        >
                          {last
                            ? (last.fromId === CURRENT_USER_ID ? "→ " : "") + last.text
                            : t("net.empty.messages")}
                        </div>
                        {unread > 0 && (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
          <ChatPanel
            peerId={activePeer}
            product={activeProduct ? productsById.get(activeProduct) : undefined}
            initialDraft={draft}
            onClose={() => {
              setActivePeer(null);
              setActiveProduct(undefined);
              setDraft(undefined);
            }}
            onClearProduct={() => {
              setActiveProduct(undefined);
              setDraft(undefined);
            }}
          />
        </div>
      )}
    </AppShell>
  );
}
