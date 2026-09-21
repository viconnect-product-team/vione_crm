import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Crown,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  X,
  ChevronDown,
  Compass,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Phone,
  Mail,
  RefreshCw,
  Search,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { submitClubApplication, checkClubRegistrationStatus } from "@/lib/club-application.functions";
import { fetchNestApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

/** ========================================================================= */
/** OFFICIAL DATA FROM CEO 1983 (TUYỆT ĐỐI KHÔNG DÙNG TỪ "DIỀU", "CÁ")        */
/** ========================================================================= */

const LEADERSHIP_MEMBERS = [
  {
    name: "Anh Lê Xuân Tùng",
    role: "Chủ tịch CLB CEO 1983",
    company: "Chủ tịch HĐQT Tập đoàn V-Group",
    quote: "Đoàn kết thế hệ 1983 để cùng nhau bứt phá vươn tầm quốc tế.",
    img: "/ceo1983-official-logo.png",
  },
  {
    name: "Anh Nguyễn Mạnh Thắng",
    role: "Phó Chủ tịch Thường trực",
    company: "Tổng Giám đốc TN Tech",
    quote: "Giao thương thực chất trên nền tảng công nghệ số tiên phong.",
    img: "/ceo1983-official-logo.png",
  },
  {
    name: "Chị Hoàng Thị Mai Phương",
    role: "Phó Chủ tịch Đối ngoại",
    company: "Phó Tổng Giám đốc Alphanam Group",
    quote: "Mở rộng mạng lưới hợp tác đa phương, lan tỏa vị thế doanh nhân.",
    img: "/ceo1983-official-logo.png",
  },
  {
    name: "Anh Vũ Tuấn Dũng",
    role: "Tổng Thư Ký CLB",
    company: "Chủ tịch HĐQT Dũng Việt Holdings",
    quote: "Kỷ cương, chuẩn mực và phụng sự vì sự phát triển bền vững.",
    img: "/ceo1983-official-logo.png",
  },
];

const SCENE_MENU = [
  { id: "scene-sky", num: "01", label: "Khởi Nguyên" },
  { id: "scene-birds", num: "02", label: "Liên Minh" },
  { id: "scene-kites", num: "03", label: "Vươn Tầm" },
  { id: "scene-villas", num: "04", label: "Thịnh Vượng" },
  { id: "scene-water", num: "05", label: "Trầm Lắng" },
  { id: "scene-underwater", num: "06", label: "Bản Lĩnh" },
];

export function Ceo1983CinematicInteractiveWorldLanding() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeScene, setActiveScene] = useState("scene-sky");
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modal State Navigation (apply vs status)
  const [modalTab, setModalTab] = useState<"apply" | "status">("apply");
  const [lookupPhone, setLookupPhone] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    found?: boolean;
    status?: "pending" | "approved" | "rejected";
    isApproved?: boolean;
    hasAccount?: boolean;
    name?: string;
    company?: string;
    memberCode?: string;
    phone?: string;
    email?: string;
    message?: string;
    reference?: string;
  } | null>(null);

  // Account creation state on approved status
  const [accountForm, setAccountForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    title: "",
    revenue: "10 - 50 Tỷ VNĐ",
  });

  // Restore remembered phone from local storage when modal opens
  useEffect(() => {
    if (modalOpen && !lookupPhone) {
      try {
        const saved = localStorage.getItem("vba_last_registration");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.phone) {
            setLookupPhone(parsed.phone);
            if (!formData.phone) {
              setFormData((prev) => ({
                ...prev,
                fullName: parsed.fullName || prev.fullName,
                phone: parsed.phone,
                email: parsed.email || prev.email,
                company: parsed.company || prev.company,
              }));
            }
          }
        }
      } catch {}
    }
  }, [modalOpen]);

  const performStatusCheck = async (phoneToCheck: string, emailToCheck = "", refCodeFallback = "", silent = false) => {
    const raw = phoneToCheck.trim();
    if (!raw) {
      if (!silent) toast.error("Vui lòng nhập số điện thoại cần tra cứu");
      return;
    }
    if (!silent) setCheckingStatus(true);
    try {
      const res = await checkClubRegistrationStatus({
        data: {
          phone: raw,
          email: emailToCheck.trim() || undefined,
        },
      });

      if (res && res.found) {
        const wasNotApproved = !statusResult?.isApproved;
        setStatusResult({
          ...res,
          reference: refCodeFallback || (res as any).reference || `MB-${raw.slice(-4)}`,
        });
        if (res.isApproved) {
          if (wasNotApproved && silent) {
            toast.success("🎉 Hồ sơ của Quý CEO đã được Ban Thư Ký CLB CEO 1983 phê duyệt thành công!");
          }
          setAccountForm((prev) => ({
            ...prev,
            username: prev.username || raw,
          }));
        }
      } else {
        // If not found in members table yet, treat freshly submitted application as pending
        setStatusResult({
          found: true,
          status: "pending",
          isApproved: false,
          name: formData.fullName || "Quý CEO",
          company: formData.company || "Doanh nghiệp thành viên",
          phone: raw,
          reference: refCodeFallback || `APP-${raw.slice(-4)}`,
          message: "Hồ sơ đã được tiếp nhận và đang trong quá trình thẩm định của Ban Thư Ký CLB CEO 1983.",
        });
      }
    } catch {
      if (!silent) {
        setStatusResult({
          found: true,
          status: "pending",
          isApproved: false,
          name: formData.fullName || "Quý CEO",
          company: formData.company || "Doanh nghiệp thành viên",
          phone: raw,
          reference: refCodeFallback || `APP-${raw.slice(-4)}`,
          message: "Hồ sơ đang chờ thẩm định từ Ban Thư Ký CLB.",
        });
      }
    } finally {
      if (!silent) setCheckingStatus(false);
    }
  };

  // Tự động reload / poll trạng thái phê duyệt hồ sơ mỗi 4s khi đang mở tab trạng thái
  useEffect(() => {
    if (!modalOpen || modalTab !== "status" || !lookupPhone.trim() || statusResult?.isApproved) {
      return;
    }
    const interval = setInterval(() => {
      void performStatusCheck(lookupPhone.trim(), formData.email || "", statusResult?.reference || "", true);
    }, 4000);
    return () => clearInterval(interval);
  }, [modalOpen, modalTab, lookupPhone, statusResult?.isApproved, statusResult?.reference, formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.company.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitClubApplication({
        data: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email?.trim() || "",
          company: formData.company.trim(),
          title: formData.title?.trim() || "Chủ tịch / CEO",
          revenue: formData.revenue,
          industry: "Thành viên gia nhập trực tuyến",
          clubSlug: "ceo-1983",
        },
      });

      const refCode = res?.reference || `APP-MB${Date.now().toString(36).toUpperCase()}`;

      // Save to localStorage for quick retrieval
      try {
        localStorage.setItem(
          "vba_last_registration",
          JSON.stringify({
            phone: formData.phone.trim(),
            email: formData.email?.trim() || "",
            fullName: formData.fullName.trim(),
            company: formData.company.trim(),
            refCode,
            date: new Date().toISOString(),
          })
        );
      } catch {}

      toast.success("Nộp hồ sơ thành công!");

      // Set phone for lookup and immediately switch to Status tab (DO NOT CLOSE MODAL)
      setLookupPhone(formData.phone.trim());
      setAccountForm((prev) => ({
        ...prev,
        username: formData.phone.trim(),
      }));

      // Switch to status tab to show 3-state display
      setModalTab("status");

      // Check real-time status
      void performStatusCheck(formData.phone.trim(), formData.email?.trim() || "", refCode);
    } catch {
      toast.error("Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = accountForm.username.trim();
    if (!uname || !accountForm.password) {
      toast.error("Vui lòng điền tên đăng nhập và mật khẩu");
      return;
    }
    if (accountForm.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (accountForm.password !== accountForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setCreatingAccount(true);
    try {
      // 1. Call Register
      try {
        await fetchNestApi("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            username: uname,
            password: accountForm.password,
            name: statusResult?.name || formData.fullName,
            phone: statusResult?.phone || formData.phone,
          }),
        });
      } catch (regErr: any) {
        // If user already exists, proceed
        console.log("Register note:", regErr?.message);
      }

      // 2. Chuyển hướng bắt buộc qua bước đăng nhập, không tự động đi thẳng vào app
      toast.success("🎉 Tạo tài khoản thành công! Quý CEO vui lòng đăng nhập để vào App Hiệp Hội.");
      setModalOpen(false);
      navigate({
        to: "/association/login" as any,
        search: { username: uname, registered: "true" } as any,
      });
    } catch (err: any) {
      toast.error(err?.message || "Đăng ký tài khoản không thành công. Vui lòng thử lại.");
    } finally {
      setCreatingAccount(false);
    }
  };

  // Scroll spy to update active scene
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight * 0.4;
      for (const item of SCENE_MENU) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveScene(item.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToScene = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full bg-[#f8fbff] text-slate-900 overflow-x-hidden selection:bg-amber-200 selection:text-amber-900 font-sans">
      {/* ===================================================================== */}
      {/* FLOATING HEADER (MINIMAL, TRANSPARENT GLASS)                          */}
      {/* ===================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between pointer-events-none transition-all duration-300">
        <div className="flex items-center gap-3 pointer-events-auto backdrop-blur-md bg-white/40 px-4 py-2 rounded-full border border-white/60 shadow-xs">
          <img
            src="/ceo1983-official-logo.png"
            alt="CLB CEO 1983"
            className="w-8 h-8 object-contain drop-shadow-xs"
          />
          <span className="text-xs font-black tracking-widest text-[#003B95] uppercase hidden sm:inline-block">
            CEO 1983 • HANOIBA
          </span>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            to="/association"
            className="text-xs font-bold text-slate-700 hover:text-[#003B95] backdrop-blur-md bg-white/40 px-4 py-2 rounded-full border border-white/60 shadow-xs transition"
          >
            Cổng Hội Viên
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95 uppercase tracking-wider"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Gia Nhập CLB</span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* FLOATING MINIMAL SCENE NAVIGATOR (SIDEBAR SCROLL SPY)                  */}
      {/* ===================================================================== */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3 pointer-events-auto backdrop-blur-md bg-black/10 hover:bg-black/20 p-2.5 rounded-full border border-white/30 transition-all duration-300">
        {SCENE_MENU.map((scene) => {
          const isActive = activeScene === scene.id;
          return (
            <button
              key={scene.id}
              onClick={() => scrollToScene(scene.id)}
              className="group relative flex items-center justify-end cursor-pointer"
              title={scene.label}
            >
              <span
                className={`absolute right-7 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider whitespace-nowrap transition-all duration-300 pointer-events-none shadow-md ${
                  isActive
                    ? "opacity-100 translate-x-0 bg-slate-900 text-white"
                    : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 bg-white/90 text-slate-800"
                }`}
              >
                {scene.num}. {scene.label}
              </span>
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "scale-150 bg-amber-400 ring-4 ring-amber-400/30"
                    : "bg-white/60 group-hover:bg-white"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* ===================================================================== */}
      {/* SCENE 01 — REAL CLOUDS + REAL SUNLIGHT (CINEMATIC SKY)                */}
      {/* ===================================================================== */}
      <section
        id="scene-sky"
        className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-950"
      >
        {/* Photorealistic Cinematic Sky & Volumetric Clouds Background */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=2400&q=95"
            alt="Real Cinematic Clouds"
            className="w-full h-full object-cover object-center scale-105 filter brightness-[1.03] contrast-[1.05]"
          />
          {/* Subtle Ambient Sky Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-sky-950/40 mix-blend-multiply" />
        </div>

        {/* Real Celestial Sunlight & Volumetric God Rays */}
        <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-full max-w-5xl h-[700px] pointer-events-none overflow-hidden">
          {/* Anamorphic Lens Flare & Solar Flare Bloom */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-radial from-amber-100/85 via-amber-200/35 to-transparent blur-3xl" />
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[300px] h-[180px] rounded-full bg-radial from-white via-amber-100/90 to-transparent blur-xl" />
          {/* Natural Volumetric Sunbeams piercing through clouds */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 10%, rgba(255,248,220,0.4) 0deg, transparent 25deg, rgba(255,240,200,0.5) 45deg, transparent 75deg, rgba(255,250,230,0.4) 100deg, transparent 135deg, rgba(255,245,210,0.5) 160deg, transparent 180deg)",
              filter: "blur(20px)",
            }}
          />
        </div>

        {/* Parallax Drifting Photorealistic Cloud Banks */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Left Upper Drifting Cloud Layer */}
          <motion.div
            initial={{ x: "-6%", opacity: 0.7 }}
            animate={{ x: "6%", opacity: 0.85 }}
            transition={{ duration: 40, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="absolute -top-12 -left-[10%] w-[80%] h-[400px] mix-blend-screen filter blur-[2px] pointer-events-none"
          >
            <img
              src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2400&q=95"
              alt="Drifting Cumulus Clouds"
              className="w-full h-full object-cover opacity-60"
            />
          </motion.div>
          {/* Right Lower Drifting Atmospheric Mist */}
          <motion.div
            initial={{ x: "5%", opacity: 0.6 }}
            animate={{ x: "-5%", opacity: 0.8 }}
            transition={{ duration: 48, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="absolute top-[40%] -right-[15%] w-[85%] h-[420px] mix-blend-screen filter blur-[3px] pointer-events-none"
          >
            <img
              src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=2400&q=95"
              alt="Soft Atmospheric Clouds"
              className="w-full h-full object-cover opacity-50"
            />
          </motion.div>
        </div>

        {/* Floating Atmospheric Hero Text (Spacious Cinematic Typography) */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 pb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-lg shadow-sky-950/10 mb-8"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-[12px] font-mono font-bold tracking-[0.22em] text-[#003B95] uppercase">
              HANOIBA • CỘNG ĐỒNG DOANH NHÂN QUÝ HỢI 1983
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#002766] uppercase leading-[1.1] drop-shadow-sm"
          >
            GẮN KẾT BỀN VỮNG
            <span className="block mt-2 text-2xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 drop-shadow-xs">
              HỢP LỰC DOANH NHÂN
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="mt-8 text-base sm:text-lg md:text-xl text-slate-700 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-xs"
          >
            Hành trình hội tụ bản lĩnh và khát vọng của thế hệ doanh nhân 1983.
            Cùng nhau tạo dựng liên minh kinh doanh vững mạnh, mở rộng tầm nhìn và vươn tầm quốc tế.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="mt-14 flex flex-col items-center justify-center gap-2 cursor-pointer"
            onClick={() => scrollToScene("scene-birds")}
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#003B95] font-bold drop-shadow-xs">
              Cuộn xuống để trải nghiệm
            </span>
            <ChevronDown className="w-5 h-5 text-[#003B95] animate-bounce drop-shadow-xs" />
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SCENE 02 — REAL BIRDS FLOCK IN FLIGHT (DEPTH & MULTI-LAYER PARALLAX) */}
      {/* ===================================================================== */}
      <section
        id="scene-birds"
        className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-900"
      >
        {/* Photorealistic Dynamic Sky with Deep Atmospheric Perspective */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=2400&q=95"
            alt="Real Birds in Flight over Cinematic Sky"
            className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.08]"
          />
          {/* Subtle Horizon Mist & Lighting Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-sky-950/50 mix-blend-multiply" />
        </div>

        {/* Dynamic Multi-layered Photorealistic Avian Flight Layers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Midground High Flock Layer (Gliding majestically left-to-right across open sky) */}
          <motion.div
            initial={{ x: "-20vw", y: "15vh" }}
            whileInView={{ x: "120vw", y: "-5vh" }}
            viewport={{ once: false }}
            transition={{ duration: 24, ease: "linear", repeat: Infinity }}
            className="absolute top-0 left-0 w-[420px] h-[180px] pointer-events-none filter drop-shadow-md"
          >
            <img
              src="https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=800&q=90"
              alt="Avian Flock Formation"
              className="w-full h-full object-contain mix-blend-multiply opacity-80"
            />
          </motion.div>

          {/* Distant V-Formation Flock Layer (Higher altitude, slower, softer focus) */}
          <motion.div
            initial={{ x: "115vw", y: "25vh" }}
            whileInView={{ x: "-25vw", y: "10vh" }}
            viewport={{ once: false }}
            transition={{ duration: 38, ease: "linear", repeat: Infinity, delay: 2 }}
            className="absolute top-0 left-0 w-[300px] h-[120px] pointer-events-none filter blur-[0.7px] opacity-60 mix-blend-multiply"
          >
            <img
              src="https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=600&q=85"
              alt="Distant Wild Birds"
              className="w-full h-full object-contain scale-x-[-1]"
            />
          </motion.div>
        </div>

        {/* Cinematic Atmospheric Text Floating in Space */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/75 backdrop-blur-md border border-white/80 shadow-md mb-6"
          >
            <Users className="w-4 h-4 text-[#003B95]" />
            <span className="text-[12px] font-mono font-bold tracking-[0.22em] text-[#003B95] uppercase">
              KHÔNG GIAN LIÊN MINH DOANH NHÂN
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#002766] uppercase tracking-tight leading-tight drop-shadow-sm"
          >
            HỘI TỤ TINH HOA
            <span className="block mt-2 text-xl sm:text-3xl md:text-4xl font-extrabold text-amber-600 drop-shadow-xs">
              SỨC MẠNH LIÊN MINH DOANH NHÂN
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-800 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-xs"
          >
            Như đàn chim sải cánh hướng về một chân trời chung, hơn 200 Chủ tịch &amp; Tổng Giám đốc
            cùng thế hệ kết nối chặt chẽ, tạo nên luồng gió sức mạnh nâng tầm toàn khối doanh nghiệp.
          </motion.p>

          {/* Organic Floating Core Metrics in Negative Space */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-14"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-black text-[#002766] font-mono tracking-tight drop-shadow-xs">
                200+
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-700 font-bold mt-1">
                Lãnh Đạo Doanh Nghiệp
              </span>
            </div>
            <div className="h-10 w-px bg-slate-300 hidden sm:block" />
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-black text-amber-600 font-mono tracking-tight drop-shadow-xs">
                30.000+
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-700 font-bold mt-1">
                Nhân Sự Toàn Khối
              </span>
            </div>
            <div className="h-10 w-px bg-slate-300 hidden sm:block" />
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-black text-[#002766] font-mono tracking-tight drop-shadow-xs">
                100.000+
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-700 font-bold mt-1">
                Tỷ Đồng Tổng Doanh Thu
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SCENE 03 — REAL KITES SOARING IN HIGH WIND (AERODYNAMIC SWAY)         */}
      {/* ===================================================================== */}
      <section
        id="scene-kites"
        className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-900"
      >
        {/* Photorealistic High-Altitude Wind Sky Backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=2400&q=95"
            alt="Real Kites Soaring High in Sky"
            className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.05]"
          />
          {/* Atmospheric Color Tone Integration */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-800/30 via-transparent to-sky-900/40 mix-blend-multiply" />
        </div>

        {/* Photorealistic Floating Kites with Aerodynamic Sway & Taut Tension Lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Primary High-Flying Photographic Kite (Upper Right) */}
          <motion.div
            initial={{ y: "-15px", rotate: -3 }}
            animate={{ y: "20px", rotate: 4 }}
            transition={{ duration: 7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="absolute top-[12%] right-[14%] w-48 h-64 pointer-events-none filter drop-shadow-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=90"
              alt="High Soaring Kite"
              className="w-full h-full object-contain filter contrast-125"
            />
            {/* Fine Taut String reaching deep below */}
            <div className="absolute top-[60%] left-1/2 w-[1px] h-[550px] bg-gradient-to-b from-slate-200/80 to-transparent rotate-[24deg] origin-top opacity-60" />
          </motion.div>

          {/* Secondary Distant Kite (Upper Left Horizon) */}
          <motion.div
            initial={{ y: "15px", rotate: 4 }}
            animate={{ y: "-15px", rotate: -2 }}
            transition={{ duration: 9, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
            className="absolute top-[20%] left-[12%] w-32 h-44 pointer-events-none filter drop-shadow-xl opacity-80"
          >
            <img
              src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=90"
              alt="Distant Aerial Kite"
              className="w-full h-full object-contain filter contrast-110"
            />
            <div className="absolute top-[60%] left-1/2 w-[1px] h-[450px] bg-gradient-to-b from-slate-200/70 to-transparent rotate-[-20deg] origin-top opacity-50" />
          </motion.div>
        </div>

        {/* Majestic Floating Vision Text */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/75 backdrop-blur-md border border-white/80 shadow-md mb-6"
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span className="text-[12px] font-mono font-bold tracking-[0.22em] text-[#003B95] uppercase">
              TẦM NHÌN THẾ HỆ
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#002766] uppercase tracking-tight leading-tight drop-shadow-sm"
          >
            KHÁT VỌNG VƯƠN TẦM
            <span className="block mt-2 text-xl sm:text-3xl md:text-4xl font-extrabold text-amber-600 drop-shadow-xs">
              BỨT PHÁ MỌI GIỚI HẠN
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-800 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-xs"
          >
            Càng đón gió lớn của thời đại, bản lĩnh doanh nhân càng vươn cao kiêu hãnh.
            Mỗi thành viên là một điểm tựa vững vàng, cùng nhau chinh phục những đỉnh cao mới
            trong kỷ nguyên kinh tế số và hội nhập toàn cầu.
          </motion.p>

          {/* Delicate Constellations of Core Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
          >
            {[
              "Tín Nhiệm Danh Dự",
              "Giao Thương Thực Chất",
              "Tiên Phong Công Nghệ",
              "Phụng Sự Cộng Đồng",
            ].map((pillar, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-md border border-white/80 text-xs font-black text-[#003B95] uppercase tracking-wider shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" />
                <span>{pillar}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SCENE 04 — REAL LUXURY VILLAS AT HORIZON (STRICT: 20-25% HEIGHT ONLY) */}
      {/* ===================================================================== */}
      <section
        id="scene-villas"
        className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-slate-900"
      >
        {/* Sky Background for Upper 75-80% */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2400&q=95"
            alt="Atmospheric Clear Sky"
            className="w-full h-full object-cover object-top filter brightness-[1.05] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-800/35 via-transparent to-sky-950/40 mix-blend-multiply" />
        </div>

        {/* Upper 75-80%: Vast Negative Space with Cinematic Typography */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 sm:pt-36">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/75 backdrop-blur-md border border-white/80 shadow-md mb-6"
          >
            <Building2 className="w-4 h-4 text-[#003B95]" />
            <span className="text-[12px] font-mono font-bold tracking-[0.22em] text-[#003B95] uppercase">
              CƠ NGHIỆP TRƯỜNG TỒN
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#002766] uppercase tracking-tight leading-tight drop-shadow-sm"
          >
            KIẾN TẠO VỊ THẾ
            <span className="block mt-2 text-xl sm:text-3xl md:text-4xl font-extrabold text-amber-700 drop-shadow-xs">
              NỀN TẢNG THỊNH VƯỢNG BỀN LÂU
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-800 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-xs"
          >
            Không gian của những giá trị trường tồn. Nơi hội tụ các tập đoàn đa ngành dẫn dắt
            nền kinh tế, kiến tạo chuỗi giá trị khép kín và dựng xây cơ nghiệp vững vàng cho thế hệ tương lai.
          </motion.p>
        </div>

        {/* Lower 20-25% Horizon: Real Modernist Luxury Villas Landscape Photography */}
        <div className="relative w-full h-[23vh] sm:h-[25vh] overflow-hidden">
          {/* Subtle Warm Atmospheric Glow at Horizon */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-amber-200/40 via-amber-100/10 to-transparent pointer-events-none z-10" />

          {/* Panoramic Luxury Modernist Villa Architecture at Water's Edge */}
          <div className="relative w-full h-full flex items-end">
            <img
              src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2400&q=95"
              alt="Real Luxury Waterfront Modern Villas at Horizon"
              className="w-full h-full object-cover object-bottom filter brightness-[1.08] contrast-[1.05]"
            />
            {/* Seamless gradient blend between horizon villa lawn and water below */}
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0284c7]/90 to-transparent" />
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SCENE 05 — REALISTIC TURQUOISE WATER / INFINITY POOL CAUSTICS         */}
      {/* ===================================================================== */}
      <section
        id="scene-water"
        className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-slate-950"
      >
        {/* Real Turquoise Water Texture with Natural Caustic Refractions */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2400&q=95"
            alt="Real Turquoise Water Caustics and Ripples"
            className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.12]"
          />
          {/* Atmospheric Oceanic Blend Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-600/30 via-cyan-900/30 to-[#022c44]/90" />
        </div>

        {/* Floating Atmospheric Typography */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 sm:pt-36">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md border border-white/90 shadow-md mb-6"
          >
            <ShieldCheck className="w-4 h-4 text-[#003B95]" />
            <span className="text-[12px] font-mono font-bold tracking-[0.22em] text-[#003B95] uppercase">
              TÂM THỨC DOANH NHÂN
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-lg"
          >
            TÂM THỨC TRẦM LẮNG
            <span className="block mt-2 text-xl sm:text-3xl md:text-4xl font-extrabold text-cyan-200 drop-shadow-md">
              BẢN LĨNH ĐƯƠNG ĐẦU MỌI THỬ THÁCH
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-white/90 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-md"
          >
            Mặt nước phẳng lặng phản chiếu sự kiên định của người lãnh đạo.
            Trước khi mở ra đại dương lớn, mọi quyết sách đều được đúc kết từ chiều sâu tư duy
            và sự trầm tĩnh chiến lược.
          </motion.p>
        </div>

        {/* Real Pool/Ocean Water Surface Edge & Deep Submerge Call */}
        <div className="relative w-full pb-14 pt-20 flex flex-col items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center gap-3 cursor-pointer"
            onClick={() => scrollToScene("scene-underwater")}
          >
            <div className="px-6 py-2 rounded-full bg-cyan-950/60 border border-cyan-400/40 backdrop-blur-md shadow-lg">
              <span className="text-[12px] font-mono uppercase tracking-[0.25em] text-cyan-200 font-bold">
                Lặn xuống lòng đại dương sâu thẳm
              </span>
            </div>
            <ChevronDown className="w-6 h-6 text-cyan-300 animate-bounce drop-shadow-lg" />
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SCENE 06 — DEEP SAPPHIRE OCEAN / REAL SHARKS & 4 PILLARS              */}
      {/* ===================================================================== */}
      <section
        id="scene-underwater"
        className="relative min-h-[220vh] w-full flex flex-col items-center justify-between overflow-hidden bg-slate-950 text-white"
      >
        {/* Photorealistic Deep Sapphire Ocean Backdrop with Penetrating Sun Rays */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=2400&q=95"
            alt="Real Deep Sapphire Ocean with God Rays"
            className="w-full h-full object-cover object-top filter brightness-[0.9] contrast-[1.15]"
          />
          {/* Volumetric Ocean Ray Blend */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#022c44]/85 via-[#011829]/95 to-[#000814]" />
        </div>

        {/* Real Marine Particulate / Floating Deep Sea Plankton */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(28)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: "105vh", opacity: 0 }}
              animate={{ y: "-10vh", opacity: [0, 0.6, 0] }}
              transition={{
                duration: 14 + (i % 8) * 2.5,
                repeat: Infinity,
                delay: (i % 7) * 1.8,
                ease: "linear",
              }}
              className="absolute rounded-full bg-cyan-200/50 backdrop-blur-xs border border-white/50"
              style={{
                width: 3 + (i % 4) * 2.5,
                height: 3 + (i % 4) * 2.5,
                left: `${(i * 3.7) % 96}%`,
              }}
            />
          ))}
        </div>

        {/* Real Photographic Sharks Gliding Through Deep Oceanic Abyss */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Alpha Apex Shark 1 (Photorealistic shark gliding horizontally across midground) */}
          <motion.div
            initial={{ x: "-35vw", y: "35vh", scale: 1 }}
            whileInView={{ x: "125vw", y: "42vh", scale: 1.05 }}
            viewport={{ once: false }}
            transition={{ duration: 28, ease: "linear", repeat: Infinity }}
            className="absolute top-0 left-0 w-[420px] h-[190px] filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)] opacity-95 pointer-events-none"
          >
            <img
              src="https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=1200&q=90"
              alt="Real Shark Gliding in Ocean"
              className="w-full h-full object-contain filter brightness-[0.95] contrast-[1.15]"
            />
          </motion.div>

          {/* Deep Ocean Shark 2 (Distant, gliding deeper in the abyss) */}
          <motion.div
            initial={{ x: "120vw", y: "75vh", scale: 0.65 }}
            whileInView={{ x: "-30vw", y: "68vh", scale: 0.65 }}
            viewport={{ once: false }}
            transition={{ duration: 36, ease: "linear", repeat: Infinity, delay: 5 }}
            className="absolute top-0 left-0 w-[320px] h-[150px] filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)] opacity-75 blur-[0.8px] pointer-events-none"
          >
            <img
              src="https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=1000&q=85"
              alt="Deep Ocean Shark"
              className="w-full h-full object-contain scale-x-[-1] filter brightness-[0.85] contrast-[1.1]"
            />
          </motion.div>
        </div>

        {/* TOP SECTION OF UNDERWATER: THE INITIATION */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-36 pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-950/70 backdrop-blur-md border border-cyan-500/40 shadow-lg mb-6 text-cyan-300"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[12px] font-mono font-bold tracking-[0.22em] uppercase">
              BẢN LĨNH TIÊN PHONG
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-2xl"
          >
            ĐẠI DƯƠNG SỐ
            <span className="block mt-2 text-xl sm:text-3xl md:text-4xl font-extrabold text-cyan-400 drop-shadow-md">
              VỊ THẾ DẪN ĐẦU THỊ TRƯỜNG
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed drop-shadow-md"
          >
            Giữa biển lớn kinh tế nhiều biến động, bản lĩnh và kinh nghiệm thực chiến của người thuyền trưởng
            là kim chỉ nam định hình tương lai doanh nghiệp.
          </motion.p>
        </div>

        {/* 4 PILLARS OF LEADERSHIP (MONOLITHIC LUMINOUS EMBLEMS) */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-14">
            <span className="text-xs font-mono font-bold tracking-[0.25em] text-amber-400 uppercase">
              BAN LÃNH ĐẠO TIÊN PHONG • CLB CEO 1983
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white uppercase mt-2 drop-shadow-lg">
              NHỮNG CỘT TRỤ BẢN LĨNH
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {LEADERSHIP_MEMBERS.map((leader, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 1, delay: idx * 0.15 }}
                className="group relative flex flex-col items-center text-center p-6 rounded-3xl bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent border border-white/15 hover:border-amber-400/60 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 shadow-xl shadow-black/40"
              >
                {/* Luminous Aura Beacon behind Leader */}
                <div className="absolute -top-4 w-32 h-32 rounded-full bg-cyan-400/15 group-hover:bg-amber-400/25 blur-2xl transition-all duration-500 pointer-events-none" />

                {/* Monolithic Portrait / Official Emblem */}
                <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400/70 to-cyan-400/70 mb-5 shadow-lg shadow-black/60">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={leader.img}
                      alt={leader.name}
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-amber-400 tracking-wider uppercase mb-1">
                  {leader.role}
                </span>
                <h4 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  {leader.name}
                </h4>
                <p className="text-xs text-slate-300 mt-1 font-medium">{leader.company}</p>
                <div className="w-8 h-px bg-white/20 my-3 group-hover:w-16 group-hover:bg-amber-400 transition-all" />
                <p className="text-xs text-slate-300 italic font-normal leading-relaxed">
                  "{leader.quote}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* BOTTOM SECTION: UNDERWATER CALMS DOWN -> SACRED BRAND MESSAGE -> MASTER CTA */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center pt-24 pb-36">
          {/* Water Calming Ethereal Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-cyan-500/15 blur-3xl pointer-events-none rounded-full" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1.4 }}
            className="space-y-6"
          >
            <span className="text-xs font-mono font-black tracking-[0.3em] text-amber-400 uppercase">
              THÔNG ĐIỆP THƯƠNG HIỆU
            </span>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight drop-shadow-2xl">
              GẮN KẾT BỀN — PHÁT TRIỂN VỮNG
            </h2>

            <p className="text-base sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Liên minh thế hệ doanh nhân 1983 vững bước giữa đại dương số.
              Đồng hành kiến tạo giá trị thực chất và vị thế tự hào của doanh nhân Việt.
            </p>

            {/* MASTER CTA BUTTONS */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-black text-slate-900 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 shadow-xl shadow-amber-500/30 transition-all duration-300 cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                <Crown className="w-5 h-5 text-slate-900" />
                <span>Nộp Hồ Sơ Gia Nhập Liên Minh</span>
                <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                to="/association"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all cursor-pointer"
              >
                <span>Vào Cổng Hội Viên CEO 1983</span>
              </Link>
            </div>

            <div className="pt-4 text-xs text-slate-400 font-mono">
              ★ 100% Thẩm định tín nhiệm chuẩn mực HanoiBA • Cấp thẻ Titanium VIP NFC
            </div>
          </motion.div>
        </div>

        {/* Minimalist Submerged Footer */}
        <div className="relative z-10 w-full border-t border-white/10 py-8 px-6 text-center text-xs text-slate-500">
          <p>© 2026 CLB Doanh Nhân CEO 1983 • HanoiBA. Bảo lưu mọi quyền.</p>
          <p className="text-amber-400/80 mt-1 font-mono">Khẩu hiệu: Gắn kết bền — Phát triển vững</p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MODAL NỘP HỒ SƠ HỘI VIÊN VIP (PRESERVED FUNCTIONALITY)                */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-400/30 overflow-hidden text-slate-900"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                      CỔNG HỘI VIÊN CEO 1983
                    </h3>
                    <p className="text-[10.5px] text-slate-500 font-semibold">
                      Hội Doanh Nhân Trẻ Hà Nội • HanoiBA
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-100/70 p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setModalTab("apply")}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalTab === "apply"
                      ? "bg-white text-[#003B95] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>1. Đăng Ký Hồ Sơ VIP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalTab("status");
                    if (lookupPhone && !statusResult) {
                      void performStatusCheck(lookupPhone);
                    }
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalTab === "status"
                      ? "bg-white text-[#003B95] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Trạng Thái & Kích Hoạt</span>
                </button>
              </div>

              {/* TAB 1: FORM NỘP HỒ SƠ */}
              {modalTab === "apply" && (
                <div className="p-5 sm:p-7 max-h-[75vh] overflow-y-auto [scrollbar-width:thin]">
                  <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-900 leading-snug font-medium">
                      Hồ sơ gia nhập CLB Doanh Nhân CEO 1983 sẽ được chuyển trực tiếp tới hệ thống CRM &amp; Hội đồng Thẩm định của HanoiBA.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Họ và tên Chủ tịch / CEO *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#003B95]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Số điện thoại *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="0988 888 888"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#003B95]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="ceo@company.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#003B95]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Tên doanh nghiệp *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Tập đoàn / Công ty..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#003B95]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">Chức danh</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Chủ tịch HĐQT / CEO"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#003B95]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Doanh thu bình quân hàng năm
                      </label>
                      <select
                        value={formData.revenue}
                        onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-[#003B95]"
                      >
                        <option value="Dưới 10 Tỷ VNĐ">Dưới 10 Tỷ VNĐ</option>
                        <option value="10 - 50 Tỷ VNĐ">10 - 50 Tỷ VNĐ</option>
                        <option value="50 - 200 Tỷ VNĐ">50 - 200 Tỷ VNĐ</option>
                        <option value="Trên 200 Tỷ VNĐ">Trên 200 Tỷ VNĐ</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:brightness-105 active:scale-95 transition shadow-lg shadow-amber-500/25 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Đang gửi hồ sơ lên CRM...</span>
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4" />
                            <span>Xác Nhận Nộp Hồ Sơ VIP</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setModalTab("status");
                          if (formData.phone) {
                            setLookupPhone(formData.phone);
                            void performStatusCheck(formData.phone);
                          }
                        }}
                        className="text-[11.5px] font-bold text-[#003B95] hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Đã nộp hồ sơ trước đó? Tra cứu trạng thái tại đây</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: TRA CỨU TRẠNG THÁI & KÍCH HOẠT TÀI KHOẢN (3 TRẠNG THÁI) */}
              {modalTab === "status" && (
                <div className="p-5 sm:p-7 max-h-[75vh] overflow-y-auto [scrollbar-width:thin] space-y-4">
                  {/* Phone Lookup Bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={lookupPhone}
                        onChange={(e) => setLookupPhone(e.target.value)}
                        placeholder="Nhập số điện thoại đã đăng ký..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#003B95]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={checkingStatus}
                      onClick={() => performStatusCheck(lookupPhone)}
                      className="px-4 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#003B95]/20 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {checkingStatus ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>Tra cứu</span>
                    </button>
                  </div>

                  {/* Loading indicator */}
                  {checkingStatus && (
                    <div className="p-6 text-center text-slate-500 text-xs space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                      <p className="font-semibold">Đang kết nối hệ thống CRM đối soát hồ sơ...</p>
                    </div>
                  )}

                  {/* RESULT DISPLAY */}
                  {!checkingStatus && statusResult && (
                    <div className="space-y-4">
                      {/* ======================================================= */}
                      {/* TRẠNG THÁI 1: CHỜ PHÊ DUYỆT (PENDING)                   */}
                      {/* ======================================================= */}
                      {statusResult.status === "pending" && (
                        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 space-y-3">
                          <div className="flex items-center gap-2 text-amber-800">
                            <Clock className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
                            <h4 className="text-xs sm:text-sm font-black uppercase">
                              TRẠNG THÁI: ĐANG CHỜ PHÊ DUYỆT
                            </h4>
                          </div>

                          <div className="rounded-xl bg-white/80 p-3 border border-amber-200/80 text-xs space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Mã hồ sơ:</span>
                              <span className="font-mono font-bold text-amber-700">
                                {statusResult.reference || `APP-${statusResult.phone?.slice(-4)}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Họ và tên:</span>
                              <span className="font-bold text-slate-900">{statusResult.name || formData.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Doanh nghiệp:</span>
                              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                                {statusResult.company || formData.company}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Số điện thoại:</span>
                              <span className="font-semibold text-slate-800">{statusResult.phone}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                            {statusResult.message ||
                              "Hồ sơ của Quý CEO đã được gửi thành công đến hệ thống CRM của CLB Doanh Nhân CEO 1983. Ban Thẩm Định đang đối soát thông tin (thường hoàn tất trong 24 giờ làm việc). Quý CEO có thể bấm 'Làm mới' bất kỳ lúc nào để theo dõi kết quả."}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => performStatusCheck(lookupPhone)}
                              className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Làm mới trạng thái</span>
                            </button>
                            <a
                              href="tel:0983331983"
                              className="px-3 py-2 rounded-xl border border-amber-300 bg-white text-amber-800 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Hotline Ban Thư Ký</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* ======================================================= */}
                      {/* TRẠNG THÁI 2: ĐÃ PHÊ DUYỆT (APPROVED) -> ĐĂNG KÝ TK    */}
                      {/* ======================================================= */}
                      {statusResult.status === "approved" && (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-4">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <h4 className="text-xs sm:text-sm font-black uppercase">
                                🎉 HỒ SƠ ĐÃ ĐƯỢC PHÊ DUYỆT!
                              </h4>
                              <p className="text-[10.5px] text-emerald-700 font-semibold">
                                Chào mừng Quý CEO chính thức gia nhập CLB CEO 1983
                              </p>
                            </div>
                          </div>

                          <div className="rounded-xl bg-white/90 p-3 border border-emerald-200 text-xs space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Mã hội viên:</span>
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                {statusResult.memberCode || "M1983-VIP"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">CEO:</span>
                              <span className="font-bold text-slate-900">{statusResult.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Doanh nghiệp:</span>
                              <span className="font-semibold text-slate-800">{statusResult.company}</span>
                            </div>
                          </div>

                          {/* Account Creation Form */}
                          <form onSubmit={handleCreateAccount} className="space-y-3 pt-1">
                            <div className="border-t border-emerald-200/80 pt-3">
                              <h5 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 mb-2">
                                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                <span>KÍCH HOẠT TÀI KHOẢN APP HIỆP HỘI</span>
                              </h5>
                              <p className="text-[11px] text-slate-600 mb-3">
                                Thiết lập mật khẩu để hoàn tất tạo tài khoản và đăng nhập vào ứng dụng hội viên:
                              </p>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Tên đăng nhập / Số điện thoại
                              </label>
                              <input
                                type="text"
                                required
                                value={accountForm.username || statusResult.phone || lookupPhone}
                                onChange={(e) =>
                                  setAccountForm({ ...accountForm, username: e.target.value })
                                }
                                placeholder="0988 888 888"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-[#003B95]"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Mật khẩu mới *
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={6}
                                    value={accountForm.password}
                                    onChange={(e) =>
                                      setAccountForm({ ...accountForm, password: e.target.value })
                                    }
                                    placeholder="Tối thiểu 6 ký tự"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-[#003B95] pr-8"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  >
                                    {showPassword ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Xác nhận mật khẩu *
                                </label>
                                <input
                                  type={showPassword ? "text" : "password"}
                                  required
                                  minLength={6}
                                  value={accountForm.confirmPassword}
                                  onChange={(e) =>
                                    setAccountForm({
                                      ...accountForm,
                                      confirmPassword: e.target.value,
                                    })
                                  }
                                  placeholder="Nhập lại mật khẩu"
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-[#003B95]"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={creatingAccount}
                              className="w-full py-3 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-105 active:scale-95 transition shadow-lg shadow-emerald-600/25 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              {creatingAccount ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Đang tạo tài khoản &amp; đăng nhập...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Kích Hoạt &amp; Vào App Hiệp Hội</span>
                                </>
                              )}
                            </button>
                          </form>
                        </div>
                      )}

                      {/* ======================================================= */}
                      {/* TRẠNG THÁI 3: CẦN BỔ SUNG / CHƯA ĐẠT (REJECTED)        */}
                      {/* ======================================================= */}
                      {statusResult.status === "rejected" && (
                        <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-4 space-y-3">
                          <div className="flex items-center gap-2 text-rose-800">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                            <h4 className="text-xs sm:text-sm font-black uppercase">
                              HỒ SƠ CẦN BỔ SUNG THÔNG TIN
                            </h4>
                          </div>

                          <p className="text-[11.5px] text-rose-900 leading-relaxed">
                            {statusResult.message ||
                              "Hồ sơ của Quý CEO chưa đạt tiêu chuẩn phê duyệt hoặc cần bổ sung thông tin đăng ký doanh nghiệp theo quy chế HanoiBA."}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setModalTab("apply")}
                              className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <span>Chỉnh sửa &amp; Nộp lại</span>
                            </button>
                            <a
                              href="tel:0983331983"
                              className="px-3 py-2 rounded-xl border border-rose-300 bg-white text-rose-800 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Hotline Ban Thư Ký</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!checkingStatus && !statusResult && (
                    <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                      <Search className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        Vui lòng nhập Số điện thoại và bấm "Tra cứu" để kiểm tra trạng thái hồ sơ.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Hoặc chuyển sang tab "Đăng Ký Hồ Sơ VIP" nếu Quý CEO chưa nộp hồ sơ gia nhập.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
