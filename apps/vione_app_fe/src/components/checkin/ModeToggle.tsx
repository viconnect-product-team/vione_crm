import { QrCode, Wifi } from "lucide-react";
import { useT } from "@/lib/i18n";

type Props = {
  mode: "qr" | "nfc";
  onChange: (m: "qr" | "nfc") => void;
};

export function ModeToggle({ mode, onChange }: Props) {
  const t = useT();
  const items: { key: "qr" | "nfc"; Icon: typeof QrCode; label: string }[] = [
    { key: "qr", Icon: QrCode, label: t("checkin.mode.qr") },
    { key: "nfc", Icon: Wifi, label: t("checkin.mode.nfc") },
  ];
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-[var(--shadow-card)]">
      {items.map((it) => {
        const active = mode === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              active
                ? "text-primary-foreground shadow-[var(--shadow-glow)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={active ? { background: "var(--gradient-primary)" } : undefined}
          >
            <it.Icon className="h-3.5 w-3.5" />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
