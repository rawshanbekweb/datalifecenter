import { listGames } from '../api/games';
import { createHasContentHook } from './useHasContent';

/**
 * Nashr qilingan o'yin bor-yo'qligi.
 *
 * Birinchi o'yin qo'shilmaguncha "O'yinlar" havolasi menyuda ko'rinmaydi.
 * Qoidasi [[useHasContent]] da.
 */
export const useHasGames = createHasContentHook(listGames);
