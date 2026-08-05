import { listTeam } from '../api/team';
import { createHasContentHook } from './useHasContent';

/** Jamoada nashr qilingan a'zo bor-yo'qligi — qoidasi [[useHasContent]] da */
export const useHasTeam = createHasContentHook(listTeam);
