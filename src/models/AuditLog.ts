import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * Security-relevant event log: logins, failed logins, and admin actions.
 * Stores no sensitive payloads (no passwords, no PII beyond the actor's email).
 */
export interface IAuditLog {
  _id: Types.ObjectId;
  action: string; // e.g. "login.success", "login.failure", "admin.suspend_vendor"
  actor?: Types.ObjectId | null; // User id, if known
  actorEmail?: string | null;
  role?: string | null;
  target?: string | null; // affected entity id/description
  detail?: string | null;
  at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorEmail: { type: String, default: null },
    role: { type: String, default: null },
    target: { type: String, default: null },
    detail: { type: String, default: null },
    at: { type: Date, required: true },
  },
  { timestamps: true },
);

AuditLogSchema.index({ at: -1 });

export const AuditLog: Model<IAuditLog> =
  (models.AuditLog as Model<IAuditLog>) ||
  model<IAuditLog>("AuditLog", AuditLogSchema);
