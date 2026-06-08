import { Schema, model, Document, Types } from 'mongoose';

export interface ILeaveType extends Document {
  name: string;
  description: string;
  maxDaysPerYear: number;
  isPaid: boolean;
  color: string;
}

export interface ILeaveRequest extends Document {
  employee: Types.ObjectId;
  leaveType: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
}

const leaveTypeSchema = new Schema<ILeaveType>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    maxDaysPerYear: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: true },
    color: { type: String, default: '#4F46E5' },
  },
  { timestamps: true },
);

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true },
);

leaveRequestSchema.index({ employee: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

export const LeaveType = model<ILeaveType>('LeaveType', leaveTypeSchema);
export const LeaveRequest = model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
