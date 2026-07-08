// Har bir rol o'z kabinetiga: ADMIN → /admin, MENTOR → /mentor, qolganlar → /student
export function roleHome(role?: string | null): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MENTOR') return '/mentor';
  return '/student';
}
