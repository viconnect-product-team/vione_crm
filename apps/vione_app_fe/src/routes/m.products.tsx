import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SlidersHorizontal, Eye, Plus, Box, FileText } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listMyProducts, requestQuote, type MyProduct } from "@/lib/member-app.functions";
import { useT, useFmt } from "@/lib/i18n";

export const Route = createFileRoute("/m/products")({
  component: ProductsScreen,
});

function ProductsScreen() {
  const t = useT();
  const fmt = useFmt();
  const fetchProducts = useServerFn(listMyProducts);
  const doQuote = useServerFn(requestQuote);
  const { data: products, loading } = useServerData<MyProduct[]>(() => fetchProducts(), []);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const list = products.filter(
    (p) => !q || (p.name + p.company).toLowerCase().includes(q.toLowerCase()),
  );

  async function quote(id: string) {
    setBusy(id);
    try {
      await doQuote({ data: { productId: id } });
      toast.success(t("m.products.quote_success"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("m.products.quote_error"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="vba-animate">
      <MemberHeader
        title={t("m.products.title")}
        back
        right={
          <button className="rounded-lg vba-gold-grad px-2.5 py-1.5 text-[10px] font-semibold text-[#1a1206]">
            <Plus className="mr-0.5 inline h-3 w-3" />
            {t("m.products.post_btn")}
          </button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] px-3 py-2.5">
          <Search className="h-4 w-4 text-[var(--vba-text-dim)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("m.products.search_placeholder")}
            className="w-full bg-transparent text-[13px] text-[var(--vba-text)] outline-none placeholder:text-[var(--vba-text-dim)]"
          />
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-xl vba-gold-grad text-[#1a1206]">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3 px-4">
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.products.loading")}
          </p>
        )}
        {!loading && list.length === 0 && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.products.empty")}
          </p>
        )}
        {list.map((p) => (
          <div key={p.id} className="vba-card flex gap-3 p-3">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
              <Box className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[13px] font-semibold text-[var(--vba-text)]">
                {p.name}
              </div>
              <div className="text-[11px] text-[var(--vba-text-muted)]">{p.category}</div>
              <div className="mt-1.5 flex items-center gap-4 text-[11px] text-[var(--vba-text-dim)]">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {p.views}
                </span>
                <span className="ml-auto">{fmt.rel(p.time)}</span>
              </div>
              <button
                onClick={() => quote(p.id)}
                disabled={busy === p.id}
                className="mt-2 inline-flex items-center gap-1 rounded-lg vba-gold-grad px-3 py-1.5 text-[11px] font-semibold text-[#1a1206] disabled:opacity-60"
              >
                <FileText className="h-3.5 w-3.5" />
                {busy === p.id ? t("m.products.quoting") : t("m.products.quote_btn")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
