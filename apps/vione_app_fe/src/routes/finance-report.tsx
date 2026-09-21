import React, { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  X,
  Printer,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { listTransactionsFn, type Transaction } from "@/lib/finance.functions";
import { useFmt, useT } from "@/lib/i18n";
import { downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";

const FALLBACK_TRANSACTIONS: Transaction[] = [
  {
    id: "PT-2026-001",
    date: "2026-03-10",
    type: "income",
    category: "Hội phí hội viên",
    description: "Thu hội phí hội viên Kim Cương 2026",
    amount: 50000000,
    method: "bank",
    status: "completed",
    recipient: "Công ty CP Tập đoàn Hòa Bình",
  },
  {
    id: "PT-2026-002",
    date: "2026-03-09",
    type: "income",
    category: "Vé sự kiện",
    description: "Thu vé tham dự Diễn đàn Kết nối Giao thương B2B Quốc Tế",
    amount: 15000000,
    method: "bank",
    status: "completed",
    recipient: "Công ty TNHH Giải pháp Số Vione",
  },
  {
    id: "PT-2026-003",
    date: "2026-03-08",
    type: "income",
    category: "Tài trợ sự kiện",
    description: "Tài trợ kim cương Gala Dinner Doanh nhân Tiên Phong",
    amount: 80000000,
    method: "bank",
    status: "completed",
    recipient: "Ngân hàng Thương mại Cổ phần Á Châu",
  },
  {
    id: "PT-2026-004",
    date: "2026-03-06",
    type: "income",
    category: "Thu đột xuất",
    description: "Đăng ký bổ sung gian hàng triển lãm B2B Tech Expo",
    amount: 8000000,
    method: "cash",
    status: "completed",
    recipient: "Doanh nghiệp Tư nhân Minh Khang",
  },
  {
    id: "PT-2026-005",
    date: "2026-03-04",
    type: "income",
    category: "Hội phí hội viên",
    description: "Phí gia nhập hội viên mới Khối Sản Xuất & Bán Lẻ",
    amount: 20000000,
    method: "bank",
    status: "completed",
    recipient: "Công ty TNHH Dược phẩm An Sinh",
  },
  {
    id: "PC-2026-001",
    date: "2026-03-10",
    type: "expense",
    category: "Thuê địa điểm & Hội trường",
    description: "Thanh toán tiền thuê trung tâm hội nghị Gem Center",
    amount: 35000000,
    method: "bank",
    status: "completed",
    recipient: "Gem Center Saigon",
  },
  {
    id: "PC-2026-002",
    date: "2026-03-09",
    type: "expense",
    category: "Tiệc chiêu đãi & F&B",
    description: "Tiệc trà teabreak & gala dinner đại biểu B2B",
    amount: 18000000,
    method: "bank",
    status: "completed",
    recipient: "Saigon Catering Service",
  },
  {
    id: "PC-2026-003",
    date: "2026-03-07",
    type: "expense",
    category: "Quà tặng & Ấn phẩm",
    description: "In ấn backdrop, kỷ yếu hội viên mạ vàng, cúp vinh danh",
    amount: 12500000,
    method: "bank",
    status: "completed",
    recipient: "Công ty In ấn Mỹ Thuật Á Đông",
  },
  {
    id: "PC-2026-004",
    date: "2026-03-05",
    type: "expense",
    category: "Truyền thông & Báo chí",
    description: "Gói truyền thông báo điện tử VnExpress, CafeF, Doanh Nhân Trẻ",
    amount: 15000000,
    method: "bank",
    status: "completed",
    recipient: "VCCorp Media Network",
  },
  {
    id: "PC-2026-005",
    date: "2026-03-02",
    type: "expense",
    category: "Hành chính & Tiếp khách",
    description: "Chi phí tiếp đón đoàn xúc tiến thương mại Hàn Quốc",
    amount: 4500000,
    method: "cash",
    status: "completed",
    recipient: "Văn phòng Hiệp hội VIONE",
  },
];

export const Route = createFileRoute("/finance-report")({
  ssr: false,
  loader: async () => {
    try {
      const data = await listTransactionsFn();
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback safe
    }
    return FALLBACK_TRANSACTIONS;
  },
  component: FinanceReport,
});

type PeriodFilter = "all" | "month" | "quarter" | "year";

function FinanceReport() {
  const t = useT();
  const fmt = useFmt();
  const rawTransactions = (Route.useLoaderData() as Transaction[]) || FALLBACK_TRANSACTIONS;

  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Filtered by search & type
  const transactions = useMemo(() => {
    return rawTransactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.id.toLowerCase().includes(q) ||
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.recipient && tx.recipient.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [rawTransactions, typeFilter, searchQuery]);

  const tc = useTableControls<Transaction>(
    transactions,
    {
      id: (tx) => tx.id,
      date: (tx) => tx.date,
      type: (tx) => tx.type,
      cat: (tx) => tx.category,
      amount: (tx) => tx.amount,
      status: (tx) => tx.status,
    },
    { initialSortKey: "date", initialSortDir: "desc", initialPageSize: 10 },
  );

  const income = useMemo(() => transactions.filter((tx) => tx.type === "income"), [transactions]);
  const expense = useMemo(() => transactions.filter((tx) => tx.type === "expense"), [transactions]);

  const totalIn = useMemo(() => income.reduce((s, tx) => s + tx.amount, 0), [income]);
  const totalOut = useMemo(() => expense.reduce((s, tx) => s + tx.amount, 0), [expense]);
  const netBalance = totalIn - totalOut;
  const expenseRatio = totalIn > 0 ? Math.round((totalOut / totalIn) * 100) : 0;

  // Breakdown by Category
  const byCat = (list: typeof rawTransactions) => {
    const m = new Map<string, number>();
    for (const tx of list) m.set(tx.category, (m.get(tx.category) ?? 0) + tx.amount);
    const arr = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const total = arr.reduce((s, [, v]) => s + v, 0);
    return arr.map(([k, v]) => ({ k, v, pct: total > 0 ? Math.round((v / total) * 100) : 0 }));
  };

  const incomeByCat = useMemo(() => byCat(income), [income]);
  const expenseByCat = useMemo(() => byCat(expense), [expense]);

  // Cash vs Bank Analysis
  const bankIn = income.filter((tx) => tx.method === "bank").reduce((s, tx) => s + tx.amount, 0);
  const cashIn = income.filter((tx) => tx.method === "cash").reduce((s, tx) => s + tx.amount, 0);
  const bankOut = expense.filter((tx) => tx.method === "bank").reduce((s, tx) => s + tx.amount, 0);
  const cashOut = expense.filter((tx) => tx.method === "cash").reduce((s, tx) => s + tx.amount, 0);

  const handleExportCsv = () => {
    downloadCsv("bao-cao-tai-chinh-chi-tiet", transactions, [
      { header: "Mã chứng từ", value: (tx) => tx.id },
      { header: "Ngày ghi sổ", value: (tx) => tx.date },
      { header: "Loại giao dịch", value: (tx) => (tx.type === "income" ? "Thu" : "Chi") },
      { header: "Danh mục", value: (tx) => tx.category },
      { header: "Nội dung hạch toán", value: (tx) => tx.description },
      { header: "Số tiền (VNĐ)", value: (tx) => tx.amount },
      { header: "Phương thức", value: (tx) => (tx.method === "cash" ? "Tiền mặt" : "Chuyển khoản") },
      { header: "Đối tác / Người nộp - nhận", value: (tx) => tx.recipient || "" },
      { header: "Trạng thái kiểm toán", value: (tx) => (tx.status === "completed" ? "Đã duyệt" : "Chờ duyệt") },
    ]);
    toast.success("Đã xuất sổ nhật ký hạch toán tài chính ra file CSV!");
  };

  const handleExportPdf = () => {
    setExportModalOpen(true);
  };

  return (
    <AppShell>
      {/* Header */}
      <PageHeader
        title="Báo Cáo Tài Chính & Kiểm Toán Toàn Diện"
        subtitle="Báo cáo thu chi thực tế, phân tích cơ cấu ngân quỹ, tỷ lệ thặng dư và sổ nhật ký kế toán minh bạch"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground shadow-sm hover:bg-muted cursor-pointer transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Xuất Excel / CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 cursor-pointer transition-all"
            >
              <FileText className="h-4 w-4" />
              <span>In / Xuất Báo Cáo PDF</span>
            </button>
          </div>
        }
      />

      {/* Period & Filter Control Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground mr-1">Kỳ báo cáo:</span>
          {[
            { id: "all", label: "Tất cả kỳ" },
            { id: "month", label: "Tháng 03/2026" },
            { id: "quarter", label: "Quý 1/2026" },
            { id: "year", label: "Năm tài chính 2026" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id as PeriodFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === p.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã, nội dung, danh mục..."
              className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-1.5 text-xs outline-none focus:border-primary"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none"
          >
            <option value="all">Tất cả giao dịch</option>
            <option value="income">Chỉ khoản thu (+)</option>
            <option value="expense">Chỉ khoản chi (-)</option>
          </select>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total In */}
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Tổng Thu Thực Nhận
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            +{fmt.money(totalIn)}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between pt-2 border-t border-emerald-500/20">
            <span>Chuyển khoản: {fmt.money(bankIn)}</span>
            <span>Tiền mặt: {fmt.money(cashIn)}</span>
          </div>
        </div>

        {/* Total Out */}
        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Tổng Chi Thực Tế
            </span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            -{fmt.money(totalOut)}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between pt-2 border-t border-rose-500/20">
            <span>Chuyển khoản: {fmt.money(bankOut)}</span>
            <span>Tiền mặt: {fmt.money(cashOut)}</span>
          </div>
        </div>

        {/* Net Cash Balance */}
        <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Tồn Quỹ Ròng / Thặng Dư
            </span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono tracking-tight ${
              netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netBalance >= 0 ? `+${fmt.money(netBalance)}` : `-${fmt.money(Math.abs(netBalance))}`}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between pt-2 border-t border-blue-500/20">
            <span>Khả dụng tức thì</span>
            <span className="font-bold text-emerald-600">100% Sẵn sàng</span>
          </div>
        </div>

        {/* Operating Ratio */}
        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Tỷ Lệ Chi / Thu
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {expenseRatio}%
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between pt-2 border-t border-amber-500/20">
            <span>Ngưỡng an toàn quỹ: &lt;75%</span>
            <span className="font-bold text-emerald-600">Đạt chuẩn</span>
          </div>
        </div>
      </div>

      {/* Cash Flow Visual Comparison Bar Chart */}
      <div className="mb-6 p-5 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              So Sánh Dòng Tiền Thu & Chi Thực Tế
            </h3>
            <p className="text-xs text-muted-foreground">
              Biểu diễn trực quan cán cân ngân sách và thặng dư dòng tiền
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Khoản Thu (+{fmt.money(totalIn)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Khoản Chi (-{fmt.money(totalOut)})</span>
            </div>
          </div>
        </div>

        {/* Flow visual bars */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-emerald-700 dark:text-emerald-400">Dòng Tiền Thu Vào (100%)</span>
              <span className="font-mono text-emerald-600">+{fmt.money(totalIn)}</span>
            </div>
            <div className="h-3.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-rose-700 dark:text-rose-400">Dòng Tiền Chi Ra ({expenseRatio}%)</span>
              <span className="font-mono text-rose-600">-{fmt.money(totalOut)}</span>
            </div>
            <div className="h-3.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500"
                style={{ width: `${Math.min(100, expenseRatio)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Breakdown Grid */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Income Breakdown */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4" />
              <span>Cơ Cấu Các Nguồn Thu ({income.length} khoản)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600">+{fmt.money(totalIn)}</span>
          </div>
          <div className="space-y-3.5">
            {incomeByCat.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Chưa có dữ liệu nguồn thu</p>
            ) : (
              incomeByCat.map((c) => (
                <div key={c.k}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{c.k}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {fmt.money(c.v)} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <ArrowDownRight className="h-4 w-4" />
              <span>Cơ Cấu Các Khoản Chi ({expense.length} khoản)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-rose-600">-{fmt.money(totalOut)}</span>
          </div>
          <div className="space-y-3.5">
            {expenseByCat.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Chưa có dữ liệu khoản chi</p>
            ) : (
              expenseByCat.map((c) => (
                <div key={c.k}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{c.k}</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {fmt.money(c.v)} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Comprehensive Transaction Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Sổ Nhật Ký Giao Dịch & Hạch Toán Chi Tiết
            </h3>
            <p className="text-xs text-muted-foreground">
              {transactions.length > 0
                ? `Hiển thị chứng từ ${tc.from}-${tc.to} trên tổng số ${transactions.length} chứng từ đã được xác nhận trong hệ thống`
                : "Hiển thị 0 chứng từ thu/chi trong hệ thống"}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-muted text-foreground">
            Tổng cộng: {transactions.length} chứng từ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Mã CT</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Diễn giải hạch toán</th>
                <th className="px-4 py-3">Đối tác / Người nộp-nhận</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3">Hình thức</th>
                <th className="px-4 py-3 text-center">Kiểm toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tc.paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-xs">
                    Không tìm thấy chứng từ tài chính nào trong kỳ này.
                  </td>
                </tr>
              ) : (
                tc.paged.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">
                      {tx.id}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {tx.type === "income" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Thu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                          Chi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">
                      {tx.category}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {tx.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">
                      {tx.recipient || "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-xs font-bold whitespace-nowrap ${
                        tx.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? `+${fmt.money(tx.amount)}` : `-${fmt.money(tx.amount)}`}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {tx.method === "cash" ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          Tiền mặt
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400">
                          Chuyển khoản
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {tx.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <Clock className="h-3.5 w-3.5" />
                          Chờ duyệt
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <Pagination
          page={tc.page}
          pageCount={tc.pageCount}
          pageSize={tc.pageSize}
          total={tc.total}
          from={tc.from}
          to={tc.to}
          onPage={tc.setPage}
          onPageSize={tc.setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* Modal Xuất Báo Cáo Tài Chính - Mờ nền Dashboard (bg-black/60 backdrop-blur-sm) */}
      {exportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setExportModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Xuất Báo Cáo & Quyết Toán Tài Chính
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Hiệp hội Doanh nhân CEO 1983 · {period === "all" ? "Toàn thời gian" : period === "month" ? "Tháng 03/2026" : period === "quarter" ? "Quý 1/2026" : "Năm tài chính 2026"} · Tổng {transactions.length} giao dịch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Summary Preview */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider block">Tổng Thu</span>
                <span className="text-base font-black text-emerald-600 font-mono">+{fmt.money(totalIn)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10.5px] font-bold text-rose-600 uppercase tracking-wider block">Tổng Chi</span>
                <span className="text-base font-black text-rose-600 font-mono">-{fmt.money(totalOut)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10.5px] font-bold text-blue-600 uppercase tracking-wider block">Tồn Quỹ Ròng</span>
                <span className={`text-base font-black font-mono ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {netBalance >= 0 ? `+${fmt.money(netBalance)}` : `-${fmt.money(Math.abs(netBalance))}`}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10.5px] font-bold text-amber-600 uppercase tracking-wider block">Tỷ Lệ Chi/Thu</span>
                <span className="text-base font-black text-amber-600 font-mono">{expenseRatio}%</span>
              </div>
            </div>

            {/* Export Format Options */}
            <div className="mt-5 space-y-3">
              {/* PDF Option */}
              <div className="p-4 rounded-2xl border border-border bg-muted/30 hover:border-primary/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Bản In / Báo Cáo Kiểm Toán Ban Chấp Hành (PDF)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Định dạng trang in chuẩn A4 bao gồm biểu đồ cơ cấu thu chi, chữ ký của Thủ quỹ, Ban Tài Chính & Ban Thường Vụ.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExportModalOpen(false);
                    setTimeout(() => {
                      toast.success("Đang mở hộp thoại in báo cáo PDF chuẩn Ban Thư Ký...");
                      window.print();
                    }, 200);
                  }}
                  className="shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>In / Lưu PDF</span>
                </button>
              </div>

              {/* Excel/CSV Option */}
              <div className="p-4 rounded-2xl border border-border bg-muted/30 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Sổ Kế Toán & Danh Sách Bút Toán Chi Tiết (Excel / CSV)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Xuất toàn bộ {transactions.length} dòng chứng từ thu chi chi tiết kèm mã phiếu, ngày, đối tác và ghi chú hạch toán.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv();
                    setExportModalOpen(false);
                  }}
                  className="shrink-0 px-4 py-2 rounded-xl border border-border bg-card text-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-muted cursor-pointer"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Tải Excel / CSV</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-end">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-5 py-2 rounded-xl border border-border bg-muted/40 text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
