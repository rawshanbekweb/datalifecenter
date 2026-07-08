// JWT'ni localStorage'da saqlash: Safari va boshqa brauzerlar krossdomen
// (vercel.app ↔ onrender.com) cookie'ni bloklaydi — shuning uchun token
// Authorization header orqali ham yuboriladi. Cookie zaxira yo'l bo'lib qoladi.
const TOKEN_KEY = 'datalife_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage o'chiq (private mode) — cookie'ga umid qilamiz
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // e'tiborsiz
  }
}
