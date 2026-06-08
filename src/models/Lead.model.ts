import { Schema, model, Document, Types } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  value: number;
  currency: string;
  assignedTo?: Types.ObjectId;
  notes: { content: string; createdBy: Types.ObjectId; createdAt: Date }[];
  activities: { type: string; description: string; createdBy: Types.ObjectId; createdAt: Date }[];
  convertedAt?: Date;
  convertedTo?: Types.ObjectId;
  createdBy: Types.ObjectId;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    email: { type: String, default: '', lowercase: true },
    phone: { type: String, default: '' },
    company: { type: String },
    source: { type: String, default: 'manual' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
      default: 'new',
    },
    value: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: [
      {
        content: String,
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activities: [
      {
        type: String,
        description: String,
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    convertedAt: { type: Date },
    convertedTo: { type: Schema.Types.ObjectId, ref: 'Customer' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ name: 'text', email: 'text', company: 'text' });

export const Lead = model<ILead>('Lead', leadSchema);
