import { Request, Response } from 'express';
import { authService } from './auth.service';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from './auth.validation';
import { sendSuccess } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ApiError } from '../../utils/ApiError';

const getDevice = (req: Request) => req.headers['user-agent'] || 'Unknown';
const getIp = (req: Request) => (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input, getIp(req), getDevice(req));
  sendSuccess(res, result, 'Registration successful', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input, getIp(req), getDevice(req), getDevice(req));

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token');

  const result = await authService.refresh(token);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (req.user && token) {
    await authService.logout(req.user.userId, token);
  }
  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(email);
  sendSuccess(res, null, 'If that email exists, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(token, password);
  sendSuccess(res, null, 'Password reset successful');
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  sendSuccess(res, null, 'Password changed');
});

export const getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessions = await authService.getSessions(req.user!.userId);
  sendSuccess(res, sessions);
});

export const revokeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tokenFamily } = req.params;
  await authService.revokeSession(req.user!.userId, tokenFamily);
  sendSuccess(res, null, 'Session revoked');
});
