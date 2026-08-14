import { useIdleHeartbeat } from '../../hooks/useIdleHeartbeat';

/**
 * Ko'rinmas komponent: butun ilova davomida seansni tirik ushlab turadi.
 *
 * Router'dan TASHQARIDA, AuthProvider ichida turadi — shu tufayli har bir
 * layout'ga alohida ulash shart emas va sahifadan sahifaga o'tganda taymer
 * qaytadan boshlanmaydi.
 */
export default function SessionKeepAlive(): null {
  useIdleHeartbeat();
  return null;
}
