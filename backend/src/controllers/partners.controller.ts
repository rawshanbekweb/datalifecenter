import { Request, Response } from 'express';
import * as partnersService from '../services/partners.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const listPartnersHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const partners = await partnersService.listPartners(category);
  sendSuccess(res, partners);
});

export const createPartnerHandler = asyncHandler(async (req: Request, res: Response) => {
  const partner = await partnersService.createPartner(req.body);
  sendSuccess(res, partner, 201);
});

export const updatePartnerHandler = asyncHandler(async (req: Request, res: Response) => {
  const partner = await partnersService.updatePartner(req.params.id as string, req.body);
  sendSuccess(res, partner);
});

export const deletePartnerHandler = asyncHandler(async (req: Request, res: Response) => {
  await partnersService.deletePartner(req.params.id as string);
  sendSuccess(res, { message: "Hamkor o'chirildi" });
});
