import { Schema, model, Document, Types } from 'mongoose';

export interface IEmployee extends Document {
  user?: Types.ObjectId;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  department: Types.ObjectId;
  position: Types.ObjectId;
  manager?: Types.ObjectId;
  hireDate: Date;
  terminationDate?: Date;
  status: 'active' | 'inactive' | 'terminated';
  salary: { amount: number; currency: string; type: 'monthly' | 'hourly' };
  address: { street: string; city: string; country: string };
  emergencyContact: { name: string; phone: string; relation: string };
  documents: { name: string; url: string; uploadedAt: Date }[];
  notes: { content: string; createdBy: Types.ObjectId; createdAt: Date }[];
}

const employeeSchema = new Schema<IEmployee>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    employeeId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, default: '' },
    avatar: { type: String },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    position: { type: Schema.Types.ObjectId, ref: 'Position', required: true },
    manager: { type: Schema.Types.ObjectId, ref: 'Employee' },
    hireDate: { type: Date, required: true },
    terminationDate: { type: Date },
    status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
    salary: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      type: { type: String, enum: ['monthly', 'hourly'], default: 'monthly' },
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: [
      {
        content: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeId: 'text' });

export const Employee = model<IEmployee>('Employee', employeeSchema);
