import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';
import { translateErrorMessage } from '../i18n/translateError';
import { SupportedLocale } from '../config/locale';

/**
 * Bir nechta muammo ", " bilan birlashtirilgani uchun har bir bo'lak ALOHIDA
 * o'giriladi — birlashgan satr lug'atda hech qachon topilmasdi.
 * (errorHandler keyin butun matnni yana bir bor izlaydi; tarjima qilingan matn
 * kalit bo'lmagani uchun bu zararsiz.)
 */
function issuesToMessage(issues: { message: string }[], locale: SupportedLocale | undefined): string {
  return issues.map((i) => translateErrorMessage(i.message, locale)).join(', ');
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(ApiError.badRequest(issuesToMessage(result.error.issues, req.locale), 'VALIDATION_ERROR'));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(ApiError.badRequest(issuesToMessage(result.error.issues, req.locale), 'VALIDATION_ERROR'));
    }
    req.validatedQuery = result.data as Record<string, unknown>;
    next();
  };
}
