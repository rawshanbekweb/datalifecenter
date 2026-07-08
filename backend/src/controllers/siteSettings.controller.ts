import { Request, Response } from 'express';
import * as siteSettingsService from '../services/siteSettings.service';
import { SECTION_SCHEMAS } from '../validators/siteSettings.validator';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const getSiteSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await siteSettingsService.getAllSettings();
  sendSuccess(res, settings);
});

export const updateSiteSettingSectionHandler = asyncHandler(async (req: Request, res: Response) => {
  const section = req.params.section as string;
  const schema = SECTION_SCHEMAS[section];
  if (!schema) {
    throw ApiError.notFound("Bunday bo'lim mavjud emas", 'SECTION_NOT_FOUND');
  }
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest(result.error.issues.map((i) => i.message).join(', '), 'VALIDATION_ERROR');
  }
  const updated = await siteSettingsService.upsertSection(section, result.data);
  sendSuccess(res, updated);
});
