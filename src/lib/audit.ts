// src/lib/audit.ts - Audit logging utility
import { prisma } from './db';
import { AuthUser } from './auth';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT' | 'EXPORT';

interface AuditLogParams {
  user: AuthUser;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

/**
 * Create an audit log entry for tracking who did what, when
 */
export async function createAuditLog({
  user,
  action,
  entityType,
  entityId,
  description,
  changes,
}: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action,
        entityType,
        entityId: entityId || undefined,
        description,
        changes: changes ? JSON.stringify(changes) : undefined,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Compare two objects and return the differences
 */
export function getChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  fieldsToTrack: string[]
): Record<string, { old: unknown; new: unknown }> | null {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  for (const field of fieldsToTrack) {
    if (oldData[field] !== newData[field]) {
      changes[field] = {
        old: oldData[field],
        new: newData[field],
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}
