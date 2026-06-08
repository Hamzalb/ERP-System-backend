import { Schema, model, Document } from 'mongoose';

export interface IAccount extends Document {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
  balance: number;
  currency: string;
  description: string;
  isActive: boolean;
}

const accountSchema = new Schema<IAccount>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
      required: true,
    },
    category: { type: String, default: '' },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

accountSchema.index({ code: 1 });
accountSchema.index({ type: 1 });

export const Account = model<IAccount>('Account', accountSchema);
