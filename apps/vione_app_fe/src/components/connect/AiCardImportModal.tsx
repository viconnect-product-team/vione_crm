// AI-powered card import — upload one OR many business card images at once,
// extract design + content via Gemini vision for each in parallel, then let
// the user review/edit fields, template and qrOptions per image before
// applying to the builder card (one image at a time; the modal advances
// through the queue).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Crop,
  FileDown,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  Redo2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n";
import {
  analyzeCardImage,
  recommendOptimalTemplate,
  type CardAiSuggestion,
  type OptimalTemplatePick,
} from "@/lib/card-ai.functions";
import {
  deleteCardAiHistory,
  listCardAiHistory,
  saveCardAiHistory,
  type CardAiHistoryEntry,
} from "@/lib/card-ai-history.functions";
import {
  exportHistoryCSV,
  exportHistoryPDF,
  type HistoryExportRow,
} from "@/lib/card-ai-history-export";
import { getTemplate } from "@/lib/card-templates";
import { supabase } from "@/integrations/supabase/client";
import { GlobalCardPreview, type PreviewState } from "./GlobalCardPreview";
import { CardTemplateGallery } from "./CardTemplateGallery";
import { ImageCropperDialog } from "./ImageCropperDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_FILES = 10;
const ACCEPT = "image/png,image/jpeg,image/webp";

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(new Error("read failed"));
      r.readAsDataURL(file);
    });
  }
  const MAX = 1600;
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.88);
}

async function makeThumbnail(dataUrl: string, max = 320): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("thumb load failed"));
    el.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.72);
}

type Draft = CardAiSuggestion;

type ItemStatus = "loading" | "ready" | "error" | "applied";

export type FieldHistoryEntry = {
  ts: number;
  value: string | null;
  source: "ai" | "edit" | "restore" | "revert";
  actorId?: string | null;
  actorLabel?: string | null;
};

type Item = {
  id: string;
  previewUrl: string;
  originalUrl: string; // always the untouched upload — used to re-open cropper
  cropped: boolean;
  status: ItemStatus;
  draft: Draft | null;
  aiDraft: Draft | null; // pristine AI suggestion — used for per-field restore
  verified: Record<string, boolean>;
  history: Partial<Record<keyof Draft, FieldHistoryEntry[]>>;
  error?: string;
};

const HISTORY_FIELDS: readonly (keyof Draft)[] = [
  "displayName",
  "professionalTitle",
  "companyName",
  "headline",
  "workEmail",
  "workPhone",
  "website",
] as const;

const AI_ACTOR_LABEL = "AI";

function seedHistoryFromAi(ai: Draft): Item["history"] {
  const ts = Date.now();
  const h: Item["history"] = {};
  for (const k of HISTORY_FIELDS) {
    const v = (ai as Record<string, unknown>)[k as string];
    h[k] = [
      {
        ts,
        value: (v ?? null) as string | null,
        source: "ai",
        actorId: null,
        actorLabel: AI_ACTOR_LABEL,
      },
    ];
  }
  return h;
}

