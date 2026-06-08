import { Schema, model, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  employee: Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  totalHours: number;
  overtime: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  isLate: boolean;
  lateMinutes: number;
  note?: string;
  adjustedBy?: Types.ObjectId;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    totalHours: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'holiday'],
      default: 'absent',
    },
    isLate: { type: Boolean, default: false },
    lateMinutes: { type: Number, default: 0 },
    note: { type: String },
    adjustedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
