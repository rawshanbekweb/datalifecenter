import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { message: `Route topilmadi: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' },
  });
}
