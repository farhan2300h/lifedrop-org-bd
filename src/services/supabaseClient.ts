import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, UserRole, BloodGroup } from '../types';

const cleanEnvVar = (val: unknown): string => typeof val === 'string'
  ? val.trim().replace(/^['"](.*)['"]$/, '$1').trim() : '';
const supabaseUrl = cleanEnvVar(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnvVar(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = (): boolean =>
  Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project'));

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

const USERS_STORAGE_KEY = 'lifedrop_rbac_users_v1';
const CURRENT_USER_STORAGE_KEY = 'lifedrop_current_user_v1';
type AuthListener = (user: UserProfile | null) => void;
const authListeners = new Set<AuthListener>();
function notifyAuthChange(user: UserProfile | null) {
  authListeners.forEach(listener => listener(user));
}

export const convertFileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export interface RegistrationDetails {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  bloodGroup: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  currentArea: string;
  lastDonationDate: string;
  isAvailable: boolean;
  avatarUrl: string;
  donorListConsent: boolean;
  privacyConsent: boolean;
}

export const authService = {
  get isConfigured(): boolean { return isSupabaseConfigured(); },
  subscribe(listener: AuthListener) {
    authListeners.add(listener);
    return () => { authListeners.delete(listener); };
  },
  getAllUsers(actor?: UserProfile | null): UserProfile[] {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  },
  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  async updateProfile(
    userId: string, updates: Partial<UserProfile>, actor?: UserProfile | null
  ): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const current = this.getCurrentUser();
    if (!current || current.id !== userId) {
      return { success: false, message: 'নিজের প্রোফাইল ছাড়া পরিবর্তন করা যাবে না।' };
    }
    const updatedUser: UserProfile = { ...current, ...updates, id: current.id, role: current.role };
    if (this.isConfigured && supabase) {
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData.user || sessionData.user.id !== userId) {
        return { success: false, message: 'আবার লগইন করুন।' };
      }
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: updatedUser.fullName,
          phone: updatedUser.phone,
          avatar_url: updatedUser.avatarUrl,
          division: updatedUser.division,
          district: updatedUser.district,
          upazila: updatedUser.upazila,
          blood_group: updatedUser.bloodGroup,
          gender: updatedUser.gender,
          age: updatedUser.age
        }
      });
      if (error) return { success: false, message: error.message };
    }
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) users[index] = updatedUser;
    else users.push(updatedUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    notifyAuthChange(updatedUser);
    return { success: true, user: updatedUser, message: 'তথ্য সফলভাবে সেভ হয়েছে!' };
  },
  async signUp(details: RegistrationDetails): Promise<{
    success: boolean; user?: UserProfile; message?: string; needsConfirmation?: boolean;
  }> {
    if (!supabase) return { success: false, message: 'Supabase কনফিগার করা নেই।' };
    if (!details.donorListConsent || !details.privacyConsent)
      return { success: false, message: 'দুটি সম্মতি প্রয়োজন।' };
    try {
      const { data, error } = await supabase.auth.signUp({
        email: details.email.trim().toLowerCase(),
        password: details.password,
        options: {
          data: {
            full_name: details.fullName.trim(),
            phone: details.phone.trim(),
            blood_group: details.bloodGroup,
            division: details.division,
            district: details.district,
            upazila: details.upazila,
            current_area: details.currentArea,
            last_donation_date: details.lastDonationDate || null,
            is_available: details.isAvailable,
            avatar_url: details.avatarUrl,
            donor_list_consent: details.donorListConsent,
            privacy_consent: details.privacyConsent
          }
        }
      });
      if (error) return { success: false, message: error.message };
      if (!data.user) return { success: false, message: 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' };
      if (!data.session) {
        return {
          success: true, needsConfirmation: true,
          message: 'ইমেইলে যাচাইকরণ লিংক পাঠানো হয়ে থাকতে পারে। ইমেইল যাচাই করে লগইন করুন।'
        };
      }
      const profile: UserProfile = {
        id: data.user.id,
        email: data.user.email || details.email.trim().toLowerCase(),
        fullName: details.fullName.trim(),
        phone: details.phone.trim(),
        bloodGroup: details.bloodGroup,
        division: details.division,
        district: details.district,
        upazila: details.upazila,
        avatarUrl: details.avatarUrl,
        role: 'user',
        createdAt: data.user.created_at
      };
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(profile));
      const users = this.getAllUsers().filter(u => u.id !== profile.id);
      users.push(profile);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      notifyAuthChange(profile);
      return { success: true, user: profile, message: 'রেজিস্ট্রেশন সফল হয়েছে!' };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' };
    }
  },
  async signIn(identifier: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !password) return { success: false, message: 'সকল ফিল্ড পূরণ করুন।' };
    if (this.isConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanId, password });
        if (error || !data.user) return { success: false, message: error?.message || 'লগইন ব্যর্থ হয়েছে।' };
        let role: UserRole = 'user';
        if (cleanId === 'blooddonationnetwork5@gmail.com' || data.user.app_metadata?.role === 'admin') role = 'admin';
        const local = this.getCurrentUser();
        const savedLocal = local?.id === data.user.id ? local : null;
        const meta = data.user.user_metadata || {};
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanId,
          fullName: savedLocal?.fullName || meta.full_name || (role === 'admin' ? 'Admin' : 'Member'),
          phone: savedLocal?.phone || data.user.phone || meta.phone || '',
          avatarUrl: savedLocal?.avatarUrl || meta.avatar_url || '',
          division: savedLocal?.division || meta.division || 'Dhaka',
          district: savedLocal?.district || meta.district || 'Dhaka',
          upazila: savedLocal?.upazila || meta.upazila || 'Dhanmondi',
          bloodGroup: savedLocal?.bloodGroup || meta.blood_group,
          role,
          createdAt: data.user.created_at
        };
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userProfile));
        notifyAuthChange(userProfile);
        return { success: true, user: userProfile };
      } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'লগইন ব্যর্থ হয়েছে।' };
      }
    }
    return { success: false, message: 'Supabase কনফিগার করা নেই।' };
  },
  async signOut(): Promise<void> {
    if (this.isConfigured && supabase) {
      try { await supabase.auth.signOut(); } catch {}
    }
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    notifyAuthChange(null);
  }
};
export const getSupabaseConfig = () => ({
  url: supabaseUrl || 'Not configured',
  isConfigured: isSupabaseConfigured()
});
