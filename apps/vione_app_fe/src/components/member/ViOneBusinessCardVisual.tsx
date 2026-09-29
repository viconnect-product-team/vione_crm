import React from "react";
import { Phone, Mail, Globe, Share2, QrCode } from "lucide-react";
import { QrCanvas } from "./QrCanvas";

export interface ViOneBusinessCardVisualProps {
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  clubEmail?: string;
  cardCode?: string;
  qrValue?: string;
  avatarUrl?: string | null;
  showActions?: boolean;
}

export function ViOneBusinessCardVisual({
  name,
  title = "Executive Member",
  phone = "036xxxxxxx",
  email = "member@vione.vn",
  company = "ViOne Enterprise Network",
  website = "https://vione.vn",
  cardCode = "VN-0001",
  qrValue = "https://vione.vn",
  avatarUrl,
  showActions = true,
}: ViOneBusinessCardVisualProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0E203C] to-[#050B14] p-6 text-white shadow-2xl border border-[#D4AF37]/30">
      {/* Luxury Metallic Accent Lines */}
      <div className="absolute top-0 right-0 h-32 w-32 bg-radial from-[#D4AF37]/20 to-transparent blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-radial from-[#003B95]/30 to-transparent blur-2xl pointer-events-none" />

      {/* Header with Brand & Chip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] p-1 grid place-items-center shadow-md">
            <span className="text-[#05070E] font-black text-xs">V</span>
          </div>
          <div>
            <div className="text-[12px] font-black tracking-widest uppercase text-[#D4AF37]">
              ViOne Business Card
            </div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">
              Titanium NFC Member Pass
            </div>
          </div>
        </div>

        {/* Card Code Badge */}
        <div className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#F3E5AB]">
          {cardCode}
        </div>
      </div>

      {/* Main Info */}
      <div className="mt-5 flex items-start gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-16 w-16 rounded-2xl object-cover border-2 border-[#D4AF37]/60 shadow-lg"
          />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-xl font-bold text-white border-2 border-[#D4AF37]/40 shadow-lg">
            {name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-white">{name}</h3>
          <p className="truncate text-xs font-semibold text-[#D4AF37]">{title}</p>
          <p className="truncate text-[11px] text-slate-300 font-medium">{company}</p>
        </div>
      </div>

      {/* Contact Details Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] border-t border-white/10 pt-4">
        {phone && (
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
            <span className="truncate">{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2 text-slate-300">
            <Mail className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {website && (
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
            <span className="truncate">{website}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-slate-300">
          <QrCode className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
          <span className="truncate">NFC Smart Tap & Connect</span>
        </div>
      </div>

      {/* QR Code on Bottom Right */}
      {qrValue && (
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="text-[10px] text-slate-400">
            Quét mã để lưu danh bạ và kết nối tức thì
          </div>
          <div className="rounded-xl bg-white p-1.5 shadow-md">
            <QrCanvas value={qrValue} size={54} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ViOneBusinessCardVisual;
