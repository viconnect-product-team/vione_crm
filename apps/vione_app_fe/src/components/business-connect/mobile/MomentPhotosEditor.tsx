// BC-Mobile-7D — Sửa ảnh của một khoảnh khắc đã lưu.
//
// Chủ sở hữu có thể gỡ từng ảnh hoặc tải thêm ảnh mới (tổng ≤ giới hạn).
// Ảnh mới được nén và gỡ EXIF ở máy khách trước khi tải lên kho riêng tư;
// đường dẫn kho luôn do máy chủ sinh.

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useT, type TKey } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import {
  MOMENT_IMAGE_ACCEPT,
  processMomentImage,
} from "@/lib/business-connect/mobile/moment-image";
import { MOMENT_MAX_PHOTOS } from "@/lib/business-connect/mobile/moment.types";
import {
  bcMobileMomentPhotoCommitFn,
  bcMobileMomentPhotoRemoveFn,
  bcMobileMomentPhotoSlotsFn,
  bcMobileMomentPhotosFn,
} from "@/lib/business-connect/mobile/moment.functions";
import { uploadFileToNest } from "@/lib/api-client";

const MOMENT_MEDIA_BUCKET = "relationship-moments";

type Photo = { mediaId: string; url: string | null };

export function MomentPhotosEditor({
  momentId,
  disabled,
  onChanged,
}: {
  momentId: string;
  disabled?: boolean;
  onChanged: () => void;
}) {
  const t = useT();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<TKey | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await bcMobileMomentPhotosFn({ data: { momentId } });
      setPhotos(res.ok ? res.photos.map((p) => ({ mediaId: p.mediaId, url: p.url })) : []);
    } catch {
      setPhotos([]);
      setErrorKey("bc.mobile.moment.error.photos");
    }
  }, [momentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const count = photos?.length ?? 0;
  const full = count >= MOMENT_MAX_PHOTOS;
  const locked = Boolean(disabled) || busy;

  async function remove(mediaId: string) {
    if (locked) return;
    setBusy(true);
    setErrorKey(null);
    try {
      const res = await bcMobileMomentPhotoRemoveFn({ data: { momentId, mediaId } });
      if (!res.ok) {
        setErrorKey("bc.mobile.moment.error.photos");
      } else {
        setPhotos((prev) => (prev ?? []).filter((p) => p.mediaId !== mediaId));
        toast.success(t("bc.mobile.moment.edit.photos.removedToast"));
        onChanged();
      }
    } catch {
      setErrorKey("bc.mobile.moment.error.photos");
    }
    setBusy(false);
  }

  async function addFiles(files: File[]) {
    if (locked || files.length === 0) return;
    const capacity = MOMENT_MAX_PHOTOS - count;
    if (capacity <= 0) return;
    setBusy(true);
    setErrorKey(null);
    try {
      const blobs: Blob[] = [];
      for (const file of files.slice(0, capacity)) {
        const processed = await processMomentImage(file);
        if (processed.ok) blobs.push(processed.image.blob);
      }
      if (blobs.length === 0) {
        setErrorKey("bc.mobile.moment.error.photos");
        setBusy(false);
        return;
      }

      const slots = await bcMobileMomentPhotoSlotsFn({
        data: { momentId, count: blobs.length },
      });
      if (!slots.ok) {
        setErrorKey("bc.mobile.moment.error.photos");
        setBusy(false);
        return;
      }

      const uploaded: string[] = [];
      const mediaPaths: Record<string, string> = {};
      for (let i = 0; i < slots.photos.length; i += 1) {
        const slot = slots.photos[i]!;
        try {
          const minioPath = await uploadFileToNest(blobs[i]!, `${slot.mediaId}.jpg`);
          mediaPaths[slot.mediaId] = minioPath;
          uploaded.push(slot.mediaId);
        } catch (err) {
          console.error("Upload error for slot:", slot.mediaId, err);
        }
      }

      await bcMobileMomentPhotoCommitFn({
        data: {
          momentId,
          addedMediaIds: slots.photos.map((s) => s.mediaId),
          uploadedMediaIds: uploaded,
          mediaPaths,
        },
      });

      if (uploaded.length === 0) {
        setErrorKey("bc.mobile.moment.error.photos");
        setBusy(false);
        return;
      }
      toast.success(t("bc.mobile.moment.edit.photos.addedToast"));
      await load();
      onChanged();
    } catch {
      setErrorKey("bc.mobile.moment.error.photos");
    }
    setBusy(false);
  }

  return (
    <section aria-labelledby="bc-moment-edit-photos">
      <div className="flex items-center justify-between gap-2">
        <span
          id="bc-moment-edit-photos"
          className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]"
        >
          {t("bc.mobile.moment.edit.photos.title")}
        </span>
        <span className="text-[12px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.moment.photos.count", {
            selected: String(count),
            max: String(MOMENT_MAX_PHOTOS),
          })}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {photos === null ? (
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--bc-mobile-border)]">
            <Loader2
              aria-label={t("bc.mobile.moment.edit.photos.loading")}
              className="h-4 w-4 animate-spin text-[var(--bc-mobile-muted)] motion-reduce:animate-none"
              strokeWidth={1.8}
            />
          </span>
        ) : (
          photos.map((p) => (
            <span key={p.mediaId} className="relative">
              {p.url ? (
                <img
                  src={p.url}
                  alt=""
                  className="h-20 w-20 rounded-2xl border border-[var(--bc-mobile-border)] object-cover"
                />
              ) : (
                <span className="block h-20 w-20 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]" />
              )}
              <button
                type="button"
                onClick={() => void remove(p.mediaId)}
                disabled={locked}
                aria-label={t("bc.mobile.moment.photos.remove")}
                className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-text)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </span>
          ))
        )}

        {!full ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={locked}
            className="grid h-20 w-20 place-items-center gap-1 rounded-2xl border border-dashed border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
          >
            {busy ? (
              <Loader2
                aria-hidden="true"
                className="h-5 w-5 animate-spin motion-reduce:animate-none"
                strokeWidth={1.8}
              />
            ) : (
              <ImagePlus aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            )}
            <span className="text-[11px]">{t("bc.mobile.moment.edit.photos.add")}</span>
          </button>
        ) : null}
      </div>

      {photos !== null && count === 0 ? (
        <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.moment.edit.photos.empty")}
        </p>
      ) : null}

      {full ? (
        <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.moment.photos.full")}
        </p>
      ) : null}

      {errorKey ? (
        <p role="alert" className="mt-2 text-[13px] text-[var(--bc-mobile-danger,#E5484D)]">
          {t(errorKey)}
        </p>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept={MOMENT_IMAGE_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void addFiles(files);
        }}
      />
    </section>
  );
}
