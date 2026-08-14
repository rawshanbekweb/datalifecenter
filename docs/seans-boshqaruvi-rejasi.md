# Seans (session) boshqaruvi — amalga oshirish rejasi

> Holat: **KOD YOZILDI (2026-08-14).** Reja 2026-08-05 da kelishilgan va
> 1–9 qadamlari bajarilgan; qolgani — 10-qadam, ya'ni tinch vaqtda deploy
> qilib admin hisobida qo'lda tekshirish.
>
> Rejadan farqlar:
> - Parol o'zgarganda seanslar yopilib, joriy qurilmaga yangisi ochiladi
>   (ro'yxatda o'lik yozuvlar qolmasligi uchun).
> - `optionalAuth` ham seansni tekshiradi, lekin `lastSeenAt` ni ATAYIN
>   yangilamaydi — ochiq sahifadagi mehmon so'rovi seansni tirik ushlab
>   turmasligi kerak.
> - Heartbeat butun ilova uchun bitta joyda: router'dan tashqaridagi
>   `SessionKeepAlive` komponenti (har layoutga alohida ulanmagan).
> - Tozalash: `npm run clean:sessions` (quruq ishga tushirish standart,
>   o'chirish uchun `-- --apply`).

## 1. Nima uchun kerak — hozirgi holatdagi kamchilik

Uchta narsa aniqlandi (kod o'qib tekshirilgan, taxmin emas):

1. **"Chiqish" aslida sessiyani bekor qilmaydi.**
   `logoutHandler` (`auth.controller.ts`) faqat `res.clearCookie('token')`
   qiladi. Token esa `localStorage` da ham saqlanadi (`api/token.ts`) va
   server tomonda `JWT_EXPIRES_IN=7d` bo'yicha **yana 7 kun amal qiladi**.
   Ya'ni token bir marta oshkor bo'lsa, "chiqdim" tugmasi uni to'xtatmaydi.

2. **Seanslarni ko'rish va tanlab bekor qilish imkonsiz.**
   JWT stateless — server qaysi qurilmalarda ochiq seans borligini
   umuman bilmaydi. Bu ma'lumot hech qayerda saqlanmaydi.

3. **Yagona bekor qilish vositasi — "hammasini birdan".**
   `User.tokenVersion` oshirilsa barcha tokenlar bekor bo'ladi (parol
   o'zgarganda shunday bo'ladi). Bitta qurilmani chiqarish yo'li yo'q.

Xulosa: so'ralgan ikkala imkoniyat ham (seanslar ro'yxati va harakatsizlik
bo'yicha chiqarish) seanslarni **bazada ro'yxatga olmasdan** qurib bo'lmaydi.

## 2. Kelishilgan qarorlar

| Savol | Qaror |
|---|---|
| Harakatsizlik chegarasi | ADMIN / MENTOR / TEAM — **60 daqiqa**; STUDENT — **12 soat** |
| Deploy vaqti | Tadbirdan keyin, tinch vaqtda |
| Haqiqat manbai | Server (brauzerdagi taymer faqat qulaylik uchun) |

Nega rolga qarab: xavf asosan imtiyozli hisoblarda. Talaba darsni 60 daqiqa
**o'qib** o'tirsa hech qanday API so'rovi ketmaydi va u o'rtada chiqib
ketardi — bu xavfsizlik emas, xalaqit bo'lardi.

## 3. Ma'lumotlar modeli

```prisma
model Session {
  id         String    @id @default(cuid())
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     String
  // Ro'yxatda ko'rsatish uchun — "Chrome, Windows", "iPhone"
  userAgent  String?
  ip         String?
  // Brauzerdagi anonim qurilma id (api/device.ts) — "shu qurilma" ni
  // ishonchli belgilash uchun, userAgent bir xil bo'lib qolishi mumkin
  deviceId   String?
  createdAt  DateTime  @default(now())
  lastSeenAt DateTime  @default(now())
  revokedAt  DateTime?

  @@index([userId])
  // Eski yozuvlarni tozalash uchun
  @@index([lastSeenAt])
}
```

`User` ga `sessions Session[]` qo'shiladi.

**Zaxira/tiklash ro'yxatlariga `Session` ni qo'shish SHART:**
`backup-to-json.ts` va `restore-from-json.ts` dagi `ORDER` massivlariga
(`User` dan keyin). Backup skripti jadval ro'yxatini bazadan o'qigani uchun
nusxaga o'zi tushadi, lekin `ORDER` da bo'lmasa **tiklanmaydi** — skript
buni ishga tushganda ochiq aytadi.

## 4. Backend

### 4.1 JWT

`JwtPayload` ga `sid?: string` qo'shiladi (`utils/jwt.ts`).

**Eski tokenlar bilan nima bo'ladi:** `sid` siz token **rad etiladi**
(401 `SESSION_REVOKED`). Ya'ni deploy paytida hamma qayta kirishi kerak.
Bu ataylab: aynan shu narsa oshkor bo'lgan eski tokenlarni ham bekor
qiladi. Hozir prod bazasida **1 ta foydalanuvchi** bor (admin), shuning
uchun amaliy zarari yo'q — keyinroq foydalanuvchi ko'payganda bu qadam
ancha qimmatroq bo'lardi.

### 4.2 `authenticate` middleware (eng nozik joy)

Hozir har so'rovda `prisma.user.findUnique` bajariladi. Yangi mantiqda
**o'sha bitta so'rov `Session` dan boshlanadi va `user` ni birga oladi** —
qo'shimcha o'qish YO'Q:

```ts
const session = await prisma.session.findUnique({
  where: { id: sid },
  select: {
    revokedAt: true, lastSeenAt: true, userId: true,
    user: { select: { isBlocked: true, role: true, tokenVersion: true } },
  },
});
```

Tekshiruv tartibi:

1. JWT imzosi va `exp` — hozirgidek
2. `sid` bormi → yo'q bo'lsa 401 `SESSION_REVOKED`
3. seans topildimi va `revokedAt === null` mi → aks holda 401 `SESSION_REVOKED`
4. `user.isBlocked` → 403 `USER_BLOCKED` (hozirgidek)
5. `tv === user.tokenVersion` → aks holda 401 `SESSION_REVOKED` (hozirgidek)
6. **harakatsizlik:** `now - lastSeenAt > limit(user.role)` bo'lsa —
   seansga `revokedAt` qo'yiladi va 401 `SESSION_IDLE` qaytariladi
7. **`lastSeenAt` yangilanishi:** faqat qiymat **60 soniyadan** eskirgan
   bo'lsa yoziladi

7-band muhim: har so'rovda UPDATE qilish bepul emas. 60 soniyalik chegara
bilan faol foydalanuvchi daqiqasiga bittadan ortiq yozuv hosil qilmaydi.

```ts
const IDLE_LIMIT_MS: Record<string, number> = {
  ADMIN:  60 * 60 * 1000,
  MENTOR: 60 * 60 * 1000,
  TEAM:   60 * 60 * 1000,
  STUDENT: 12 * 60 * 60 * 1000,
};
```

Rol **bazadan** olinadi (hozir ham shunday), shuning uchun admin rolni
o'zgartirsa chegara darhol yangi rolga mos keladi.

### 4.3 Endpointlar

| Metod | Yo'l | Vazifa |
|---|---|---|
| GET | `/api/auth/sessions` | O'z seanslari ro'yxati, joriysi `isCurrent: true` bilan |
| DELETE | `/api/auth/sessions/others` | Joriysidan boshqa HAMMASINI bekor qilish |
| DELETE | `/api/auth/sessions/:id` | Bitta seansni bekor qilish (faqat o'ziniki) |
| POST | `/api/auth/logout` | **O'zgaradi:** joriy seansni ham bekor qiladi |
| GET | `/api/auth/heartbeat` | "Men shu yerdaman" — 204 qaytaradi |

`DELETE /sessions/:id` da **egalik tekshiruvi shart**: boshqa
foydalanuvchining seansini bekor qila olmasin.

**Nega heartbeat GET:** POST bo'lsa `writeLimiter` ga (300/5 daqiqa)
tushadi va bitta Wi-Fi ortidagi ko'p foydalanuvchi limitni birga yeydi.
GET esa `readLimiter` (3000/daqiqa) ostida qoladi. Yozuv baribir
middleware ichida, throttle bilan bo'ladi.

**Nomlanish tuzog'i:** frontendda `api/sessions.ts` ALLAQACHON BAND —
u mentor jonli darslari (`LiveSession`) uchun. Yangi fayl
`api/authSessions.ts` deb nomlansin.

### 4.4 Login/register

`signToken` chaqirilishidan oldin `Session` yaratiladi va uning `id` si
`sid` sifatida tokenga qo'yiladi. `userAgent` `req.headers['user-agent']`
dan, `ip` `req.ip` dan (`trust proxy` allaqachon o'rnatilgan).

### 4.5 Tozalash

Bekor qilingan va uzoq ishlatilmagan seanslar yig'ilib boradi. 30 kundan
eski yozuvlarni o'chiradigan `clean:sessions` skripti (yoki mavjud
monitoring workflow'iga qo'shimcha qadam).

## 5. Frontend

### 5.1 Heartbeat

`useIdleHeartbeat` hook (`MainLayout` va kabinet layoutlarida):

- `mousemove`, `keydown`, `touchstart`, `visibilitychange` ni tinglaydi
- **faqat tab ko'rinib turganda** va oxirgi ping'dan keyin haqiqiy
  harakat bo'lgan bo'lsa yuboradi
- ko'pi bilan **5 daqiqada bir marta** (throttle)

Shu tufayli darsni o'qib o'tirgan foydalanuvchi chiqib ketmaydi, ochiq
qolgan va tegilmayotgan tab esa seansni tirik ushlab turmaydi.

### 5.2 Seanslar ro'yxati UI

Profil/sozlamalar sahifasida bo'lim: qurilma, IP, "oxirgi faollik",
har qatorda "Chiqarish", tepada **"Boshqa qurilmalardan chiqish"**.
Joriy seans alohida belgilanadi va uni ro'yxatdan chiqarib bo'lmaydi
(uning uchun oddiy "Chiqish" bor).

### 5.3 401 ishlovi

`api/client.ts` da `ApiClientError` allaqachon `status` va `code` ni
saqlaydi — markazlashgan joy bor. `SESSION_IDLE` va `SESSION_REVOKED`
kelganda: token tozalanadi va login sahifasiga **sababi bilan**
yo'naltiriladi ("Uzoq vaqt harakat bo'lmagani uchun chiqarildingiz").
Sababsiz chiqarish foydalanuvchiga nosozlikdek ko'rinadi.

## 6. Xavflar va ehtiyot choralari

| Xavf | Chorasi |
|---|---|
| `authenticate` da xato = BUTUN sayt yiqiladi | Testlarsiz deploy qilinmasin; tadbirdan keyin, tinch vaqtda |
| Deploy paytida hamma chiqib ketadi | Ataylab; hozir prod'da 1 ta foydalanuvchi |
| `lastSeenAt` yozuvlari bazani yuklaydi | 60 soniyalik throttle |
| Eski seanslar yig'iladi | 30 kunlik tozalash skripti |
| IP saqlash — shaxsiy ma'lumot | Faqat seans ro'yxatida ko'rsatiladi, 30 kundan keyin o'chadi |

## 7. Testlar (mavjud 184 tasi ustiga)

- login → `Session` yaratiladi, tokenda `sid` bor
- logout → seans `revokedAt` oladi, o'sha token endi 401
- bekor qilingan seans → 401 `SESSION_REVOKED`
- `sid` siz eski token → 401
- ADMIN `lastSeenAt` 61 daqiqa eski → 401 `SESSION_IDLE`
- STUDENT `lastSeenAt` 61 daqiqa eski → **o'tadi** (12 soat chegarasi)
- STUDENT 13 soat eski → 401
- `/sessions/others` → boshqalar bekor, joriysi ishlayveradi
- boshqa foydalanuvchining seansini o'chirishga urinish → 403/404
- `lastSeenAt` throttle: ketma-ket ikki so'rovda ikkinchi UPDATE bo'lmasin

## 8. Ish tartibi

1. Prisma modeli + migratsiya
2. `backup-to-json.ts` va `restore-from-json.ts` dagi `ORDER` ga `Session`
3. `jwt.ts` ga `sid`
4. login/register da seans yaratish
5. `authenticate` ni qayta yozish (+ testlar shu bosqichda)
6. Seans endpointlari
7. Frontend: `api/authSessions.ts`, heartbeat hook, 401 ishlovi
8. Seanslar UI
9. Tozalash skripti
10. Tinch vaqtda deploy, keyin admin hisobida qo'lda tekshirish

Backend ~1 kun, frontend ~yarim kun.

## 9. Hal qilinmagan savol

**Refresh token kerakmi?** Hozir token 7 kun amal qiladi va seans uni
bekor qila oladi — bu so'ralgan vazifa uchun yetarli. Lekin token oshkor
bo'lsa, foydalanuvchi seansni **o'zi bekor qilmaguncha** u ishlayveradi.
Qisqa (masalan 15 daqiqalik) access token + refresh token bu oynani
toraytiradi, lekin ancha katta ish. Alohida qaror sifatida qoldirildi.
