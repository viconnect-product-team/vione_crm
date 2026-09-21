import { Search, X } from "lucide-react";
import { useT } from "@/lib/i18n";

interface MobileSearchBarProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function MobileSearchBar({
  id = "bc-network-search",
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  onClear,
}: MobileSearchBarProps) {
  const t = useT();

  const handleClear = () => {
    onChange("");
    onClear?.();
  };

  return (
    <div className="flex flex-col items-start relative flex-1 w-full">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <div className="flex items-center pl-10 pr-9 relative self-stretch w-full h-[40px] bg-[var(--bc-mobile-surface-2)] rounded-full border border-[var(--bc-mobile-border)] transition-colors">
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mobile-search-input w-full bg-transparent !border-none !outline-none !ring-0 focus:!ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:!ring-0 text-[13px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] py-0 px-0 shadow-none"
          style={{ outline: "none", boxShadow: "none", border: "none" }}
          autoComplete="off"
          spellCheck="false"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label={t("bc.mobile.network.search.clear")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface)] transition-colors"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : null}
      </div>
      <Search
        className="absolute top-1/2 -translate-y-1/2 left-3.5 w-4 h-4 text-[var(--bc-mobile-muted)] pointer-events-none"
        aria-hidden="true"
        strokeWidth={1.8}
      />
    </div>
  );
}
