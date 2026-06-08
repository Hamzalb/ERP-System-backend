import crypto from 'crypto';
import { User } from '../../models/User.model';
import { Role } from '../../models/Role.model';
import { ApiError } from '../../utils/ApiError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateTokenFamily,
} from '../../utils/jwt';
import type { RegisterInput, LoginInput } from './auth.validation';
import { auditLog } from '../../middleware/audit.middleware';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const buildTokenPayload = async (userId: string) => {
  const user = await User.findById(userId)
    .populate({ path: 'roles', populate: { path: 'permissions' } })
    .lean();
  if (!user) throw ApiError.notFound('User not found');

  const roles: string[] = (user.roles as any[]).map((r) => r.name);
  const permissions: string[] = [
    ...(user.roles as any[]).flatMap((r) => r.permissions.map((p: any) => p.key)),
    ...(user.extraPermissions as any[]).map((p: any) => p.key),
  ].filter((p) => !(user.revokedPermissions as any[]).find((rp: any) => rp.key === p));

  return { userId, roles, permissions };
};

export const authService = {
  async register(input: RegisterInput, ip: string, userAgent: string) {
    const exists = await User.findOne({ email: input.email });
    if (exists) throw ApiError.conflict('Email already registered');

    const defaultRole = await Role.findOne({ name: 'Viewer' });
    const user = await User.create({
      ...input,
      roles: defaultRole ? [defaultRole._id] : [],
    });

    await auditLog(user.id, 'create', 'User', user.id, undefined, { email: user.email }, ip, userAgent);
    return { message: 'Registered successfully. Please verify your email.' };
  },

  async login(input: LoginInput, ip: string, userAgent: string, device: string) {
    const user = await User.findOne({ email: input.email }).select('+password');
    if (!user || !(await user.comparePassword(input.password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (user.status !== 'active') throw ApiError.forbidden('Account is not active');

    const payload = await buildTokenPayload(user.id);
    const tokenFamily = generateTokenFamily();
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user.id, tokenFamily });

    user.sessions.push({
      refreshToken,
      tokenFamily,
      device: device || 'Unknown',
      ip,
      lastUsed: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    user.lastLogin = new Date();
    await user.save();

    await auditLog(user.id, 'login', 'User', user.id, undefined, undefined, ip, userAgent);
    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email } };
  },

  async refresh(token: string) {
    let payload: { userId: string; tokenFamily: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const user = await User.findById(payload.userId);
    if (!user) throw ApiError.unauthorized('User not found');

    const sessionIdx = user.sessions.findIndex(
      (s) => s.tokenFamily === payload.tokenFamily && s.refreshToken === token,
    );
    if (sessionIdx === -1) {
      // Token reuse detected — invalidate entire family
      user.sessions = user.sessions.filter((s) => s.tokenFamily !== payload.tokenFamily);
      await user.save();
      throw ApiError.unauthorized('Token reuse detected');
    }

    const tokenPayload = await buildTokenPayload(user.id);
    const newFamily = generateTokenFamily();
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: user.id, tokenFamily: newFamily });

    user.sessions[sessionIdx].tokenFamily = newFamily;
    user.sessions[sessionIdx].refreshToken = refreshToken;
    user.sessions[sessionIdx].lastUsed = new Date();
    user.sessions[sessionIdx].expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    await user.save();

    return { accessToken, refreshToken };
  },

  async logout(userId: string, refreshToken: string) {
    const user = await User.findById(userId);
    if (user) {
      user.sessions = user.sessions.filter((s) => s.refreshToken !== refreshToken);
      await user.save();
    }
  },

  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) return; // silent — don't reveal existence

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // TODO: send email with token
    return token;
  },

  async resetPassword(token: string, newPassword: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) throw ApiError.badRequest('Invalid or expired reset token');

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.sessions = [];
    await user.save();
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('User not found');
    if (!(await user.comparePassword(currentPassword))) {
      throw ApiError.badRequest('Current password is incorrect');
    }
    user.password = newPassword;
    user.sessions = [];
    await user.save();
  },

  async getSessions(userId: string) {
    const user = await User.findById(userId).select('sessions');
    return user?.sessions || [];
  },

  async revokeSession(userId: string, tokenFamily: string) {
    const user = await User.findById(userId);
    if (user) {
      user.sessions = user.sessions.filter((s) => s.tokenFamily !== tokenFamily);
      await user.save();
    }
  },
};
