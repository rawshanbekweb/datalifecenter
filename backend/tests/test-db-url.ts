// Asosiy DATABASE_URL'dan test bazasi URL'ini yasaydi (baza nomi: datalife_test).
// Testlar hech qachon asosiy bazaga tegmasligi uchun nom qat'iy almashtiriladi.
export const TEST_DB_NAME = 'datalife_test';

export function deriveTestDbUrl(base: string): string {
  const url = new URL(base);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}
