import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack ? `${timestamp} [${level}]: ${message}\n${stack}` : `${timestamp} [${level}]: ${message}`,
  ),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 20 * 1024 * 1024,
      maxFiles: 14,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 14,
    }),
  ],
});

export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
