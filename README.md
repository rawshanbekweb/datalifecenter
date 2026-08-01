# DATA LIFE — IT ta'lim platformasi

To'liq stack veb-platforma: kurslar, mentorlar, jonli sessiyalar, blog, savol-javob,
bildirishnomalar, qo'lda to'lov tasdiqlash (chek yuklash) va PDF sertifikatlar bilan.

## Texnologiyalar

| Qatlam    | Stack                                                              |
|-----------|--------------------------------------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4, framer-motion          |
| Backend   | Express 5, TypeScript, Prisma 7, PostgreSQL, Zod 4                 |
| Auth      | JWT (httpOnly cookie), bcrypt, rolga asoslangan ruxsat (RBAC)      |
| Fayllar   | Multer (lokal) yoki Cloudinary (production)                        |
| Email     | Nodemailer (SMTP) — parol tiklash, to'lov tasdiqlash xatlari       |
| Testlar   | Vitest + Supertest (integratsion)                                  |
| CI        | GitHub Actions (build + lint + test)                               |

## Rollar va imkoniyatlar

- **Talaba** — kursga yoziladi, chek yuklaydi, darslarni o'tadi, savol beradi,
  jonli sessiyalarga qatnashadi, sertifikat oladi.
- **Mentor** — o'z kurslari dasturini (modul/dars) boshqaradi, savollarga javob beradi,
  sessiyalar o'tkazadi, talabalar progressini kuzatadi, adminga so'rov yuboradi.
- **Admin** — hamma narsa: kurslar, foydalanuvchilar, to'lovlarni tasdiqlash,
  mentorlar, blog, hamkorlar, e'lonlar, murojaatlar.

## Lokal ishga tushirish

Talablar: Node.js >= 20, PostgreSQL 14+ (yoki Docker).

```bash
# 1. Backend
cd backend
cp .env.example .env          # DATABASE_URL va JWT_SECRET'ni sozlang
npm install
npx prisma migrate dev        # bazani yaratadi
npm run seed                  # demo ma'lumotlar (ixtiyoriy)
npm run dev                   # http://localhost:4000

# 2. Frontend (yangi terminal)
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                   # http://localhost:5173
```

Seed'dan keyingi demo hisoblar (faqat development):

| Rol     | Email                    | Parol       |
|---------|--------------------------|-------------|
| Admin   | admin@datalife.uz        | Admin123!   |
| Mentor  | aziz-karimov@datalife.uz | Mentor123!  |
| Talaba  | student@datalife.uz      | Student123! |

## Docker bilan (backend + Postgres)

```bash
docker compose up -d --build
# demo ma'lumotlar kerak bo'lsa (backend papkasidan, hostdan):
cd backend
DATABASE_URL="postgresql://datalife:datalife_dev_password@localhost:5433/datalife?schema=public" npm run seed
```

API `http://localhost:4000` da ko'tariladi (migratsiyalar avtomatik qo'llanadi);
frontend odatdagidek `npm run dev` bilan. Postgres hostga `5433` portda ochilgan.

## Muhit o'zgaruvchilari (backend)

