import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpCircle,
  Download,
  FileDown,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  Banknote,
  Building,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, Pill } from "@/components/dashboard/PageKit";
import { Card } from "@/components/ui/card";
import {
  createTransactionFn,
  deleteTransactionFn,
  listTransactionsFn,
  updateTransactionFn,
  type Transaction,
} from "@/lib/finance.functions";
import { downloadInvoiceVoucher } from "@/lib/invoice-receipt";
import { useFmt, useT } from "@/lib/i18n";
import { downloadCsv } from "@/lib/csv";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";

const DEFAULT_INCOME_TRANSACTIONS: Transaction[] = [
  {
    id: "PT-2026-001",
    date: "2026-03-10",
    type: "income",
    category: "membership_fee",
    description: "Thu hội phí hội viên VIP 2026",
    amount: 50000000,
    method: "bank",
    status: "completed",
    recipient: "Công ty CP Tập đoàn Hòa Bình",
  },
  {
    id: "PT-2026-002",
    date: "2026-03-09",
    type: "income",
    category: "event_ticket",
    description: "Thu vé tham dự Diễn đàn Kết nối Giao thương B2B",
    amount: 1500000,
    method: "bank",
    status: "completed",
    recipient: "Bà Trần Mai Anh",
  },
  {
    id: "PT-2026-003",
    date: "2026-03-08",
    type: "income",
    category: "event_walkin",
    description: "Thu tiền mặt trực tiếp tại bàn đón tiếp sự kiện",
    amount: 500000,
    method: "cash",
    status: "completed",
    recipient: "Ông Nguyễn Hoàng Long",
  },
  {
    id: "PT-2026-004",
    date: "2026-03-05",
    type: "income",
    category: "sponsor",
    description: "Thu gói Tài trợ Kim Cương Tech Expo 2026",
    amount: 150000000,
    method: "bank",
    status: "completed",
    recipient: "Techcombank",
  },
  {
    id: "PT-2026-005",
    date: "2026-03-02",
    type: "income",
    category: "membership_fee",
    description: "Thu phí gia nhập hội viên mới",
    amount: 15000000,
    method: "bank",
    status: "completed",
    recipient: "Công ty TNHH Smart Logistics",
  },
  {
    id: "PT-2026-006",
    date: "2026-02-28",
    type: "income",
    category: "event_walkin",
    description: "Thu đột xuất tiền mặt ủng hộ quỹ hội viên",
    amount: 2000000,
    method: "cash",
    status: "completed",
    recipient: "Ông Vũ Minh Tuấn",
  },
];

export const Route = createFileRoute("/income")({
  ssr: false,
  loader: async () => {
    try {
      const data = await listTransactionsFn();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  component: IncomePage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error?.message || "Đã xảy ra lỗi khi tải dữ liệu thu chi."}
    </div>
  ),
});

