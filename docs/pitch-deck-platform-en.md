# Pitch Deck (EN) — The Platform Itself

12 slides about the product and the engineering behind it.
No company history, no enrollment figures, no course prices — the project stands on its own.

Every number below was measured from the codebase on 2026-08-10.
Replace `<Product name>` with whatever you present it as.

---

## Slide 1 — Title

**<Product name>**
**A complete learning platform, built from scratch — not assembled from rented tools.**

One system where a course is created, taught live, graded, tracked, and certified.
33,000 lines of TypeScript · 36 data models · 3 role-based cabinets · 4 languages

*Speaker notes:* What I am showing you is not a website with a course catalogue. It is the operating system of an education program: everything from the moment a student applies to the moment an employer verifies their certificate happens inside one system that we designed and wrote ourselves.

---

## Slide 2 — The Problem

**Education runs on duct tape.**

A typical program today is stitched together from five disconnected services:

| The need | What is normally used | What breaks |
|---|---|---|
| Live class | Zoom / Meet | No link to the lesson, no attendance record |
| Materials | Google Drive, Telegram | Lost in a chat scroll, no order, no progress |
| Assignments | Chat messages, forms | Nothing to grade against, no history |
| Enrollment & payment | Spreadsheets | Manual, error-prone, no audit trail |
| Certificate | A PDF made by hand | Unverifiable — worth nothing to an employer |

**Nobody owns the data, nobody can see the whole picture, and nothing is verifiable.**

*Speaker notes:* The teacher spends more time being an administrator than teaching. The student has to remember which of five apps holds the thing they need. And the certificate at the end is a decorated image file.

---

## Slide 3 — The Solution

**One integrated system. Three role-based cabinets. Zero external tools.**

- **Student cabinet** — enrolled courses, lessons with video and materials, automatic progress, assignments and grades, live classes, Q&A, certificates
- **Mentor cabinet** — build the syllabus, manage students, set and grade assignments, run live sessions, answer questions, request support from the admin
- **Admin panel** — 21 screens covering enrollments, payments, users and roles, courses, curriculum, mentors, team, blog, projects, partners, announcements, reviews, messages, site settings, and analytics

**Every role sees only what belongs to it, enforced server-side — not hidden in the UI.**

*Speaker notes:* The important word is *integrated*. Because the live session knows which course it belongs to, and the assignment knows which lesson it came from, and the certificate knows which lessons were actually completed — the system can answer questions no combination of Zoom, Telegram, and spreadsheets can answer.

---

## Slide 4 — The Journey Through the Product

**Six stages, all inside the platform.**

1. **Request** — the student picks a program and applies; the request lands in the admin panel as a tracked record, not an email.
2. **Enrollment** — an administrator confirms; the course unlocks in the student's cabinet automatically. Group capacity is enforced by the system: when seats run out, enrollment closes and a waitlist opens.
3. **Learning** — modules and lessons in order, with video, theory, and materials; progress is computed automatically from what is actually completed.
4. **Assignments** — the mentor sets work; the student submits text, links, or screenshots; the mentor accepts or returns it for rework, with a grade and written feedback.
5. **Live class** — the room opens inside the site 10 minutes before start, with screen sharing; the mentor chooses who it is for.
6. **Certificate** — issued when the course is genuinely complete, as a PDF carrying a public verification link.

*Speaker notes:* Follow one record through that chain and you see the design principle: nothing is re-entered by hand at any step, because every stage writes into the same data model the next stage reads.

---

## Slide 5 — What the Student Actually Gets

- **Everything in one place** — every lesson's video, theory, and task stays in the cabinet, revisitable at any time
- **Progress you can see** — active and finished courses, lessons completed, overall percentage
- **Questions where they arise** — Q&A sits under the specific lesson, not in a group chat; the student is notified the moment a mentor answers
- **Real feedback, not a checkmark** — submissions can be returned for rework with comments
- **Live notifications** — new assignment, upcoming live class, enrollment status, announcements, all pushed in real time over a live server connection
- **A certificate that survives scrutiny** — an employer opens the link on the PDF and the system confirms it independently

*Speaker notes:* The verification page is my favourite feature to demo, because it takes five seconds and it is the only one that creates value for someone who is not our user — the employer.

---

## Slide 6 — What the Institution Gets

**The administrative work disappears into the system.**

- **Enrollments and payments** — confirmation, status, and history as records, with the course access following automatically from the decision
- **Capacity control** — seats per group are set in advance and enforced; no overbooked cohorts
- **Users and roles** — one place to grant, revoke, and audit access
- **Curriculum management** — modules and lessons authored in the panel; several mentors can co-lead one course as equals, sharing curriculum, Q&A, assignments, and live sessions
- **Content operations** — blog, projects, partners, team, testimonials, announcements, and site settings, all editable without touching code
- **Engagement analytics** — daily views, likes, new users, and enrollments over 7 / 30 / 90 days, each compared against the previous period of the same length

*Speaker notes:* This is the slide that turns a school into a product. Everything an administrator used to do in a spreadsheet at midnight is now a record with an author, a timestamp, and a permission check.

---

## Slide 7 — Architecture

