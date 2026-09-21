import { MEMBERS, type Member } from "./members-data";

export type ConnectionStatus = "connected" | "pending_outgoing" | "pending_incoming" | "none";

export type ChatMessage = {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  at: string; // ISO
  readAt?: string | null;
};

// The current logged-in member id, resolved server-side and hydrated below.
export let CURRENT_USER_ID = "";

let _statuses = new Map<string, ConnectionStatus>();
let _timestamps = new Map<string, string>();
let _messages: ChatMessage[] = [];

export type Listener = () => void;
const listeners = new Set<Listener>();
function emit() {
  listeners.forEach((l: any) => l());
}
export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Hydrate the local store from server-loaded data.
export function hydrateNetwork(
  currentMemberId: string | null,
  statuses: Record<string, ConnectionStatus>,
  messages: ChatMessage[],
  timestamps: Record<string, string> = {},
) {
  CURRENT_USER_ID = currentMemberId ?? "";
  _statuses = new Map(Object.entries(statuses));
  _timestamps = new Map(Object.entries(timestamps));
  _messages = [...messages];
  emit();
}

export function getStatus(memberId: string): ConnectionStatus {
  if (memberId === CURRENT_USER_ID) return "none";
  return _statuses.get(memberId) ?? "none";
}

// Timestamp (ISO) of the last status change for a peer (sent/accepted), if any.
export function getStatusTime(memberId: string): string | null {
  return _timestamps.get(memberId) ?? null;
}

// Optimistically update local status, then persist via the matching server fn.
function localSet(memberId: string, status: ConnectionStatus) {
  if (status === "none") _statuses.delete(memberId);
  else _statuses.set(memberId, status);
  emit();
}

// Re-sync the local connection statuses from the database so the UI always
// reflects the authoritative DB state right after an action (or a failure).
export async function refreshFromDb() {
  try {
    const { getNetworkStateFn } = await import("./networking.functions");
    const net = await getNetworkStateFn();
    _statuses = new Map(Object.entries(net.statuses));
    _timestamps = new Map(Object.entries(net.timestamps ?? {}));
    CURRENT_USER_ID = net.currentMemberId ?? CURRENT_USER_ID;
    emit();
  } catch {
    /* keep optimistic state on transient failures */
  }
}

type PersistFn = "sendRequestFn" | "acceptRequestFn" | "declineRequestFn" | "removeConnectionFn";

function persist(fn: PersistFn, peerId: string): Promise<void> {
  return import("./networking.functions")
    .then((m) => m[fn]({ data: { peerId } }))
    .then(() => {})
    .finally(() => {
      // Reconcile with DB whether the RPC succeeded or failed.
      void refreshFromDb();
    });
}

export function sendRequest(memberId: string): Promise<void> {
  return persist("sendRequestFn", memberId).then(() => {
    localSet(memberId, "pending_outgoing");
  });
}

export function cancelRequest(memberId: string): Promise<void> {
  const prev = getStatus(memberId);
  localSet(memberId, "none");
  return persist("removeConnectionFn", memberId).catch((err) => {
    // Revert optimistic state so the UI stays in sync with the DB.
    localSet(memberId, prev);
    throw err;
  });
}
export function acceptRequest(memberId: string): Promise<void> {
  return persist("acceptRequestFn", memberId).then(() => {
    localSet(memberId, "connected");
  });
}

export function declineRequest(memberId: string): Promise<void> {
  localSet(memberId, "none");
  return persist("declineRequestFn", memberId);
}
export function disconnect(memberId: string) {
  localSet(memberId, "none");
  persist("removeConnectionFn", memberId);
}

export function listConnections(): Member[] {
  return MEMBERS.filter((m) => getStatus(m.id) === "connected");
}
export function listIncoming(): Member[] {
  return MEMBERS.filter((m) => getStatus(m.id) === "pending_incoming");
}
export function listOutgoing(): Member[] {
  return MEMBERS.filter((m) => getStatus(m.id) === "pending_outgoing");
}
export function listSuggestions(): Member[] {
  return MEMBERS.filter((m) => m.id !== CURRENT_USER_ID && getStatus(m.id) === "none");
}

export function getThread(memberId: string): ChatMessage[] {
  return _messages
    .filter(
      (m) =>
        (m.fromId === CURRENT_USER_ID && m.toId === memberId) ||
        (m.fromId === memberId && m.toId === CURRENT_USER_ID),
    )
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function sendMessage(toId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  _messages.push({
    id: `m${_messages.length + 1}-${Date.now()}`,
    fromId: CURRENT_USER_ID,
    toId,
    text: trimmed,
    at: new Date().toISOString(),
  });
  // ensure connection exists when messaging
  if (_statuses.get(toId) !== "connected") _statuses.set(toId, "connected");
  emit();
  import("./networking.functions")
    .then((m) => m.sendMessageFn({ data: { toId, text: trimmed } }))
    .catch(() => {});
}

export function lastMessageWith(memberId: string): ChatMessage | undefined {
  const t = getThread(memberId);
  return t[t.length - 1];
}

// Number of unread messages received from a given peer.
export function unreadCountWith(memberId: string): number {
  return _messages.filter((m) => m.fromId === memberId && m.toId === CURRENT_USER_ID && !m.readAt)
    .length;
}

// Mark all messages from a peer as read (optimistic + persisted).
export function markThreadRead(memberId: string) {
  const now = new Date().toISOString();
  let changed = false;
  _messages = _messages.map((m) => {
    if (m.fromId === memberId && m.toId === CURRENT_USER_ID && !m.readAt) {
      changed = true;
      return { ...m, readAt: now };
    }
    return m;
  });
  if (!changed) return;
  emit();
  import("./networking.functions")
    .then((m) => m.markThreadReadFn({ data: { peerId: memberId } }))
    .catch(() => {});
}

export function deleteMessage(id: string) {
  const msg = _messages.find((m) => m.id === id);
  if (!msg || msg.fromId !== CURRENT_USER_ID) return;
  _messages = _messages.filter((m) => m.id !== id);
  emit();
  import("./networking.functions").then((m) => m.deleteMessageFn({ data: { id } })).catch(() => {});
}
