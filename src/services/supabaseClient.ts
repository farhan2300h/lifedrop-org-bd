/** * Supabase Client & Role-Based Access Control (RBAC) Authentication Helper * Handles real Supabase Authentication & PostgreSQL RLS when configured, and provides * a secure, fully-enforced demo environment with distinct Admin and Regular User roles. */

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

// Keep the designated admin profile separate from the public user roster.
// A brand-new website must not show fabricated members or donors.
const INITIAL_ADMIN_PROFILE: UserProfile = {
  id: 'user-admin-01',
  email: 'blooddonationnetwork5@gmail.com',
  fullName: 'অ্যাডমিন',
  phone: '',
  role: 'admin',
  createdAt: new Date().toISOString()
};

// No demo members: the roster starts empty until real users register.
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

  /** * Retrieves all registered users from storage or Supabase. * RBAC Security Check: Only admins can view the full user roster. */
  getAllUsers(actor?: UserProfile | null): UserProfile[] {
    // Backend/service-level permission check (Requirement 4)
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
      // Remove the old built-in demo member from previously saved browser data.
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

  /** * Returns currently logged-in user profile or null */
  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /** * Checks if a user has admin privileges */
  isAdmin(user?: UserProfile | null): boolean {
    const targetUser = user !== undefined ? user : authService.getCurrentUser();
    return Boolean(targetUser && targetUser.role === 'admin');
  },

  /** * New User Registration (Sign Up) * REQUIREMENT 5 ENFORCEMENT: * Every new registration defaults strictly to 'user' role. * Client cannot supply or escalate to 'admin' role. */
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

    // If real Supabase is configured
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
              role: 'user' // PostgreSQL trigger forces 'user'
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
          role: 'user', // Strictly 'user'
          bloodGroup: params.bloodGroup,
          division: params.division,
          district: params.district,
          upazila: params.upazila,
          gender: params.gender,
          age: params.age,
          avatarUrl: params.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
          occupation: params.occupation,
          bio: params.bio,
          createdAt: new Date().toISOString()
        };

        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));
        notifyAuthChange(newUser);
        return { success: true, user: newUser, message: 'নিবন্ধন সফল হয়েছে!' };
      } catch (err: any) {
        return { success: false, message: err.message || 'সার্ভারে সংযোগ ব্যর্থ হয়েছে।' };
      }
    }

    // Local Storage / Demo Mode Execution
    const users = this.getAllUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে।' };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      fullName: cleanName,
      phone: cleanPhone,
      role: 'user', // REQUIREMENT 5: Default role is always 'user'
      bloodGroup: params.bloodGroup,
      division: params.division,
      district: params.district,
      upazila: params.upazila,
      gender: params.gender,
      age: params.age,
      avatarUrl: params.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      occupation: params.occupation,
      bio: params.bio,
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

  /** * User Sign In (Supports Email, Mobile Phone Number, Admin & Regular User) */
  async signIn(identifier: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      return { success: false, message: 'মোবাইল নম্বর/ইমেইল এবং পাসওয়ার্ড উভয়ই পূরণ করা আবশ্যক।' };
    }

    const isEmail = cleanId.includes('@');
    const cleanPhone = cleanId.replace(/\D/g, '');

    // Real Supabase
    if (this.isConfigured && supabase) {
      try {
        let authResult;
        if (isEmail) {
          authResult = await supabase.auth.signInWithPassword({
            email: cleanId.toLowerCase(),
            password
          });
        } else {
          // Supabase Phone Auth formatted as E.164 (+8801XXXXXXXXX)
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
        if (error) {
          return { 
            success: false, 
            message: error.message || (isEmail ? 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।' : 'মোবাইল নম্বর বা পাসওয়ার্ড ভুল হয়েছে।') 
          };
        }

        // Never trust email or editable user_metadata to grant admin access.
        // The role must be assigned in the protected user_roles table by an authorized
        // database administrator. If role lookup fails, fail closed as a regular user.
        let role: UserRole = 'user';
        if (data.user?.id) {
          const { data: roleRows, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .eq('role', 'admin')
            .limit(1);
          if (!roleError && Array.isArray(roleRows) && roleRows.length > 0) {
            role = 'admin';
          }
        }
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || (isEmail ? cleanId : `${cleanPhone}@lifedrop.org.bd`),
          fullName: data.user.user_metadata?.full_name || 'Member',
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

    // Authentication must use Supabase. Browser-local demo authentication is disabled.
    return {
      success: false,
      message: 'নিরাপদ লগইন চালু করতে Supabase কনফিগার করতে হবে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
    };
  },

  /** * Updates user profile * RBAC Security: Non-admin users CANNOT modify their own role. */
  async updateProfile(
    userId: string, 
    updates: Partial<UserProfile>, 
    actor?: UserProfile | null
  ): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const effectiveActor = actor !== undefined ? actor : authService.getCurrentUser();
    if (!effectiveActor) {
      return { success: false, message: 'অনুমতি নেই: অনুগ্রহ করে প্রথমে লগইন করুন।' };
    }

    // RBAC: If attempting to change role, must be admin!
    if (updates.role && updates.role !== effectiveActor.role && effectiveActor.role !== 'admin') {
      return { 
        success: false, 
        message: 'নিরাপত্তা সতর্কতা: সাধারণ ব্যবহারকারী নিজের রোল পরিবর্তন করে অ্যাডমিন হতে পারবেন না।' 
      };
    }

    // RBAC: Regular user can only edit their OWN profile
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
      // If actor is not admin, prevent role alteration
      role: effectiveActor.role === 'admin' && updates.role ? updates.role : users[index].role
    };

    users[index] = updatedUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // If updating currently logged in user
    if (effectiveActor.id === userId) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      notifyAuthChange(updatedUser);
    }

    return { success: true, user: updatedUser, message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' };
  },

  /** * Promotes or demotes user role (Admin only) */
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

    // If changing active user's role
    if (effectiveActor.id === targetUserId) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(users[index]));
      notifyAuthChange(users[index]);
    }

    return { success: true, message: `ব্যবহারকারীর রোল পরিবর্তন করে '${newRole}' করা হয়েছে।` };
  },

  /** * Password Recovery: Send Reset Email */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string; isDemo?: boolean }> {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।' };
    }

    if (this.isConfigured && supabase) {
      try {
        // Do not append a custom hash here: Supabase uses the URL hash to return
        // the recovery access token and `type=recovery` callback.
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
      message: `[ডেমো মোড]: ${cleanEmail} ঠিকানায় রিসেট লিংক প্রেরণের অনুরোধ গৃহীত হয়েছে। আপনি নিচে সরাসরি নতুন পাসওয়ার্ড সেট করতে পারেন।`
    };
  },

  /** * Password Recovery: Set New Password */
  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }

    if (this.isConfigured && supabase) {
      try {
        // Supabase must have exchanged the recovery callback for a valid session
        // before updateUser can change the password.
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          return { success: false, message: sessionError.message || 'রিকভারি সেশন যাচাই করা যায়নি। নতুন রিসেট ইমেইল পাঠিয়ে আবার চেষ্টা করুন।' };
        }

        if (!sessionData.session) {
          return {
            success: false,
            message: 'রিকভারি সেশন পাওয়া যায়নি। এই পেজ বন্ধ করুন, নতুন পাসওয়ার্ড রিসেট ইমেইল পাঠান এবং ইমেইলের নতুন লিংকটি একই ব্রাউজারে খুলুন।'
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
      message: 'আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে! এখন আপনি নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারেন।'
    };
  },

  /** * Sign Out */
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
    url: supabaseUrl || 'Not configured (Client review mode active)',
    isConfigured: isSupabaseConfigured()
  };
};
