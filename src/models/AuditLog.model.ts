import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actor: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
