import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Check,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Lock,
  Crown,
  Minus,
  Move,
  GripHorizontal,
  Info,
} from "lucide-react";

export type SeatInfo = {
  id: string;
  label: string;
  category: "vip" | "standard" | "table";
  row?: string;
  number?: number;
};

export type CinemaRowConfig = {
  id: string;
  rowLetter: string;
  name: string;
  category: "vip" | "standard";
  seatsCount: number;
};

export type BanquetTable = {
  id: string;
  name: string;
  shape: "round" | "rect";
  seatsCount: number;
  isVip?: boolean;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
};

export type FloorSeat = {
  id: string;
  label: string;
  category: "vip" | "standard";
  row: string;
  number: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  title?: string;
};

const generateInitialFloorSeats = (): FloorSeat[] => {
  const rows = [
    { row: "A", name: "Hàng VIP A", category: "vip" as const, count: 8, y: 18 },
    { row: "B", name: "Hàng VIP B", category: "vip" as const, count: 8, y: 40 },
    { row: "C", name: "Hàng Tiêu Chuẩn C", category: "standard" as const, count: 10, y: 64 },
    { row: "D", name: "Hàng Doanh Nhân D", category: "standard" as const, count: 10, y: 86 },
  ];
  const list: FloorSeat[] = [];
  rows.forEach((r) => {
    const step = 84 / (r.count + 1);
    for (let i = 0; i < r.count; i++) {
      const num = i + 1;
      list.push({
        id: `${r.row}-${String(num).padStart(2, "0")}`,
        label: `${r.name} - Ghế ${r.row}-${String(num).padStart(2, "0")}`,
        category: r.category,
        row: r.row,
        number: num,
        x: Math.round(8 + num * step),
        y: r.y,
        title: `${r.row}${num}`,
      });
    }
  });
  return list;
};

type Props = {
  currentSeat?: string;
  occupiedSeats?: Record<string, { attendeeName: string; attendeeCode?: string }>;
  onSelectSeat: (seatLabel: string) => void;
  initialMode?: "cinema" | "banquet";
};

const DEFAULT_BANQUET_TABLES: BanquetTable[] = [
  {
    id: "T1",
    name: "Bàn VIP 01 - Ban Chủ Tọa",
    shape: "round",
    seatsCount: 8,
    isVip: true,
    x: 25,
    y: 22,
  },
  {
    id: "T2",
    name: "Bàn VIP 02 - Khách Mời Danh Dự",
    shape: "round",
    seatsCount: 8,
    isVip: true,
    x: 75,
    y: 22,
  },
  {
    id: "T3",
    name: "Bàn 03 - Ban Xúc Tiến B2B",
    shape: "round",
    seatsCount: 10,
    isVip: false,
    x: 20,
    y: 56,
  },
  {
    id: "T4",
    name: "Bàn 04 - Hội Viên CEO 1983",
    shape: "round",
    seatsCount: 10,
    isVip: false,
    x: 50,
    y: 56,
  },
  {
    id: "T5",
    name: "Bàn 05 - Đối Tác Chiến Lược",
    shape: "rect",
    seatsCount: 10,
    isVip: false,
    x: 80,
    y: 56,
  },
  {
    id: "T6",
    name: "Bàn 06 - Doanh Nghiệp Trẻ",
    shape: "rect",
    seatsCount: 8,
    isVip: false,
    x: 35,
    y: 84,
  },
  {
    id: "T7",
    name: "Bàn 07 - Báo Chí & Truyền Thông",
    shape: "rect",
    seatsCount: 8,
    isVip: false,
    x: 65,
    y: 84,
  },
];

const DEFAULT_CINEMA_ROWS: CinemaRowConfig[] = [
  { id: "row-A", rowLetter: "A", name: "Hàng VIP A", category: "vip", seatsCount: 10 },
  { id: "row-B", rowLetter: "B", name: "Hàng VIP B", category: "vip", seatsCount: 10 },
  { id: "row-C", rowLetter: "C", name: "Hàng Tiêu Chuẩn C", category: "standard", seatsCount: 12 },
  { id: "row-D", rowLetter: "D", name: "Hàng Tiêu Chuẩn D", category: "standard", seatsCount: 12 },
  { id: "row-E", rowLetter: "E", name: "Hàng Doanh Nhân E", category: "standard", seatsCount: 12 },
];

