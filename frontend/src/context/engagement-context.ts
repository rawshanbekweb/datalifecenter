import { createContext } from 'react';
import { EngagementTarget } from '../api/engagement';

export interface EngagementEntry {
  likesCount: number;
  /** Sharhlarda ko'rishlar yo'q — null */
  views: number | null;
  liked: boolean;
}

export interface EngagementContextValue {
  /** Kalit: `${target}:${id}` */
  entries: Record<string, EngagementEntry>;
  /** Element ekranda paydo bo'lganda ro'yxatga qo'shadi; tozalash funksiyasini qaytaradi */
  register: (target: EngagementTarget, id: string) => () => void;
  /** Yoqtirishni almashtiradi — UI darhol yangilanadi, keyin server bilan sinxronlanadi */
  toggle: (target: EngagementTarget, id: string) => void;
}

export const EngagementContext = createContext<EngagementContextValue | null>(null);

export const entryKey = (target: EngagementTarget, id: string): string => `${target}:${id}`;
