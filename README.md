# DATA LIFE — IT Education Platform

A full-stack web platform for IT education, featuring courses, mentors, live sessions, a blog, Q&A, notifications, manual payment verification through receipt uploads, and PDF certificates.

## Technologies

| Layer          | Stack                                                              |
| -------------- | ------------------------------------------------------------------ |
| Frontend       | React 19, TypeScript, Vite, Tailwind CSS 4, framer-motion          |
| Backend        | Express 5, TypeScript, Prisma 7, PostgreSQL, Zod 4                 |
| Authentication | JWT (httpOnly cookie), bcrypt, role-based access control (RBAC)    |
| File Storage   | Multer (local) or Cloudinary (production)                          |
| Email          | Nodemailer (SMTP) — password reset and payment confirmation emails |
| Testing        | Vitest + Supertest (integration testing)                           |
| CI             | GitHub Actions (build + lint + test)                               |

## Roles and Capabilities

* **Student** — enrolls in courses, uploads payment receipts, completes lessons, asks questions, attends live sessions, and receives certificates.
* **Mentor** — manages the curriculum (modules/lessons) of their courses, answers questions, conducts live sessions, monitors student progress, and sends requests to administrators.

  Multiple mentors can manage the same course together. They have **equal management permissions** over the course, including the curriculum, Q&A, assignments, and live lessons. The only difference is that the first mentor in the list is designated as the **primary mentor**. The primary mentor is displayed first on the website and is selected as the author when an administrator creates a session or assignment on behalf of the course.
* **Admin** — has full management access to courses, users, payments, mentors, blog content, partners, announcements, and contact requests.

## Local Development

### Requirements

* Node.js >= 20
* PostgreSQL 14+ or Docker

```bash
# 1. Backend
cd backend
cp .env.example .env          # Configure DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev        # Creates the database
npm run seed                  # Demo data (optional)
npm run dev                   # http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                   # http://localhost:5173
```

### Demo Accounts After Seeding

The following accounts are intended for development only:

> **WARNING:** These passwords are publicly visible in this repository. The `admin@datalife.uz` account also exists in the live database and **must be assigned a different password immediately after creation** through the account settings.
>
> Otherwise, administrator access may be exposed to anyone who knows the credentials. Login attempt limits do not mitigate this specific risk because an attacker does not need to discover the password through brute force.

| Role    | Email                                                       | Password    |
| ------- | ----------------------------------------------------------- | ----------- |
| Admin   | [admin@datalife.uz](mailto:admin@datalife.uz)               | Admin123!   |
| Mentor  | [aziz-karimov@datalife.uz](mailto:aziz-karimov@datalife.uz) | Mentor123!  |
| Student | [student@datalife.uz](mailto:student@datalife.uz)           | Student123! |

## Docker — Backend + PostgreSQL

```bash
docker compose up -d --build

# If demo data is required (from the backend directory, on the host):
cd backend
DATABASE_URL="postgresql://datalife:datalife_dev_password@localhost:5433/datalife?schema=public" npm run seed
```

The API runs on:

```text
http://localhost:4000
```

Database migrations are applied automatically.

The frontend can be started normally with:

```bash
npm run dev
```

PostgreSQL is exposed on port `5433` on the host.

## Environment Variables — Backend