export function CinemaSeatingMap({
  currentSeat = "",
  occupiedSeats = {},
  onSelectSeat,
  initialMode = "cinema",
}: Props) {
  const [mode, setMode] = useState<"cinema" | "banquet">(initialMode);
  const [selectedSeatId, setSelectedSeatId] = useState<string>(currentSeat);
  const [hoveredSeat, setHoveredSeat] = useState<{
    id: string;
    label: string;
    occupant?: string;
  } | null>(null);

  // Cinema Dynamic Rows & Stage Seats
  const [cinemaRows, setCinemaRows] = useState<CinemaRowConfig[]>(DEFAULT_CINEMA_ROWS);
  const [stageSeatsCount, setStageSeatsCount] = useState<number>(6);
  const [showStageSeats, setShowStageSeats] = useState<boolean>(true);

  // Banquet State
  const [tables, setTables] = useState<BanquetTable[]>(DEFAULT_BANQUET_TABLES);
  const [activeTableId, setActiveTableId] = useState<string | null>("T1");
  const activeTable = (tables || []).find((t) => t.id === activeTableId);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<BanquetTable | null>(null);

  // Mouse drag-and-drop table positioning
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    tableX: number;
    tableY: number;
  } | null>(null);

  // New table form state
  const [newTableName, setNewTableName] = useState("");
  const [newTableShape, setNewTableShape] = useState<"round" | "rect">("round");
  const [newTableSeats, setNewTableSeats] = useState<number>(10);
  const [newTableIsVip, setNewTableIsVip] = useState<boolean>(false);

  // Stage Seats with Drag-and-Drop Coordinates
  const stageCanvasRef = useRef<HTMLDivElement | null>(null);
  const [draggingStageSeatId, setDraggingStageSeatId] = useState<string | null>(null);
  const dragStageSeatStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    seatX: number;
    seatY: number;
  } | null>(null);

  const [stageSeats, setStageSeats] = useState<{
    id: string;
    label: string;
    category: "vip";
    row: string;
    number: number;
    x: number;
    y: number;
    title?: string;
  }[]>(() => {
    const defaultCount = 6;
    const step = 84 / (defaultCount + 1);
    return Array.from({ length: defaultCount }, (_, i) => ({
      id: `SK-${String(i + 1).padStart(2, "0")}`,
      label: `Sân Khấu - Ghế SK-${String(i + 1).padStart(2, "0")}`,
      category: "vip" as const,
      row: "SK",
      number: i + 1,
      x: Math.round(8 + (i + 1) * step),
      y: 62,
      title: i === 2 || i === 3 ? "Chủ tọa" : `Ghế ${i + 1}`,
    }));
  });

  const handlePointerDownStageSeat = (e: React.PointerEvent, seatId: string) => {
    if (e.button !== 0) return;
    const target = stageSeats.find((s) => s.id === seatId);
    if (!target) return;

    setDraggingStageSeatId(seatId);
    dragStageSeatStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      seatX: target.x,
      seatY: target.y,
    };
    e.stopPropagation();
  };

  useEffect(() => {
    if (!draggingStageSeatId) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStageSeatStartRef.current || !stageCanvasRef.current) return;
      const rect = stageCanvasRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaX = e.clientX - dragStageSeatStartRef.current.mouseX;
      const deltaY = e.clientY - dragStageSeatStartRef.current.mouseY;

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      const newX = Math.round(
        Math.max(6, Math.min(94, dragStageSeatStartRef.current.seatX + deltaPercentX))
      );
      const newY = Math.round(
        Math.max(28, Math.min(84, dragStageSeatStartRef.current.seatY + deltaPercentY))
      );

      setStageSeats((prev) =>
        prev.map((s) => (s.id === draggingStageSeatId ? { ...s, x: newX, y: newY } : s))
      );
    };

    const handlePointerUp = () => {
      setDraggingStageSeatId(null);
      dragStageSeatStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingStageSeatId]);

  // ── Manual Floor Seats Drag & Drop Under The Stage ──
  const [cinemaViewMode, setCinemaViewMode] = useState<"floor-manual" | "rows">("floor-manual");
  const floorCanvasRef = useRef<HTMLDivElement | null>(null);
  const [floorSeats, setFloorSeats] = useState<FloorSeat[]>(generateInitialFloorSeats);
  const [draggingFloorSeatId, setDraggingFloorSeatId] = useState<string | null>(null);
  const dragFloorSeatStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    seatX: number;
    seatY: number;
  } | null>(null);

  const handlePointerDownFloorSeat = (e: React.PointerEvent, seatId: string) => {
    if (e.button !== 0) return;
    const target = floorSeats.find((s) => s.id === seatId);
    if (!target) return;

    setDraggingFloorSeatId(seatId);
    dragFloorSeatStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      seatX: target.x,
      seatY: target.y,
    };
    e.stopPropagation();
  };

  useEffect(() => {
    if (!draggingFloorSeatId) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragFloorSeatStartRef.current || !floorCanvasRef.current) return;
      const rect = floorCanvasRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaX = e.clientX - dragFloorSeatStartRef.current.mouseX;
      const deltaY = e.clientY - dragFloorSeatStartRef.current.mouseY;

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      const newX = Math.round(
        Math.max(4, Math.min(96, dragFloorSeatStartRef.current.seatX + deltaPercentX))
      );
      const newY = Math.round(
        Math.max(6, Math.min(94, dragFloorSeatStartRef.current.seatY + deltaPercentY))
      );

      setFloorSeats((prev) =>
        prev.map((s) => (s.id === draggingFloorSeatId ? { ...s, x: newX, y: newY } : s))
      );
    };

    const handlePointerUp = () => {
      setDraggingFloorSeatId(null);
      dragFloorSeatStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingFloorSeatId]);

  const handleAddFloorSeat = (category: "vip" | "standard") => {
    const nextNum = floorSeats.length + 1;
    const letter = category === "vip" ? "V" : "K";
    const newSeat: FloorSeat = {
      id: `${letter}-${String(nextNum).padStart(2, "0")}`,
      label: `Khán Phòng - Ghế ${category === "vip" ? "VIP" : "Tiêu Chuẩn"} ${letter}-${String(nextNum).padStart(2, "0")}`,
      category,
      row: letter,
      number: nextNum,
      x: 50,
      y: 50,
      title: `${letter}${nextNum}`,
    };
    setFloorSeats((prev) => [...prev, newSeat]);
  };

  const handleResetFloorSeats = () => {
    setFloorSeats(generateInitialFloorSeats());
  };

  const handleDeleteFloorSeat = (seatId: string) => {
    setFloorSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  const handleAddStageSeat = () => {
    const nextNum = stageSeats.length + 1;
    const newSeat = {
      id: `SK-${String(nextNum).padStart(2, "0")}`,
      label: `Sân Khấu - Ghế SK-${String(nextNum).padStart(2, "0")}`,
      category: "vip" as const,
      row: "SK",
      number: nextNum,
      x: 50,
      y: 62,
      title: `Ghế VIP ${nextNum}`,
    };
    setStageSeats((prev) => [...prev, newSeat]);
    setStageSeatsCount((prev) => prev + 1);
  };

  const handleRemoveStageSeat = () => {
    if (stageSeats.length <= 1) return;
    setStageSeats((prev) => prev.slice(0, -1));
    setStageSeatsCount((prev) => prev - 1);
  };

  const handleResetStageSeats = () => {
    const count = stageSeats.length || 6;
    const step = 84 / (count + 1);
    setStageSeats(
      Array.from({ length: count }, (_, i) => ({
        id: `SK-${String(i + 1).padStart(2, "0")}`,
        label: `Sân Khấu - Ghế SK-${String(i + 1).padStart(2, "0")}`,
        category: "vip" as const,
        row: "SK",
        number: i + 1,
        x: Math.round(8 + (i + 1) * step),
        y: 62,
        title: i === Math.floor(count / 2) || i === Math.floor(count / 2) - 1 ? "Chủ tọa" : `Ghế ${i + 1}`,
      }))
    );
  };

  // Cinema Dynamic Row Generator
  const getRowSeats = (row: CinemaRowConfig): SeatInfo[] => {
    return Array.from({ length: row.seatsCount }, (_, i) => ({
      id: `${row.rowLetter}-${String(i + 1).padStart(2, "0")}`,
      label: `${row.name} - Ghế ${row.rowLetter}-${String(i + 1).padStart(2, "0")}`,
      category: row.category,
      row: row.rowLetter,
      number: i + 1,
    }));
  };

  const handleAddRow = () => {
    const existingLetters = cinemaRows.map((r) => r.rowLetter);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const nextLetter =
      alphabet.find((l) => !existingLetters.includes(l)) || `R${cinemaRows.length + 1}`;
    const newRow: CinemaRowConfig = {
      id: `row-${nextLetter}-${Date.now()}`,
      rowLetter: nextLetter,
      name: `Hàng Ghế ${nextLetter}`,
      category: "standard",
      seatsCount: 12,
    };
    setCinemaRows((prev) => [...prev, newRow]);
  };

  const handleRemoveRow = (rowId: string) => {
    setCinemaRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleAdjustSeatsCount = (rowId: string, delta: number) => {
    setCinemaRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const nextCount = Math.max(2, Math.min(32, r.seatsCount + delta));
        return { ...r, seatsCount: nextCount };
      }),
    );
  };

  const handleSetRowSeats = (rowId: string, count: number) => {
    const valid = Math.max(2, Math.min(32, isNaN(count) ? 2 : count));
    setCinemaRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, seatsCount: valid } : r)));
  };

  const handleResetCinema = () => {
    setCinemaRows(DEFAULT_CINEMA_ROWS);
    setStageSeatsCount(6);
    setShowStageSeats(true);
  };

  const handleDeleteTable = (tableId: string) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    if (activeTableId === tableId) {
      setActiveTableId(null);
    }
  };

  const moveTable = (tableId: string, dx: number, dy: number) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          x: Math.max(5, Math.min(95, t.x + dx)),
          y: Math.max(5, Math.min(95, t.y + dy)),
        };
      }),
    );
  };

  // Direct table seat adjuster
  const handleUpdateTableSeatsCount = (tableId: string, count: number) => {
    const valid = Math.max(2, Math.min(32, isNaN(count) ? 2 : count));
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, seatsCount: valid } : t)));
  };

  // Mouse Drag Handlers
  const handlePointerDownTable = (e: React.PointerEvent, tableId: string) => {
    if (e.button !== 0) return; // Only primary mouse button
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) return;

    setActiveTableId(tableId);
    setDraggingTableId(tableId);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      tableX: targetTable.x,
      tableY: targetTable.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    if (!draggingTableId) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      const newX = Math.round(
        Math.max(6, Math.min(94, dragStartRef.current.tableX + deltaPercentX)),
      );
      const newY = Math.round(
        Math.max(6, Math.min(95, dragStartRef.current.tableY + deltaPercentY)),
      );

      setTables((prev) =>
        prev.map((t) => (t.id === draggingTableId ? { ...t, x: newX, y: newY } : t)),
      );
    };

    const handlePointerUp = () => {
      setDraggingTableId(null);
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingTableId]);

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const newId = `T${tables.length + 1}-${Date.now().toString().slice(-4)}`;
    const newTable: BanquetTable = {
      id: newId,
      name: newTableName.trim(),
      shape: newTableShape,
      seatsCount: newTableSeats,
      isVip: newTableIsVip,
      x: 50,
      y: 50,
    };
    setTables((prev) => [...prev, newTable]);
    setActiveTableId(newId);
    setShowAddTableModal(false);
    setNewTableName("");
    setNewTableIsVip(false);
  };

  const handleUpdateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    setTables((prev) => prev.map((t) => (t.id === editingTable.id ? editingTable : t)));
    setEditingTable(null);
  };

  // --- Seat Selection Handler ---
  const handleSeatClick = (seatLabel: string, seatId: string) => {
    const occupant = occupiedSeats[seatId] || occupiedSeats[seatLabel];
    const isOccupied = !!occupant && seatLabel !== currentSeat && seatId !== currentSeat;
    if (isOccupied) return;

    setSelectedSeatId(seatLabel);
    onSelectSeat(seatLabel);
  };

  const getSeatStatus = (seatLabel: string, seatId: string) => {
    const isSelected =
      selectedSeatId === seatLabel ||
      selectedSeatId === seatId ||
      currentSeat === seatLabel ||
      currentSeat === seatId;
    const occupant = occupiedSeats[seatId] || occupiedSeats[seatLabel];
    const isOccupied = !!occupant && !isSelected;

    return { isSelected, isOccupied, occupant };
  };

  // --- Render Single Cinema Seat ---
  const renderCinemaSeatBtn = (seat: SeatInfo) => {
    const { isSelected, isOccupied, occupant } = getSeatStatus(seat.label, seat.id);

    let bgClass =
      "bg-muted text-muted-foreground border-border hover:border-primary/60 hover:bg-primary/10";
    if (seat.category === "vip") {
      bgClass =
        "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500";
    }

    if (isOccupied) {
      bgClass =
        "bg-rose-500/10 text-rose-500/70 dark:text-rose-400/60 border-rose-500/30 cursor-not-allowed opacity-60 line-through select-none";
    }

    if (isSelected) {
      bgClass =
        "bg-emerald-600 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-105 ring-2 ring-emerald-400";
    }

    return (
      <button
        key={seat.id}
        type="button"
        disabled={isOccupied}
        onClick={() => handleSeatClick(seat.label, seat.id)}
        onMouseEnter={() =>
          setHoveredSeat({
            id: seat.id,
            label: seat.label,
            occupant: occupant?.attendeeName,
          })
        }
        onMouseLeave={() => setHoveredSeat(null)}
        title={
          isOccupied
            ? `${seat.label} - [ĐÃ CÓ CHỦ: ${occupant?.attendeeName || "Hội viên"}] - Không thể chọn`
            : isSelected
              ? `${seat.label} (Đang chọn)`
              : `${seat.label} (Còn trống - Click để chọn)`
        }
        className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-[10px] sm:text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center ${
          isOccupied ? "cursor-not-allowed" : "cursor-pointer"
        } ${bgClass}`}
      >
        {isSelected ? (
          <Check className="w-4 h-4 stroke-[3]" />
        ) : isOccupied ? (
          <Lock className="w-3.5 h-3.5 text-rose-500/80" />
        ) : (
          <span className="leading-none">{seat.number}</span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full select-none rounded-2xl border border-border bg-card/60 p-4 sm:p-6 backdrop-blur-md shadow-inner text-center">
      {/* 1. Mode Switcher: Cinema vs Banquet */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border pb-3 mb-5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
          <button
            type="button"
            onClick={() => setMode("cinema")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "cinema"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hội Trường / Sân Khấu Sự Kiện
          </button>
          <button
            type="button"
            onClick={() => setMode("banquet")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "banquet"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bàn Tiệc Hội Nghị / Gala Dinner
          </button>
        </div>

        {/* Toolbar based on mode */}
        {mode === "cinema" ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Thêm hàng ghế mới ở hội trường"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Hàng Ghế</span>
            </button>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Ghế Sân Khấu:</span>
              <button
                type="button"
                onClick={() => setStageSeatsCount((c) => Math.max(2, c - 1))}
                disabled={stageSeatsCount <= 2}
                className="p-0.5 rounded hover:bg-amber-500/20 cursor-pointer disabled:opacity-40"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min={2}
                max={24}
                value={stageSeatsCount}
                onChange={(e) =>
                  setStageSeatsCount(Math.max(2, Math.min(24, parseInt(e.target.value, 10) || 2)))
                }
                className="w-10 h-6 text-center text-xs font-mono font-bold rounded border border-amber-500/40 bg-background text-amber-700 dark:text-amber-300 outline-none"
              />
              <button
                type="button"
                onClick={() => setStageSeatsCount((c) => Math.min(24, c + 1))}
                disabled={stageSeatsCount >= 24}
                className="p-0.5 rounded hover:bg-amber-500/20 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleResetCinema}
              title="Đặt lại sơ đồ ghế mặc định"
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddTableModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Bàn Tiệc</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTables(DEFAULT_BANQUET_TABLES);
                setActiveTableId("T1");
              }}
              title="Đặt lại sơ đồ mặc định"
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. CINEMA / STAGE THEATER MODE */}
      {mode === "cinema" && (
        <div>
          {/* Cinema Stage Arc with Drag-and-Drop Stage Seating */}
          <div className="mx-auto max-w-2xl mb-6">
            <div className="relative flex flex-col items-center">
              <div
                ref={stageCanvasRef}
                className="relative w-full h-44 sm:h-48 pt-3 pb-4 px-4 rounded-t-2xl rounded-b-[70px] border-2 border-amber-500/70 bg-gradient-to-b from-amber-500/10 via-amber-500/20 to-amber-500/30 shadow-[0_10px_25px_rgba(245,158,11,0.2)] overflow-hidden"
              >
                {/* Stage Header Info & Quick Re-align button */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono">
                      SÂN KHẤU CHÍNH ({stageSeats.length} GHẾ)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleResetStageSeats}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-[10px] font-bold text-amber-800 dark:text-amber-200 border border-amber-500/40 cursor-pointer"
                      title="Căn đều lại ghế trên sân khấu theo hình vòng cung"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Căn đều</span>
                    </button>
                    <span className="text-[9.5px] text-amber-800/80 dark:text-amber-300/80 hidden sm:inline font-medium">
                      (Kéo thả từng ghế tự do)
                    </span>
                  </div>
                </div>

                {/* Seats directly arranged and draggable ON the stage */}
                {showStageSeats &&
                  stageSeats.map((seat) => {
                    const isOccupied = occupiedSeats[seat.label] || occupiedSeats[seat.id];
                    const isSelected = selectedSeatId === seat.label || selectedSeatId === seat.id;
                    const isDragging = draggingStageSeatId === seat.id;

                    return (
                      <div
                        key={seat.id}
                        onPointerDown={(e) => handlePointerDownStageSeat(e, seat.id)}
                        onClick={() => {
                          if (!isOccupied) {
                            setSelectedSeatId(seat.label);
                            onSelectSeat(seat.label);
                          }
                        }}
                        onMouseEnter={() =>
                          setHoveredSeat({
                            id: seat.id,
                            label: seat.label,
                            occupant: isOccupied?.attendeeName,
                          })
                        }
                        onMouseLeave={() => setHoveredSeat(null)}
                        style={{
                          left: `${seat.x}%`,
                          top: `${seat.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        className={`absolute flex flex-col items-center justify-center min-w-[56px] px-2 py-1 rounded-xl transition-all cursor-grab active:cursor-grabbing select-none ${
                          isDragging
                            ? "scale-110 z-30 ring-2 ring-amber-400 shadow-2xl"
                            : "z-10 hover:scale-105 shadow-md"
                        } ${
                          isSelected
                            ? "bg-emerald-500 text-white font-bold ring-2 ring-white"
                            : isOccupied
                              ? "bg-rose-500/80 text-white border border-rose-400"
                              : "bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 font-black border border-amber-300"
                        }`}
                        title={`${seat.label} - Kéo chuột để di chuyển vị trí`}
                      >
                        <div className="flex items-center gap-0.5 text-[9.5px] uppercase font-mono tracking-tight font-black">
                          <Crown className="w-2.5 h-2.5 shrink-0" />
                          <span>{seat.id}</span>
                        </div>
                        <span className="text-[8.5px] font-bold truncate max-w-[58px] text-center leading-tight">
                          {isOccupied ? isOccupied.attendeeName : seat.title || `Ghế ${seat.number}`}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <div className="w-64 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[1px] -mt-0.5" />
            </div>
          </div>

          {/* Stage Under-Area: Toggle Between Manual Freeform Drag & Drop and Standard Rows */}
          <div className="mx-auto max-w-3xl mb-4 flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/70 border border-border">
              <button
                type="button"
                onClick={() => setCinemaViewMode("floor-manual")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  cinemaViewMode === "floor-manual"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>Xếp Ghế Bằng Tay (Kéo Thả Tự Do)</span>
              </button>
              <button
                type="button"
                onClick={() => setCinemaViewMode("rows")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  cinemaViewMode === "rows"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GripHorizontal className="w-3.5 h-3.5" />
                <span>Xem Theo Hàng Cố Định</span>
              </button>
            </div>

            {cinemaViewMode === "floor-manual" && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddFloorSeat("vip")}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-3 h-3 text-amber-500" />
                  <span>+ Ghế VIP</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFloorSeat("standard")}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-800 dark:text-sky-200 border border-sky-500/40 text-[11px] font-bold cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-3 h-3 text-sky-500" />
                  <span>+ Ghế Tiêu Chuẩn</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetFloorSeats}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-[11px] font-bold cursor-pointer transition border border-border"
                  title="Căn đều lại vị trí các ghế khán phòng"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Căn Đều</span>
                </button>
              </div>
            )}
          </div>

          {/* 2A. INTERACTIVE FLOOR CANVAS (DRAGGABLE SEATS UNDER STAGE) */}
          {cinemaViewMode === "floor-manual" ? (
            <div className="mx-auto max-w-3xl mb-8">
              <div className="text-[11px] text-muted-foreground font-medium text-center mb-2 flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Bạn có thể <strong>kéo rê từng chiếc ghế bằng chuột/tay</strong> để sắp xếp sơ đồ khán phòng dưới sân khấu tùy ý.</span>
              </div>

              <div
                ref={floorCanvasRef}
                className="relative w-full h-[480px] sm:h-[520px] rounded-2xl border-2 border-dashed border-border/80 bg-slate-950/90 shadow-2xl overflow-hidden p-4 select-none"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                {/* Sàn khán phòng & ánh đèn sân khấu hắt xuống */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent pointer-events-none" />

                <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] font-mono uppercase font-black tracking-widest text-slate-400">
                  <span>KHÁN PHÒNG DƯỚI SÂN KHẤU ({floorSeats.length} GHẾ)</span>
                </div>

                {/* Các ghế xếp tự do dưới sân khấu */}
                {floorSeats.map((seat) => {
                  const isOccupied = occupiedSeats[seat.label] || occupiedSeats[seat.id];
                  const isSelected = selectedSeatId === seat.label || selectedSeatId === seat.id;
                  const isDragging = draggingFloorSeatId === seat.id;

                  return (
                    <div
                      key={seat.id}
                      onPointerDown={(e) => handlePointerDownFloorSeat(e, seat.id)}
                      onClick={() => {
                        if (!isOccupied) {
                          setSelectedSeatId(seat.label);
                          onSelectSeat(seat.label);
                        }
                      }}
                      onMouseEnter={() =>
                        setHoveredSeat({
                          id: seat.id,
                          label: seat.label,
                          occupant: isOccupied?.attendeeName,
                        })
                      }
                      onMouseLeave={() => setHoveredSeat(null)}
                      style={{
                        left: `${seat.x}%`,
                        top: `${seat.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className={`absolute flex flex-col items-center justify-center min-w-[46px] sm:min-w-[50px] px-2 py-1.5 rounded-xl transition-transform cursor-grab active:cursor-grabbing select-none ${
                        isDragging
                          ? "scale-115 z-30 ring-2 ring-amber-400 shadow-2xl brightness-125"
                          : "z-10 hover:scale-105 shadow-md"
                      } ${
                        isSelected
                          ? "bg-emerald-600 text-white font-black ring-2 ring-emerald-300 shadow-emerald-500/50 shadow-lg"
                          : isOccupied
                          ? "bg-rose-600/80 text-white border border-rose-400 opacity-60 line-through"
                          : seat.category === "vip"
                          ? "bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 font-black border border-amber-300 shadow-amber-500/20"
                          : "bg-slate-800 text-white font-bold border border-slate-700 hover:border-sky-400 shadow-xs"
                      }`}
                      title={`${seat.label} - Giữ chuột để kéo sang vị trí khác`}
                    >
                      <span className="text-[9.5px] uppercase font-mono tracking-tight font-black leading-none">
                        {seat.id}
                      </span>
                      <span className="text-[8px] font-semibold truncate max-w-[46px] text-center leading-tight mt-0.5 opacity-90">
                        {isOccupied ? isOccupied.attendeeName : seat.title || `${seat.row}${seat.number}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 2B. Traditional Rows */
            <div className="space-y-4 max-w-3xl mx-auto overflow-x-auto pb-16 min-h-[300px]">
            {(cinemaRows || []).map((row) => {
              const seats = getRowSeats(row);
              const half = Math.ceil(seats.length / 2);
              const leftGroup = seats.slice(0, half);
              const rightGroup = seats.slice(half);

              return (
                <div
                  key={row.id}
                  className={`rounded-xl border p-2.5 sm:p-3 transition-all ${
                    row.category === "vip"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-card/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          row.category === "vip"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-foreground"
                        }`}
                      >
                        {row.name} ({row.seatsCount} ghế)
                      </span>
                      {row.category === "vip" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">
                          VIP
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                        Số ghế:
                      </span>
                      <div className="flex items-center gap-0.5 bg-background/80 px-1 py-0.5 rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => handleAdjustSeatsCount(row.id, -1)}
                          disabled={row.seatsCount <= 2}
                          title="Bớt 1 ghế ở hàng này"
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-40"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={2}
                          max={32}
                          value={row.seatsCount}
                          onChange={(e) =>
                            handleSetRowSeats(row.id, parseInt(e.target.value, 10) || 2)
                          }
                          className="w-10 h-6 text-center text-xs font-bold font-mono border-0 bg-transparent text-foreground outline-none"
                          title="Nhập trực tiếp số lượng ghế cho hàng này"
                        />
                        <button
                          type="button"
                          onClick={() => handleAdjustSeatsCount(row.id, 1)}
                          disabled={row.seatsCount >= 32}
                          title="Thêm 1 ghế vào hàng này"
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {cinemaRows.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          title={`Xóa ${row.name}`}
                          className="ml-1 p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seat Buttons with aisle in the middle */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className="w-5 text-xs font-black font-mono text-muted-foreground">
                      {row.rowLetter}
                    </span>
                    <div className="flex gap-1 sm:gap-1.5">
                      {leftGroup.map(renderCinemaSeatBtn)}
                    </div>
                    <div className="w-3 sm:w-6 flex items-center justify-center">
                      <span className="h-4 w-[1px] bg-border" />
                    </div>
                    <div className="flex gap-1 sm:gap-1.5">
                      {rightGroup.map(renderCinemaSeatBtn)}
                    </div>
                    <span className="w-5 text-xs font-black font-mono text-muted-foreground">
                      {row.rowLetter}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Row at the bottom */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm hàng ghế bên dưới</span>
              </button>
            </div>
          </div>
          )}

          {/* Seat Status Legend */}
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border border-border bg-muted" />
              <span className="text-muted-foreground">Ghế trống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border border-amber-500/40 bg-amber-500/20" />
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                Ghế VIP / Sân khấu
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border border-emerald-500 bg-emerald-600 flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">Đang chọn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border border-rose-500/40 bg-rose-500/20 flex items-center justify-center text-rose-500 text-[10px]">
                ✕
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                Đã có chủ (Disable)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. BANQUET TABLE MODE */}
      {mode === "banquet" && (
        <div className="space-y-4">
          {/* Stage / Backdrop Top Header */}
          <div className="mx-auto max-w-md">
            <div className="py-2 px-6 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 text-center">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-700 dark:text-amber-300 font-mono">
                SÂN KHẤU CHÍNH & BACKDROP DẠ TIỆC
              </span>
            </div>
          </div>

          {/* Drag & Drop Hint Banner */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-left text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <Move className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
              <span>
                <strong>Di chuột kéo thả bàn tiệc:</strong> Nhấp & giữ chuột trực tiếp vào bàn để
                kéo thả vị trí linh hoạt trên khán phòng • Nhập số lượng ghế tùy ý.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
              Kéo chuột tự do
            </span>
          </div>

          {/* Active Table Quick Control Bar */}
          {activeTable && (
            <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl border border-border bg-muted/40 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">
                  Đang chọn:{" "}
                  <strong className="text-amber-600 dark:text-amber-400">{activeTable.name}</strong>
                </span>

                {/* Direct Seats Number Input */}
                <div className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded-lg border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground">Số ghế:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateTableSeatsCount(activeTable.id, activeTable.seatsCount - 1)
                    }
                    disabled={activeTable.seatsCount <= 2}
                    className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
                    title="Giảm 1 ghế"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={2}
                    max={32}
                    value={activeTable.seatsCount}
                    onChange={(e) =>
                      handleUpdateTableSeatsCount(activeTable.id, parseInt(e.target.value, 10) || 2)
                    }
                    className="w-11 h-6 text-center text-xs font-bold font-mono border border-border rounded bg-muted/30 text-foreground outline-none focus:border-primary"
                    title="Nhập số lượng ghế của bàn"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateTableSeatsCount(activeTable.id, activeTable.seatsCount + 1)
                    }
                    disabled={activeTable.seatsCount >= 32}
                    className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
                    title="Tăng 1 ghế"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingTable(activeTable)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Chỉnh sửa chi tiết bàn"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTable(activeTable.id)}
                  className="p-1 rounded text-rose-500 hover:text-rose-600 cursor-pointer"
                  title="Xóa bàn này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Coordinates Indicator & D-Pad Position Adjuster */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-[10px] font-mono font-bold text-muted-foreground px-2 py-0.5 rounded bg-background border border-border">
                  Tọa độ: X: {activeTable.x}% • Y: {activeTable.y}%
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveTable(activeTable.id, -4, 0)}
                    className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-xs font-bold cursor-pointer"
                    title="Sang trái 4%"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTable(activeTable.id, 4, 0)}
                    className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-xs font-bold cursor-pointer"
                    title="Sang phải 4%"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTable(activeTable.id, 0, -4)}
                    className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-xs font-bold cursor-pointer"
                    title="Lên trên 4%"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTable(activeTable.id, 0, 4)}
                    className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-xs font-bold cursor-pointer"
                    title="Xuống dưới 4%"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive 2D Banquet Hall Canvas with Mouse Drag Support */}
          <div
            ref={canvasRef}
            className="relative w-full h-[640px] rounded-2xl border border-border bg-slate-950/40 dark:bg-black/50 overflow-hidden p-4 shadow-inner select-none"
          >
            {/* Floor Grid Lines */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(216,178,130,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(216,178,130,0.3) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Banquet Tables Render */}
            {(tables || []).map((table) => {
              const isSelectedTable = activeTableId === table.id;
              const isDraggingThis = draggingTableId === table.id;

              // Generate seats for this table
              const tableSeats = Array.from({ length: table.seatsCount }, (_, i) => {
                const seatNum = i + 1;
                const seatId = `${table.id}-${String(seatNum).padStart(2, "0")}`;
                const seatLabel = `${table.name} - Ghế ${seatNum}`;
                return { seatId, seatNum, seatLabel };
              });

              return (
                <div
                  key={table.id}
                  onPointerDown={(e) => handlePointerDownTable(e, table.id)}
                  onClick={() => setActiveTableId(table.id)}
                  style={{
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                  }}
                  className={`absolute select-none transition-transform duration-75 ${
                    isDraggingThis
                      ? "cursor-grabbing z-30 scale-105 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] ring-2 ring-amber-400 rounded-2xl"
                      : isSelectedTable
                        ? "cursor-grab z-20 scale-105"
                        : "cursor-grab z-10 hover:scale-102 hover:z-20"
                  }`}
                  title="Nhấp giữ & kéo chuột để di chuyển bàn này"
                >
                  {/* Floating drag coordinates tooltip */}
                  {isDraggingThis && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/95 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/60 shadow-xl pointer-events-none whitespace-nowrap z-50 flex items-center gap-1 animate-pulse">
                      <Move className="w-2.5 h-2.5" />
                      <span>
                        X: {table.x}% • Y: {table.y}%
                      </span>
                    </div>
                  )}

                  {table.shape === "round" ? (
                    // --- Round Table ---
                    <div className="relative flex items-center justify-center">
                      {/* Central Table Surface */}
                      <div
                        className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center p-2 text-center transition-all ${
                          table.isVip
                            ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            : isSelectedTable
                              ? "bg-primary/20 border-primary text-foreground shadow-[0_0_15px_rgba(0,75,145,0.3)]"
                              : "bg-muted/70 border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <span className="text-[11px] font-black leading-tight line-clamp-2">
                          {table.name}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-mono mt-0.5 opacity-80">
                          <Move className="w-2.5 h-2.5 opacity-60" />
                          <span>{table.seatsCount} chỗ</span>
                        </div>
                      </div>

                      {/* Surrounding Round Table Seats */}
                      {tableSeats.map((s, idx) => {
                        const angle = (idx / table.seatsCount) * (2 * Math.PI) - Math.PI / 2;
                        const radius = 66; // Distance from center
                        const seatX = Math.cos(angle) * radius;
                        const seatY = Math.sin(angle) * radius;

                        const { isSelected, isOccupied, occupant } = getSeatStatus(
                          s.seatLabel,
                          s.seatId,
                        );

                        let seatClass =
                          "bg-muted/90 text-foreground border-border hover:border-primary hover:bg-primary/20";
                        if (table.isVip) {
                          seatClass =
                            "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30";
                        }
                        if (isOccupied) {
                          seatClass =
                            "bg-slate-700 text-slate-400 border-slate-600/30 cursor-not-allowed opacity-60";
                        }
                        if (isSelected) {
                          seatClass =
                            "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.8)] scale-110";
                        }

                        return (
                          <button
                            key={s.seatId}
                            type="button"
                            disabled={isOccupied}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeatClick(s.seatLabel, s.seatId);
                            }}
                            onMouseEnter={() =>
                              setHoveredSeat({
                                id: s.seatId,
                                label: s.seatLabel,
                                occupant: occupant?.attendeeName,
                              })
                            }
                            onMouseLeave={() => setHoveredSeat(null)}
                            style={{
                              transform: `translate(${seatX}px, ${seatY}px)`,
                            }}
                            title={
                              isOccupied
                                ? `${s.seatLabel} - Đã có: ${occupant?.attendeeName}`
                                : isSelected
                                  ? `${s.seatLabel} (Đang chọn)`
                                  : `${s.seatLabel} (Click để chọn)`
                            }
                            className={`absolute w-7 h-7 rounded-full border text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${seatClass}`}
                          >
                            {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.seatNum}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // --- Rectangular Table ---
                    <div className="relative flex flex-col items-center justify-center">
                      {/* Top Row Seats */}
                      <div className="flex gap-2 mb-1.5">
                        {tableSeats.slice(0, Math.ceil(table.seatsCount / 2)).map((s) => {
                          const { isSelected, isOccupied, occupant } = getSeatStatus(
                            s.seatLabel,
                            s.seatId,
                          );
                          let seatClass =
                            "bg-muted/90 text-foreground border-border hover:border-primary hover:bg-primary/20";
                          if (table.isVip)
                            seatClass =
                              "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30";
                          if (isOccupied)
                            seatClass =
                              "bg-slate-700 text-slate-400 border-slate-600/30 cursor-not-allowed opacity-60";
                          if (isSelected)
                            seatClass =
                              "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300 shadow-md scale-110";

                          return (
                            <button
                              key={s.seatId}
                              type="button"
                              disabled={isOccupied}
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeatClick(s.seatLabel, s.seatId);
                              }}
                              onMouseEnter={() =>
                                setHoveredSeat({
                                  id: s.seatId,
                                  label: s.seatLabel,
                                  occupant: occupant?.attendeeName,
                                })
                              }
                              onMouseLeave={() => setHoveredSeat(null)}
                              title={
                                isOccupied
                                  ? `${s.seatLabel} - Đã có: ${occupant?.attendeeName}`
                                  : isSelected
                                    ? `${s.seatLabel} (Đang chọn)`
                                    : `${s.seatLabel} (Click để chọn)`
                              }
                              className={`w-7 h-7 rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${seatClass}`}
                            >
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                s.seatNum
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Central Rectangular Table Surface */}
                      <div
                        className={`w-44 h-16 rounded-xl border-2 flex flex-col items-center justify-center px-2 text-center transition-all ${
                          table.isVip
                            ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            : isSelectedTable
                              ? "bg-primary/20 border-primary text-foreground shadow-[0_0_15px_rgba(0,75,145,0.3)]"
                              : "bg-muted/70 border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <span className="text-[11px] font-black leading-tight line-clamp-1">
                          {table.name}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-mono mt-0.5 opacity-80">
                          <Move className="w-2.5 h-2.5 opacity-60" />
                          <span>{table.seatsCount} chỗ ngồi</span>
                        </div>
                      </div>

                      {/* Bottom Row Seats */}
                      <div className="flex gap-2 mt-1.5">
                        {tableSeats.slice(Math.ceil(table.seatsCount / 2)).map((s) => {
                          const { isSelected, isOccupied, occupant } = getSeatStatus(
                            s.seatLabel,
                            s.seatId,
                          );
                          let seatClass =
                            "bg-muted/90 text-foreground border-border hover:border-primary hover:bg-primary/20";
                          if (table.isVip)
                            seatClass =
                              "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30";
                          if (isOccupied)
                            seatClass =
                              "bg-slate-700 text-slate-400 border-slate-600/30 cursor-not-allowed opacity-60";
                          if (isSelected)
                            seatClass =
                              "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300 shadow-md scale-110";

                          return (
                            <button
                              key={s.seatId}
                              type="button"
                              disabled={isOccupied}
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeatClick(s.seatLabel, s.seatId);
                              }}
                              onMouseEnter={() =>
                                setHoveredSeat({
                                  id: s.seatId,
                                  label: s.seatLabel,
                                  occupant: occupant?.attendeeName,
                                })
                              }
                              onMouseLeave={() => setHoveredSeat(null)}
                              title={
                                isOccupied
                                  ? `${s.seatLabel} - Đã có: ${occupant?.attendeeName}`
                                  : isSelected
                                    ? `${s.seatLabel} (Đang chọn)`
                                    : `${s.seatLabel} (Click để chọn)`
                              }
                              className={`w-7 h-7 rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${seatClass}`}
                            >
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                s.seatNum
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Hover & Selected Status Bar */}
      <div className="mt-4 min-h-[28px] text-xs font-medium">
        {hoveredSeat ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border">
            <span>{hoveredSeat.label}</span>
            {hoveredSeat.occupant ? (
              <span className="text-rose-600 font-bold">• Đã xếp: {hoveredSeat.occupant}</span>
            ) : (
              <span className="text-emerald-600 font-bold">• Ghế còn trống (Click để chọn)</span>
            )}
          </span>
        ) : selectedSeatId ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
            <Check className="w-3.5 h-3.5" />
            <span>Vị trí đã chọn: {selectedSeatId}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            Click vào ghế bất kỳ trên sơ đồ để chọn chỗ ngồi
          </span>
        )}
      </div>

      {/* 5. Clean Geometric Legend (No random tacky icons) */}
      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-center gap-5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500" />
          <span className="text-muted-foreground">Bàn / Ghế VIP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-muted border border-border" />
          <span className="text-muted-foreground">Tiêu chuẩn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-400 dark:bg-slate-700 border border-slate-500/20" />
          <span className="text-muted-foreground">Đã có người</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-emerald-500 ring-1 ring-emerald-400" />
          <span className="text-emerald-600 font-bold">Đang chọn</span>
        </div>
      </div>

      {/* Modal Thêm Bàn Tiệc Mới */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl text-left">
            <h4 className="text-sm font-bold text-foreground mb-3">Thêm Bàn Tiệc Mới Vào Sơ Đồ</h4>
            <form onSubmit={handleAddTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Tên Bàn Tiệc
                </label>
                <input
                  type="text"
                  required
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Ví dụ: Bàn 08 - Doanh Nghiệp FDI"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Kiểu Bàn
                  </label>
                  <select
                    value={newTableShape}
                    onChange={(e) => setNewTableShape(e.target.value as "round" | "rect")}
                    className="w-full rounded-xl border border-border bg-background px-2 py-2 text-xs text-foreground outline-none"
                  >
                    <option value="round">Bàn Tròn</option>
                    <option value="rect">Bàn Chữ Nhật</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Số Lượng Ghế (Có ô nhập)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={32}
                    required
                    value={newTableSeats}
                    onChange={(e) =>
                      setNewTableSeats(Math.max(2, Math.min(32, parseInt(e.target.value, 10) || 2)))
                    }
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold font-mono text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Quick Preset Seats Chips */}
              <div>
                <span className="block text-[11px] text-muted-foreground mb-1">
                  Chọn nhanh số ghế:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[6, 8, 10, 12, 16, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setNewTableSeats(cnt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        newTableSeats === cnt
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                          : "bg-muted text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {cnt} ghế
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newTableVip"
                  checked={newTableIsVip}
                  onChange={(e) => setNewTableIsVip(e.target.checked)}
                  className="rounded border-border"
                />
                <label
                  htmlFor="newTableVip"
                  className="text-xs text-foreground font-medium cursor-pointer"
                >
                  Đặt làm Bàn VIP (Viền Vàng Hoàng Gia)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Tạo Bàn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Bàn Tiệc */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl text-left">
            <h4 className="text-sm font-bold text-foreground mb-3">Chỉnh Sửa Thông Tin Bàn Tiệc</h4>
            <form onSubmit={handleUpdateTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Tên Bàn Tiệc
                </label>
                <input
                  type="text"
                  required
                  value={editingTable.name}
                  onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Kiểu Bàn
                  </label>
                  <select
                    value={editingTable.shape}
                    onChange={(e) =>
                      setEditingTable({
                        ...editingTable,
                        shape: e.target.value as "round" | "rect",
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-2 py-2 text-xs text-foreground outline-none"
                  >
                    <option value="round">Bàn Tròn</option>
                    <option value="rect">Bàn Chữ Nhật</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Số Lượng Ghế (Có ô nhập)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={32}
                    required
                    value={editingTable.seatsCount}
                    onChange={(e) =>
                      setEditingTable({
                        ...editingTable,
                        seatsCount: Math.max(2, Math.min(32, parseInt(e.target.value, 10) || 2)),
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold font-mono text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Quick Preset Seats Chips */}
              <div>
                <span className="block text-[11px] text-muted-foreground mb-1">
                  Chọn nhanh số ghế:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[6, 8, 10, 12, 16, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() =>
                        setEditingTable({
                          ...editingTable,
                          seatsCount: cnt,
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        editingTable.seatsCount === cnt
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {cnt} ghế
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editTableVip"
                  checked={editingTable.isVip || false}
                  onChange={(e) => setEditingTable({ ...editingTable, isVip: e.target.checked })}
                  className="rounded border-border"
                />
                <label
                  htmlFor="editTableVip"
                  className="text-xs text-foreground font-medium cursor-pointer"
                >
                  Bàn VIP (Viền Vàng Hoàng Gia)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
