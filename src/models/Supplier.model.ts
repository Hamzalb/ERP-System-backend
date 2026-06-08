import { Schema, model, Document, Types } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  email: string;
  phone: string;
  taxId?: string;
  address: { street: string; city: string; country: string };
  contactPerson: string;
  status: 'active' | 'inactive';
  createdBy: Types.ObjectId;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    email: { type: String, default: '', lowercase: true },
    phone: { type: String, default: '' },
    taxId: { type: String },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    contactPerson: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

supplierSchema.index({ name: 'text', email: 'text' });

export const Supplier = model<ISupplier>('Supplier', supplierSchema);