function pushHistory(
  history: Item["history"],
  key: keyof Draft,
  value: string | null,
  source: FieldHistoryEntry["source"],
  actor?: { id: string | null; label: string | null },
): Item["history"] {
  const arr = history?.[key] ?? [];
  const last = arr[arr.length - 1];
  if (last && last.value === value) return history;
  return {
    ...history,
    [key]: [
      ...arr,
      {
        ts: Date.now(),
        value,
        source,
        actorId: actor?.id ?? null,
        actorLabel: actor?.label ?? (source === "ai" ? AI_ACTOR_LABEL : null),
      },
    ],
  };
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiCardImportModal({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onApply: (s: CardAiSuggestion) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoPickLoading, setAutoPickLoading] = useState<string | null>(null);
  const [autoPick, setAutoPick] = useState<Record<string, OptimalTemplatePick | null>>({});
  const previewRef = useRef<HTMLDivElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropBusy, setCropBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<CardAiHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"detail" | "list">("detail");
  const [listFilter, setListFilter] = useState<"all" | "needsReview" | "ok">("all");
  const [batchApplying, setBatchApplying] = useState(false);
  const [batchExporting, setBatchExporting] = useState(false);
  const batchRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [restoreConfirm, setRestoreConfirm] = useState<
    | { kind: "field"; id: string; key: keyof Draft; label: string }
    | { kind: "all"; id: string }
    | null
  >(null);
  // Per-item undo/redo stacks capturing user field edits (source === "edit").
  // Restore/revert flows have their own affordances and are not stacked here.
  type UndoEntry = {
    key: keyof Draft;
    prev: Draft[keyof Draft];
    next: Draft[keyof Draft];
    label: string;
    // History snapshot recorded when the edit was applied. Undo removes it
    // from the field history; redo re-appends the exact same entry so the
    // timeline stays in lock-step with the undo/redo stacks.
    historyEntry: FieldHistoryEntry | null;
  };
  const [undoStacks, setUndoStacks] = useState<Record<string, UndoEntry[]>>({});
  const [redoStacks, setRedoStacks] = useState<Record<string, UndoEntry[]>>({});
  // Transient banner shown right after undo/redo so the user can compare the
  // pristine AI suggestion with the value they just landed on.
  const [lastUndoRedo, setLastUndoRedo] = useState<{
    id: string;
    key: keyof Draft;
    label: string;
    current: Draft[keyof Draft];
    direction: "undo" | "redo";
    ts: number;
  } | null>(null);
  useEffect(() => {
    if (!lastUndoRedo) return;
    const timer = window.setTimeout(() => {
      setLastUndoRedo((prev) => (prev && prev.ts === lastUndoRedo.ts ? null : prev));
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [lastUndoRedo]);
  const [actor, setActor] = useState<{ id: string | null; label: string | null }>({
    id: null,
    label: null,
  });
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelled) return;
        const u = data?.user ?? null;
        if (!u) return;
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const label =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          u.email ||
          u.id;
        setActor({ id: u.id, label: String(label) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setSelectedId(null);
    setAutoPickLoading(null);
    setAutoPick({});
    setUndoStacks({});
    setRedoStacks({});
  }, []);

  const selected = useMemo(
    () => items.find((it) => it.id === selectedId) ?? null,
    [items, selectedId],
  );

  const analyzeOne = useCallback(async (id: string, dataUrl: string) => {
    try {
      const result = await analyzeCardImage({ data: { imageDataUrl: dataUrl } });
      setItems((list) =>
        list.map((it) =>
          it.id === id
            ? {
                ...it,
                status: "ready",
                draft: result,
                aiDraft: result,
                verified: {},
                history: seedHistoryFromAi(result),
              }
            : it,
        ),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "err";
      setItems((list) =>
        list.map((it) => (it.id === id ? { ...it, status: "error", error: msg } : it)),
      );
    }
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const currentCount = items.length;
      const remaining = Math.max(0, MAX_FILES - currentCount);
      const accepted = files.slice(0, remaining);
      if (files.length > remaining) toast.warning(t("connect.ai.import.limit"));

      const valid: { file: File; id: string; dataUrl: string }[] = [];
      for (const f of accepted) {
        if (!ACCEPT.split(",").includes(f.type)) {
          toast.error(`${f.name}: ${t("connect.ai.import.errType")}`);
          continue;
        }
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name}: ${t("connect.ai.import.errSize")}`);
          continue;
        }
        try {
          const dataUrl = await fileToDataUrl(f);
          valid.push({ file: f, id: newId(), dataUrl });
        } catch {
          toast.error(t("connect.ai.import.errGeneric"));
        }
      }
      if (valid.length === 0) return;

      const newItems: Item[] = valid.map(({ id, dataUrl }) => ({
        id,
        previewUrl: dataUrl,
        originalUrl: dataUrl,
        cropped: false,
        status: "loading",
        draft: null,
        aiDraft: null,
        verified: {},
        history: {},
      }));
      setItems((list) => [...list, ...newItems]);
      setSelectedId((cur) => cur ?? newItems[0].id);
      // Analyze in parallel
      await Promise.all(valid.map(({ id, dataUrl }) => analyzeOne(id, dataUrl)));
    },
    [items.length, analyzeOne, t],
  );

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    if (!selectedId) return;
    const label = fieldLabelFor(key);
    updateItemField(selectedId, key, value, "edit", label);
  }

  function updateItemField<K extends keyof Draft>(
    id: string,
    key: K,
    value: Draft[K],
    source: FieldHistoryEntry["source"] = "edit",
    label?: string,
  ) {
    let prev: Draft[K] | undefined;
    let recordedHistoryEntry: FieldHistoryEntry | null = null;
    setItems((list) =>
      list.map((it) => {
        if (it.id !== id || !it.draft) return it;
        prev = it.draft[key] as Draft[K];
        if (prev === value) return it;
        const isTracked = (HISTORY_FIELDS as readonly string[]).includes(key as string);
        const nextDraft = { ...it.draft, [key]: value };
        let nextHistory = it.history;
        if (isTracked) {
          const arr = it.history?.[key] ?? [];
          const last = arr[arr.length - 1];
          if (!last || last.value !== (value as unknown as string | null)) {
            const actor = actorRef.current;
            const entry: FieldHistoryEntry = {
              ts: Date.now(),
              value: value as unknown as string | null,
              source,
              actorId: actor?.id ?? null,
              actorLabel: actor?.label ?? (source === "ai" ? AI_ACTOR_LABEL : null),
            };
            recordedHistoryEntry = entry;
            nextHistory = { ...it.history, [key]: [...arr, entry] };
          }
        }
        return { ...it, draft: nextDraft, history: nextHistory };
      }),
    );
    if (source === "edit" && prev !== undefined && prev !== value) {
      const entry: UndoEntry = {
        key,
        prev: prev as Draft[keyof Draft],
        next: value as Draft[keyof Draft],
        label: label ?? fieldLabelFor(key),
        historyEntry: recordedHistoryEntry,
      };
      setUndoStacks((s) => ({ ...s, [id]: [...(s[id] ?? []), entry].slice(-50) }));
      setRedoStacks((s) => (s[id]?.length ? { ...s, [id]: [] } : s));
    }
  }

  function fieldLabelFor(key: keyof Draft): string {
    const k = (QUICK_FIX_LABEL_KEY as Record<string, string>)[key as string];
    return k ? t(k as never) : String(key);
  }

  function applyUndoValue(id: string, key: keyof Draft, value: Draft[keyof Draft]) {
    setItems((list) =>
      list.map((it) => {
        if (it.id !== id || !it.draft) return it;
        const isTracked = (HISTORY_FIELDS as readonly string[]).includes(key as string);
        const nextDraft = { ...it.draft, [key]: value };
        const nextHistory = isTracked
          ? pushHistory(
              it.history,
              key,
              value as unknown as string | null,
              "revert",
              actorRef.current,
            )
          : it.history;
        const nextVerified = { ...it.verified };
        delete nextVerified[key as string];
        return {
          ...it,
          draft: nextDraft,
          history: nextHistory,
          verified: nextVerified,
        };
      }),
    );
  }

  // Undo/redo mutate the field history in lock-step with the stacks: undo
  // pops the exact snapshot the edit produced, redo pushes it back with the
  // original ts/source/actor so the History popover, filters, and exports
  // stay consistent.
  function doUndo(id: string | null) {
    if (!id) return;
    const stack = undoStacks[id] ?? [];
    const entry = stack[stack.length - 1];
    if (!entry) {
      toast(t("connect.ai.import.undo.empty"));
      return;
    }
    setItems((list) =>
      list.map((it) => {
        if (it.id !== id || !it.draft) return it;
        const nextDraft = { ...it.draft, [entry.key]: entry.prev };
        let nextHistory = it.history;
        if (entry.historyEntry) {
          const arr = it.history?.[entry.key] ?? [];
          const last = arr[arr.length - 1];
          if (last && last.ts === entry.historyEntry.ts) {
            nextHistory = { ...it.history, [entry.key]: arr.slice(0, -1) };
          }
        }
        return { ...it, draft: nextDraft, history: nextHistory };
      }),
    );
    setUndoStacks((s) => ({ ...s, [id]: stack.slice(0, -1) }));
    setRedoStacks((s) => ({ ...s, [id]: [...(s[id] ?? []), entry] }));
    setLastUndoRedo({
      id,
      key: entry.key,
      label: entry.label,
      current: entry.prev,
      direction: "undo",
      ts: Date.now(),
    });
    toast.success(t("connect.ai.import.undo.undone").replace("{label}", entry.label));
  }

  function doRedo(id: string | null) {
    if (!id) return;
    const stack = redoStacks[id] ?? [];
    const entry = stack[stack.length - 1];
    if (!entry) {
      toast(t("connect.ai.import.undo.redoEmpty"));
      return;
    }
    setItems((list) =>
      list.map((it) => {
        if (it.id !== id || !it.draft) return it;
        const nextDraft = { ...it.draft, [entry.key]: entry.next };
        let nextHistory = it.history;
        if (entry.historyEntry) {
          const arr = it.history?.[entry.key] ?? [];
          const last = arr[arr.length - 1];
          if (!last || last.ts !== entry.historyEntry.ts) {
            nextHistory = {
              ...it.history,
              [entry.key]: [...arr, entry.historyEntry],
            };
          }
        }
        return { ...it, draft: nextDraft, history: nextHistory };
      }),
    );
    setRedoStacks((s) => ({ ...s, [id]: stack.slice(0, -1) }));
    setUndoStacks((s) => ({ ...s, [id]: [...(s[id] ?? []), entry] }));
    setLastUndoRedo({
      id,
      key: entry.key,
      label: entry.label,
      current: entry.next,
      direction: "redo",
      ts: Date.now(),
    });
    toast.success(t("connect.ai.import.undo.redone").replace("{label}", entry.label));
  }

  function exportHistory(id: string, format: "csv" | "pdf") {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const rows: HistoryExportRow[] = HISTORY_FIELDS.map((k) => ({
      fieldKey: k as string,
      fieldLabel: t(`connect.field.${k as string}` as Parameters<typeof t>[0]),
      entries: it.history?.[k] ?? [],
    })).filter((r) => r.entries.length > 0);
    if (rows.length === 0) {
      toast(t("connect.ai.import.exportHistory.empty"));
      return;
    }
    const cardTitle =
      (it.draft?.displayName as string | null) ||
      (it.draft?.companyName as string | null) ||
      `Card ${items.indexOf(it) + 1}`;
    try {
      const meta = { cardTitle, generatedAt: Date.now(), locale: "vi" as const };
      if (format === "csv") exportHistoryCSV(rows, meta);
      else exportHistoryPDF(rows, meta);
      toast.success(t("connect.ai.import.exportHistory.done"));
    } catch (e) {
      console.error("[export history]", e);
      toast.error(t("connect.ai.import.exportHistory.err"));
    }
  }

  function revertItemFieldTo(id: string, key: keyof Draft, ts: number, label: string) {
    const it = items.find((x) => x.id === id);
    const entries = it?.history?.[key];
    const entry = entries?.find((e: any) => e.ts === ts);
    if (!it || !it.draft || !entry) return;
    if (it.draft[key] === entry.value) {
      toast(t("connect.ai.import.fieldHistory.noop").replace("{label}", label));
      return;
    }
    setItems((list) =>
      list.map((row) => {
        if (row.id !== id || !row.draft) return row;
        const nextVerified = { ...row.verified };
        delete nextVerified[key as string];
        return {
          ...row,
          draft: { ...row.draft, [key]: entry.value as Draft[keyof Draft] },
          verified: nextVerified,
          history: pushHistory(row.history, key, entry.value, "revert", actorRef.current),
        };
      }),
    );
    const display =
      entry.value === null || entry.value === ""
        ? t("connect.ai.import.compare.empty")
        : String(entry.value);
    toast.success(
      t("connect.ai.import.fieldHistory.reverted")
        .replace("{label}", label)
        .replace("{value}", display),
    );
  }

  function toggleVerified(id: string, key: string) {
    setItems((list) =>
      list.map((it) =>
        it.id === id ? { ...it, verified: { ...it.verified, [key]: !it.verified?.[key] } } : it,
      ),
    );
  }

  function restoreItemField(id: string, key: keyof Draft, label: string) {
    const it = items.find((x) => x.id === id);
    if (!it || !it.draft || !it.aiDraft) return;
    const aiVal = it.aiDraft[key];
    const curVal = it.draft[key];
    if (aiVal === curVal) {
      toast(t("connect.ai.import.restore.statusFieldNoop").replace("{label}", label));
      return;
    }
    setItems((list) =>
      list.map((row) => {
        if (row.id !== id || !row.draft || !row.aiDraft) return row;
        const nextVerified = { ...row.verified };
        delete nextVerified[key as string];
        const isTracked = (HISTORY_FIELDS as readonly string[]).includes(key as string);
        return {
          ...row,
          draft: { ...row.draft, [key]: row.aiDraft[key] },
          verified: nextVerified,
          history: isTracked
            ? pushHistory(
                row.history,
                key,
                row.aiDraft[key] as unknown as string | null,
                "restore",
                actorRef.current,
              )
            : row.history,
        };
      }),
    );
    const display =
      aiVal === null || aiVal === undefined || aiVal === ""
        ? t("connect.ai.import.compare.empty")
        : String(aiVal);
    toast.success(
      t("connect.ai.import.restore.statusField")
        .replace("{label}", label)
        .replace("{value}", display),
    );
  }

  function restoreItemAll(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it || !it.aiDraft || !it.draft) return;
    const ai = it.aiDraft;
    const cur = it.draft;
    const diffCount = (Object.keys(ai) as (keyof Draft)[]).filter(
      (k) => k !== "confidence" && ai[k] !== cur[k],
    ).length;
    if (diffCount === 0) {
      toast(t("connect.ai.import.restore.statusAllNoop"));
      return;
    }
    setItems((list) =>
      list.map((row) => {
        if (row.id !== id || !row.aiDraft) return row;
        let history = row.history;
        for (const k of HISTORY_FIELDS) {
          history = pushHistory(
            history,
            k,
            (row.aiDraft as Record<string, unknown>)[k as string] as string | null,
            "restore",
            actorRef.current,
          );
        }
        return { ...row, draft: { ...row.aiDraft }, verified: {}, history };
      }),
    );
    toast.success(t("connect.ai.import.restore.statusAll").replace("{n}", String(diffCount)));
  }

  function askRestoreField(id: string, key: keyof Draft, label: string) {
    setRestoreConfirm({ kind: "field", id, key, label });
  }
  function askRestoreAll(id: string) {
    setRestoreConfirm({ kind: "all", id });
  }
  function confirmRestore() {
    const c = restoreConfirm;
    if (!c) return;
    if (c.kind === "field") restoreItemField(c.id, c.key, c.label);
    else restoreItemAll(c.id);
    setRestoreConfirm(null);
  }

  function setAllVerified(id: string, value: boolean) {
    setItems((list) =>
      list.map((it) => {
        if (it.id !== id) return it;
        const map: Record<string, boolean> = {};
        if (value) for (const k of REVIEW_FIELD_KEYS) map[k] = true;
        return { ...it, verified: map };
      }),
    );
  }

  function removeItem(id: string) {
    setItems((list) => list.filter((it) => it.id !== id));
    setSelectedId((cur) => {
      if (cur !== id) return cur;
      const rest = items.filter((it) => it.id !== id);
      return rest[0]?.id ?? null;
    });
    setUndoStacks((s) => {
      const { [id]: _u, ...rest } = s;
      return rest;
    });
    setRedoStacks((s) => {
      const { [id]: _r, ...rest } = s;
      return rest;
    });
  }

  function retry(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setItems((list) =>
      list.map((x: any) => (x.id === id ? { ...x, status: "loading", error: undefined } : x)),
    );
    void analyzeOne(id, it.previewUrl);
  }

  async function handleCropConfirm(croppedDataUrl: string) {
    if (!selected) return;
    const id = selected.id;
    setCropBusy(true);
    try {
      setItems((list) =>
        list.map((x: any) =>
          x.id === id
            ? {
                ...x,
                previewUrl: croppedDataUrl,
                cropped: true,
                status: "loading",
                error: undefined,
                draft: null,
              }
            : x,
        ),
      );
      setAutoPick((m) => ({ ...m, [id]: null }));
      await analyzeOne(id, croppedDataUrl);
      toast.success(t("connect.ai.import.crop.done"));
      setCropOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("connect.ai.import.errGeneric"));
    } finally {
      setCropBusy(false);
    }
  }

  async function restoreOriginal() {
    if (!selected || !selected.cropped) return;
    const id = selected.id;
    const original = selected.originalUrl;
    setItems((list) =>
      list.map((x: any) =>
        x.id === id
          ? {
              ...x,
              previewUrl: original,
              cropped: false,
              status: "loading",
              error: undefined,
              draft: null,
            }
          : x,
      ),
    );
    setAutoPick((m) => ({ ...m, [id]: null }));
    await analyzeOne(id, original);
  }

  async function requestAutoTemplate() {
    if (!selected?.draft) return;
    const id = selected.id;
    setAutoPickLoading(id);
    try {
      const pick = await recommendOptimalTemplate({
        data: {
          imageDataUrl: selected.previewUrl,
          currentTemplateId: selected.draft.templateId,
          industryHint: selected.draft.industryHint,
        },
      });
      setAutoPick((m) => ({ ...m, [id]: pick }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("connect.ai.import.autoTemplateErr"));
    } finally {
      setAutoPickLoading((cur) => (cur === id ? null : cur));
    }
  }

  function confirmAutoTemplate() {
    if (!selected?.draft) return;
    const pick = autoPick[selected.id];
    if (!pick) return;
    update("templateId", pick.templateId);
    setAutoPick((m) => ({ ...m, [selected.id]: null }));
    toast.success(t("connect.ai.import.applied"));
  }

  function dismissAutoTemplate() {
    if (!selected) return;
    setAutoPick((m) => ({ ...m, [selected.id]: null }));
  }

  async function exportPdf() {
    if (!selected?.draft || !previewRef.current) return;
    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const node = previewRef.current;
      const canvas = await html2canvas(node, {
        scale: 4, // hi-res
        backgroundColor: null, // preserve transparency of QR bg mode
        useCORS: true,
        logging: false,
      });
      const pxW = canvas.width;
      const pxH = canvas.height;
      // Fit on A4 landscape with a 12mm margin, preserve aspect ratio.
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = pxW / pxH;
      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      const png = canvas.toDataURL("image/png");
      pdf.addImage(png, "PNG", x, y, drawW, drawH, undefined, "FAST");
      const safeName =
        (selected.draft.displayName || "business-card")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "business-card";
      pdf.save(`${safeName}.pdf`);
      toast.success(t("connect.ai.import.pdfDone"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("connect.ai.import.pdfError"));
    } finally {
      setExportingPdf(false);
    }
  }

  async function persistToHistory(item: Item, draft: Draft) {
    try {
      const thumbnail = await makeThumbnail(item.previewUrl);
      const saved = await saveCardAiHistory({
        data: {
          thumbnail,
          suggestion: draft as unknown as Record<string, unknown>,
          templateId: draft.templateId ?? null,
          qrBackground: draft.qrBackground ?? null,
          applied: true,
        },
      });
      setHistory((h) => [saved, ...h].slice(0, 50));
    } catch (e) {
      // Non-blocking: history is a nice-to-have.
      console.warn("saveCardAiHistory failed", e);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const rows = await listCardAiHistory({ data: undefined });
      setHistory(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("connect.ai.import.history.saveErr"));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function removeHistoryEntry(id: string) {
    try {
      await deleteCardAiHistory({ data: { id } });
      setHistory((h) => h.filter((e: any) => e.id !== id));
      toast.success(t("connect.ai.import.history.removed"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("connect.ai.import.history.saveErr"));
    }
  }

  function reapplyFromHistory(entry: CardAiHistoryEntry) {
    onApply(entry.suggestion as unknown as CardAiSuggestion);
    toast.success(t("connect.ai.import.applied"));
    setHistoryOpen(false);
    onOpenChange(false);
    reset();
  }

  function draftToPreviewState(d: Draft): PreviewState {
    return {
      displayName: d.displayName,
      professionalTitle: d.professionalTitle,
      headline: d.headline,
      companyName: d.companyName,
      bio: null,
      avatarUrl: null,
      website: d.website,
      workEmail: d.workEmail,
      workPhone: d.workPhone,
      themeId: d.templateId,
      slug: "preview",
      showContact: true,
      qrOptions: { background: d.qrBackground },
    };
  }

  async function applyAllReady() {
    const ready = items.filter((it) => it.status === "ready" && it.draft);
    if (ready.length === 0) {
      toast.info(t("connect.ai.import.noReady"));
      return;
    }
    setBatchApplying(true);
    try {
      // Persist each to history so users can reapply any individually later.
      await Promise.allSettled(ready.map((it) => persistToHistory(it, it.draft!)));
      // Apply the currently selected (or first ready) to the builder.
      const primary = ready.find((it) => it.id === selectedId) ?? ready[0];
      onApply(primary.draft!);
      setItems((list) =>
        list.map((it) => (ready.some((r) => r.id === it.id) ? { ...it, status: "applied" } : it)),
      );
      toast.success(t("connect.ai.import.appliedAll").replace("{n}", String(ready.length)));
      onOpenChange(false);
      reset();
    } finally {
      setBatchApplying(false);
    }
  }

  async function exportAllPdf() {
    const ready = items.filter((it) => it.status !== "loading" && it.draft);
    if (ready.length === 0) {
      toast.info(t("connect.ai.import.noReady"));
      return;
    }
    setBatchExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      let pageIdx = 0;
      for (const it of ready) {
        const node = batchRefs.current.get(it.id);
        if (!node) continue;
        // Give the browser a tick so hidden nodes settle before capture.
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const canvas = await html2canvas(node, {
          scale: 4,
          backgroundColor: null,
          useCORS: true,
          logging: false,
        });
        const ratio = canvas.width / canvas.height;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        let drawW = maxW;
        let drawH = drawW / ratio;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH * ratio;
        }
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;
        if (pageIdx > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, drawW, drawH, undefined, "FAST");
        pageIdx += 1;
      }
      if (pageIdx === 0) {
        toast.info(t("connect.ai.import.noReady"));
        return;
      }
      pdf.save(`business-cards-${Date.now()}.pdf`);
      toast.success(t("connect.ai.import.exportAllDone").replace("{n}", String(pageIdx)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("connect.ai.import.pdfError"));
    } finally {
      setBatchExporting(false);
    }
  }

  useEffect(() => {
    if (historyOpen && history.length === 0 && !historyLoading) {
      void loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen]);

  // Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z for undo/redo of latest edit.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      const undoLen = selectedId ? (undoStacks[selectedId] ?? []).length : 0;
      const redoLen = selectedId ? (redoStacks[selectedId] ?? []).length : 0;
      if (e.shiftKey) {
        if (redoLen === 0) return;
        e.preventDefault();
        doRedo(selectedId);
      } else {
        if (undoLen === 0) return;
        e.preventDefault();
        doUndo(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedId, undoStacks, redoStacks]);

  function applySelected(advance: boolean) {
    if (!selected?.draft) return;
    const currentItem = selected;
    const currentDraft = selected.draft;
    onApply(currentDraft);
    toast.success(t("connect.ai.import.applied"));
    void persistToHistory(currentItem, currentDraft);
    // mark applied
    setItems((list) =>
      list.map((it) => (it.id === selected.id ? { ...it, status: "applied" } : it)),
    );
    if (advance) {
      const next = items.find((it) => it.id !== selected.id && it.status === "ready");
      if (next) {
        setSelectedId(next.id);
      } else {
        toast.info(t("connect.ai.import.batchDone"));
        onOpenChange(false);
        reset();
      }
    } else {
      onOpenChange(false);
      reset();
    }
  }

  const previewState: PreviewState | null = useMemo(() => {
    const d = selected?.draft;
    if (!d) return null;
    return {
      displayName: d.displayName,
      professionalTitle: d.professionalTitle,
      headline: d.headline,
      companyName: d.companyName,
      bio: null,
      avatarUrl: null,
      website: d.website,
      workEmail: d.workEmail,
      workPhone: d.workPhone,
      themeId: d.templateId,
      slug: "preview",
      showContact: true,
      qrOptions: { background: d.qrBackground },
    };
  }, [selected]);

  const tpl = selected?.draft ? getTemplate(selected.draft.templateId) : null;
  const readyCount = items.filter((it) => it.status !== "loading").length;
  const hasNextReady =
    items.filter((it) => it.status === "ready" && it.id !== selectedId).length > 0;

  const listItems = useMemo(() => {
    return items.filter((it) => {
      if (!it.draft) return false;
      if (listFilter === "all") return true;
      const lowN = countLowConfFields(
        it.draft.confidence as Record<string, number | undefined>,
        REVIEW_FIELD_KEYS,
        it.verified,
      );
      return listFilter === "needsReview" ? lowN > 0 : lowN === 0;
    });
  }, [items, listFilter]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        // Giữ nguyên state (items + undo/redo stacks) khi đóng modal
        // để user mở lại trong cùng phiên vẫn còn hàng đợi Undo/Redo.
      }}
    >
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {t("connect.ai.import.title")}
          </DialogTitle>
          <DialogDescription>{t("connect.ai.import.desc")}</DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            const fs = Array.from(e.target.files ?? []);
            if (fs.length) void handleFiles(fs);
            e.target.value = "";
          }}
        />

        {items.length === 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-10 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Upload className="size-6" />
            <span className="font-medium">{t("connect.ai.import.uploadMulti")}</span>
            <span className="text-xs">{t("connect.ai.import.uploadMultiHint")}</span>
          </button>
        )}

        {items.length > 0 && (
          <div className="space-y-4">
            {/* Batch strip */}
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("connect.ai.import.batchTitle")
                    .replace("{done}", String(readyCount))
                    .replace("{total}", String(items.length))}
                </Label>
                <div className="flex items-center gap-1.5">
                  <div
                    role="group"
                    aria-label={t("connect.ai.import.viewList")}
                    className="inline-flex rounded-md border border-border p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("detail")}
                      aria-pressed={viewMode === "detail"}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition ${viewMode === "detail" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <LayoutGrid className="size-3.5" />
                      {t("connect.ai.import.viewDetail")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-pressed={viewMode === "list"}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <List className="size-3.5" />
                      {t("connect.ai.import.viewList")}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={items.length >= MAX_FILES}
                  >
                    <Upload className="size-3.5" />
                    {t("connect.ai.import.addMore")}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {items.map((it) => (
                  <ItemThumb
                    key={it.id}
                    item={it}
                    active={it.id === selectedId}
                    onSelect={() => setSelectedId(it.id)}
                    onRemove={() => removeItem(it.id)}
                    onRetry={() => retry(it.id)}
                  />
                ))}
              </div>
            </div>

            {viewMode === "detail" && selected?.status === "loading" && (
              <div
                className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
                role="status"
              >
                <Loader2 className="size-4 animate-spin" />
                {t("connect.ai.import.analyzing")}
              </div>
            )}

            {viewMode === "detail" && selected?.status === "error" && (
              <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  {selected.error ?? t("connect.ai.import.errGeneric")}
                </div>
                <Button size="sm" variant="outline" onClick={() => retry(selected.id)}>
                  {t("connect.ai.import.retry")}
                </Button>
              </div>
            )}

            {viewMode === "detail" &&
              selected?.draft &&
              previewState &&
              selected.status !== "loading" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t("connect.ai.import.compareOriginal")}
                        </Label>
                        <div className="flex items-center gap-1">
                          {selected.cropped && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={restoreOriginal}
                            >
                              <RotateCcw className="size-3.5" />
                              {t("connect.ai.import.crop.reset")}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCropOpen(true)}
                          >
                            <Crop className="size-3.5" />
                            {t("connect.ai.import.crop.button")}
                          </Button>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-lg border border-border bg-muted/20">
                        <img
                          src={selected.previewUrl}
                          alt=""
                          className="max-h-72 w-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("connect.ai.import.compareGenerated")}
                      </Label>
                      <div className="rounded-lg border border-border bg-muted/10 p-3">
                        <div ref={previewRef} className="bg-transparent">
                          <GlobalCardPreview state={previewState} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t("connect.ai.import.editHint")}
                    </p>

                    {(() => {
                      const lowN = countLowConfFields(
                        selected.draft.confidence as Record<string, number | undefined>,
                        REVIEW_FIELD_KEYS,
                        selected.verified,
                      );
                      const allVerified =
                        Object.keys(selected.verified ?? {}).length > 0 &&
                        REVIEW_FIELD_KEYS.every((k) => selected.verified?.[k]);
                      return (
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          {lowN > 0 ? (
                            <div
                              role="status"
                              className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
                            >
                              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" aria-hidden />
                              <span>
                                {t("connect.ai.import.reviewBanner").replace("{n}", String(lowN))}
                              </span>
                            </div>
                          ) : (
                            <div
                              role="status"
                              className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs text-success"
                            >
                              <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
                              <span>{t("connect.ai.import.reviewOk")}</span>
                            </div>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={allVerified ? "ghost" : "outline"}
                            onClick={() => setAllVerified(selected.id, !allVerified)}
                            className="shrink-0"
                          >
                            <ShieldCheck className="size-3.5" />
                            {allVerified
                              ? t("connect.ai.import.verify.clearAll")
                              : t("connect.ai.import.verify.all")}
                          </Button>
                          {(() => {
                            const undoLen = (undoStacks[selected.id] ?? []).length;
                            const redoLen = (redoStacks[selected.id] ?? []).length;
                            return (
                              <div
                                className="inline-flex shrink-0 items-center gap-1"
                                role="group"
                                aria-label={t("connect.ai.import.undo.undo")}
                              >
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => doUndo(selected.id)}
                                  disabled={undoLen === 0}
                                  aria-disabled={undoLen === 0}
                                  title={
                                    undoLen === 0
                                      ? t("connect.ai.import.undo.empty")
                                      : t("connect.ai.import.undo.undoTip")
                                  }
                                  aria-label={
                                    undoLen === 0
                                      ? t("connect.ai.import.undo.empty")
                                      : t("connect.ai.import.undo.undo")
                                  }
                                >
                                  <Undo2 className="size-3.5" />
                                  {t("connect.ai.import.undo.undo")}
                                  {undoLen > 0 ? (
                                    <span
                                      className="ml-1 rounded-full bg-muted px-1.5 text-[10px]"
                                      aria-label={`${undoLen}`}
                                    >
                                      {undoLen}
                                    </span>
                                  ) : null}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => doRedo(selected.id)}
                                  disabled={redoLen === 0}
                                  aria-disabled={redoLen === 0}
                                  title={
                                    redoLen === 0
                                      ? t("connect.ai.import.undo.redoEmpty")
                                      : t("connect.ai.import.undo.redoTip")
                                  }
                                  aria-label={
                                    redoLen === 0
                                      ? t("connect.ai.import.undo.redoEmpty")
                                      : t("connect.ai.import.undo.redo")
                                  }
                                >
                                  <Redo2 className="size-3.5" />
                                  {t("connect.ai.import.undo.redo")}
                                  {redoLen > 0 ? (
                                    <span
                                      className="ml-1 rounded-full bg-muted px-1.5 text-[10px]"
                                      aria-label={`${redoLen}`}
                                    >
                                      {redoLen}
                                    </span>
                                  ) : null}
                                </Button>
                              </div>
                            );
                          })()}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                disabled={
                                  !HISTORY_FIELDS.some(
                                    (k) => (selected.history?.[k]?.length ?? 0) > 0,
                                  )
                                }
                                title={t("connect.ai.import.exportHistory.menu")}
                              >
                                <FileDown className="size-3.5" />
                                {t("connect.ai.import.exportHistory.menu")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-52 p-1">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => exportHistory(selected.id, "csv")}
                              >
                                <FileDown className="size-3.5" />
                                {t("connect.ai.import.exportHistory.csv")}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => exportHistory(selected.id, "pdf")}
                              >
                                <FileDown className="size-3.5" />
                                {t("connect.ai.import.exportHistory.pdf")}
                              </button>
                            </PopoverContent>
                          </Popover>
                          {selected.aiDraft ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => askRestoreAll(selected.id)}
                              className="shrink-0"
                            >
                              <RotateCcw className="size-3.5" />
                              {t("connect.ai.import.restore.all")}
                            </Button>
                          ) : null}
                        </div>
                      );
                    })()}

                    {lastUndoRedo && lastUndoRedo.id === selected.id
                      ? (() => {
                          const key = lastUndoRedo.key;
                          const aiRaw = selected.aiDraft
                            ? (selected.aiDraft as Record<string, unknown>)[key as string]
                            : null;
                          const curRaw = lastUndoRedo.current as unknown;
                          const fmt = (v: unknown): string => {
                            if (v == null || v === "") return "—";
                            if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
                            if (typeof v === "object") return JSON.stringify(v);
                            return String(v);
                          };
                          const aiStr = fmt(aiRaw);
                          const curStr = fmt(curRaw);
                          const same = aiStr === curStr;
                          return (
                            <div
                              className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs"
                              role="status"
                              aria-live="polite"
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-medium">
                                  {lastUndoRedo.direction === "undo" ? (
                                    <Undo2 className="size-3.5" />
                                  ) : (
                                    <Redo2 className="size-3.5" />
                                  )}
                                  <span>
                                    {t(
                                      lastUndoRedo.direction === "undo"
                                        ? "connect.ai.import.undo.compare.afterUndo"
                                        : "connect.ai.import.undo.compare.afterRedo",
                                    ).replace("{label}", lastUndoRedo.label)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {selected.aiDraft && !same ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        updateItemField(
                                          selected.id,
                                          key,
                                          aiRaw as Draft[keyof Draft],
                                          "restore",
                                          lastUndoRedo.label,
                                        );
                                        setLastUndoRedo(null);
                                      }}
                                    >
                                      <RotateCcw className="size-3" />
                                      {t("connect.ai.import.undo.compare.applyAi")}
                                    </Button>
                                  ) : null}
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setLastUndoRedo(null)}
                                    aria-label={t("connect.ai.import.undo.compare.dismiss")}
                                  >
                                    {t("connect.ai.import.undo.compare.dismiss")}
                                  </Button>
                                </div>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded border bg-background p-2">
                                  <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                    {t("connect.ai.import.undo.compare.ai")}
                                  </div>
                                  <div className="break-words">{aiStr}</div>
                                </div>
                                <div
                                  className={`rounded border p-2 ${same ? "bg-background" : "bg-warning/30 border-warning/60"}`}
                                >
                                  <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                    {t("connect.ai.import.undo.compare.current")}
                                  </div>
                                  <div className="break-words">{curStr}</div>
                                </div>
                              </div>
                              {same ? (
                                <div className="mt-2 text-[11px] text-muted-foreground">
                                  {t("connect.ai.import.undo.compare.same")}
                                </div>
                              ) : null}
                            </div>
                          );
                        })()
                      : null}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <EditField
                        label={t("connect.field.displayName")}
                        confidence={selected.draft.confidence.displayName}
                        value={selected.draft.displayName}
                        onChange={(v) => update("displayName", v)}
                        verified={!!selected.verified?.displayName}
                        onToggleVerified={() => toggleVerified(selected.id, "displayName")}
                        aiValue={selected.aiDraft?.displayName ?? null}
                        onRestore={() =>
                          askRestoreField(
                            selected.id,
                            "displayName",
                            t("connect.field.displayName"),
                          )
                        }
                        history={selected.history?.displayName}
                        onRevertTo={(ts) =>
                          revertItemFieldTo(
                            selected.id,
                            "displayName",
                            ts,
                            t("connect.field.displayName"),
                          )
                        }
                      />
                      <EditField
                        label={t("connect.field.professionalTitle")}
                        confidence={selected.draft.confidence.professionalTitle}
                        value={selected.draft.professionalTitle}
                        onChange={(v) => update("professionalTitle", v)}
                        verified={!!selected.verified?.professionalTitle}
                        onToggleVerified={() => toggleVerified(selected.id, "professionalTitle")}
                        aiValue={selected.aiDraft?.professionalTitle ?? null}
                        onRestore={() =>
                          askRestoreField(
                            selected.id,
                            "professionalTitle",
                            t("connect.field.professionalTitle"),
                          )
                        }
                        history={selected.history?.professionalTitle}
                        onRevertTo={(ts) =>
                          revertItemFieldTo(
                            selected.id,
                            "professionalTitle",
                            ts,
                            t("connect.field.professionalTitle"),
                          )
                        }
                      />
                      <EditField
                        label={t("connect.field.companyName")}
                        confidence={selected.draft.confidence.companyName}
                        value={selected.draft.companyName}
                        onChange={(v) => update("companyName", v)}
                        verified={!!selected.verified?.companyName}
                        onToggleVerified={() => toggleVerified(selected.id, "companyName")}
                        aiValue={selected.aiDraft?.companyName ?? null}
                        onRestore={() =>
                          askRestoreField(
                            selected.id,
                            "companyName",
                            t("connect.field.companyName"),
                          )
                        }
                        history={selected.history?.companyName}
                        onRevertTo={(ts) =>
                          revertItemFieldTo(
                            selected.id,
                            "companyName",
                            ts,
                            t("connect.field.companyName"),
                          )
                        }
                      />
                      <EditField
                        label={t("connect.field.headline")}
                        confidence={selected.draft.confidence.headline}
                        value={selected.draft.headline}
                        onChange={(v) => update("headline", v)}
                        verified={!!selected.verified?.headline}
                        onToggleVerified={() => toggleVerified(selected.id, "headline")}
                        aiValue={selected.aiDraft?.headline ?? null}
                        onRestore={() =>
                          askRestoreField(selected.id, "headline", t("connect.field.headline"))
                        }
                        history={selected.history?.headline}
                        onRevertTo={(ts) =>
                          revertItemFieldTo(
                            selected.id,
                            "headline",
                            ts,
                            t("connect.field.headline"),
                          )
                        }
                      />
                      <EditField
                        label={t("connect.field.workEmail")}
                        confidence={selected.draft.confidence.workEmail}
                        value={selected.draft.workEmail}
                        onChange={(v) => update("workEmail", v)}
                        type="email"
                        verified={!!selected.verified?.workEmail}
                        onToggleVerified={() => toggleVerified(selected.id, "workEmail")}
                        aiValue={selected.aiDraft?.workEmail ?? null}
                        onRestore={() =>
                          askRestoreField(selected.id, "workEmail", t("connect.field.workEmail"))
                        }
                        history={selected.history?.workEmail}
                        onRevertTo={(ts) =>
                          revertItemFieldTo(
                            selected.id,
                            "workEmail",
                            ts,
                            t("connect.field.workEmail"),
                          )
                        }
                      />
                      <EditField
                        label={t("connect.field.workPhone")}
                        confidence={selected.draft.confidence.workPhone}
                        value={selected.draft.workPhone}
                        onChange={(v) => update("workPhone", v)}
                        verified={!!selected.verified?.workPhone}
                        onToggleVerified={() => toggleVerified(selected.id, "workPhone")}
                        aiValue={selected.aiDraft?.workPhone ?? null}
                        onRestore={() =>
                          askRestoreField(selected.id, "workPhone", t("connect.field.workPhone"))
                        }
                        history={selected.history?.workPhone}
                        onRevertTo={(ts) =>
                          revertItemFieldTo(
                            selected.id,
                            "workPhone",
                            ts,
                            t("connect.field.workPhone"),
                          )
                        }
                      />
                      <EditField
                        label={t("connect.field.website")}
                        confidence={selected.draft.confidence.website}
                        value={selected.draft.website}
                        onChange={(v) => update("website", v)}
                        verified={!!selected.verified?.website}
                        onToggleVerified={() => toggleVerified(selected.id, "website")}
                        aiValue={selected.aiDraft?.website ?? null}
                        onRestore={() =>
                          askRestoreField(selected.id, "website", t("connect.field.website"))
                        }
                        history={selected.history?.website}
                        onRevertTo={(ts) =>
                          revertItemFieldTo(selected.id, "website", ts, t("connect.field.website"))
                        }
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">
                            {t("connect.ai.import.template")}
                          </Label>
                          <ConfidenceBadge value={selected.draft.confidence.templateId} />
                        </div>
                        <div className="flex items-center gap-2 rounded-md border p-2">
                          <div
                            className="h-8 w-12 rounded border shrink-0"
                            style={{
                              background: tpl?.surface ?? "hsl(var(--muted))",
                            }}
                            aria-hidden
                          />
                          <span className="flex-1 truncate text-sm">
                            {tpl?.label ?? selected.draft.templateId}
                          </span>
                          <CardTemplateGallery
                            currentId={selected.draft.templateId}
                            onSelect={(id) => update("templateId", id)}
                            trigger={
                              <Button variant="outline" size="sm" type="button">
                                {t("connect.template.change")}
                              </Button>
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">
                            {t("connect.qr.background")}
                          </Label>
                          <ConfidenceBadge value={selected.draft.confidence.qrBackground} />
                        </div>
                        <Select
                          value={selected.draft.qrBackground}
                          onValueChange={(v) => update("qrBackground", v as Draft["qrBackground"])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="white">{t("connect.qr.bg.white")}</SelectItem>
                            <SelectItem value="template">{t("connect.qr.bg.template")}</SelectItem>
                            <SelectItem value="transparent">
                              {t("connect.qr.bg.transparent")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* AI auto-template picker */}
                    {(() => {
                      const pick = autoPick[selected.id];
                      const loading = autoPickLoading === selected.id;
                      if (loading) {
                        return (
                          <div
                            className="flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-sm text-muted-foreground"
                            role="status"
                          >
                            <Loader2 className="size-4 animate-spin" />
                            {t("connect.ai.import.autoTemplateWorking")}
                          </div>
                        );
                      }
                      if (pick) {
                        const suggested = getTemplate(pick.templateId);
                        return (
                          <div className="space-y-3 rounded-md border border-primary/40 bg-primary/5 p-3">
                            <div className="flex items-start gap-3">
                              <div
                                className="h-10 w-14 shrink-0 rounded border"
                                style={{ background: suggested?.surface ?? "hsl(var(--muted))" }}
                                aria-hidden
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs uppercase tracking-wide text-primary">
                                    {t("connect.ai.import.autoTemplateSuggest")}
                                  </span>
                                  <span className="font-medium">
                                    {suggested?.label ?? pick.templateId}
                                  </span>
                                  <ConfidenceBadge value={pick.confidence} />
                                </div>
                                {pick.rationale && (
                                  <p className="text-xs text-muted-foreground">{pick.rationale}</p>
                                )}
                                {pick.alternates.length > 0 && (
                                  <div className="pt-1">
                                    <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                      {t("connect.ai.import.autoTemplateAlt")}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {pick.alternates.map((a: any) => {
                                        const at = getTemplate(a.templateId);
                                        return (
                                          <button
                                            key={a.templateId}
                                            type="button"
                                            onClick={() => {
                                              update("templateId", a.templateId);
                                              dismissAutoTemplate();
                                            }}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] hover:border-primary"
                                            title={a.reason}
                                          >
                                            <span
                                              className="h-2.5 w-2.5 rounded-sm"
                                              style={{
                                                background: at?.surface ?? "hsl(var(--muted))",
                                              }}
                                              aria-hidden
                                            />
                                            {at?.label ?? a.templateId}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={dismissAutoTemplate}>
                                {t("connect.ai.import.autoTemplateKeep")}
                              </Button>
                              <Button size="sm" onClick={confirmAutoTemplate}>
                                <Check className="size-3.5" />
                                {t("connect.ai.import.autoTemplateConfirm")}
                              </Button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={requestAutoTemplate}
                          className="flex w-full items-start gap-3 rounded-md border border-dashed border-border bg-muted/20 p-3 text-left text-sm transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Wand2 className="mt-0.5 size-4 text-primary" />
                          <span className="flex-1">
                            <span className="block font-medium">
                              {t("connect.ai.import.autoTemplate")}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {t("connect.ai.import.autoTemplateHint")}
                            </span>
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </>
              )}

            {viewMode === "list" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    role="group"
                    aria-label={t("connect.ai.import.filterLabel")}
                    className="inline-flex rounded-md border border-border p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => setListFilter("all")}
                      aria-pressed={listFilter === "all"}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                        listFilter === "all"
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t("connect.ai.import.filterAll")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setListFilter("needsReview")}
                      aria-pressed={listFilter === "needsReview"}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                        listFilter === "needsReview"
                          ? "bg-warning/15 text-warning"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <AlertTriangle className="size-3" aria-hidden />
                      {t("connect.ai.import.filterNeedsReview")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setListFilter("ok")}
                      aria-pressed={listFilter === "ok"}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                        listFilter === "ok"
                          ? "bg-success/15 text-success"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ShieldCheck className="size-3" aria-hidden />
                      {t("connect.ai.import.filterOk")}
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("connect.ai.import.filterResults").replace("{n}", String(listItems.length))}
                  </span>
                </div>

                {listItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    {listFilter === "all"
                      ? t("connect.ai.import.listEmpty")
                      : t("connect.ai.import.filterEmpty")}
                  </div>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {listItems.map((it) => {
                      const d = it.draft!;
                      const tp = getTemplate(d.templateId);
                      return (
                        <li
                          key={it.id}
                          className={`flex gap-3 rounded-lg border bg-card p-3 transition ${
                            it.id === selectedId
                              ? "border-primary ring-1 ring-primary/40"
                              : "border-border"
                          }`}
                        >
                          <img
                            src={it.previewUrl}
                            alt=""
                            className="h-24 w-32 shrink-0 rounded-md border object-cover"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="truncate text-sm font-medium">
                              {d.displayName || t("connect.field.displayName")}
                            </div>
                            {d.professionalTitle && (
                              <div className="truncate text-xs text-muted-foreground">
                                {d.professionalTitle}
                              </div>
                            )}
                            {d.companyName && (
                              <div className="truncate text-xs text-muted-foreground">
                                {d.companyName}
                              </div>
                            )}
                            {d.workEmail && (
                              <div className="truncate text-xs text-muted-foreground">
                                {d.workEmail}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {tp && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[10px]">
                                  <span
                                    className="h-2.5 w-2.5 rounded-sm"
                                    style={{ background: tp.surface }}
                                    aria-hidden
                                  />
                                  {tp.label}
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                                  it.status === "applied"
                                    ? "bg-primary/15 text-primary"
                                    : it.status === "ready"
                                      ? "bg-success/15 text-success"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {it.status === "applied"
                                  ? t("connect.ai.import.itemApplied")
                                  : it.status === "ready"
                                    ? t("connect.ai.import.itemReady")
                                    : t("connect.ai.import.itemLoading")}
                              </span>
                              {(() => {
                                const lowN = countLowConfFields(
                                  d.confidence as Record<string, number | undefined>,
                                  REVIEW_FIELD_KEYS,
                                  it.verified,
                                );
                                return lowN > 0 ? (
                                  <QuickFixPopover
                                    draft={d}
                                    aiDraft={it.aiDraft}
                                    lowN={lowN}
                                    verified={it.verified}
                                    onPatch={(k, v) => updateItemField(it.id, k, v)}
                                    onToggleVerified={(k) => toggleVerified(it.id, k)}
                                    onRestoreField={(k) =>
                                      askRestoreField(
                                        it.id,
                                        k,
                                        t(
                                          QUICK_FIX_LABEL_KEY[
                                            k as keyof typeof QUICK_FIX_LABEL_KEY
                                          ] as never,
                                        ),
                                      )
                                    }
                                  />
                                ) : null;
                              })()}
                              {(() => {
                                const allVerified =
                                  Object.keys(it.verified ?? {}).length > 0 &&
                                  REVIEW_FIELD_KEYS.every((k) => it.verified?.[k]);
                                return allVerified ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
                                    <ShieldCheck className="size-2.5" aria-hidden />
                                    {t("connect.ai.import.verify.badgeAll")}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <div className="flex flex-wrap justify-end gap-1 pt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const allVerified =
                                    Object.keys(it.verified ?? {}).length > 0 &&
                                    REVIEW_FIELD_KEYS.every((k) => it.verified?.[k]);
                                  setAllVerified(it.id, !allVerified);
                                }}
                                aria-label={t("connect.ai.import.verify.all")}
                                title={t("connect.ai.import.verify.all")}
                              >
                                <ShieldCheck className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItem(it.id)}
                                aria-label={t("connect.ai.import.remove")}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedId(it.id);
                                  setViewMode("detail");
                                }}
                              >
                                {t("connect.ai.import.viewDetail")}
                              </Button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {items.some((it) => it.draft) && <LowConfSummary items={items} />}

        {/* Offscreen preview container for batch PDF export */}
        <div aria-hidden className="pointer-events-none fixed left-[-99999px] top-0">
          {items
            .filter((it) => it.draft)
            .map((it) => (
              <div
                key={it.id}
                ref={(el) => {
                  if (el) batchRefs.current.set(it.id, el);
                  else batchRefs.current.delete(it.id);
                }}
                style={{ width: 420 }}
              >
                <GlobalCardPreview state={draftToPreviewState(it.draft!)} />
              </div>
            ))}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <Button variant="ghost" className="mr-auto" onClick={() => setHistoryOpen(true)}>
            <Clock className="size-4" />
            {t("connect.ai.import.history.open")}
            {history.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {history.length}
              </span>
            )}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          {items.filter((it) => it.status === "ready").length >= 2 && (
            <>
              <Button
                variant="outline"
                onClick={exportAllPdf}
                disabled={batchExporting || batchApplying}
              >
                {batchExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}
                {batchExporting
                  ? t("connect.ai.import.exportAllWorking")
                  : t("connect.ai.import.exportAllPdf")}
              </Button>
              <Button onClick={applyAllReady} disabled={batchApplying || batchExporting}>
                {batchApplying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {batchApplying
                  ? t("connect.ai.import.applyingAll")
                  : t("connect.ai.import.applyAll")}
              </Button>
            </>
          )}
          {viewMode === "detail" && selected?.draft && selected.status !== "loading" && (
            <>
              <Button variant="outline" onClick={exportPdf} disabled={exportingPdf}>
                {exportingPdf ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}
                {exportingPdf
                  ? t("connect.ai.import.exportPdfWorking")
                  : t("connect.ai.import.exportPdf")}
              </Button>
              <Button variant="outline" onClick={() => applySelected(false)}>
                <Sparkles className="size-4" />
                {t("connect.ai.import.applyThis")}
              </Button>
              {hasNextReady && (
                <Button onClick={() => applySelected(true)}>
                  {t("connect.ai.import.applyAndNext")}
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
      <ImageCropperDialog
        open={cropOpen}
        onOpenChange={(o) => {
          if (!cropBusy) setCropOpen(o);
        }}
        imageUrl={selected?.originalUrl ?? null}
        onConfirm={handleCropConfirm}
        busy={cropBusy}
      />
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        loading={historyLoading}
        entries={history}
        onReapply={reapplyFromHistory}
        onRemove={removeHistoryEntry}
      />
      <AlertDialog open={!!restoreConfirm} onOpenChange={(o) => !o && setRestoreConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {restoreConfirm?.kind === "all"
                ? t("connect.ai.import.restore.confirmAllTitle")
                : t("connect.ai.import.restore.confirmFieldTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {restoreConfirm?.kind === "all"
                ? t("connect.ai.import.restore.confirmAllDesc")
                : t("connect.ai.import.restore.confirmFieldDesc").replace(
                    "{label}",
                    restoreConfirm?.kind === "field" ? restoreConfirm.label : "",
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("connect.ai.import.restore.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              {t("connect.ai.import.restore.confirmCta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function ItemThumb({
  item,
  active,
  onSelect,
  onRemove,
  onRetry,
}: {
  item: Item;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const t = useT();
  const badge =
    item.status === "loading"
      ? {
          cls: "bg-muted text-muted-foreground",
          label: t("connect.ai.import.itemLoading"),
          icon: <Loader2 className="size-3 animate-spin" />,
        }
      : item.status === "ready"
        ? {
            cls: "bg-success/15 text-success",
            label: t("connect.ai.import.itemReady"),
            icon: <Check className="size-3" />,
          }
        : item.status === "applied"
          ? {
              cls: "bg-primary/15 text-primary",
              label: t("connect.ai.import.itemApplied"),
              icon: <Check className="size-3" />,
            }
          : {
              cls: "bg-destructive/15 text-destructive",
              label: t("connect.ai.import.itemError"),
              icon: <AlertCircle className="size-3" />,
            };

  return (
    <div
      className={`group relative shrink-0 rounded-md border transition ${
        active ? "border-primary ring-2 ring-primary/40" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block h-20 w-28 overflow-hidden rounded-md focus-visible:outline-none"
      >
        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
      </button>
      <span
        className={`absolute left-1 top-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge.cls}`}
      >
        {badge.icon}
        <span className="hidden sm:inline">{badge.label}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("connect.ai.import.remove")}
        className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-foreground opacity-0 shadow transition hover:bg-background group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
      {item.status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="absolute inset-x-1 bottom-1 rounded bg-background/90 py-0.5 text-[10px] font-medium text-foreground shadow hover:bg-background"
        >
          {t("connect.ai.import.retry")}
        </button>
      )}
    </div>
  );
}

const LOW_CONF_THRESHOLD = 0.6;

function isLowConf(v: number | undefined): boolean {
  return typeof v === "number" && v < LOW_CONF_THRESHOLD;
}

function countLowConfFields(
  conf: Record<string, number | undefined> | undefined,
  keys: readonly string[],
  verified?: Record<string, boolean>,
): number {
  if (!conf) return 0;
  let n = 0;
  for (const k of keys) if (isLowConf(conf[k]) && !verified?.[k]) n += 1;
  return n;
}

const REVIEW_FIELD_KEYS = [
  "displayName",
  "professionalTitle",
  "companyName",
  "headline",
  "workEmail",
  "workPhone",
  "website",
  "templateId",
  "qrBackground",
] as const;

function EditField({
  label,
  value,
  onChange,
  type = "text",
  confidence,
  verified,
  onToggleVerified,
  aiValue,
  onRestore,
  history,
  onRevertTo,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  type?: string;
  confidence?: number;
  verified?: boolean;
  onToggleVerified?: () => void;
  aiValue?: string | null;
  onRestore?: () => void;
  history?: FieldHistoryEntry[];
  onRevertTo?: (ts: number) => void;
}) {
  const t = useT();
  const rawLow = isLowConf(confidence);
  const low = rawLow && !verified;
  const showVerifyToggle = rawLow || verified;
  const canRestore = !!onRestore && aiValue !== undefined && (aiValue ?? null) !== (value ?? null);
  const historyEntries = history ?? [];
  const hasHistory = historyEntries.length > 1;
  const [historySourceFilter, setHistorySourceFilter] = useState<
    FieldHistoryEntry["source"] | "all"
  >("all");
  const filterOptions: Array<{
    key: FieldHistoryEntry["source"] | "all";
    label: string;
  }> = [
    { key: "all", label: t("connect.ai.import.fieldHistory.filter.all") },
    { key: "ai", label: t("connect.ai.import.fieldHistory.source.ai") },
    { key: "edit", label: t("connect.ai.import.fieldHistory.source.edit") },
    { key: "restore", label: t("connect.ai.import.fieldHistory.source.restore") },
    { key: "revert", label: t("connect.ai.import.fieldHistory.source.revert") },
  ];
  const filteredEntries =
    historySourceFilter === "all"
      ? historyEntries
      : historyEntries.filter((e: any) => e.source === historySourceFilter);
  const currentTs = historyEntries[historyEntries.length - 1]?.ts;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <ConfidenceBadge value={confidence} />
        {low && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-warning"
            title={t("connect.ai.import.fieldNeedsReview")}
          >
            <AlertTriangle className="size-3" aria-hidden />
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {hasHistory && onRevertTo && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  title={t("connect.ai.import.fieldHistory.title")}
                  aria-label={t("connect.ai.import.fieldHistory.title")}
                >
                  <Clock className="size-2.5" aria-hidden />
                  {t("connect.ai.import.fieldHistory.button")} ({historyEntries.length})
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-2">
                <div className="mb-1 px-1">
                  <div className="text-xs font-semibold">
                    {t("connect.ai.import.fieldHistory.title")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {t("connect.ai.import.fieldHistory.hint")}
                  </div>
                </div>
                <div
                  role="group"
                  aria-label={t("connect.ai.import.fieldHistory.filter.label")}
                  className="mb-1.5 flex flex-wrap gap-1 px-1"
                >
                  {filterOptions.map((opt) => {
                    const active = historySourceFilter === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setHistorySourceFilter(opt.key)}
                        aria-pressed={active}
                        className={`rounded-full border px-1.5 py-0.5 text-[10px] transition ${
                          active
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <ul className="max-h-64 space-y-1 overflow-y-auto">
                  {filteredEntries.length === 0 && (
                    <li className="px-1 py-2 text-[11px] text-muted-foreground">
                      {t("connect.ai.import.fieldHistory.filter.empty")}
                    </li>
                  )}
                  {[...filteredEntries].reverse().map((entry) => {
                    const isCurrent = entry.ts === currentTs;
                    const display =
                      entry.value === null || entry.value === ""
                        ? t("connect.ai.import.compare.empty")
                        : String(entry.value);
                    const sourceKey =
                      entry.source === "ai"
                        ? "connect.ai.import.fieldHistory.source.ai"
                        : entry.source === "restore"
                          ? "connect.ai.import.fieldHistory.source.restore"
                          : entry.source === "revert"
                            ? "connect.ai.import.fieldHistory.source.revert"
                            : "connect.ai.import.fieldHistory.source.edit";
                    return (
                      <li key={entry.ts}>
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => onRevertTo(entry.ts)}
                          className={`flex w-full flex-col gap-0.5 rounded border px-2 py-1.5 text-left text-[11px] transition ${
                            isCurrent
                              ? "border-success/40 bg-success/10 text-success cursor-default"
                              : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">
                              {isCurrent
                                ? t("connect.ai.import.fieldHistory.current")
                                : t(sourceKey as never)}
                            </span>
                            <span
                              className="text-[10px] text-muted-foreground"
                              title={new Date(entry.ts).toLocaleString()}
                            >
                              {new Date(entry.ts).toLocaleString([], {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                            <span
                              className="truncate"
                              title={
                                entry.actorLabel ??
                                t("connect.ai.import.fieldHistory.actor.unknown")
                              }
                            >
                              {t("connect.ai.import.fieldHistory.actor.by")}:{" "}
                              {entry.actorLabel ??
                                t("connect.ai.import.fieldHistory.actor.unknown")}
                            </span>
                          </div>
                          <div className="truncate text-muted-foreground">{display}</div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          )}
          {canRestore && (
            <button
              type="button"
              onClick={onRestore}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              title={
                (aiValue ?? "").trim() === ""
                  ? t("connect.ai.import.restore.fieldEmpty")
                  : `${t("connect.ai.import.restore.field")}: ${aiValue}`
              }
            >
              <RotateCcw className="size-2.5" aria-hidden />
              {t("connect.ai.import.restore.field")}
            </button>
          )}
          {showVerifyToggle && onToggleVerified && (
            <button
              type="button"
              onClick={onToggleVerified}
              aria-pressed={!!verified}
              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40 ${
                verified
                  ? "border-success/40 bg-success/15 text-success"
                  : "border-border bg-background text-muted-foreground hover:border-success/40 hover:text-success dark:hover:text-success"
              }`}
              title={
                verified
                  ? t("connect.ai.import.verify.fieldOn")
                  : t("connect.ai.import.verify.field")
              }
            >
              <Check className="size-2.5" aria-hidden />
              {verified
                ? t("connect.ai.import.verify.fieldOn")
                : t("connect.ai.import.verify.field")}
            </button>
          )}
        </div>
      </div>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v.trim() === "" ? null : v);
        }}
        aria-invalid={low || undefined}
        className={low ? "border-warning/60 focus-visible:ring-warning/40 bg-warning/5" : undefined}
      />
      {low && <p className="text-[10px] text-warning">{t("connect.ai.import.fieldNeedsReview")}</p>}
    </div>
  );
}

const QUICK_FIX_KEYS = [
  "displayName",
  "professionalTitle",
  "companyName",
  "headline",
  "workEmail",
  "workPhone",
  "website",
] as const satisfies readonly (keyof Draft)[];

const QUICK_FIX_LABEL_KEY: Record<(typeof QUICK_FIX_KEYS)[number], string> = {
  displayName: "connect.field.displayName",
  professionalTitle: "connect.field.professionalTitle",
  companyName: "connect.field.companyName",
  headline: "connect.field.headline",
  workEmail: "connect.field.workEmail",
  workPhone: "connect.field.workPhone",
  website: "connect.field.website",
};

function QuickFixPopover({
  draft,
  aiDraft,
  lowN,
  onPatch,
  verified,
  onToggleVerified,
  onRestoreField,
}: {
  draft: Draft;
  aiDraft?: Draft | null;
  lowN: number;
  onPatch: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  verified?: Record<string, boolean>;
  onToggleVerified?: (key: string) => void;
  onRestoreField?: (key: keyof Draft) => void;
}) {
  const t = useT();
  const [showDiff, setShowDiff] = useState(true);
  const conf = draft.confidence as Record<string, number | undefined>;
  const lowKeys = QUICK_FIX_KEYS.filter((k) => isLowConf(conf[k]) && !verified?.[k]);
  const hasSkipped =
    (isLowConf(conf.templateId) && !verified?.templateId) ||
    (isLowConf(conf.qrBackground) && !verified?.qrBackground);

  const fmt = (v: unknown) => {
    if (v === null || v === undefined || v === "") return t("connect.ai.import.compare.empty");
    return String(v);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/40 dark:text-warning"
          aria-label={t("connect.ai.import.quickFix.open")}
          title={t("connect.ai.import.reviewBanner").replace("{n}", String(lowN))}
        >
          <AlertTriangle className="size-2.5" aria-hidden />
          {t("connect.ai.import.reviewBadge").replace("{n}", String(lowN))}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold">{t("connect.ai.import.quickFix.title")}</p>
            <p className="text-[11px] text-muted-foreground">
              {t("connect.ai.import.quickFix.hint")}
            </p>
          </div>
          {aiDraft ? (
            <button
              type="button"
              onClick={() => setShowDiff((v) => !v)}
              className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-pressed={showDiff}
            >
              {showDiff
                ? t("connect.ai.import.compare.toggleOff")
                : t("connect.ai.import.compare.toggleOn")}
            </button>
          ) : null}
        </div>
        {lowKeys.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/30 p-2 text-center text-[11px] text-muted-foreground">
            {t("connect.ai.import.quickFix.none")}
          </p>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-auto pr-1">
            {lowKeys.map((k) => {
              const aiVal = aiDraft ? (aiDraft[k] as unknown) : undefined;
              const curVal = draft[k] as unknown;
              const differs = aiDraft ? aiVal !== curVal : false;
              return (
                <div key={k} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-[11px] text-muted-foreground">
                      {t(QUICK_FIX_LABEL_KEY[k] as never)}
                    </Label>
                    <div className="flex items-center gap-1">
                      <ConfidenceBadge value={conf[k]} />
                      {onRestoreField && aiDraft && differs && (
                        <button
                          type="button"
                          onClick={() => onRestoreField(k)}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          title={t("connect.ai.import.restore.field")}
                        >
                          <RotateCcw className="size-2.5" aria-hidden />
                          {t("connect.ai.import.restore.field")}
                        </button>
                      )}
                      {onToggleVerified && (
                        <button
                          type="button"
                          onClick={() => onToggleVerified(k)}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-success/40 hover:text-success dark:hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40"
                          title={t("connect.ai.import.verify.field")}
                        >
                          <Check className="size-2.5" aria-hidden />
                          {t("connect.ai.import.verify.field")}
                        </button>
                      )}
                    </div>
                  </div>
                  {showDiff && aiDraft ? (
                    <div className="grid grid-cols-2 gap-1 rounded-md border border-border/60 bg-muted/30 p-1.5 text-[10px]">
                      <div className="space-y-0.5">
                        <div className="font-medium uppercase tracking-wide text-muted-foreground">
                          {t("connect.ai.import.compare.ai")}
                        </div>
                        <div className="break-words text-foreground/80">{fmt(aiVal)}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-medium uppercase tracking-wide text-muted-foreground">
                          {t("connect.ai.import.compare.now")}
                        </div>
                        <div
                          className={`break-words ${differs ? "text-warning font-medium" : "text-foreground/80"}`}
                        >
                          {fmt(curVal)}
                        </div>
                      </div>
                      {!differs && (
                        <div className="col-span-2 text-[10px] text-success">
                          {t("connect.ai.import.compare.same")}
                        </div>
                      )}
                    </div>
                  ) : null}
                  <Input
                    autoFocus={k === lowKeys[0]}
                    type={k === "workEmail" ? "email" : "text"}
                    value={(draft[k] as string | null) ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      onPatch(k, (v.trim() === "" ? null : v) as Draft[typeof k]);
                    }}
                    className="h-8 text-xs"
                    aria-invalid
                  />
                </div>
              );
            })}
          </div>
        )}
        {hasSkipped && (
          <p className="text-[10px] text-muted-foreground">
            {t("connect.ai.import.quickFix.skipped")}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ConfidenceBadge({ value }: { value: number | undefined }) {
  const t = useT();
  if (value === undefined) return null;
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.8
      ? {
          cls: "bg-success/15 text-success border-success/30",
          key: "connect.ai.import.conf.high" as const,
          Icon: Check,
        }
      : value >= LOW_CONF_THRESHOLD
        ? {
            cls: "bg-warning/15 text-warning border-warning/30",
            key: "connect.ai.import.conf.med" as const,
            Icon: AlertCircle,
          }
        : {
            cls: "bg-destructive/15 text-destructive border-destructive/30",
            key: "connect.ai.import.conf.low" as const,
            Icon: AlertTriangle,
          };
  const Icon = tone.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${tone.cls}`}
      title={`${t(tone.key)} · ${pct}%`}
      aria-label={`${t("connect.ai.import.conf.label")}: ${pct}% — ${t(tone.key)}`}
    >
      <Icon className="size-2.5" aria-hidden />
      {pct}%
    </span>
  );
}

function HistoryDialog({
  open,
  onOpenChange,
  loading,
  entries,
  onReapply,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  loading: boolean;
  entries: CardAiHistoryEntry[];
  onReapply: (e: CardAiHistoryEntry) => void;
  onRemove: (id: string) => void;
}) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            {t("connect.ai.import.history.title")}
          </DialogTitle>
          <DialogDescription>{t("connect.ai.import.history.desc")}</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" />
            {t("connect.ai.import.history.loading")}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            {t("connect.ai.import.history.empty")}
          </div>
        )}

        {!loading && entries.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {entries.map((entry) => {
              const s = entry.suggestion as Partial<CardAiSuggestion>;
              const tpl = entry.templateId ? getTemplate(entry.templateId) : null;
              const created = new Date(entry.createdAt);
              return (
                <li
                  key={entry.id}
                  className="flex gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <img
                    src={entry.thumbnail}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-md border object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="truncate text-sm font-medium">
                      {s.displayName || t("connect.field.displayName")}
                    </div>
                    {s.professionalTitle && (
                      <div className="truncate text-xs text-muted-foreground">
                        {s.professionalTitle}
                      </div>
                    )}
                    {s.companyName && (
                      <div className="truncate text-xs text-muted-foreground">{s.companyName}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {tpl && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[10px]">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ background: tpl.surface }}
                            aria-hidden
                          />
                          {tpl.label}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {created.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-end gap-1 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(entry.id)}
                        aria-label={t("connect.ai.import.history.remove")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onReapply(entry)}>
                        <Sparkles className="size-3.5" />
                        {t("connect.ai.import.history.reapply")}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

const SUMMARY_FIELDS = [
  "displayName",
  "professionalTitle",
  "companyName",
  "headline",
  "workEmail",
  "workPhone",
  "website",
  "templateId",
  "qrBackground",
] as const;

const SUMMARY_FIELD_LABEL: Record<(typeof SUMMARY_FIELDS)[number], string> = {
  displayName: "connect.field.displayName",
  professionalTitle: "connect.field.professionalTitle",
  companyName: "connect.field.companyName",
  headline: "connect.field.headline",
  workEmail: "connect.field.workEmail",
  workPhone: "connect.field.workPhone",
  website: "connect.field.website",
  templateId: "connect.ai.import.template",
  qrBackground: "connect.ai.import.qrBg",
};

function LowConfSummary({ items }: { items: Item[] }) {
  const t = useT();
  const [open, setOpen] = useState(true);

  const stats = useMemo(() => {
    const analyzed = items.filter((it) => it.draft);
    type Row = {
      templateId: string;
      total: number;
      perField: Record<string, number>;
      lowTotal: number;
    };
    const byTpl = new Map<string, Row>();
    for (const it of analyzed) {
      const d = it.draft!;
      const conf = d.confidence as Record<string, number | undefined>;
      const tid = d.templateId ?? "unknown";
      const row: Row = byTpl.get(tid) ?? { templateId: tid, total: 0, perField: {}, lowTotal: 0 };
      row.total += 1;
      for (const k of SUMMARY_FIELDS) {
        if (isLowConf(conf[k])) {
          row.perField[k] = (row.perField[k] ?? 0) + 1;
          row.lowTotal += 1;
        }
      }
      byTpl.set(tid, row);
    }
    const rows = Array.from(byTpl.values()).sort(
      (a, b) => b.lowTotal / b.total - a.lowTotal / a.total,
    );
    return { rows, analyzedCount: analyzed.length };
  }, [items]);

  if (stats.analyzedCount === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-semibold">{t("connect.ai.import.lowConfSummary.title")}</p>
          <p className="text-[11px] text-muted-foreground">
            {t("connect.ai.import.lowConfSummary.hint")}
          </p>
        </div>
        <span className="text-[11px] text-primary hover:underline">
          {open
            ? t("connect.ai.import.lowConfSummary.hide")
            : t("connect.ai.import.lowConfSummary.show")}
        </span>
      </button>

      {open && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[11px]">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 pr-2 font-medium">
                  {t("connect.ai.import.lowConfSummary.template")}
                </th>
                <th className="py-1 px-2 text-right font-medium">
                  {t("connect.ai.import.lowConfSummary.total")}
                </th>
                <th className="py-1 px-2 text-right font-medium">
                  {t("connect.ai.import.lowConfSummary.avgLow")}
                </th>
                {SUMMARY_FIELDS.map((k) => (
                  <th
                    key={k}
                    className="py-1 px-1.5 text-center font-medium"
                    title={t(SUMMARY_FIELD_LABEL[k] as never)}
                  >
                    <span className="inline-block max-w-[60px] truncate align-middle">
                      {t(SUMMARY_FIELD_LABEL[k] as never)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((row) => {
                const tpl = getTemplate(row.templateId);
                const avg = row.total > 0 ? row.lowTotal / row.total : 0;
                return (
                  <tr key={row.templateId} className="border-t border-border/60">
                    <td className="py-1 pr-2 font-medium">{tpl?.label ?? row.templateId}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{row.total}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{avg.toFixed(1)}</td>
                    {SUMMARY_FIELDS.map((k) => {
                      const n = row.perField[k] ?? 0;
                      const ratio = row.total > 0 ? n / row.total : 0;
                      const bg =
                        n === 0
                          ? "bg-transparent"
                          : ratio >= 0.66
                            ? "bg-destructive/25 text-destructive"
                            : ratio >= 0.34
                              ? "bg-warning/20 text-warning"
                              : "bg-success/15 text-success";
                      return (
                        <td
                          key={k}
                          className={`py-1 px-1 text-center tabular-nums ${bg}`}
                          title={`${n}/${row.total}`}
                        >
                          {n > 0 ? `${n}/${row.total}` : "·"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