function IncomePage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const rawLoaderData = Route.useLoaderData();
  const loadedTransactions = Array.isArray(rawLoaderData) ? (rawLoaderData as Transaction[]) : [];
  const TRANSACTIONS = loadedTransactions.length > 0 ? loadedTransactions : DEFAULT_INCOME_TRANSACTIONS;

  // Method filter: all | cash (Tiền mặt) | bank (Chuyển khoản)
  const [methodFilter, setMethodFilter] = useState<"all" | "cash" | "bank">("all");
  // Category filter: all | membership_fee | event_ticket | event_walkin | sponsor | other
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const createFn = useServerFn(createTransactionFn);
  const updateFn = useServerFn(updateTransactionFn);
  const deleteFn = useServerFn(deleteTransactionFn);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formDate, setFormDate] = useState("");
  const [formCategory, setFormCategory] = useState("membership_fee");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formMethod, setFormMethod] = useState<"cash" | "bank" | "card">("bank");
  const [formStatus, setFormStatus] = useState<"completed" | "pending">("completed");
  const [formRecipient, setFormRecipient] = useState("");

  const openCreate = (defaultCategory?: string, defaultMethod?: "cash" | "bank") => {
    setEditing(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCategory(defaultCategory || "membership_fee");
    setFormDescription(
      defaultCategory === "event_walkin"
        ? "Thu tiền mặt trực tiếp tại bàn đón tiếp sự kiện"
        : defaultCategory === "membership_fee"
        ? "Thu hội phí thường niên"
        : ""
    );
    setFormAmount(0);
    setFormMethod(defaultMethod || "bank");
    setFormStatus("completed");
    setFormRecipient("");
    setModalOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setFormDate(tx.date || new Date().toISOString().slice(0, 10));
    setFormCategory(tx.category);
    setFormDescription(tx.description);
    setFormAmount(tx.amount);
    setFormMethod(tx.method);
    setFormStatus(tx.status);
    setFormRecipient(tx.recipient || "");
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        date: formDate,
        type: "income" as const,
        category: formCategory,
        description: formDescription,
        amount: Number(formAmount),
        method: formMethod,
        status: formStatus,
        advanceAmount: 0,
        refundAmount: 0,
        recipient: formRecipient,
        invoiceUrl: editing?.invoiceUrl || `/invoices/INV-THU-${Date.now()}.pdf`,
      };

      if (editing) {
        await updateFn({ data: { id: editing.id, ...payload } });
        toast.success(t("common.updated"));
      } else {
        await createFn({ data: payload });
        toast.success(t("common.created"));
      }
      setModalOpen(false);
      setEditing(null);
      await router.invalidate();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (tx: Transaction) => {
    if (!window.confirm(t("common.confirmDelete", { name: tx.description || tx.id }))) return;
    setDeletingId(tx.id);
    try {
      await deleteFn({ data: { id: tx.id } });
      toast.success(t("common.deletedToast"));
      await router.invalidate();
    } catch {
      toast.error(t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  // Only consider income transactions
  const incomeList = useMemo(() => {
    return TRANSACTIONS.filter((tx) => tx.type === "income");
  }, [TRANSACTIONS]);

  // Breakdown by Cash vs Bank transfer
  const incomeCash = useMemo(() => {
    return incomeList
      .filter((tx) => tx.method === "cash")
      .reduce((s, tx) => s + tx.amount, 0);
  }, [incomeList]);

  const incomeBank = useMemo(() => {
    return incomeList
      .filter((tx) => tx.method === "bank" || tx.method === "card")
      .reduce((s, tx) => s + tx.amount, 0);
  }, [incomeList]);

  const totalIncome = incomeCash + incomeBank;

  const walkinIncome = useMemo(() => {
    return incomeList
      .filter((tx) => tx.category === "event_walkin" || tx.description.toLowerCase().includes("trực tiếp"))
      .reduce((s, tx) => s + tx.amount, 0);
  }, [incomeList]);

  // Filtered dataset
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return incomeList
      .filter((tx) => {
        if (methodFilter === "all") return true;
        if (methodFilter === "cash") return tx.method === "cash";
        return tx.method === "bank" || tx.method === "card";
      })
      .filter((tx) => {
        if (categoryFilter === "all") return true;
        return tx.category === categoryFilter;
      })
      .filter(
        (tx) =>
          !ql ||
          tx.id.toLowerCase().includes(ql) ||
          tx.description.toLowerCase().includes(ql) ||
          tx.category.toLowerCase().includes(ql) ||
          (tx.recipient && tx.recipient.toLowerCase().includes(ql)),
      );
  }, [q, methodFilter, categoryFilter, incomeList]);

  const tc = useTableControls<Transaction>(
    filtered,
    {
      id: (tx) => tx.id,
      date: (tx) => tx.date,
      cat: (tx) => tx.category,
      amount: (tx) => tx.amount,
      status: (tx) => tx.status,
    },
    { initialSortKey: "date", initialSortDir: "desc", initialPageSize: 20 },
  );

  const handleExport = () => {
    downloadCsv("danh-sach-khoan-thu", tc.sorted, [
      { header: "Mã phiếu thu", value: (tx) => tx.id },
      { header: "Ngày thu", value: (tx) => tx.date },
      { header: "Danh mục thu", value: (tx) => tx.category },
      { header: "Nội dung thu", value: (tx) => tx.description },
      { header: "Người nộp / Đơn vị", value: (tx) => tx.recipient || "" },
      { header: "Số tiền", value: (tx) => tx.amount },
      { header: "Hình thức", value: (tx) => (tx.method === "cash" ? "Tiền mặt" : "Chuyển khoản") },
      { header: "Trạng thái", value: (tx) => (tx.status === "completed" ? "Đã xác nhận" : "Chờ xử lý") },
    ]);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "membership_fee":
        return "Phí hội viên";
      case "event_ticket":
        return "Vé sự kiện";
      case "event_walkin":
        return "Thu đột xuất (Tại sự kiện)";
      case "sponsor":
        return "Tài trợ";
      default:
        return cat;
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Quản Lý Thu"
        subtitle="Theo dõi toàn bộ nguồn thu quỹ, phí hội viên, vé sự kiện, thu đột xuất tiền mặt tại bàn đón tiếp & chuyển khoản ngân hàng"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              {t("common.exportExcel")}
            </button>
            <button
              onClick={() => openCreate("event_walkin", "cash")}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              <Banknote className="h-4 w-4" />
              Thu Tiền Mặt Đột Xuất
            </button>
            <button
              onClick={() => openCreate("membership_fee", "bank")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Lập Phiếu Thu
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng thu */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Tổng Thu Quỹ
            </span>
            <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {fmt.money(totalIncome)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tổng hợp toàn bộ các nguồn thu
          </p>
        </div>

        {/* Card 2: Thu Tiền Mặt */}
        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Thu Tiền Mặt
            </span>
            <Banknote className="h-5 w-5 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-teal-700 dark:text-teal-300">
            {fmt.money(incomeCash)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Bao gồm thu trực tiếp tại quầy / sự kiện
          </p>
        </div>

        {/* Card 3: Thu Chuyển Khoản */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Thu Chuyển Khoản
            </span>
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700 dark:text-blue-300">
            {fmt.money(incomeBank)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            VietQR / Chuyển khoản ngân hàng tự động
          </p>
        </div>

        {/* Card 4: Thu Đột Xuất Sự Kiện */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Thu Đột Xuất Tại Sự Kiện
            </span>
            <UserCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">
            {fmt.money(walkinIncome)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Khách vãng lai & tham gia đột xuất
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1">
            <button
              onClick={() => setMethodFilter("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                methodFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả PT
            </button>
            <button
              onClick={() => setMethodFilter("cash")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                methodFilter === "cash" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tiền mặt
            </button>
            <button
              onClick={() => setMethodFilter("bank")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                methodFilter === "bank" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Chuyển khoản
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                categoryFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả nguồn thu
            </button>
            <button
              onClick={() => setCategoryFilter("membership_fee")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                categoryFilter === "membership_fee" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Phí hội viên
            </button>
            <button
              onClick={() => setCategoryFilter("event_ticket")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                categoryFilter === "event_ticket" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Vé sự kiện
            </button>
            <button
              onClick={() => setCategoryFilter("event_walkin")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                categoryFilter === "event_walkin" ? "bg-amber-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Thu đột xuất
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo mã, nội dung, người nộp..."
            className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Main Income Table */}
      <Card className="overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="border-b border-border bg-secondary/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-20 w-14 bg-secondary/90 px-3 py-3 text-center text-xs font-bold border-b border-border">STT</th>
              <th className="sticky left-[56px] z-20 bg-secondary/90 px-4 py-3 text-xs font-bold border-b border-border">Mã phiếu thu</th>
              <th className="px-4 py-3 border-b border-border">Ngày thu</th>
              <th className="px-4 py-3 border-b border-border">Danh mục thu</th>
              <th className="px-4 py-3 border-b border-border">Nội dung thu</th>
              <th className="px-4 py-3 border-b border-border">Người nộp / Đơn vị</th>
              <th className="px-4 py-3 text-right font-bold text-emerald-600 border-b border-border">Số tiền</th>
              <th className="px-4 py-3 border-b border-border">Hình thức</th>
              <th className="px-4 py-3 border-b border-border">Trạng thái</th>
              <th className="px-4 py-3 text-center border-b border-border">Tải hóa đơn</th>
              <th className="sticky right-0 z-20 bg-secondary/90 px-4 py-3 text-right text-xs font-bold border-b border-border">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(tc?.paged || []).length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy khoản thu nào phù hợp
                </td>
              </tr>
            ) : (
              (tc?.paged || []).map((tx, idx) => (
                <tr key={tx.id} className="group hover:bg-muted/30 transition-colors border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card px-3 py-3 text-center font-mono text-xs font-semibold text-muted-foreground group-hover:bg-muted/70 border-b border-border/50">
                    {(tc.page - 1) * tc.pageSize + idx + 1}
                  </td>
                  <td className="sticky left-[56px] z-10 bg-card px-4 py-3 font-mono text-xs font-bold text-foreground group-hover:bg-muted/70 border-b border-border/50">
                    {tx.id}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap border-b border-border/50">
                    {tx.date}
                  </td>
                  <td className="px-4 py-3 text-xs border-b border-border/50">
                    {tx.category === "event_walkin" ? (
                      <Pill tone="warn">Thu đột xuất</Pill>
                    ) : (
                      <span className="font-medium text-foreground">{getCategoryLabel(tx.category)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium max-w-xs truncate border-b border-border/50">
                    {tx.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-foreground border-b border-border/50">
                    {tx.recipient || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap border-b border-border/50">
                    +{fmt.money(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-xs border-b border-border/50">
                    {tx.method === "cash" ? (
                      <Pill tone="success">Tiền mặt</Pill>
                    ) : (
                      <Pill tone="info">Chuyển khoản</Pill>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs border-b border-border/50">
                    {tx.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã xác nhận
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        Chờ xác nhận
                      </span>
                    )}
                  </td>

                  {/* Column Tải hóa đơn / Phiếu thu on each row */}
                  <td className="px-4 py-3 text-center border-b border-border/50">
                    <button
                      type="button"
                      onClick={() =>
                        downloadInvoiceVoucher({
                          id: tx.id,
                          date: tx.date,
                          type: "income",
                          category: tx.category,
                          description: tx.description,
                          amount: tx.amount,
                          method: tx.method,
                          status: tx.status,
                          recipient: tx.recipient,
                        })
                      }
                      title="Tải phiếu thu / Hóa đơn điện tử PDF"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-xs hover:bg-muted cursor-pointer transition-colors"
                    >
                      <FileDown className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Tải HĐ</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="sticky right-0 z-10 bg-card px-4 py-3 text-right whitespace-nowrap group-hover:bg-muted/70 border-b border-border/50">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(tx)}
                        title="Sửa phiếu thu"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(tx)}
                        disabled={deletingId === tx.id}
                        title="Xóa"
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </Card>

      <Pagination
        page={tc.page}
        pageCount={tc.pageCount}
        pageSize={tc.pageSize}
        total={tc.total}
        from={tc.from}
        to={tc.to}
        onPage={tc.setPage}
        onPageSize={tc.setPageSize}
      />

      {/* Modal Lập / Sửa Phiếu Thu */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">
              {editing ? "Sửa Phiếu Thu" : "Lập Phiếu Thu Mới"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ghi nhận nguồn thu quỹ, phí hội viên hoặc thanh toán tiền mặt trực tiếp tại sự kiện
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Ngày thu</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Danh mục thu</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="membership_fee">Phí hội viên thường niên</option>
                    <option value="event_ticket">Vé tham gia sự kiện</option>
                    <option value="event_walkin">Thu tiền mặt trực tiếp (Đột xuất tại sự kiện)</option>
                    <option value="sponsor">Tài trợ sự kiện / hiệp hội</option>
                    <option value="other">Khoản thu khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Người nộp / Doanh nghiệp</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ông Trần Văn B (CEO Công ty XYZ) / Khách vãng lai"
                  value={formRecipient}
                  onChange={(e) => setFormRecipient(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Nội dung thu</label>
                <input
                  type="text"
                  required
                  placeholder="Diễn giải chi tiết lý do thu..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Số tiền thu (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary text-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Phương thức thanh toán</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="cash">Tiền mặt (Thu tại bàn tiếp đón)</option>
                    <option value="bank">Chuyển khoản (VietQR / Ngân hàng)</option>
                    <option value="card">Quẹt thẻ POS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Trạng thái ghi nhận</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="completed">Đã nhận tiền thành công</option>
                  <option value="pending">Chờ xác nhận giao dịch</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo phiếu thu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
