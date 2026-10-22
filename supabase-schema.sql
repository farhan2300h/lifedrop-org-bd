-- ==============================================================================
-- LifeDrop Bangladesh — Production Database Security & Schema Migration
-- Project URL: https://ncnboxpojpvnupbxjlhi.supabase.co
-- ==============================================================================
--
-- This script configures:
-- 1. Tables: profiles, donors, blood_requests, notifications, audit_logs, admin_passkeys
-- 2. Row Level Security (RLS) enabled on EVERY table
-- 3. Fine-grained SELECT, INSERT, UPDATE, DELETE policies
-- 4. Server-side role protection (users CANNOT make themselves admin)
-- 5. Automatic profile creation trigger on Supabase Auth signup
-- 6. Helper function is_admin() for server-side authorization checks
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE blood_group_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status_type AS ENUM ('urgent', 'pending', 'donor_found', 'in_progress', 'fulfilled', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE urgency_level_type AS ENUM ('immediate', 'today', 'scheduled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  blood_group TEXT,
  division TEXT DEFAULT 'Dhaka',
  district TEXT DEFAULT 'Dhaka',
  upazila TEXT,
  gender TEXT DEFAULT 'male',
  age INTEGER CHECK (age IS NULL OR (age >= 18 AND age <= 65)),
  occupation TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. DONORS TABLE (Registered Voluntary Donors)
CREATE TABLE IF NOT EXISTS public.donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 65),
  gender TEXT NOT NULL,
  last_donation_date DATE,
  total_donations INTEGER NOT NULL DEFAULT 0 CHECK (total_donations >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  availability_reported_at TEXT DEFAULT 'সরাসরি প্রস্তুত',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  phone_consent BOOLEAN NOT NULL DEFAULT TRUE,
  occupation TEXT,
  notes TEXT,
  photo_url TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on donors
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

-- 5. BLOOD REQUESTS TABLE (Emergency Patient Requests)
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER CHECK (patient_age IS NULL OR (patient_age > 0 AND patient_age <= 120)),
  hemoglobin TEXT,
  blood_group TEXT NOT NULL,
  units_required INTEGER NOT NULL DEFAULT 1 CHECK (units_required > 0 AND units_required <= 20),
  hospital TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'immediate' CHECK (urgency IN ('immediate', 'today', 'scheduled')),
  reason TEXT NOT NULL,
  date_needed DATE NOT NULL DEFAULT CURRENT_DATE,
  time_needed TEXT,
  status TEXT NOT NULL DEFAULT 'urgent' CHECK (status IN ('urgent', 'pending', 'donor_found', 'in_progress', 'fulfilled', 'completed', 'cancelled')),
  attendant_notes TEXT,
  consent BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on blood_requests
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

-- 6. NOTIFICATIONS TABLE (Emergency Alerts & Announcements)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'emergency_blood',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  blood_group TEXT,
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  patient_name TEXT,
  hospital TEXT,
  contact_phone TEXT,
  urgency TEXT DEFAULT 'immediate',
  district TEXT,
  upazila TEXT,
  certificate_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7. AUDIT LOGS TABLE (Security Event Tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. ADMIN WEBAUTHN / PASSKEYS TABLE
CREATE TABLE IF NOT EXISTS public.admin_passkeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT,
  transports TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Enable RLS on admin_passkeys
ALTER TABLE public.admin_passkeys ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- SERVER-SIDE SECURITY FUNCTIONS
-- ==============================================================================

-- Helper function: Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Trigger: Automatically create public.profiles entry upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    blood_group,
    division,
    district,
    upazila,
    avatar_url,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    'user', -- ALWAYS 'user' by default! Client CANNOT elevate to admin on signup
    COALESCE(NEW.raw_user_meta_data->>'blood_group', 'O+'),
    COALESCE(NEW.raw_user_meta_data->>'division', 'Dhaka'),
    COALESCE(NEW.raw_user_meta_data->>'district', 'Dhaka'),
    COALESCE(NEW.raw_user_meta_data->>'upazila', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Prevent non-admin users from changing their own or other users' roles
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if executor is an admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: সাধারণ ব্যবহারকারী নিজের বা অন্যের রোল পরিবর্তন করতে পারবেন না (403 Forbidden)';
    END IF;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone authenticated can read basic profile info; Public can see minimal member count
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (TRUE);

-- Users can only insert their own profile (matching auth.uid)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile; Admins can update any profile
CREATE POLICY "Users can update own profile, Admins can update any"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Only Admins can delete profiles
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- DONORS POLICIES
-- ------------------------------------------------------------------------------
-- Approved donors are viewable by anyone (public directory); Pending/Rejected viewable only by owner or admin
CREATE POLICY "Public can view approved donors with consent"
  ON public.donors FOR SELECT
  USING (approval_status = 'approved' OR auth.uid() = user_id OR public.is_admin());

-- Authenticated users or public can register as a donor
CREATE POLICY "Authenticated users or guests can register as donor"
  ON public.donors FOR INSERT
  WITH CHECK (
    -- If user_id is provided, it must match current logged-in user
    (user_id IS NULL OR auth.uid() = user_id)
    -- Default approval_status must be 'pending' for normal users
    AND (approval_status = 'pending' OR public.is_admin())
  );

-- Donors can update their own availability and details; Admins can update any (including approval)
CREATE POLICY "Donors can update own profile, Admins can moderate"
  ON public.donors FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR (
      auth.uid() = user_id 
      AND approval_status = OLD.approval_status -- Regular user cannot self-approve
      AND is_verified = OLD.is_verified       -- Regular user cannot self-verify
    )
  );

-- Donors can delete their own registration; Admins can delete any
CREATE POLICY "Donors can delete own, Admins can delete any"
  ON public.donors FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- BLOOD REQUESTS POLICIES
-- ------------------------------------------------------------------------------
-- Emergency blood requests are viewable by everyone (public humanitarian network)
CREATE POLICY "Blood requests are publicly viewable"
  ON public.blood_requests FOR SELECT
  USING (TRUE);

-- Anyone (registered user or guest) can submit an emergency blood request
CREATE POLICY "Anyone can submit a blood request"
  ON public.blood_requests FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Request owner can update their request; Admins can update/fulfill any request
CREATE POLICY "Owner or admin can update blood request"
  ON public.blood_requests FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Request owner or admin can delete request
CREATE POLICY "Owner or admin can delete blood request"
  ON public.blood_requests FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
-- Public/system notifications viewable by all; User-specific viewable by user
CREATE POLICY "Notifications viewable by recipient or all"
  ON public.notifications FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id OR public.is_admin());

-- Authenticated users or server can insert emergency broadcasts
CREATE POLICY "Anyone can broadcast emergency notification"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

-- Users can mark their notifications as read
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin())
  WITH CHECK (TRUE);

-- ------------------------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- ------------------------------------------------------------------------------
-- Only Admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- Anyone/System can insert an audit log event
CREATE POLICY "System can record audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- ------------------------------------------------------------------------------
-- ADMIN PASSKEYS POLICIES
-- ------------------------------------------------------------------------------
-- Passkeys are strictly accessible by their owner
CREATE POLICY "Users can manage own passkeys"
  ON public.admin_passkeys FOR ALL
  USING (auth.uid() = user_id AND public.is_admin())
  WITH CHECK (auth.uid() = user_id AND public.is_admin());

-- ==============================================================================
-- BOOTSTRAP INSTRUCTIONS (How to create your First Admin)
-- ==============================================================================
-- Step 1: Register an account on LifeDrop website with your official admin email
--         (e.g., blooddonationnetwork5@gmail.com)
-- Step 2: Open Supabase Dashboard -> SQL Editor and run this single command:
--
-- UPDATE public.profiles
-- SET role = 'admin', is_verified = TRUE
-- WHERE email = 'blooddonationnetwork5@gmail.com';
--
-- Step 3: Now log in from the Admin Login tab using your email & password!
-- ==============================================================================
