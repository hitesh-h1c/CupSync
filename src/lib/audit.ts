import { dbConnect } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

export interface AuditEntry {
  action: string;
  actor?: string | null;
  actorEmail?: string | null;
  role?: string | null;
  target?: string | null;
  detail?: string | null;
}

/**
 * Record a security-relevant event. Best-effort: never throws into the caller,
 * so an audit-log failure can't break the action being audited.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create({
      action: entry.action,
      actor: entry.actor ?? null,
      actorEmail: entry.actorEmail ?? null,
      role: entry.role ?? null,
      target: entry.target ?? null,
      detail: entry.detail ?? null,
      at: new Date(),
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