**Designed as a system, not grown as a website.**

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, framer-motion
- **Backend:** Express 5, TypeScript, Prisma 7, PostgreSQL, Zod schema validation on every input
- **Data model:** 36 entities — users, courses, modules, lessons, enrollments, assignments and submissions, live sessions, questions, conversations, notifications, certificates, engagement, and content
- **API:** 28 route groups under a single consistent response envelope
- **Real time:** server-sent events push notifications the instant they are created — no polling
- **Storage:** cloud object storage for images and video, with a documented fallback provider
- **Scale:** 354 TypeScript source files, ~33,000 lines, one shared type language from database to browser

*Speaker notes:* One detail worth calling out: types run end to end. A field renamed in the database schema fails the build in the browser code. That is why a system this size stays changeable by a small team.

---

## Slide 8 — Security & Trust

**Trust is a feature, and it is implemented.**

- **Authentication** — JWT in an httpOnly cookie, with a header fallback for browsers that block cross-domain cookies; bcrypt password hashing
- **Session invalidation** — changing a password revokes every existing session everywhere, immediately
- **Role-based access control** — enforced on the server for every route; the UI is a convenience, never the boundary
- **Protected video** — course videos live in a private bucket and open only through short-lived signed links generated per request; the raw URL is useless
- **Upload safety** — files are validated by their actual magic bytes, not their extension; orphaned files are cleaned up automatically
- **Abuse resistance** — CSRF origin checks, global and per-endpoint rate limiting, email verification, and dedicated protection against fake registrations
- **Public verifiability** — certificates can be checked by anyone through a public page or API endpoint

*Speaker notes:* Every one of these lines is a real attack we designed against. The signed-video-link model matters commercially too: it is what makes paid course content actually paid.

---

## Slide 9 — Engineering Discipline

**The difference between a demo and a product.**

- **220 automated tests** across 21 integration suites and 45 test groups — covering registration and login, password reset, course CRUD, enrollment, payments, group capacity, assignments, live sessions, messaging, video access control, analytics, and storage
- The tests exercise **whole flows** end to end: enroll → confirm → complete → certificate, against a real database
- **Continuous integration** — every change is built, linted, and tested before it can ship
- **Continuous monitoring** — the service and database are watched constantly, with alerts on failure and error reporting wired into the application
- **Reproducible environments** — Docker for local development, documented configuration, automatic database migrations on deploy

*Speaker notes:* A jury can't inspect our code in five minutes, so this is the proxy: 220 tests that must pass before anything reaches a student. That is the standard we hold ourselves to, and it is why we can deploy without fear.

---

## Slide 10 — Built Multilingual, Not Translated Later

**Four languages, all first-class: Karakalpak, Uzbek, Russian, English.**

- The **interface** is fully localized — public site, student cabinet, mentor cabinet, and admin panel
- So is the **content**: courses, lessons, blog posts, and announcements carry their own translations in the database, with a defined base language to fall back to
- **Karakalpak is the default**, not an afterthought — the language with the least software written for it anywhere is the one this platform opens in

*Speaker notes:* Almost every platform in this category treats localization as a string file bolted on at the end. Here it goes all the way down into the content model, which is the hard half. And a platform whose default language is one that most software ignores entirely is not a feature — it is a position.

---

## Slide 11 — Where the Project Goes

**Phase 1 — Harden the operating system of one program.** Deepen assignment and grading workflows, richer live sessions, session management and per-role security policies.

**Phase 2 — Open the platform to other programs.** Multi-tenant: any training center or department runs its own courses, mentors, students, and branding on the same system.

**Phase 3 — The verified-outcome layer.** Public verification of certificates becomes an employer-facing service: a skills record backed by completed work and graded assignments, not a decorated PDF.

**The underlying bet:** learning platforms that are rented cannot be adapted, and learning records that cannot be verified are not worth issuing. This project fixes both.

*Speaker notes:* Phase 2 is where the economics change — the same codebase, one more tenant, near-zero marginal cost. Everything built so far was built with that in mind.

---

## Slide 12 — Close

**A learning platform that owns its data, protects its content, verifies its results, and speaks the learner's language.**

- Built and running in production — not a prototype
- 36 data models · 28 API groups · 220 automated tests · 4 languages · 3 role cabinets
- Written end to end in TypeScript by the team presenting it

**What we're looking for:** partners and institutions to run their programs on it, and the support to take it multi-tenant.

> Live demo available on request — bring a laptop and I'll show you a certificate being verified.
> `<site>` · `<contact>`

*Speaker notes:* Close with the demo offer, then stop. If there is time for exactly one live thing, do the certificate verification — it is fast, it is visual, and it is the only moment where the jury sees the product create trust in real time.

---

### Before you present

- Decide the product name used on Slides 1 and 12
- Have the live demo ready in a second tab: student cabinet → a lesson → a graded assignment → certificate verification
- Optional strong addition: a one-slide architecture diagram for Slide 7 (data model in the middle, three cabinets around it)
- If the jury asks "why not use an off-the-shelf LMS": the answer is Slides 8 and 10 — content protection and a content model that is genuinely multilingual, neither of which you can add to a rented platform
