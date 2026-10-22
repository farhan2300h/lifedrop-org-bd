/**
 * LifeDrop Emergency Notification & Real-Time Broadcast Service
 * 
 * Strict Production Security Hardening:
 * 1. Zero Fake / Sample Notifications. When there are no alerts, count is 0.
 * 2. Real-time emergency broadcasts when legitimate users submit requests.
 * 3. Supabase notifications table synchronization.
 * 4. Web Audio tone alert and Browser push notifications for real emergencies.
 */

import { BloodRequest, LifeDropNotification } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const REAL_NOTIFICATIONS_KEY = 'lifedrop_real_notifications_v1';
const PUSH_PERMISSION_KEY = 'lifedrop_push_opt_in';

type NotificationListener = () => void;
type UrgentAlertCallback = (notification: LifeDropNotification) => void;

const listeners = new Set<NotificationListener>();
const urgentAlertCallbacks = new Set<UrgentAlertCallback>();

function playEmergencyAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.setValueAtTime(880.00, now + 0.15);
    osc1.frequency.setValueAtTime(659.25, now + 0.3);
    osc1.frequency.setValueAtTime(880.00, now + 0.45);

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.65);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.65);
  } catch {
    // Audio Context might require user gesture
  }
}

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('lifedrop_emergency_broadcast');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'EMERGENCY_REQUEST') {
        const notif = event.data.notification as LifeDropNotification;
        playEmergencyAlertSound();
        urgentAlertCallbacks.forEach(cb => cb(notif));
        notifyListeners();
      }
    };
  } catch {
    broadcastChannel = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'lifedrop_last_broadcast_event' && e.newValue) {
      try {
        const notif: LifeDropNotification = JSON.parse(e.newValue);
        playEmergencyAlertSound();
        urgentAlertCallbacks.forEach(cb => cb(notif));
        notifyListeners();
      } catch {
        // Parse error
      }
    }
  });
}

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export const notificationService = {
  subscribe(fn: NotificationListener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  onUrgentAlert(cb: UrgentAlertCallback) {
    urgentAlertCallbacks.add(cb);
    return () => {
      urgentAlertCallbacks.delete(cb);
    };
  },

  async requestPushPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      localStorage.setItem(PUSH_PERMISSION_KEY, granted ? 'true' : 'false');
      return granted;
    } catch {
      return false;
    }
  },

  isPushEnabled(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  },

  /**
   * Retrieves all notifications.
   * NEVER returns fake demo notifications. Returns [] if empty.
   */
  getNotifications(): LifeDropNotification[] {
    const raw = localStorage.getItem(REAL_NOTIFICATIONS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.isRead).length;
  },

  markAllAsRead() {
    const list = this.getNotifications().map(n => ({ ...n, isRead: true }));
    localStorage.setItem(REAL_NOTIFICATIONS_KEY, JSON.stringify(list));
    notifyListeners();
  },

  markAsRead(id: string) {
    const list = this.getNotifications().map(n => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem(REAL_NOTIFICATIONS_KEY, JSON.stringify(list));
    notifyListeners();
  },

  /**
   * Real emergency broadcast trigger
   */
  broadcastEmergency(request: BloodRequest) {
    const urgencyBengali = request.urgency === 'immediate' ? 'তাত্ক্ষণিক জরুরি' : 'আজকেই প্রয়োজন';
    const notif: LifeDropNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'emergency_blood',
      title: `🚨 জরুরি রক্তের প্রয়োজন (${request.bloodGroup})`,
      message: `${request.hospital}, ${request.district}-এ রোগীর জন্য ${request.unitsRequired} ব্যাগ ${request.bloodGroup} রক্ত প্রয়োজন (${urgencyBengali})।`,
      bloodGroup: request.bloodGroup,
      requestId: request.id,
      patientName: request.patientName,
      hospital: request.hospital,
      contactPhone: request.contactPhone,
      urgency: request.urgency,
      district: request.district,
      upazila: request.upazila,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    // Save to Supabase notifications table if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        supabase.from('notifications').insert([{
          type: notif.type,
          title: notif.title,
          message: notif.message,
          blood_group: notif.bloodGroup,
          patient_name: notif.patientName,
          hospital: notif.hospital,
          contact_phone: notif.contactPhone,
          urgency: notif.urgency,
          district: notif.district,
          upazila: notif.upazila
        }]).then();
      } catch {
        // Table pending
      }
    }

    const existing = this.getNotifications();
    existing.unshift(notif);
    if (existing.length > 50) existing.pop();
    localStorage.setItem(REAL_NOTIFICATIONS_KEY, JSON.stringify(existing));

    playEmergencyAlertSound();

    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'EMERGENCY_REQUEST', notification: notif });
      } catch {
        // ignore
      }
    }

    localStorage.setItem('lifedrop_last_broadcast_event', JSON.stringify(notif));
    urgentAlertCallbacks.forEach(cb => cb(notif));
    notifyListeners();

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const nativeNotif = new Notification(`🚨 জরুরি রক্তের প্রয়োজন: ${request.bloodGroup}`, {
          body: `${request.patientName}-এর জন্য ${request.hospital}, ${request.district}-এ রক্ত প্রয়োজন। কল করুন: ${request.contactPhone}`,
          icon: '/favicon.ico',
          tag: notif.id
        });
        nativeNotif.onclick = () => window.focus();
      } catch {
        // ignore
      }
    }

    return notif;
  },

  notifyCertificateIssued(donorName: string, bloodGroup: string, certificateId: string) {
    const notif: LifeDropNotification = {
      id: `cert-notif-${Date.now()}`,
      type: 'certificate_issued',
      title: '🎖️ অভিনন্দন! রক্তদানের প্রশংসাপত্র প্রদান করা হয়েছে',
      message: `${donorName}, আপনার রক্তদানের স্বীকৃতিস্বরূপ LifeDrop অফিসিয়াল প্রশংসাপত্র ইস্যু করা হয়েছে।`,
      certificateId,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    const existing = this.getNotifications();
    existing.unshift(notif);
    localStorage.setItem(REAL_NOTIFICATIONS_KEY, JSON.stringify(existing));
    notifyListeners();
  }
};
