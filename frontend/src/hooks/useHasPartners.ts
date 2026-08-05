import { listPartners } from '../api/partners';
import { createHasContentHook } from './useHasContent';

/**
 * Nashr qilingan hamkor bor-yo'qligi.
 *
 * Hozircha jadval bo'sh, shuning uchun "Hamkorlar" havolasi menyuda ham,
 * footerda ham ko'rinmaydi. `/admin/partners` dan birinchi hamkor
 * qo'shilishi bilan havola O'ZI qaytadi — buning uchun kodga qaytish
 * shart emas. Qoidasi [[useHasContent]] da.
 */
export const useHasPartners = createHasContentHook(listPartners);
