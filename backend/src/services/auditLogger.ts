import { PrismaClient } from '@prisma/client';

/**
 * Audit event metadata type.
 */
export interface AuditEventMetadata {
  [key: string]: any;
}

/**
 * Audit event logging parameters.
 */
export interface AuditLogParams {
  actorId: string;
  actorRole: string;
  action: string;
  targetUserId?: string;
  metadata?: AuditEventMetadata;
}

/**
 * Singleton Prisma client instance.
 */
const prisma = new PrismaClient();

/**
 * Logs an immutable audit event for support interactions.
 * All audit logs are stored in the database and cannot be modified or deleted.
 *
 * @param params - Audit log parameters
 * @returns Promise<void>
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        targetUserId: params.targetUserId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Audit log error:', error);
    // Do not throw error to avoid breaking main flow
  }
}