| Variable                                     | Required | Description                                                                                |
| -------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                               | Yes      | PostgreSQL connection string                                                               |
| `PORT`                                       | No       | API port (default: `4000`)                                                                 |
| `NODE_ENV`                                   | Yes      | `development` / `production` / `test`                                                      |
| `FRONTEND_URL`                               | Yes      | Frontend URL used for CORS and email links                                                 |
| `EXTRA_ALLOWED_ORIGINS`                      | No       | Additional origins for CORS/CSRF, separated by commas                                      |
| `JWT_SECRET`                                 | Yes      | At least 32 characters in production; validated by the server                              |
| `JWT_EXPIRES_IN`                             | No       | Token lifetime (default: `7d`)                                                             |
| `BREVO_API_KEY`                              | No       | Email delivery through the Brevo HTTP API; disabled if not configured                      |
| `EMAIL_FROM`                                 | No       | Sender address: `Name <email>` (must be verified in Brevo)                                 |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | No*      | File storage using Supabase Storage. *Required on Render/Railway if Cloudinary is not used |
| `SUPABASE_BUCKET_IMAGES/VIDEOS`              | No       | Bucket names (default: `datalife-images` / `datalife-videos`)                              |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`   | No*      | Alternative file storage. **Cloudinary is unavailable from Uzbekistan**                    |
| `IMAGE_MAX_MB` / `VIDEO_MAX_MB`              | No       | Upload limits (default: 15 / 500 MB). Do not exceed the storage provider's own limits      |
| `SENTRY_DSN`                                 | No       | Send application errors to Sentry                                                          |
| `CLICK_*` / `PAYME_*`                        | No       | Payment gateways; payment buttons remain hidden if not configured                          |

Frontend:

```text
VITE_API_URL
```

Example:

```text
VITE_API_URL=http://localhost:4000/api
```

Optional:

```text
VITE_SENTRY_DSN
```

## File Storage

Render/Railway disks are **ephemeral**. Files stored on the local filesystem may be removed when the service is redeployed or restarted.

If cloud storage is not configured, uploads may appear to work initially — the image may be displayed and its URL may be stored in the database — but the file can return `404` after a deployment.

Therefore, cloud storage is **required in production**.

The application supports two providers:

* **Supabase Storage** — recommended
* **Cloudinary** — alternative

If both are configured, Cloudinary takes precedence.

> **Cloudinary is unavailable from Uzbekistan:** the registration page currently returns "Unfortunately our services currently are not available in your country." Therefore, Supabase is the primary recommended option for this deployment environment.

### Supabase Storage — Recommended

1. Create a free account and a new **Project** at [supabase.com](https://supabase.com).
2. Choose a nearby region, such as `eu-central` / Frankfurt.
3. Go to **Project Settings → API** and obtain:

   * **Project URL** (`https://xxxx.supabase.co`) → `SUPABASE_URL`
   * **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
4. In Render → Web Service → **Environment**, add these two variables.
5. Save the configuration. Render will automatically redeploy the service.
6. Buckets do not need to be created manually. The server creates them during the first upload:

   * `datalife-images` — public
   * `datalife-videos` — private

> **Security warning:** The `service_role` key provides full access to the project's data. It must exist **only in the backend environment**. Never expose it through the frontend, `VITE_*` variables, or the repository.

Videos are stored in a private bucket. Direct raw URLs are not exposed. A signed URL valid for 6 hours is generated for each request.

Images are stored in a public bucket because they are intended to be publicly displayed on the website.

### Cloudinary — Alternative

