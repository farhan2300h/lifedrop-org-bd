/**
 * LifeDrop SMS & OTP Verification Service
 * Handles mobile number verification using 6-digit OTP codes.
 * Supports on-screen simulated live SMS delivery, gateway simulation, 
 * audio alert chime, countdown timers, and configurable SMS providers.
 */

import { SmsOtpSession } from '../types';

const OTP_SESSIONS_KEY = 'lifedrop_otp_sessions';
const VERIFIED_PHONES_KEY = 'lifedrop_verified_phones';
const SMS_CONFIG_KEY = 'lifedrop_sms_gateway_config';

export interface SmsGatewayConfig {
  provider: 'simulated' | 'greenweb' | 'sslwireless' | 'firebase';
  senderId: string;
  apiKey: string;
  isEnabled: boolean;
}

export interface SmsDeliveryAlert {
  id: string;
  phone: string;
  code: string;
  message: string;
  timestamp: number;
}

type SmsAlertListener = (alert: SmsDeliveryAlert) => void;
const smsAlertListeners = new Set<SmsAlertListener>();

// Web Audio API simulated SMS tone
function playSmsChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.1); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);
  } catch {
    // AudioContext blocked or not allowed until interaction
  }
}

export const smsOtpService = {
  /**
   * Subscribe to incoming simulated SMS delivery popups
   */
  onSmsReceived(listener: SmsAlertListener) {
    smsAlertListeners.add(listener);
    return () => {
      smsAlertListeners.delete(listener);
    };
  },

  /**
   * Retrieves verified phone numbers
   */
  getVerifiedPhones(): string[] {
    try {
      const raw = localStorage.getItem(VERIFIED_PHONES_KEY);
      return raw ? JSON.parse(raw) : ['01950902300']; // Admin number is verified by default
    } catch {
      return ['01950902300'];
    }
  },

  /**
   * Checks if a phone number is already verified
   */
  isPhoneVerified(phone: string): boolean {
    const clean = phone.replace(/\D/g, '');
    if (!clean) return false;
    const verifiedList = this.getVerifiedPhones();
    return verifiedList.includes(clean);
  },

  /**
   * Marks a phone number as verified
   */
  markPhoneVerified(phone: string) {
    const clean = phone.replace(/\D/g, '');
    if (!clean) return;
    const list = this.getVerifiedPhones();
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(VERIFIED_PHONES_KEY, JSON.stringify(list));
    }
  },

  /**
   * Generates and sends a 6-digit OTP to the phone number
   */
  sendOtp(phone: string, purpose: SmsOtpSession['purpose'] = 'phone_verification'): { 
    success: boolean; 
    code: string; 
    expiresInSeconds: number;
    message: string;
  } {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      throw new Error('অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)');
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInSeconds = 180; // 3 minutes
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    const session: SmsOtpSession = {
      phone: cleanPhone,
      code,
      expiresAt,
      isVerified: false,
      purpose
    };

    // Save session
    localStorage.setItem(`${OTP_SESSIONS_KEY}_${cleanPhone}`, JSON.stringify(session));

    // Bengali SMS body
    const purposeText = purpose === 'donor_registration'
      ? 'রক্তদাতা নিবন্ধনের'
      : purpose === 'emergency_request'
      ? 'জরুরি রক্তের অনুরোধের'
      : 'মোবাইল নম্বর যাচাইয়ের';

    const smsText = `LifeDrop SMS: আপনার ${purposeText} ওটিপি কোড হলো: ${code}। এটি আগামী ৩ মিনিট পর্যন্ত কার্যকর থাকবে। কাউকেই এই কোড শেয়ার করবেন না।`;

    // Play chime
    playSmsChime();

    // Broadcast alert to UI subscribers so simulated phone alert shows on screen
    const alert: SmsDeliveryAlert = {
      id: `sms-${Date.now()}`,
      phone: cleanPhone,
      code,
      message: smsText,
      timestamp: Date.now()
    };

    smsAlertListeners.forEach(listener => listener(alert));

    // Try web native notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`LifeDrop SMS (${cleanPhone})`, {
          body: `যাচাইকরণ কোড: ${code}`,
          icon: '/favicon.ico'
        });
      } catch {
        // Notification failed silently
      }
    }

    return {
      success: true,
      code,
      expiresInSeconds,
      message: `আপনার মোবাইল নম্বরে (${cleanPhone}) ৬-সংখ্যার ওটিপি পাঠানো হয়েছে।`
    };
  },

  /**
   * Verifies the user-entered OTP code
   */
  verifyOtp(phone: string, enteredCode: string): { success: boolean; message: string } {
    const cleanPhone = phone.replace(/\D/g, '');
    const raw = localStorage.getItem(`${OTP_SESSIONS_KEY}_${cleanPhone}`);

    if (!raw) {
      return {
        success: false,
        message: 'কোনো ওটিপি পাওয়া যায়নি বা কোডের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে পুনরায় কোড পাঠান।'
      };
    }

    try {
      const session: SmsOtpSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        return {
          success: false,
          message: 'ওটিপি কোডের মেয়াদের ৩ মিনিট শেষ হয়ে গেছে। অনুগ্রহ করে নতুন ওটিপি নিন।'
        };
      }

      if (session.code !== enteredCode.trim()) {
        return {
          success: false,
          message: 'ভুল ওটিপি কোড! অনুগ্রহ করে সঠিকভাবে ৬ ডিজিটের কোডটি লিখুন।'
        };
      }

      // Mark verified
      session.isVerified = true;
      localStorage.setItem(`${OTP_SESSIONS_KEY}_${cleanPhone}`, JSON.stringify(session));
      this.markPhoneVerified(cleanPhone);

      return {
        success: true,
        message: 'মোবাইল নম্বর সফলভাবে যাচাই (Verified) সম্পন্ন হয়েছে!'
      };
    } catch {
      return {
        success: false,
        message: 'যাচাই প্রক্রিয়ায় সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      };
    }
  },

  /**
   * Get active session for a phone
   */
  getActiveSession(phone: string): SmsOtpSession | null {
    const cleanPhone = phone.replace(/\D/g, '');
    const raw = localStorage.getItem(`${OTP_SESSIONS_KEY}_${cleanPhone}`);
    if (!raw) return null;
    try {
      const session: SmsOtpSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt) return null;
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Clear active session
   */
  clearSession(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    localStorage.removeItem(`${OTP_SESSIONS_KEY}_${cleanPhone}`);
  },

  /**
   * SMS Gateway configuration
   */
  getGatewayConfig(): SmsGatewayConfig {
    const raw = localStorage.getItem(SMS_CONFIG_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return {
      provider: 'simulated',
      senderId: 'LifeDrop',
      apiKey: 'demo_live_gateway_token',
      isEnabled: true
    };
  },

  saveGatewayConfig(config: SmsGatewayConfig) {
    localStorage.setItem(SMS_CONFIG_KEY, JSON.stringify(config));
  }
};
