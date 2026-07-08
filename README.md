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
| `JWT_SECRET`            | ha       | Production'da kamida 32 belgi (server tekshiradi)   |
| `JWT_EXPIRES_IN`        | yo'q     | Token muddati (default `7d`)                        |
| `SMTP_HOST/PORT/USER/PASS/FROM` | yo'q | Email yuborish (sozlanmasa o'chiq)          |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | yo'q* | Fayllarni bulutda saqlash. *Render/Railway'da majburiy |
| `SENTRY_DSN`            | yo'q     | Xatolarni Sentry'ga yuborish (sentry.io)            |

Frontend: `VITE_API_URL` (masalan `http://localhost:4000/api`), ixtiyoriy `VITE_SENTRY_DSN`.

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
   `FRONTEND_URL`, `JWT_SECRET` (32+ belgi), `CLOUDINARY_*` (majburiy!),
   `SMTP_*` (email kerak bo'lsa).
4. Birinchi deploy'dan keyin kontent kerak bo'lsa, Render Shell'da:
   `SEED_FORCE=true ADMIN_PASSWORD=<kuchli parol> npm run seed`

> **Diqqat:** Cloudinary sozlanmasa, yuklangan rasm/videolar Render'ning
> ephemeral diskida saqlanadi va **har deploy'da yo'qoladi**.

### Frontend — Vercel

1. Loyihani import qiling (root: `frontend/`), framework: Vite.
2. Environment: `VITE_API_URL=https://<backend-domeningiz>/api`.
3. `vercel.json` allaqachon SPA rewrite bilan sozlangan.
4. Agar domen o'zgarsa, backend'dagi `FRONTEND_URL`ni ham yangilang
   (CORS va emaildagi havolalar uchun).

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
