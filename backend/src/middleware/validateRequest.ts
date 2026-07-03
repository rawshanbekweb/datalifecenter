import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(ApiError.badRequest(result.error.issues.map((i) => i.message).join(', '), 'VALIDATION_ERROR'));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(ApiError.badRequest(result.error.issues.map((i) => i.message).join(', '), 'VALIDATION_ERROR'));
    }
    req.validatedQuery = result.data as Record<string, unknown>;
    next();
  };
}
