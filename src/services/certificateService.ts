/**
 * LifeDrop Digital Certificate & Donor Appreciation Service
 * Generates, issues, and validates official digital certificates of appreciation
 * (রক্তদানের ডিজিটাল সম্মাননা সনদ) and donor badges for successful blood donations.
 */

import { DonationCertificate, BloodGroup, Donor, DonationRecord, UserProfile } from '../types';
import { notificationService } from './notificationService';

const CERTIFICATES_STORAGE_KEY = 'lifedrop_certificates_v1';

export interface DonorBadge {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  iconName: 'droplet' | 'shield' | 'award' | 'star' | 'crown';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requiredDonations: number;
  unlocked: boolean;
}

export const certificateService = {
  /**
   * Retrieves all issued certificates
   */
  getAllCertificates(): DonationCertificate[] {
    const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY);
    if (!raw) {
      // Seed with initial certificates for demo donor
      const initial: DonationCertificate[] = [
        {
          id: 'cert-init-1',
          donorId: 'donor-1',
          userId: 'user-regular-02',
          donorName: 'মোঃ রাকিবুল হাসান',
          bloodGroup: 'O+',
          donationDate: '2024-08-15',
          hospital: 'ঢাকা মেডিকেল কলেজ হাসপাতাল',
          location: 'ধানমন্ডি, ঢাকা',
          serialNumber: 'LD-2024-CERT-1092',
          issueDate: '2024-08-16',
          donationCount: 4,
          authorizedBy: 'CEO - HABIB',
          verificationCode: 'LD-VER-9482'
        },
        {
          id: 'cert-init-2',
          donorId: 'donor-1',
          userId: 'user-regular-02',
          donorName: 'মোঃ রাকিবুল হাসান',
          bloodGroup: 'O+',
          donationDate: '2024-03-10',
          hospital: 'বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয় (BSMMU)',
          location: 'শাহবাগ, ঢাকা',
          serialNumber: 'LD-2024-CERT-0841',
          issueDate: '2024-03-11',
          donationCount: 3,
          authorizedBy: 'CEO - HABIB',
          verificationCode: 'LD-VER-7721'
        }
      ];
      localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Retrieves certificates for a specific user or donor
   */
  getUserCertificates(userId?: string, donorId?: string, donorName?: string): DonationCertificate[] {
    const all = this.getAllCertificates();
    return all.filter(c => {
      if (userId && c.userId === userId) return true;
      if (donorId && c.donorId === donorId) return true;
      if (donorName && c.donorName.toLowerCase() === donorName.toLowerCase()) return true;
      return false;
    });
  },

  /**
   * Generates or issues an official certificate for a donation
   */
  issueCertificate(params: {
    donorId?: string;
    userId?: string;
    donorName: string;
    bloodGroup: BloodGroup;
    donationDate: string;
    hospital: string;
    location: string;
    donationCount: number;
  }): DonationCertificate {
    const certs = this.getAllCertificates();
    const currentYear = new Date().getFullYear();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const serialNumber = `LD-${currentYear}-CERT-${randomHex}`;
    const verificationCode = `LD-VER-${Math.floor(10000 + Math.random() * 90000)}`;

    const newCert: DonationCertificate = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      donorId: params.donorId,
      userId: params.userId,
      donorName: params.donorName,
      bloodGroup: params.bloodGroup,
      donationDate: params.donationDate,
      hospital: params.hospital,
      location: params.location,
      serialNumber,
      issueDate: new Date().toISOString().split('T')[0],
      donationCount: params.donationCount,
      authorizedBy: 'CEO - HABIB',
      verificationCode
    };

    certs.unshift(newCert);
    localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(certs));

    // Notify user in notification center
    notificationService.notifyCertificateIssued(params.donorName, params.bloodGroup, newCert.id);

    return newCert;
  },

  /**
   * Syncs certificates with donor history
   */
  syncCertificatesForDonor(donor: Donor, user?: UserProfile | null): DonationCertificate[] {
    const existing = this.getUserCertificates(donor.userId || user?.id, donor.id, donor.fullName);
    
    // Check if donor has donations that don't have a certificate yet
    const existingDates = new Set(existing.map(c => c.donationDate));
    
    donor.history.forEach((h, index) => {
      if (!existingDates.has(h.date)) {
        this.issueCertificate({
          donorId: donor.id,
          userId: donor.userId || user?.id,
          donorName: donor.fullName,
          bloodGroup: donor.bloodGroup,
          donationDate: h.date,
          hospital: h.hospital,
          location: h.location,
          donationCount: index + 1
        });
      }
    });

    // If totalDonations is > 0 and no certificate at all, issue for last donation date
    const updated = this.getUserCertificates(donor.userId || user?.id, donor.id, donor.fullName);
    if (updated.length === 0 && (donor.totalDonations > 0 || donor.lastDonationDate)) {
      const cert = this.issueCertificate({
        donorId: donor.id,
        userId: donor.userId || user?.id,
        donorName: donor.fullName,
        bloodGroup: donor.bloodGroup,
        donationDate: donor.lastDonationDate || new Date().toISOString().split('T')[0],
        hospital: 'LifeDrop অনুমোদিত রক্তদান কেন্দ্র',
        location: `${donor.upazila}, ${donor.district}`,
        donationCount: Math.max(1, donor.totalDonations)
      });
      return [cert];
    }

    return updated;
  },

  /**
   * Verify a certificate by serial number or verification code
   */
  verifyCertificate(code: string): DonationCertificate | null {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    const certs = this.getAllCertificates();
    return certs.find(c => 
      c.serialNumber.toUpperCase() === clean || 
      c.verificationCode.toUpperCase() === clean ||
      c.id === code
    ) || null;
  },

  /**
   * Calculate donor achievement badges
   */
  getDonorBadges(totalDonations: number): DonorBadge[] {
    const badges: DonorBadge[] = [
      {
        id: 'first-donation',
        titleBn: 'প্রথম রক্তদান ব্যাজ',
        titleEn: 'First Step Lifesaver',
        descriptionBn: 'প্রথমবার মানবকল্যাণে রক্তদানের অনন্য দৃষ্টান্ত।',
        iconName: 'droplet',
        tier: 'bronze',
        requiredDonations: 1,
        unlocked: totalDonations >= 1
      },
      {
        id: 'bronze-lifesaver',
        titleBn: 'ব্রোঞ্জ রক্তযোদ্ধা',
        titleEn: 'Bronze Hero',
        descriptionBn: '৩ বার রক্তদান করে ৩ জনের জীবন রক্ষায় অবদান।',
        iconName: 'award',
        tier: 'bronze',
        requiredDonations: 3,
        unlocked: totalDonations >= 3
      },
      {
        id: 'silver-star',
        titleBn: 'সিলভার স্টার ডোনার',
        titleEn: 'Silver Guardian',
        descriptionBn: '৫ বার রক্তদান সম্পন্নকারী সম্মানিত রক্তদাতা।',
        iconName: 'star',
        tier: 'silver',
        requiredDonations: 5,
        unlocked: totalDonations >= 5
      },
      {
        id: 'golden-champion',
        titleBn: 'গোল্ডেন লাইফ সেভার',
        titleEn: 'Golden Champion',
        descriptionBn: '১০ বার রক্তদানের মাইলফলক অর্জনকারী মহান সেবক।',
        iconName: 'crown',
        tier: 'gold',
        requiredDonations: 10,
        unlocked: totalDonations >= 10
      },
      {
        id: 'platinum-legend',
        titleBn: 'প্ল্যাটিনাম লিজেন্ড',
        titleEn: 'Platinum Legend',
        descriptionBn: '২০+ বার নিয়মিত রক্তদানে অবিস্মরণীয় প্রেরণা।',
        iconName: 'shield',
        tier: 'platinum',
        requiredDonations: 20,
        unlocked: totalDonations >= 20
      }
    ];

    return badges;
  }
};
