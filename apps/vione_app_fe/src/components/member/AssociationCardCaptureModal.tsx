import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Upload,
  X,
  RotateCw,
  Zap,
  Check,
  Download,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export interface AssociationCardCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onApplyBackground?: (imageUrl: string) => void;
}

export function AssociationCardCaptureModal({
  open,
  onClose,
  onApplyBackground,
}: AssociationCardCaptureModalProps) {
  const [mounted, setMounted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Initialize or terminate camera stream
  useEffect(() => {
    if (!open || activeTab !== "camera" || capturedImage) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [open, activeTab, facingMode, capturedImage]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    stopCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Trình duyệt không hỗ trợ truy cập máy ảnh");
        setActiveTab("upload");
        return;
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }

      // Check flashlight support
      const track = newStream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.() as any) || {};
      if (capabilities.torch) {
        setTorchSupported(true);
      } else {
        setTorchSupported(false);
      }
    } catch (err) {
      console.warn("[CardCaptureModal] Camera access error:", err);
      toast.error("Không thể mở máy ảnh. Vui lòng cấp quyền hoặc tải ảnh lên từ máy.");
      setActiveTab("upload");
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      toast.error("Thiết bị không hỗ trợ bật đèn flash");
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Capture frame exactly matching the viewfinder card frame (16:10 / 1.7:1)
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Viewfinder card aspect ratio is 1.7
    const targetAspect = 1.7;
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    const videoAspect = videoWidth / videoHeight;

    let cropWidth = videoWidth;
    let cropHeight = videoHeight;
    let startX = 0;
    let startY = 0;

    // Calculate crop area corresponding to centered viewfinder frame
    if (videoAspect > targetAspect) {
      cropWidth = videoHeight * targetAspect * 0.85;
      cropHeight = videoHeight * 0.85;
      startX = (videoWidth - cropWidth) / 2;
      startY = (videoHeight - cropHeight) / 2;
    } else {
      cropWidth = videoWidth * 0.88;
      cropHeight = (videoWidth * 0.88) / targetAspect;
      startX = (videoWidth - cropWidth) / 2;
      startY = (videoHeight - cropHeight) / 2;
    }

    canvas.width = 1020;
    canvas.height = 600;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, mirror image
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      video,
      startX,
      startY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Handle upload file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!capturedImage) return;
    onApplyBackground?.(capturedImage);
    toast.success("Đã áp dụng ảnh nền cho danh thiếp!");
    handleClose();
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const a = document.createElement("a");
    a.href = capturedImage;
    a.download = `Danh_thiep_CEO1983_${Date.now()}.jpg`;
    a.click();
    toast.success("Đã tải ảnh danh thiếp về máy!");
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (activeTab === "camera") {
      startCamera();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#070D18] text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-amber-500/25 overflow-hidden flex flex-col my-auto max-h-[92dvh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - CEO 1983 Navy Blue & Amber Gold */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-[#003B95] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 text-amber-300 border border-amber-400/40 shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Chụp & Tải Nền Danh Thiếp</h3>
              <p className="text-[11px] text-amber-200/90 font-medium">Khung ngắm tỷ lệ 1.7:1 chuẩn thẻ CEO 1983</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!capturedImage && (
          <div className="px-4 pt-3 pb-1 bg-slate-50 dark:bg-[#0A101D] border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center bg-slate-200/80 dark:bg-black/40 p-1 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("camera");
                  setCapturedImage(null);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "camera"
                    ? "bg-[#003B95] text-white font-bold shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Máy Ảnh Trực Tiếp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("upload");
                  stopCamera();
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "upload"
                    ? "bg-[#003B95] text-white font-bold shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải Ảnh Từ Máy</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] flex items-center justify-center bg-black overflow-hidden">
          {capturedImage ? (
            /* PREVIEW CAPTURED / UPLOADED IMAGE */
            <div className="relative w-full h-full p-4 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-md aspect-[1.7/1] rounded-2xl overflow-hidden border-2 border-amber-400/90 shadow-2xl shadow-amber-500/20">
                <img
                  src={capturedImage}
                  alt="Danh thiếp đã chụp"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-semibold text-amber-300 border border-amber-400/30">
                  TỶ LỆ 1.7:1 CHUẨN
                </div>
              </div>
            </div>
          ) : activeTab === "camera" ? (
            /* LIVE CAMERA WITH CARD VIEWFINDER */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Viewfinder Dark Mask Overlay */}
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />

              {/* Centered Transparent Card Frame Cutout (1.7 : 1) */}
              <div className="relative z-10 w-[88%] max-w-[420px] aspect-[1.7/1] rounded-2xl border-2 border-amber-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none flex flex-col justify-between p-3.5">
                {/* 4 Corner L-Brackets */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-amber-300 rounded-tl-xl -mt-0.5 -ml-0.5" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-amber-300 rounded-tr-xl -mt-0.5 -mr-0.5" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-amber-300 rounded-bl-xl -mb-0.5 -ml-0.5" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-amber-300 rounded-br-xl -mb-0.5 -mr-0.5" />

                {/* Animated Laser Scanning Beam */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_10px_#F59E0B] animate-pulse" />

                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-medium bg-black/75 backdrop-blur-md text-amber-200 border border-amber-400/30">
                    Căn chỉnh danh thiếp vừa khít trong khung
                  </span>
                </div>
              </div>

              {/* Floating Camera Controls Top Right */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                {torchSupported && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      torchOn
                        ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40"
                        : "bg-black/60 text-white hover:bg-black/80 border border-white/10"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/10 transition-all cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* UPLOAD VIEW */
            <div className="p-8 text-center flex flex-col items-center justify-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-sm">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-white">Tải Ảnh Nền Danh Thiếp</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Chọn hình ảnh từ thiết bị của bạn. Ảnh sẽ tự động được điều chỉnh vừa vặn với kích thước danh thiếp CEO 1983.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn Tệp Ảnh Từ Máy</span>
              </button>
            </div>
          )}

          {/* Hidden Canvas and File Input */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#070D18] flex flex-wrap items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Chụp / Chọn Lại</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Xuống</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#003B95] to-[#1E40AF] hover:brightness-110 shadow-md shadow-[#003B95]/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Làm Nền</span>
                </button>
              </div>
            </>
          ) : activeTab === "camera" ? (
            <div className="w-full flex items-center justify-center">
              {/* Dual-ring luxury shutter button */}
              <button
                type="button"
                onClick={handleCapture}
                className="w-16 h-16 rounded-full border-2 border-white/80 p-1 bg-white/5 hover:bg-white/15 transition-all flex items-center justify-center active:scale-90 cursor-pointer shadow-lg shadow-amber-400/20"
                title="Bấm để chụp"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 hover:brightness-110 transition-all shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
              </button>
            </div>
          ) : (
            <div className="w-full text-center text-xs text-slate-500">
              Hỗ trợ tệp định dạng JPG, PNG, WEBP dung lượng tối đa 15MB
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