| O'zgaruvchi             | Majburiy | Tavsif                                              |
|-------------------------|----------|-----------------------------------------------------|
| `DATABASE_URL`          | ha       | PostgreSQL ulanish satri                            |
| `PORT`                  | yo'q     | API porti (default 4000)                            |
| `NODE_ENV`              | ha       | `development` / `production` / `test`               |
| `FRONTEND_URL`          | ha       | CORS va emaildagi havolalar uchun frontend manzili  |
| `EXTRA_ALLOWED_ORIGINS` | yo'q     | CORS/CSRF uchun qo'shimcha origin'lar (vergul bilan) |
| `JWT_SECRET`            | ha       | Production'da kamida 32 belgi (server tekshiradi)   |
| `JWT_EXPIRES_IN`        | yo'q     | Token muddati (default `7d`)                        |
| `BREVO_API_KEY`         | yo'q     | Email yuborish (Brevo HTTP API; sozlanmasa o'chiq)  |
| `EMAIL_FROM`            | yo'q     | Yuboruvchi: `Nomi <email>` (Brevo'da tasdiqlangan)  |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | yo'q* | Fayllarni bulutda saqlash. *Render/Railway'da majburiy |
| `SENTRY_DSN`            | yo'q     | Xatolarni Sentry'ga yuborish (sentry.io)            |
| `CLICK_*` / `PAYME_*`   | yo'q     | To'lov shlyuzlari (sozlanmasa tugmalar ko'rinmaydi) |

Frontend: `VITE_API_URL` (masalan `http://localhost:4000/api`), ixtiyoriy `VITE_SENTRY_DSN`.

## Fayl xotirasi (Cloudinary)

Render/Railway'ning diski **ephemeral**: har deploy'da va instans qayta
ishga tushganda tozalanadi. Cloudinary sozlanmagan bo'lsa yuklash
"ishlaganday" ko'rinadi (rasm chiqadi, URL bazaga yoziladi), lekin keyingi
deploy'dan so'ng o'sha URL 404 qaytaradi. Shuning uchun production'da bu
sozlama **majburiy**.

**Sozlash (bir marta):**

1. [cloudinary.com](https://cloudinary.com) da bepul hisob oching.
2. Dashboard → **Product Environment Credentials** dan uchta qiymatni oling:
   `Cloud name`, `API Key`, `API Secret`.
3. Render → tegishli Web Service → **Environment** → uchta o'zgaruvchi qo'shing:
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` →
   **Save** (Render avtomatik qayta deploy qiladi).
4. Tekshirish: Render **Logs**da `[OGOHLANTIRISH] CLOUDINARY_* sozlanmagan`
   xabari endi chiqmasligi kerak. Admin panelda rasm yuklash maydonidagi
   "fayl keyingi deployda yo'qoladi" ogohlantirishi ham yo'qoladi
   (holat `GET /api/uploads/config` dan keladi).

**Yo'qolgan fayllarni topish.** Sozlashdan oldin yuklangan fayllar qaytmaydi —
ularning bazadagi havolasi qoladi, fayli esa yo'q. Nimani qayta yuklash
kerakligini shu audit ko'rsatadi (faqat o'qiydi, hech narsa o'zgartirmaydi):

```bash
cd backend
DATABASE_URL="<prod url>" API_URL="https://<backend>" FRONTEND_URL="https://<sayt>" npm run check:uploads
```

Natijada har bir buzuq havola **kim/qaysi bo'lim** ekani va **qayerdan
tuzatilishi** (masalan `/admin/mentors`) bilan ro'yxatlanadi. `SKIP_HTTP=true`
bilan tarmoqsiz, faqat tasnif ko'rsatiladi.

> Cloudinary yoqilgunga qadar yuklangan **videolar** ham lokal diskda — ular
> `type: authenticated` bilan qayta yuklanishi kerak (imzoli havola shundan
> ishlaydi).

## Xavfsizlik xususiyatlari

- JWT httpOnly cookie **va** `Authorization: Bearer` header (Safari krossdomen
  cookie'ni bloklaydi — token localStorage'dan header orqali ham yuboriladi)
- Parol o'zgarganda barcha eski sessiyalar bekor bo'ladi (`tokenVersion`)
- Email tasdiqlash (ro'yxatdan o'tganda havola yuboriladi, bloklamaydi)
- CSRF himoyasi (Origin tekshiruvi), rate-limit (global + auth + parol tiklash)
- Fayl yuklashda magic-bytes tekshiruvi, o'chirilgan kontent fayllari avtomatik tozalanadi
- Sertifikatlar ochiq tekshiriladi: `/verify-certificate` sahifasi
  (PDF pastida havola bor) yoki `GET /api/certificates/DL-XXXXXXXX/verify`

## Production deploy

### Backend — Render

1. Render'da **PostgreSQL** yarating, "Internal Database URL"ni nusxalang.
2. **Web Service** yarating (root: `backend/`):
   - Build Command: `npm install && npm run build && npx prisma migrate deploy`
   - Start Command: `npm start`
3. Environment o'zgaruvchilarini kiriting: `DATABASE_URL`, `NODE_ENV=production`,
   `FRONTEND_URL`, `JWT_SECRET` (32+ belgi), `CLOUDINARY_*` (majburiy! —
   "Fayl xotirasi" bo'limiga qarang), `BREVO_API_KEY`+`EMAIL_FROM` (email kerak bo'lsa).
4. Birinchi deploy'dan keyin kontent kerak bo'lsa, Render Shell'da:
   `SEED_FORCE=true ADMIN_PASSWORD=<kuchli parol> npm run seed`

> **Diqqat:** Cloudinary sozlanmasa, yuklangan rasm/videolar Render'ning
> ephemeral diskida saqlanadi va **har deploy'da yo'qoladi**.

### Frontend — Vercel

1. Loyihani import qiling (root: `frontend/`), framework: Vite.
2. Environment: `VITE_API_URL=https://<backend-domeningiz>/api`.
3. `vercel.json` allaqachon SPA rewrite bilan sozlangan.
4. Agar domen o'zgarsa, backend'dagi `FRONTEND_URL`ni ham yangilang
   (emaildagi havolalar uchun) va CORS ro'yxatiga qo'shing: yangi domenni
   `backend/src/config/cors.ts`dagi `STATIC_ORIGINS`ga yoki Render'dagi
   `EXTRA_ALLOWED_ORIGINS` env'iga kiriting.

## Testlar

```bash
cd backend
npm test          # DATABASE_URL'dagi bazadan foydalanadi — test bazasini ko'rsating!
```

Testlar auth (register/login/parol tiklash), kurs CRUD va enrollment
(yozilish → chek → tasdiqlash → sertifikat) oqimlarini qamrab oladi.

## API qisqacha

Hamma endpointlar `/api` ostida, javob formati:
`{ "success": true, "data": ... }` yoki `{ "success": false, "error": { "message", "code" } }`.

Asosiy guruhlar: `/auth`, `/courses`, `/enrollments`, `/mentors`, `/sessions`,
`/questions`, `/mentor-requests`, `/notifications`, `/announcements`, `/blog`,
`/partners`, `/contact`, `/users` (admin), `/admin/stats`, `/uploads`, `/progress`.
