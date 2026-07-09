import { Request, Response } from 'express';
import * as projectsService from '../services/projects.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const listProjectsHandler = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectsService.listProjects(req.locale);
  sendSuccess(res, projects);
});

export const listProjectsAdminHandler = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await projectsService.listProjectsAdmin();
  sendSuccess(res, projects);
});

export const createProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.createProject(req.body);
  sendSuccess(res, project, 201);
});

export const updateProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.updateProject(req.params.id as string, req.body);
  sendSuccess(res, project);
});

export const deleteProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  await projectsService.deleteProject(req.params.id as string);
  sendSuccess(res, { message: "Loyiha o'chirildi" });
});
