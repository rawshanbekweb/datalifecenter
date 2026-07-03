import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export function devOnly(_req: Request, _res: Response, next: NextFunction) {
  if (env.NODE_ENV === 'production') {
    return next(ApiError.notFound());
  }
  next();
}
