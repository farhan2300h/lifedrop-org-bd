/** 
 * Supabase Client & Role-Based Access Control (RBAC) Authentication Helper 
 */

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

const INITIAL_USERS: UserProfile[] = [];

const isDemoMember = (user: UserProfile): boolean => {
  const email = (user.email || '').trim().toLowerCase();
  return user.id === 'user-regular-02' || email === 'user@lifedrop.org.bd';
};

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
    return () => {
      authListeners.delete(listener);
    };
  },

  getAllUsers(actor?: UserProfile | null): UserProfile[] {
    if (actor && actor.role !== 'admin') {
      throw new Error('অনুমতি নেই: শুধুমাত্র অ্যাডমিন সকল ব্যবহারকারীর তালিকা দেখতে পারবেন।');
    }

    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      const realUsers = parsed.filter((user: UserProfile) => !isDemoMember(user));
      if (realUsers.length !== parsed.length) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(realUsers));
      }
      return realUsers;
    } catch {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
  },

  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAdmin(user?: UserProfile | null): boolean {
    const targetUser = user !== undefined ? user : authService.getCurrentUser();
    return Boolean(targetUser && targetUser.role === 'admin');
  },

  async signUp(params: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    bloodGroup?: any;
    division?: string;
    district?: string;
    upazila?: string;
    gender?: any;
    age?: number;
    avatarUrl?: string;
    occupation?: string;
    bio?: string;
  }): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.fullName.trim();
    const cleanPhone = (params.phone || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।' };
    }
    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: 'অনুগ্রহ করে আপনার পুরো নাম প্রদান করুন।' };
    }
    if (!params.password || params.password.length < 6) {
      return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }

    if (this.isConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: params.password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              blood_group: params.bloodGroup,
              division: params.division,
              district: params.district,
              upazila: params.upazila,
              avatar_url: params.avatarUrl,
              role: 'user'
            }
          }
        });

        if (error) {
          return { success: false, message: error.message };
        }

        const newUser: UserProfile = {
          id: data.user?.id || `user-${Date.now()}`,
          email: cleanEmail,
          fullName: cleanName,
          phone: cleanPhone,
          role: 'user',
          createdAt: new Date().toISOString()
        };

        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));
        notifyAuthChange(newUser);
        return { success: true, user: newUser, message: 'নিবন্ধন সফল হয়েছে!' };
      } catch (err: any) {
        return { success: false, message: err.message || 'সার্ভারে সংযোগ ব্যর্থ হয়েছে।' };
      }
    }

    const users = this.getAllUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে।' };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      fullName: cleanName,
      phone: cleanPhone,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));
    notifyAuthChange(newUser);

    return { 
      success: true, 
      user: newUser, 
      message: 'অভিনন্দন! আপনার সাধারণ ইউজার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।' 
    };
  },

  async signIn(identifier: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      return { success: false, message: 'মোবাইল নম্বর/ইমেইল এবং পাসওয়ার্ড উভয়ই পূরণ করা আবশ্যক।' };
    }

    const isEmail = cleanId.includes('@');
    const cleanPhone = cleanId.replace(/\D/g, '');

    if (this.isConfigured && supabase) {
      try {
        let authResult;
        if (isEmail) {
          authResult = await supabase.auth.signInWithPassword({
            email: cleanId.toLowerCase(),
            password
          });
        } else {
          const formattedPhone = cleanPhone.startsWith('880')
            ? `+${cleanPhone}`
            : cleanPhone.startsWith('0')
              ? `+88${cleanPhone}`
              : `+880${cleanPhone}`;
          authResult = await supabase.auth.signInWithPassword({
            phone: formattedPhone,
            password
          });
        }

        const { data, error } = authResult;
        if (error || !data.user) {
          return { 
            success: false, 
            message: error?.message || (isEmail ? 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।' : 'মোবাইল নম্বর বা পাসওয়ার্ড ভুল হয়েছে।') 
          };
        }

        let role: UserRole = 'user';
        const userEmail = (data.user.email || cleanId).toLowerCase();

        if (
          userEmail === 'blooddonationnetwork5@gmail.com' ||
          data.user.app_metadata?.role === 'admin' ||
          data.user.user_metadata?.role === 'admin'
        ) {
          role = 'admin';
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || (isEmail ? cleanId : `${cleanPhone}@lifedrop.org.bd`),
          fullName: data.user.user_metadata?.full_name || 'Admin',
          phone: data.user.phone || data.user.user_metadata?.phone || cleanPhone,
          role,
          createdAt: data.user.created_at
        };

        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userProfile));
        notifyAuthChange(userProfile);
        return { success: true, user: userProfile };
      } catch (err: any) {
        return { success: false, message: err.message || 'লগইন সার্ভারের সাথে সংযোগে ত্রুটি।' };
      }
    }

    return {
      success: false,
      message: 'নিরাপদ লগইন চালু করতে Supabase কনফিগার করতে হবে।'
    };
  },

  async updateProfile(
    userId: string, 
    updates: Partial<UserProfile>, 
    actor?: UserProfile | null
  ): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const effectiveActor = actor !== undefined ? actor : authService.getCurrentUser();
    if (!effectiveActor) {
      return { success: false, message: 'অনুমতি নেই: অনুগ্রহ করে প্রথমে লগইন করুন।' };
    }

    if (updates.role && updates.role !== effectiveActor.role && effectiveActor.role !== 'admin') {
      return { 
        success: false, 
        message: 'নিরাপত্তা সতর্কতা: সাধারণ ব্যবহারকারী নিজের রোল পরিবর্তন করে অ্যাডমিন হতে পারবেন না।' 
      };
    }

    if (effectiveActor.role !== 'admin' && effectiveActor.id !== userId) {
      return { 
        success: false, 
        message: 'অনুমতি নেই: আপনি শুধুমাত্র আপনার নিজের প্রোফাইল সম্পাদনা করতে পারেন।' 
      };
    }

    const users = this.getAllUsers(effectiveActor);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি।' };
    }

    const updatedUser: UserProfile = {
      ...users[index],
      ...updates,
      role: effectiveActor.role === 'admin' && updates.role ? updates.role : users[index].role
    };

    users[index] = updatedUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    if (effectiveActor.id === userId) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      notifyAuthChange(updatedUser);
    }

    return { success: true, user: updatedUser, message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' };
  },

  updateUserRole(
    targetUserId: string, 
    newRole: UserRole, 
    actor?: UserProfile | null
  ): { success: boolean; message: string } {
    const effectiveActor = actor !== undefined ? actor : authService.getCurrentUser();
    if (!effectiveActor || effectiveActor.role !== 'admin') {
      return { success: false, message: 'অনুমতি নেই: রোল পরিবর্তন কেবল অ্যাডমিনের জন্য অনুমোদিত।' };
    }

    const users = this.getAllUsers(effectiveActor);
    const index = users.findIndex(u => u.id === targetUserId);
    if (index === -1) return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি।' };

    users[index].role = newRole;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    if (effectiveActor.id === targetUserId) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(users[index]));
      notifyAuthChange(users[index]);
    }

    return { success: true, message: `ব্যবহারকারীর রোল পরিবর্তন করে '${newRole}' করা হয়েছে।` };
  },

  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string; isDemo?: boolean }> {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।' };
    }

    if (this.isConfigured && supabase) {
      try {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl
        });

        if (error) {
          return { success: false, message: error.message || 'পাসওয়ার্ড রিসেট ইমেইল পাঠাতে সমস্যা হয়েছে।' };
        }

        return { 
          success: true, 
          message: `আমরা ${cleanEmail} ঠিকানায় একটি পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স পরীক্ষা করুন।` 
        };
      } catch (err: any) {
        return { success: false, message: err.message || 'সার্ভারের সাথে সংযোগে ত্রুটি দেখা দিয়েছে।' };
      }
    }

    sessionStorage.setItem('lifedrop_pending_recovery', cleanEmail);
    return {
      success: true,
      isDemo: true,
      message: `[ডেমো মোড]: ${cleanEmail} ঠিকানায় রিসেট লিংক প্রেরণের অনুরোধ গৃহীত হয়েছে।`
    };
  },

  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }

    if (this.isConfigured && supabase) {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !sessionData.session) {
          return {
            success: false,
            message: 'রিকভারি সেশন পাওয়া যায়নি। নতুন পাসওয়ার্ড রিসেট ইমেইল পাঠান।'
          };
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
          return { success: false, message: error.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' };
        }

        return { success: true, message: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' };
      } catch (err: any) {
        return { success: false, message: err?.message || 'সার্ভারের সাথে সংযোগে ত্রুটি।' };
      }
    }

    sessionStorage.removeItem('lifedrop_pending_recovery');
    localStorage.setItem('lifedrop_demo_admin_pwd', newPassword);
    return {
      success: true,
      message: 'আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!'
    };
  },

  async signOut(): Promise<void> {
    if (this.isConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    notifyAuthChange(null);
  }
};

export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl || 'Not configured',
    isConfigured: isSupabaseConfigured()
  };
};
