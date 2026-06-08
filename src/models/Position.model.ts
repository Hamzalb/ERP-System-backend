import { Schema, model, Document, Types } from 'mongoose';

export interface IPosition extends Document {
  title: string;
  department: Types.ObjectId;
  description: string;
  minSalary: number;
  maxSalary: number;
}

const positionSchema = new Schema<IPosition>(
  {
    title: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    description: { type: String, default: '' },
    minSalary: { type: Number, default: 0 },
    maxSalary: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Position = model<IPosition>('Position', positionSchema);
