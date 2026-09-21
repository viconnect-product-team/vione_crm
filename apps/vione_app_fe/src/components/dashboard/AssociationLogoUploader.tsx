import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, History, ImageUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useT, useLang } from "@/lib/i18n";
import { useServerData } from "@/hooks/use-server-data";
import { LogoCropDialog } from "./LogoCropDialog";

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
import {
  getActiveAssociationFn,
  updateAssociationLogoFn,
  uploadAssociationLogoFn,
  listLogoHistoryFn,
  type ActiveAssociation,
  type LogoHistoryEntry,
} from "@/lib/associations.functions";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MIN_DIMENSION = 64;

function checkImageDimensions(file: File): Promise<boolean> {
  if (file.type === "image/svg+xml") return Promise.resolve(true);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth >= MIN_DIMENSION && img.naturalHeight >= MIN_DIMENSION);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

export function AssociationLogoUploader() {
  const t = useT();
  const { lang } = useLang();
  const fetchActive = useServerFn(getActiveAssociationFn);
  const saveLogo = useServerFn(updateAssociationLogoFn);
  const uploadLogo = useServerFn(uploadAssociationLogoFn);

  const fetchHistory = useServerFn(listLogoHistoryFn);
  const { data: assoc, reload } = useServerData<ActiveAssociation | null>(
    () => fetchActive(),
    null,
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<LogoHistoryEntry[]>([]);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const associationId = assoc?.associationId;
  const loadHistory = useCallback(async () => {
    if (!associationId) return;
    try {
      setHistory(await fetchHistory({ data: { associationId } }));
    } catch {
      /* non-blocking */
    }
  }, [associationId, fetchHistory]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (!assoc) return null;

  const currentLogo = previewUrl ?? logoUrl ?? assoc.logoUrl;
  const canEdit = assoc.isAdmin;

  const actionLabel = (a: string) =>
    a === "set"
      ? t("set.org.logoActionSet")
      : a === "remove"
        ? t("set.org.logoActionRemove")
        : t("set.org.logoActionChange");

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t("set.org.logoInvalidType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("set.org.logoTooLarge"));
      return;
    }
    const okDimensions = await checkImageDimensions(file);
    if (!okDimensions) {
      toast.error(t("set.org.logoTooSmall"));
      return;
    }
    setPendingFile(file);
  }

  async function onCropConfirm(file: File, preview: string) {
    setPendingFile(null);
    if (!assoc) return;
    setPreviewUrl(preview);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("associationId", assoc.associationId);
      fd.append("file", file, file.name || "logo.png");
      const { url } = await uploadLogo({ data: fd });
      await saveLogo({ data: { associationId: assoc.associationId, logoUrl: url } });
      setLogoUrl(url);
      setPreviewUrl(null);
      await reload();
      await loadHistory();
      toast.success(t("set.org.logoSaved"));
    } catch (err) {
      setPreviewUrl(null);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("FILE_TOO_LARGE")) toast.error(t("set.org.logoTooLarge"));
      else if (msg.includes("INVALID_FORMAT")) toast.error(t("set.org.logoInvalidType"));
      else toast.error(t("set.org.logoError"));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!assoc) return;
    setBusy(true);
    try {
      await saveLogo({ data: { associationId: assoc.associationId, logoUrl: null } });
      setLogoUrl(null);
      await reload();
      await loadHistory();
      toast.success(t("set.org.logoSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("set.org.logoError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-1 text-sm font-semibold text-foreground">{t("set.org.logo")}</div>
      <p className="mb-4 text-xs text-muted-foreground">{t("set.org.logoDesc")}</p>

      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted">
          {currentLogo ? (
            <img src={currentLogo} alt={assoc.name} className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={onFile}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageUp className="h-4 w-4" />
              )}
              {busy
                ? t("set.org.logoUploading")
                : currentLogo
                  ? t("set.org.logoChange")
                  : t("set.org.logoUpload")}
            </button>
            {currentLogo && (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-destructive hover:bg-muted disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {t("set.org.logoRemove")}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("set.org.logoAdminOnly")}</p>
        )}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <History className="h-4 w-4 text-muted-foreground" />
          {t("set.org.logoHistory")}
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("set.org.logoHistoryEmpty")}</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted">
                  {h.newLogoUrl ? (
                    <img src={h.newLogoUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {actionLabel(h.action)}{" "}
                    <span className="text-muted-foreground">
                      {t("set.org.logoHistoryBy")}{" "}
                      {h.changedByName || t("set.org.logoHistoryUnknown")}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{fmtDate(h.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingFile && (
        <LogoCropDialog
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={onCropConfirm}
        />
      )}

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("set.org.logoRemoveConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("set.org.logoRemoveConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmRemove(false)} disabled={busy}>
              {t("set.org.logoRemoveCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmRemove(false);
                await onRemove();
              }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("set.org.logoRemoveConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