1. Create an account at [cloudinary.com](https://cloudinary.com).
2. Go to **Dashboard → Product Environment Credentials**.
3. Obtain:

   * `Cloud name`
   * `API Key`
   * `API Secret`
4. Add the following environment variables to Render:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Verification

In Render **Logs**, you should see:

```text
File storage: supabase
```

or:

```text
File storage: cloudinary
```

You should not see:

```text
[WARNING] Cloud storage is not configured
```

The admin panel's file upload interface should also stop displaying the warning that uploaded files will be lost after the next deployment. This status is obtained from:

```text
GET /api/uploads/config
```

### Finding Missing Files

Files uploaded before cloud storage was configured cannot be recovered automatically.

Their database URLs may still exist, but the actual files may have already been removed.

The following audit command identifies broken file references. It is read-only and does not modify any data:

```bash
cd backend

DATABASE_URL="<prod url>" \
API_URL="https://<backend>" \
FRONTEND_URL="https://<site>" \
npm run check:uploads
```

The result lists each broken reference, including:

* who or which section owns it;
* where it is used;
* where it needs to be fixed, such as `/admin/mentors`.

For a network-free classification check:

```bash
SKIP_HTTP=true
```

> Videos uploaded before cloud storage was enabled may still exist only on the local filesystem. They must be uploaded again so they are stored in the private bucket or, when using Cloudinary, with `type: authenticated`, allowing signed URLs to work correctly.

## Security Features

* JWT authentication using an `httpOnly` cookie and `Authorization: Bearer` header

  * Safari may block cross-domain cookies, so the token can also be sent through the authorization header.
* All previous sessions are invalidated after a password change using `tokenVersion`.
* Email verification during registration.
* CSRF protection through Origin validation.
* Rate limiting:

  * global rate limit;
  * authentication rate limit;
  * password-reset rate limit.
* File uploads use magic-byte validation.
* Deleted content files are automatically cleaned up.
* Public certificate verification:

  * `/verify-certificate`
  * `GET /api/certificates/DL-XXXXXXXX/verify`

The certificate PDF also contains a verification link.

## Production Deployment

### Backend — Render

1. Create a **PostgreSQL** database in Render.
2. Copy the **Internal Database URL**.
3. Create a **Web Service** with the root directory:

```text
backend/
```

4. Configure the build command:

```bash
npm install && npm run build && npx prisma migrate deploy
```

5. Configure the start command:

```bash
npm start
```

6. Add the required environment variables:

```text
DATABASE_URL
NODE_ENV=production
FRONTEND_URL
JWT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

`JWT_SECRET` must contain at least 32 characters in production.

If email functionality is required, also configure:

```text
BREVO_API_KEY
EMAIL_FROM
```

After the first deployment, if initial content is required, run the seed command from the Render Shell:

```bash
SEED_FORCE=true ADMIN_PASSWORD=<strong-password> npm run seed
```

> **Important:** Running the full seed on a live database can modify existing data. It can:
>
> * reset partner logos to placeholders;
> * reset course prices to seed values;
> * create demo accounts with publicly known passwords such as `Team123!` and `Student123!`.
>
> Therefore, do **not** run the full seed on an active production database unless you understand and accept these changes.

If only team members need to be created, use the safer alternative:

```bash
npm run seed:team
```

Dry run:

```bash
npm run seed:team -- --dry-run
```

Create unpublished accounts:

```bash
npm run seed:team -- --published=false
```

The team seed:

* does not modify other tables;
* does not create unrelated accounts;
* does not create duplicates when executed multiple times.

> **Important:** Without cloud storage, uploaded images and videos are stored on Render's ephemeral filesystem and may be lost after every deployment.

### Frontend — Vercel

1. Import the project into Vercel.
2. Set the root directory to:

```text
frontend/
```

3. Select **Vite** as the framework.
4. Configure:

```text
VITE_API_URL=https://<backend-domain>/api
```

5. The existing `vercel.json` already contains the SPA rewrite configuration.
6. If the domain changes, update `FRONTEND_URL` in the backend as well.
7. Add the new domain to the CORS configuration:

```text
backend/src/config/cors.ts
```

or configure:

```text
EXTRA_ALLOWED_ORIGINS
```

in the Render environment.

## Tests

Run the test suite from the backend directory:

```bash
cd backend
npm test
```

> **Important:** Tests use the database configured through `DATABASE_URL`. Make sure `DATABASE_URL` points to a dedicated test database.

The test suite covers:

* authentication;
* registration;
* login;
* password recovery;
* course CRUD;
* enrollment flow:

  * enrollment;
  * receipt upload;
  * payment approval;
  * certificate generation.

## API Overview

All endpoints are available under:

```text
/api
```

The standard response format is:

```json
{
  "success": true,
  "data": {}
}
```

or:

```json
{
  "success": false,
  "error": {
    "message": "...",
    "code": "..."
  }
}
```

### Main API Groups

```text
/auth
/courses
/enrollments
/mentors
/sessions
/questions
/mentor-requests
/notifications
/announcements
/blog
/partners
/contact
/users
/admin/stats
/admin/analytics
/engagement
/uploads
/progress
```

### Admin Analytics

```text
/admin/analytics?days=7
/admin/analytics?days=30
/admin/analytics?days=90
```

The endpoint provides time-based monitoring of:

* daily views;
* likes;
* new users;
* course enrollments.

The selected period is compared with the previous period of the same length.

The data source is the `EngagementDaily` table, which stores daily aggregated statistics.

A new database will initially contain no analytics data.

To generate demo analytics data:

```bash
npm run seed:analytics
```

To clear the generated analytics data:

```bash
npm run seed:analytics -- --clear
```
