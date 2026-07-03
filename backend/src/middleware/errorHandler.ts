import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    error: {
      message: env.NODE_ENV === 'production' ? 'Serverda xatolik yuz berdi' : String(err instanceof Error ? err.message : err),
      code: 'INTERNAL_ERROR',
    },
  });
}
