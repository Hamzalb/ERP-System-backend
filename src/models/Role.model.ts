import { Schema, model, Document, Types } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: Types.ObjectId[];
  isSystem: boolean;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Role = model<IRole>('Role', roleSchema);
