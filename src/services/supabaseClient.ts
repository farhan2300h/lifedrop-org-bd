import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';

const cleanEnvVar = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^['"](.*)['"]$/, '$1').trim();
};

const supabaseUrl = cleanEnvVar(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnvVar(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

const USERS_STORAGE_KEY = 'lifedrop_rbac_users_v1';
const CURRENT_USER_STORAGE_KEY = 'lifedrop_current_user_v1';

type AuthListener = (user: UserProfile | null) => void;
const authListeners = new Set<AuthListener>();

function notifyAuthChange(user: UserProfile | null) {
  authListeners.forEach(listener => listener(user));
}

export const authService = {
  get isConfigured(): boolean {
    return isSupabaseConfigured();
  },

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

  // 🎯 প্রোফাইল, নাম, ঠিকানা ও ছবি স্থায়ীভাবে আপডেট করার মেথড 🎯
  async updateProfile(
    userId: string, 
    updates: Partial<UserProfile>, 
    actor?: UserProfile | null
  ): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const current = this.getCurrentUser();
    
    // তৈরি করা আপডেট প্রোফাইল অবজেক্ট
    const updatedUser: UserProfile = {
      ...(current || {
        id: userId,
        email: 'blooddonationnetwork5@gmail.com',
        fullName: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString()
      }),
      ...updates
    };

    // ১. লোকাল স্টোরেজে স্থায়ীভাবে সংরক্ষণ
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));

    // ২. অল ইউজার লিস্টিংয়ে আপডেট
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userId || u.email === updatedUser.email);
    if (index !== -1) {
      users[index] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // ৩. সুপাবেজ ক্লাউডে মেটাডেটা আপডেট
    if (this.isConfigured && supabase) {
      try {
        await supabase.auth.updateUser({
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
      } catch (err) {
        // ক্লাউড না থাকলেও লোকাল সিঙ্ক সচল থাকবে
      }
    }

    notifyAuthChange(updatedUser);
    return { success: true, user: updatedUser, message: 'প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!' };
  },

  async signIn(identifier: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !password) return { success: false, message: 'সকল ফিল্ড পূরণ করুন।' };

    if (this.isConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password
        });

        if (error || !data.user) {
          return { success: false, message: error?.message || 'লগইন ব্যর্থ হয়েছে।' };
        }

        let role: UserRole = 'user';
        if (cleanId === 'blooddonationnetwork5@gmail.com' || data.user.app_metadata?.role === 'admin') {
          role = 'admin';
        }

        // পূর্বে লোকাল স্টোরেজে সংরক্ষিত প্রোফাইল থাকলে তা অগ্রাধিকার পাবে
        const savedLocal = this.getCurrentUser();

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanId,
          fullName: savedLocal?.fullName || data.user.user_metadata?.full_name || (role === 'admin' ? 'Admin' : 'Member'),
          phone: savedLocal?.phone || data.user.phone || data.user.user_metadata?.phone || '',
          avatarUrl: savedLocal?.avatarUrl || data.user.user_metadata?.avatar_url || '',
          division: savedLocal?.division || data.user.user_metadata?.division || 'Dhaka',
          district: savedLocal?.district || data.user.user_metadata?.district || 'Dhaka',
          upazila: savedLocal?.upazila || data.user.user_metadata?.upazila || 'Dhanmondi',
          role,
          createdAt: data.user.created_at
        };

        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userProfile));
        notifyAuthChange(userProfile);
        return { success: true, user: userProfile };
      } catch (err: any) {
        return { success: false, message: err.message };
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
