import { Schema, model, Document } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  key: string;
  module: string;
  description: string;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, lowercase: true },
    module: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true },
);

permissionSchema.index({ module: 1 });

export const Permission = model<IPermission>('Permission', permissionSchema);
