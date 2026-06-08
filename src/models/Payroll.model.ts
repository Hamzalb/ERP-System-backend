import { Schema, model, Document, Types } from 'mongoose';

export interface IPayroll extends Document {
  employee: Types.ObjectId;
  period: { month: number; year: number };
  baseSalary: number;
  bonuses: { label: string; amount: number }[];
  deductions: { label: string; amount: number }[];
  tax: number;
  netSalary: number;
  currency: string;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: Date;
  payslipUrl?: string;
  generatedBy: Types.ObjectId;
}

const payrollSchema = new Schema<IPayroll>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    period: {
      month: { type: Number, required: true, min: 1, max: 12 },
      year: { type: Number, required: true },
    },
    baseSalary: { type: Number, required: true },
    bonuses: [{ label: String, amount: Number }],
    deductions: [{ label: String, amount: Number }],
    tax: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
    paidAt: { type: Date },
    payslipUrl: { type: String },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

payrollSchema.index({ employee: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });
payrollSchema.index({ status: 1 });

export const Payroll = model<IPayroll>('Payroll', payrollSchema);
