import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { DonationCertificate } from '../types';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  CheckCircle2, 
  Award, 
  Droplet, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Building, 
  Copy, 
  Check, 
  QrCode,
  Sparkles
} from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  certificate: DonationCertificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  certificate,
  onClose
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  // Trigger celebration confetti on open
  useEffect(() => {
    if (isOpen && certificate) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#e11d48', '#f59e0b', '#10b981', '#3b82f6']
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen, certificate]);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVerification = () => {
    const text = `LifeDrop অফিসিয়াল রক্তদাতা সম্মাননা সনদ | সনদ নং: ${certificate.serialNumber} | রক্তদাতা: ${certificate.donorName} (${certificate.bloodGroup}) | তারিখ: ${certificate.donationDate}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `🩸 আমি LifeDrop প্ল্যাটফর্মে রক্তদান সম্পন্ন করে অফিসিয়াল ডিজিটাল প্রশংসাপত্র অর্জন করেছি! 
রক্তদাতা: ${certificate.donorName} (${certificate.bloodGroup})
সনদ নম্বর: ${certificate.serialNumber}
স্থান: ${certificate.hospital}
এক ফোঁটা রক্ত, একটি জীবন বাঁচায়! 💖`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative max-w-4xl w-full my-auto">
        
        {/* Floating Top Controls (Hidden when printing) */}
        <div className="print:hidden mb-4 flex items-center justify-between gap-2 bg-slate-900/90 text-white p-3 rounded-2xl backdrop-blur-md border border-slate-700 shadow-xl">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">ডিজিটাল প্রশংসাপত্র (Certificate of Appreciation)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
              title="প্রিন্ট বা PDF হিসেবে সংরক্ষণ করুন"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF ডাউনলোড</span>
            </button>

            <button
              onClick={shareOnWhatsApp}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp এ শেয়ার</span>
            </button>

            <button
              onClick={handleCopyVerification}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-slate-700"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? 'কপি হয়েছে' : 'তথ্য কপি'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Container (Optimized for Screen & Window Print) */}
        <div 
          id="printable-certificate"
          ref={certRef}
          className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border-8 border-double border-amber-600/60 p-6 sm:p-10 relative select-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.15) 0%, rgba(255, 255, 255, 0.95) 100%)'
          }}
        >
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
            <Droplet className="w-96 h-96 text-red-600" />
          </div>

          {/* Certificate Corner Ornaments */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600"></div>
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600"></div>
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600"></div>

          {/* Certificate Header */}
          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-semibold text-red-700 mb-1">
              <Droplet className="w-3.5 h-3.5 fill-red-600 text-red-600" />
              <span>LifeDrop রক্তদান নেটওয়ার্ক বাংলাদেশ</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif text-slate-900">
              প্রশংসাপত্র ও সম্মাননা সনদ
            </h1>
            <p className="text-xs sm:text-sm uppercase tracking-widest text-amber-800 font-semibold font-mono">
              CERTIFICATE OF APPRECIATION
            </p>

            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-2"></div>
          </div>

          {/* Recipient Statement */}
          <div className="mt-6 text-center space-y-3 relative z-10">
            <p className="text-xs sm:text-sm text-slate-600 font-medium italic">
              এই প্রশংসাপত্রটি অত্যন্ত শ্রদ্ধা, কৃতজ্ঞতা ও গর্বের সাথে প্রদান করা হচ্ছে
            </p>

            <div className="py-2">
              <h2 className="text-2xl sm:text-4xl font-black text-red-700 tracking-tight font-serif">
                {certificate.donorName}
              </h2>
              <div className="inline-flex items-center gap-2 mt-2 px-4 py-1 bg-red-100 text-red-900 rounded-full text-sm font-bold border border-red-200">
                <Droplet className="w-4 h-4 fill-red-600 text-red-600" />
                <span>রক্তের গ্রুপ: {certificate.bloodGroup}</span>
                <span className="text-red-400">•</span>
                <span>{certificate.donationCount}ম রক্তদান সম্পন্ন</span>
              </div>
            </div>

            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-700 leading-relaxed font-sans pt-1">
              মানবতার কল্যাণে অমূল্য রক্তদান করে একজন মুমূর্ষু রোগীর জীবন বাঁচানোর মহান অবদানে আপনার নিঃস্বার্থ ত্যাগ, আন্তরিক আন্তরিকতা ও সামাজিক দায়বদ্ধতার জন্য লাইফড্রপ পরিবারের পক্ষ থেকে কৃতজ্ঞতা ও সর্বোচ্চ সম্মাননা জ্ঞাপন করা হলো।
            </p>
          </div>

          {/* Donation Record Metadata Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 text-xs relative z-10">
            <div className="space-y-1">
              <span className="text-slate-500 block">রক্তদানের তারিখ</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-red-600" />
                {certificate.donationDate}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 block">হাসপাতাল / কেন্দ্র</span>
              <span className="font-bold text-slate-900 flex items-center gap-1 truncate" title={certificate.hospital}>
                <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{certificate.hospital}</span>
              </span>
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block">সনদ ট্র্যাকিং নম্বর</span>
              <span className="font-mono font-bold text-amber-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                {certificate.serialNumber}
              </span>
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 items-end gap-4 relative z-10">
            {/* Left: Authorized By CEO-HABIB */}
            <div className="text-center space-y-1">
              <div className="h-10 flex items-center justify-center font-serif text-lg font-bold italic text-slate-800 tracking-wider">
                Habibur Rahman
              </div>
              <div className="w-36 border-t border-slate-400 mx-auto"></div>
              <p className="text-xs font-bold text-slate-900">CEO - HABIB</p>
              <p className="text-[10px] text-slate-500">প্রতিষ্ঠাতা ও নির্বাহী পরিচালক, LifeDrop</p>
            </div>

            {/* Middle: Golden Embossed Stamp Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-600/80 bg-gradient-to-br from-amber-100 to-amber-200 p-1 flex flex-col items-center justify-center text-center shadow-md shadow-amber-900/10">
                <Award className="w-6 h-6 text-amber-700" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-amber-900 tracking-tighter leading-tight mt-0.5">
                  LIFEDROP
                </span>
                <span className="text-[7px] font-bold text-red-800 leading-tight">
                  VERIFIED DONOR
                </span>
                <span className="text-[8px] font-mono text-slate-700 font-bold">2026</span>
              </div>
            </div>

            {/* Right: Medical Board & QR verification */}
            <div className="text-center space-y-1">
              <div className="h-10 flex items-center justify-center font-serif text-sm font-semibold italic text-slate-700">
                Dr. R. A. Chowdhury
              </div>
              <div className="w-36 border-t border-slate-400 mx-auto"></div>
              <p className="text-xs font-bold text-slate-900">প্রধান চিকিৎসা কর্মকর্তা</p>
              <p className="text-[10px] text-slate-500">মেডিকেল স্ক্রিনিং ও রক্ত সুরক্ষা পর্ষদ</p>
            </div>
          </div>

          {/* Verification Bar */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-mono">
              <QrCode className="w-3.5 h-3.5 text-slate-400" />
              ভেরিফিকেশন কোড: {certificate.verificationCode}
            </span>
            <span>ইস্যু তারিখ: {certificate.issueDate}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
