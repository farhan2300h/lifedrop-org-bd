export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type Gender = 'male' | 'female' | 'other';

export interface DonationRecord {
  id: string;
  date: string; // YYYY-MM-DD
  hospital: string;
  location: string;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  donorId?: string;
  donorName?: string;
  bloodGroup?: BloodGroup;
  userId?: string;
  certificateId?: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  bloodGroup?: BloodGroup;
  division?: string;
  district?: string;
  upazila?: string;
  gender?: Gender;
  age?: number;
  occupation?: string;
  bio?: string;
  donorId?: string;
  createdAt: string;
}

export interface Donor {
  id: string;
  userId?: string; // Linked user account ID (RBAC ownership)
  fullName: string;
  photoUrl?: string;
  bloodGroup: BloodGroup;
  phone: string;
  email?: string;
  division: string;
  district: string;
  upazila: string;
  age: number;
  gender: Gender;
  lastDonationDate: string | null; // YYYY-MM-DD or null if first time
  totalDonations: number;
  isAvailable: boolean;
  availabilityReportedAt: string; // e.g., "Self-reported recently"
  isVerified: boolean;
  approvalStatus: ApprovalStatus;
  phoneConsent: boolean; // Consent to show phone directly or require reveal
  history: DonationRecord[];
  occupation?: string;
  notes?: string;
  createdAt: string;
}

export type UrgencyLevel = 'immediate' | 'today' | 'scheduled';

export type RequestStatus = 
  | 'pending'      // অপেক্ষমাণ
  | 'donor_found'  // ডোনার পাওয়া গেছে
  | 'completed'    // সম্পন্ন
  | 'cancelled'    // বাতিল
  | 'urgent'       // জরুরি (পূর্ববর্তী সামঞ্জস্য)
  | 'in_progress'  // প্রক্রিয়ায়
  | 'fulfilled';   // সংগৃহীত

export interface BloodRequest {
  id: string;
  userId?: string; // Linked user account ID (RBAC ownership)
  patientName: string;
  patientAge?: number;
  hemoglobin?: string; // g/dL
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospital: string;
  division: string;
  district: string;
  upazila: string;
  contactName: string;
  contactPhone: string;
  urgency: UrgencyLevel;
  reason: string;
  dateNeeded: string; // YYYY-MM-DD
  timeNeeded?: string; // e.g. 10:30 AM
  status: RequestStatus;
  attendantNotes?: string;
  consent?: boolean; // প্রয়োজন অনুযায়ী যোগাযোগের সম্মতি
  createdAt: string;
}

export interface DivisionGeo {
  id: string;
  nameEn: string;
  nameBn: string;
  districts: DistrictGeo[];
}

export interface DistrictGeo {
  id: string;
  nameEn: string;
  nameBn: string;
  upazilas: string[];
}

export type ActivePage = 
  | 'home' 
  | 'search' 
  | 'register' 
  | 'emergency' 
  | 'eligibility' 
  | 'about' 
  | 'contact'
  | 'admin'
  | 'login'
  | 'signup'
  | 'dashboard';

export interface DonationCertificate {
  id: string;
  donorId?: string;
  userId?: string;
  donorName: string;
  bloodGroup: BloodGroup;
  donationDate: string; // YYYY-MM-DD
  hospital: string;
  location: string;
  serialNumber: string; // e.g. LD-2026-CERT-8742
  issueDate: string;
  donationCount: number;
  recipientName?: string;
  authorizedBy: string; // "CEO - HABIB"
  verificationCode: string;
}

export type NotificationType = 'emergency_blood' | 'certificate_issued' | 'donor_verified' | 'system';

export interface LifeDropNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  bloodGroup?: BloodGroup;
  requestId?: string;
  patientName?: string;
  hospital?: string;
  contactPhone?: string;
  urgency?: UrgencyLevel;
  district?: string;
  upazila?: string;
  createdAt: string;
  isRead: boolean;
  certificateId?: string;
}

export interface SmsOtpSession {
  phone: string;
  code: string;
  expiresAt: number; // timestamp
  isVerified: boolean;
  purpose: 'donor_registration' | 'emergency_request' | 'phone_verification';
}

