import React, { useState } from 'react';
import { BloodRequest } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Phone, MapPin, Building2, Share2, Check, Clock, AlertTriangle } from 'lucide-react';

interface EmergencyCardProps {
  request: BloodRequest;
  onCall?: (request: BloodRequest) => void;
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({ request }) => {
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            {t('immediate')}
          </span>
        );
      case 'today':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {t('today')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            {t('scheduled')}
          </span>
        );
    }
  };

  const shareText = `[EMERGENCY BLOOD REQUEST - BANGLADESH]
Patient: ${request.patientName}
Blood Group: ${request.bloodGroup} (${request.unitsRequired} bags needed)
Hospital: ${request.hospital} (${request.upazila}, ${request.district})
Reason: ${request.reason}
Contact: ${request.contactName} - ${request.contactPhone}
Via LifeDrop Blood Donation Network`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `URGENT: ${request.bloodGroup} Blood Needed`,
          text: shareText,
          url: window.location.href
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Header: Blood Group & Urgency */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex flex-col items-center justify-center font-bold tracking-tight shadow-sm shadow-red-200 shrink-0">
              <span className="text-base leading-none">{request.bloodGroup}</span>
              <span className="text-[10px] font-normal leading-tight opacity-90">
                {request.unitsRequired} {lang === 'bn' ? 'ব্যাগ' : 'Bag(s)'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base leading-tight">
                {request.patientName}
              </h3>
              <p className="text-xs text-red-600 font-medium mt-0.5">
                {request.reason}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {getUrgencyBadge(request.urgency)}
          </div>
        </div>

        {/* Location & Hospital */}
        <div className="space-y-1.5 py-2 text-xs text-slate-600 border-t border-b border-slate-100 my-3">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="font-medium text-slate-800 line-clamp-2">
              {request.hospital}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {request.upazila}, {request.district}, {request.division}
            </span>
          </div>
        </div>

        {/* Attendant Notes */}
        {request.attendantNotes && (
          <p className="text-xs text-slate-500 italic mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            "{request.attendantNotes}"
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center gap-2">
        <a
          href={`tel:${request.contactPhone}`}
          className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm shadow-red-200"
        >
          <Phone className="w-4 h-4" />
          <span>{t('callContact')} ({request.contactPhone})</span>
        </a>
        <button
          onClick={handleShare}
          className="min-h-[44px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="Share request"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{copied ? t('copied') : t('shareAlert')}</span>
        </button>
      </div>
    </div>
  );
};
