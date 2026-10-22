import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ActivePage } from '../types';
import { Droplet, Phone, MapPin, Shield, Heart, MessageSquare, Download } from 'lucide-react';

interface FooterProps {
  setActivePage: (page: ActivePage) => void;
  openAdminModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActivePage, openAdminModal }) => {
  const { lang, t } = useLanguage();

  const handleNav = (page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Mission (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white">
                <Droplet className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block">
                  LifeDrop
                </span>
                <span className="text-xs text-red-400 font-medium block">
                  {lang === 'bn' ? 'রক্তদান নেটওয়ার্ক বাংলাদেশ' : 'Blood Donation Network Bangladesh'}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              {lang === 'bn'
                ? 'একটি অলাভজনক সামাজিক উদ্যোগ, যার লক্ষ্য বাংলাদেশের যেকোনো প্রান্তে মুমূর্ষু রোগীর জন্য তাৎক্ষণিকভাবে স্বেচ্ছাসেবী রক্তদাতা নিশ্চিত করা।'
                : "A humanitarian voluntary network connecting life-saving blood donors with patients across all 64 districts in Bangladesh. 100% free and voluntary."}
            </p>

            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1">
                {lang === 'bn' ? 'জরুরি রক্তের প্রয়োজনে হটলাইন:' : 'Emergency Blood Helpline:'}
              </span>
              <a
                href="tel:+8801950902300"
                className="inline-flex items-center gap-2 text-white hover:text-red-400 text-sm font-bold font-mono transition-colors"
              >
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <span>+8801950902300</span>
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {lang === 'bn' ? 'দ্রুত লিঙ্ক' : 'Navigation'}
            </h4>
            <ul className="text-xs space-y-2">
              <li>
                <button
                  onClick={() => handleNav('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('home')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('search')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('findDonors')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('register')}
                  className="hover:text-white transition-colors cursor-pointer text-red-400 font-medium"
                >
                  {t('ctaRegister')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('emergency')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('emergencyRequests')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('eligibility')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('eligibility')}
                </button>
              </li>
            </ul>
          </div>

          {/* Official Contact — LifeDrop (CEO-HABIB) (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5 bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                <span>যোগাযোগ — LifeDrop (CEO-HABIB)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-700/60 px-2 py-0.5 rounded">
                অফিসিয়াল
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              {/* Phone */}
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">মোবাইল নম্বর (অ্যাডমিন):</span>
                  <a
                    href="tel:+8801950902300"
                    className="text-white hover:text-red-400 font-bold font-mono text-sm tracking-wide transition-colors"
                    title="সরাসরি কল করতে ক্লিক করুন"
                  >
                    +8801950902300
                  </a>
                </div>
              </div>

              {/* WhatsApp Action */}
              <div className="flex items-start gap-2.5 pt-1">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">WhatsApp:</span>
                  <a
                    href="https://wa.me/8801950902300"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-bold font-mono text-xs bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors mt-0.5"
                    title="হোয়াটসঅ্যাপে চ্যাট করুন"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp চ্যাট শুরু করুন (+8801950902300)</span>
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2.5 pt-1 border-t border-slate-700/60">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">ঠিকানা:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    যোগিরছিট, শ্রীপুর, গাজীপুর, বাংলাদেশ।
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Admin Portal & Code Download Button */}
            <div className="pt-2 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <a
                href="/lifedrop-Bangladesh-source.zip"
                download="lifedrop-Bangladesh-source.zip"
                className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 hover:text-amber-200 bg-amber-950/50 hover:bg-amber-900/60 px-2.5 py-1.5 rounded-lg border border-amber-500/40 transition-colors font-medium cursor-pointer"
                title="সম্পূর্ণ সোর্স কোড জিপ (ZIP) ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>সোর্স কোড (ZIP)</span>
              </a>

              <button
                onClick={openAdminModal}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <Shield className="w-3 h-3 text-red-400" />
                <span>{t('adminLogin')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Non-Profit Notice */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} {t('footerRights')}
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for voluntary blood donors in Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
