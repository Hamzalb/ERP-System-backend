import { Schema, model, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  legalName: string;
  registrationNumber: string;
  taxId: string;
  vatNumber: string;
  logo?: string;
  website?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  currency: string;
  timezone: string;
  language: string;
  fiscalYearStart: number;
  invoicePrefix: string;
  invoiceNextNumber: number;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    legalName: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    taxId: { type: String, default: '' },
    vatNumber: { type: String, default: '' },
    logo: { type: String },
    website: { type: String },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zip: { type: String, default: '' },
    },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    fiscalYearStart: { type: Number, default: 1, min: 1, max: 12 },
    invoicePrefix: { type: String, default: 'INV-' },
    invoiceNextNumber: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const Company = model<ICompany>('Company', companySchema);
