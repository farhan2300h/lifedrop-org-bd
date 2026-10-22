/**
 * LifeDrop Security Audit Logging Service
 * Records administrative actions, authentication attempts, and sensitive operational events.
 * 
 * Strict Privacy Rules:
 * - NEVER log raw passwords, access tokens, or refresh tokens.
 * - NEVER log biometrics or WebAuthn private material.
 * - Sanitize and record only actor email, action type, resource, timestamp, and client user-agent.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AuditLogEntry {
  id?: string;
  actorId?: string;
  actorEmail?: string;
  action: 
    | 'admin_login_success'
    | 'admin_login_failure'
    | 'admin_logout'
    | 'user_signup'
    | 'user_login'
    | 'passkey_registered'
    | 'passkey_auth_success'
    | 'passkey_auth_failure'
    | 'role_change_attempt'
    | 'role_changed'
    | 'donor_approved'
    | 'donor_rejected'
    | 'donor_deleted'
    | 'request_status_changed'
    | 'request_deleted'
    | 'suspicious_access_attempt';
  targetResource: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
}

const AUDIT_STORAGE_KEY = 'lifedrop_audit_logs_v1';

export const auditService = {
  /**
   * Log a security event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
    const timestamp = new Date().toISOString();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

    const cleanEntry: AuditLogEntry = {
      ...entry,
      userAgent: entry.userAgent || userAgent,
      createdAt: timestamp
    };

    // 1. Try sending to Supabase audit_logs table if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('audit_logs').insert([{
          actor_id: cleanEntry.actorId || null,
          actor_email: cleanEntry.actorEmail || null,
          action: cleanEntry.action,
          target_resource: cleanEntry.targetResource,
          target_id: cleanEntry.targetId || null,
          metadata: cleanEntry.metadata || {},
          user_agent: cleanEntry.userAgent
        }]);
      } catch {
        // Fall through to local fallback
      }
    }

    // 2. Keep local copy for in-memory / admin session audit viewing (Max 100 entries)
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      const list: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
      list.unshift({ ...cleanEntry, id: `audit-${Date.now()}` });
      if (list.length > 100) list.pop();
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Local storage full or unavailable
    }
  },

  /**
   * Retrieve recent audit logs (Admin only)
   */
  async getRecentLogs(): Promise<AuditLogEntry[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          return data.map(item => ({
            id: item.id,
            actorId: item.actor_id,
            actorEmail: item.actor_email,
            action: item.action,
            targetResource: item.target_resource,
            targetId: item.target_id,
            metadata: item.metadata,
            userAgent: item.user_agent,
            createdAt: item.created_at
          }));
        }
      } catch {
        // Fall back to local logs
      }
    }

    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
};
