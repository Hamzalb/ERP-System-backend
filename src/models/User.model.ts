import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISession {
  refreshToken: string;
  tokenFamily: string;
  device: string;
  ip: string;
  lastUsed: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  roles: Types.ObjectId[];
  extraPermissions: Types.ObjectId[];
  revokedPermissions: Types.ObjectId[];
  status: 'active' | 'inactive' | 'archived';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  sessions: ISession[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const sessionSchema = new Schema<ISession>(
  {
    refreshToken: { type: String, required: true },
    tokenFamily: { type: String, required: true },
    device: { type: String, default: 'Unknown' },
    ip: { type: String, default: '' },
    lastUsed: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    extraPermissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    revokedPermissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    sessions: [sessionSchema],
    lastLogin: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 });
userSchema.index({ status: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', userSchema);
