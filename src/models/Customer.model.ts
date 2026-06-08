import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  type: 'individual' | 'company';
  name: string;
  email: string;
  phone: string;
  company?: string;
  taxId?: string;
  address: { street: string; city: string; country: string };
  assignedTo?: Types.ObjectId;
  status: 'active' | 'inactive';
  tags: string[];
  notes: { content: string; createdBy: Types.ObjectId; createdAt: Date }[];
  createdBy: Types.ObjectId;
}

const customerSchema = new Schema<ICustomer>(
  {
    type: { type: String, enum: ['individual', 'company'], default: 'individual' },
    name: { type: String, required: true },
    email: { type: String, default: '', lowercase: true },
    phone: { type: String, default: '' },
    company: { type: String },
    taxId: { type: String },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    tags: [{ type: String }],
    notes: [
      {
        content: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

customerSchema.index({ name: 'text', email: 'text', company: 'text' });
customerSchema.index({ status: 1 });

export const Customer = model<ICustomer>('Customer', customerSchema);
