import { Response } from 'express';

// SSE orqali jonli bildirishnoma yetkazish: har bir foydalanuvchining ochiq
// ulanishlari xotirada saqlanadi. Yangi bildirishnoma yozilganda 'notify'
// hodisasi yuboriladi — mijoz ro'yxatni qayta yuklaydi (payload ichida
// ma'lumot yuborilmaydi, o'qilgan/o'qilmagan holat har doim bazadan olinadi).
//
// DIQQAT: ulanishlar shu Node jarayonining xotirasida — ko'p instansli deploy'da
// bitta instansda yozilgan bildirishnoma boshqa instansga ulangan mijozga
// bormaydi (180s zaxira polling bekitadi). Render'da hozir bitta instans.

// Bitta foydalanuvchi ochishi mumkin bo'lgan parallel ulanishlar chegarasi —
// cheklanmasa ko'p tab/qurilma server resurslarini band qilib qo'yishi mumkin
const MAX_CONNECTIONS_PER_USER = 5;

// Proxy'lar (Render, Cloudflare) jim turgan ulanishni uzib qo'yadi — davriy izoh-satr
const HEARTBEAT_MS = 25_000;

// Har bir ochiq ulanish o'z heartbeat taymeri bilan birga saqlanadi —
// evict/uzilishda taymer ham tozalanadi (aks holda yopilgan javobga yozib
// turadigan yetim taymer qoladi)
interface StreamClient {
  res: Response;
  heartbeat: NodeJS.Timeout;
}

const clients = new Map<string, Set<StreamClient>>();

// Ulanishni ro'yxatdan tozalaydi va taymerni to'xtatadi (ichki yordamchi)
function closeClient(userId: string, client: StreamClient, endResponse: boolean): void {
  clearInterval(client.heartbeat);
  const set = clients.get(userId);
  if (set) {
    set.delete(client);
    if (set.size === 0) clients.delete(userId);
  }
  if (endResponse) {
    try {
      client.res.end();
    } catch {
      // allaqachon yopilgan — e'tiborsiz
    }
  }
}

// Yangi SSE ulanishini ro'yxatga oladi. Qaytgan funksiya ulanish uzilganda
// (req 'close') chaqirilishi kerak — taymerni tozalab, ro'yxatdan chiqaradi.
export function addStreamClient(userId: string, res: Response): () => void {
  let set = clients.get(userId);
  if (!set) {
    set = new Set();
    clients.set(userId, set);
  }
  // Limitdan oshsa eng eski ulanish yopiladi (taymeri bilan) — yangi tab ustunlik oladi
  while (set.size >= MAX_CONNECTIONS_PER_USER) {
    const oldest = set.values().next().value as StreamClient;
    closeClient(userId, oldest, true);
  }

  const client: StreamClient = {
    res,
    heartbeat: setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        // yozib bo'lmadi — ulanish uzilgan, close bilan tozalanadi
      }
    }, HEARTBEAT_MS),
  };
  set.add(client);

  return () => closeClient(userId, client, false);
}

// Ko'rsatilgan foydalanuvchilarning barcha ochiq ulanishlariga 'notify' yuboradi.
// Yozish xatosi butun oqimni yiqitmasligi kerak — ulanish tozalab tashlanadi.
export function pushNotifyEvent(userIds: string[]): void {
  for (const userId of userIds) {
    const set = clients.get(userId);
    if (!set) continue;
    for (const client of [...set]) {
      try {
        client.res.write('event: notify\ndata: {}\n\n');
      } catch {
        closeClient(userId, client, true);
      }
    }
  }
}
