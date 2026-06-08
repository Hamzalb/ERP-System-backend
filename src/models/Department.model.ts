import { Schema, model, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description: string;
  manager?: Types.ObjectId;
  parentDepartment?: Types.ObjectId;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    manager: { type: Schema.Types.ObjectId, ref: 'Employee' },
    parentDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  },
  { timestamps: true },
);

export const Department = model<IDepartment>('Department', departmentSchema);
