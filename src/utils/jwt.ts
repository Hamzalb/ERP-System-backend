import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Types } from 'mongoose';

export interface AccessPayload {
  userId: string;
  roles: string[];
  permissions: string[];
}

export interface RefreshPayload {
  userId: string;
  tokenFamily: string;
}

export const signAccessToken = (payload: AccessPayload): string =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn } as SignOptions);

export const signRefreshToken = (payload: RefreshPayload): string =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn } as SignOptions);

export const verifyAccessToken = (token: string): AccessPayload =>
  jwt.verify(token, env.jwt.accessSecret) as AccessPayload;

export const verifyRefreshToken = (token: string): RefreshPayload =>
  jwt.verify(token, env.jwt.refreshSecret) as RefreshPayload;

export const generateTokenFamily = (): string =>
  new Types.ObjectId().toHexString();
