import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
