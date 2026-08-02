// Har bir rol o'z kabinetiga: ADMIN → /admin, MENTOR → /mentor,
// TEAM → /team/profile, qolganlar → /student
export function roleHome(role?: string | null): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MENTOR') return '/mentor';
  if (role === 'TEAM') return '/team/profile';
  return '/student';
}

// /team ommaviy jamoa sahifasi, /team/<slug> esa xodimning ochiq profili — ular
// hammaga ochiq. Kabinetga faqat quyidagi ichki bo'limlar tegishli.
const TEAM_CABINET_PATHS = ['/team/profile', '/team/directory'];

// LoginPage'da "session tugagach shu sahifaga qaytarish" (location.state.from) faqat
// yangi login qilgan rol o'sha yo'lga kira olsa qo'llanadi — aks holda (masalan avvalgi
// mentor sessiyasidan qolgan from='/mentor' bilan admin kirsa) noto'g'ri kabinetga
// tashlab yuboradi (router.tsx'dagi ProtectedRoute role ruxsatlari bilan bir xil bo'lishi shart).
export function isRouteAllowedForRole(path: string, role?: string | null): boolean {
  if (path.startsWith('/admin')) return role === 'ADMIN';
  if (path.startsWith('/mentor')) return role === 'MENTOR' || role === 'ADMIN';
  if (TEAM_CABINET_PATHS.some((p) => path.startsWith(p))) {
    return role === 'TEAM' || role === 'MENTOR' || role === 'ADMIN';
  }
  return true;
}
