import { JwtPayload } from '../../utils/jwt';
import { SupportedLocale } from '../../config/locale';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      validatedQuery?: Record<string, unknown>;
      locale: SupportedLocale;
      // Anonim qurilma identifikatori (X-Device-Id) — yoqtirish/ko'rish uchun
      deviceId?: string;
    }
  }
}

export {};
