# Pitch Deck (EN) — Why This Exists + Business Model

12 slides. Part A (1–6) answers the jury's real question: *why does this need to exist at all?*
Part B (7–12) answers the second one: *how does it make money?*

Numbers in `<angle brackets>` are yours to fill in. Everything shown as **illustrative**
is a worked example of the model, not a claim — replace with your real figures before presenting.

---

# PART A — WHY

## Slide 1 — The Question Nobody Asks Out Loud

**Every education program in the region already "has a website."**
**So why build a platform?**

Because a website sells a course. It does not **run** one.

The moment a student pays, the website's job ends and five other apps take over —
a video call, a chat group, a cloud folder, a form, a spreadsheet.
That handoff is where education actually breaks.

*Speaker notes:* Start with the objection, not the pitch. Everyone in this room has seen twenty course websites. I am going to spend the next four minutes on the part that starts after the website ends — the part nobody builds, because it is hard and it is invisible from outside.

---

## Slide 2 — Why It Is Needed: What Breaks Without It

| Who | What they lose today |
|---|---|
| **Student** | Materials scattered across chats and drives; questions answered in a group scroll or not at all; no idea how far along they are; a certificate that proves nothing |
| **Mentor** | More time spent as an administrator than as a teacher; grading in chat messages; no record of who submitted what, when |
| **Institution** | No single source of truth — enrollment in one place, payment in another, progress nowhere; every report assembled by hand |
| **Employer** | Cannot tell a real graduate from a decorated PDF, so the certificate is ignored — and the whole education is discounted with it |

**The loss is not comfort. It is that learning produces no trustworthy record.**

*Speaker notes:* Follow the chain to the end. If the certificate is worthless to the employer, then the student's effort is worth less in the market than it should be, and the school's reputation cannot compound. One missing piece of infrastructure devalues everything upstream of it.

---

## Slide 3 — Why Now

- **The tools finally exist.** Live video, cloud storage, and real-time delivery in the browser are commodity. Five years ago this system needed a team of thirty; today it needs a disciplined few.
- **Demand shifted permanently.** Online and hybrid learning stopped being an emergency measure and became the default expectation. Programs that cannot run both formats lose students.
- **Skills-based hiring is arriving.** Employers increasingly want evidence of work, not a diploma. Nothing in the region issues that evidence in a verifiable form.
- **Regional and minority-language learners remain unserved.** Global platforms will never localize for a market this size — the economics don't work for them. They do work for us.
- **AI raised the floor.** Generic content is now free and infinite. The scarce goods are structure, feedback from a real practitioner, and proof of completion — exactly the three things this platform is built around.

*Speaker notes:* The "why now" is that the cost of building it collapsed at the same moment the value of what it produces went up.

---

## Slide 4 — Why a Rented Platform Cannot Do This

**Three things you cannot add to somebody else's LMS:**

1. **Protected content.** Course video sits in a private store and opens only through short-lived signed links generated per request. On a rented platform, whatever your students can see, they can also take — and there goes the reason anyone pays.
2. **Genuine multilingualism.** Not a translated menu: the *content* — courses, lessons, posts, announcements — carries its own translations in the database, with a defined base language behind it. Rented platforms give you an interface language file and stop there. A platform that opens by default in a language most software ignores entirely is not a setting you can toggle.
3. **The workflow of your own program.** Group capacity enforced by the system, enrollment activated by an administrator's decision, several mentors co-leading one course as equals, a certificate issued only when the work is genuinely finished. These are not features — they are the shape of how a serious program runs, and they differ per institution.

**Rent the platform and every one of these becomes a support ticket to somebody who has no reason to answer it.**

*Speaker notes:* This is the slide that answers "why didn't you just use Moodle." The short version: because the three things that make the business defensible are precisely the three things a tenant is not allowed to change.

---

## Slide 5 — Why It Matters Beyond One Program

**Fix the infrastructure once, and it stops being about one course.**

- A learner in a regional city gets the **same** structure, feedback, and record as a learner in the capital — the gap that geography creates is closed by software.
- Learning in a **minority language** becomes economically possible, because the marginal cost of one more language on a platform you own is near zero.
- A certificate becomes a **verifiable claim** rather than an image, so effort converts into market value.
- Every other program that runs on the same system inherits all of it on day one — **no rebuild required.**

*Speaker notes:* This is the ambition slide, and the honest version of it. We are not claiming to reform education. We are claiming that one missing layer — a system that runs a program end to end and can prove what it produced — is worth building properly, and that it lifts everything sitting on top of it.

---

## Slide 6 — Why This Team Can Build It

**It already exists, in production, and it is engineered like a product.**

- **36 data models · 28 API groups · ~33,000 lines of TypeScript** — one type language from database to browser
- **220 automated tests** across 21 suites — every change is built, linted, and tested before it can reach a student
- **Security implemented, not promised** — session invalidation on password change, server-enforced role permissions, signed video links, upload validation by magic bytes, rate limiting, CSRF protection
- **Continuously monitored** in production, with alerting on failure
- **Four languages** shipped: Karakalpak, Uzbek, Russian, English

**This is not a slide of intentions. It is a description of what is running right now.**

*Speaker notes:* If you take one thing from part A: the risky part of this venture — can they actually build it — is the part already behind us.

---

# PART B — BUSINESS MODEL

## Slide 7 — How It Makes Money

**Four revenue lines, one codebase.**

| # | Line | Who pays | Model | Margin |
|---|---|---|---|---|
| 1 | **Program tuition** | Learners | Per course, per cohort | Medium — mentor cost is variable |
| 2 | **Corporate training** | Companies | Per closed cohort or per seat | High — same content, higher price point |
| 3 | **Platform subscription** | Other training centers, departments | Recurring, per tenant + per active learner | Very high — software only |
| 4 | **Institutional licensing** | Universities, colleges, agencies | Annual license + setup | High — long contracts, low churn |

**Lines 1–2 are the business today. Lines 3–4 are what the architecture was built for.**

*Speaker notes:* The order matters. Running our own program is not a distraction from the software business — it is the reason the software is any good, and it is a live reference customer that never churns.

---

## Slide 8 — The Core Bet: One Codebase, Many Programs

**Why this compounds instead of just adding up:**

- Every feature built for our own program — capacity control, grading, live sessions, certificates, analytics — becomes a feature **every** tenant gets, at no extra build cost.
- Every additional language is written **once** and serves every tenant afterwards.
- Adding tenant number ten costs roughly what tenant number two cost: some storage, some database rows, some support.
- Our own program is the **proving ground**: nothing ships to a paying tenant that has not already survived contact with real students and real mentors.

**Services revenue funds the build. Subscription revenue is what scales.**

*Speaker notes:* This is the entire investment thesis in one line. A training center's revenue grows one classroom at a time. A platform's revenue grows one tenant at a time, and tenants don't need classrooms.

---

## Slide 9 — Pricing

**Learners — per program**
Priced per course by length and level, online or offline. Payment is confirmed by an administrator, and access opens automatically once confirmed — no card processing on the site, no chargeback exposure, no fraud surface.
Current range: `<your price range>` per course, `<2–6>` months.

**Companies — per cohort**
Closed group for a company's staff, curriculum adapted to their actual work. Priced per program, benchmarked at `<X>`× the individual price for a group of `<N>`.

**Platform — recurring (proposed)**

| Tier | For | Included | Price |
|---|---|---|---|
| **Starter** | One program, small center | 1 program, up to `<50>` active learners, all core features | `<$/month>` |
| **Growth** | Multi-program center | Unlimited programs, up to `<300>` active learners, analytics, multi-mentor courses | `<$/month>` |
| **Institution** | University, agency | Custom domain and branding, unlimited learners, priority support, onboarding | `<annual>` |

*Speaker notes:* Two deliberate design choices. First, no money moves through the website — in this market trust is built face to face, and the side effect is that we carry zero payment-fraud risk. Second, platform pricing scales with **active** learners, not registered ones, so a tenant's bill tracks their actual value received.

---

## Slide 10 — Unit Economics **(illustrative — replace with your figures)**

**Program tuition, per cohort**

| | Illustrative |
|---|---|
| Learners per group (capacity-enforced) | 5–6 |
| Revenue per learner | `<price>` |
| Mentor cost (variable, per cohort) | `<%>` of cohort revenue |
| Platform + infrastructure cost per learner | Near zero — the system is already running |
| **Contribution margin per cohort** | `<%>` |

**Platform subscription, per tenant**

| | Illustrative |
|---|---|
| Cost to serve one tenant | Database rows, object storage, support hours |
| Gross margin | 80%+ — no per-tenant engineering |
| Payback on acquisition | Months, not years — no hardware, no per-seat licenses to resell |

**The lever that matters:** a learner who completes one program and returns for the next one costs nothing to acquire the second time. Course ladder → lifetime value multiplies while acquisition cost stays at zero.

*Speaker notes:* Say the word "illustrative" out loud. Juries forgive missing numbers; they do not forgive invented ones. Bring the real cohort figures if you have them, and if you don't, present the structure and say which number you are still measuring.

---

## Slide 11 — Go To Market

**Now — prove it on ourselves.** Our own program runs entirely on the platform. Every graduate, every issued certificate, and every verified credential is evidence for the next conversation.

**Next — corporate and institutional.** Companies need staff trained; universities need practice and internship programs. Both already have the learners — what they lack is the system to run them. Short sales cycle, high contract value, natural references.

**Then — other training centers.** The pitch writes itself: keep your program, your mentors, and your brand; stop stitching together five tools; get content protection, four languages, and verifiable certificates on day one.

**Always — the credential as marketing.** Every certificate carries a public verification link. Every employer who clicks it meets the platform without us paying for the introduction.

*Speaker notes:* That last point is the one people miss. The verification page is a distribution channel disguised as a trust feature — the product markets itself to the exact audience whose opinion determines its value.

---

## Slide 12 — What We Track, and What We're Asking For

**The five numbers that tell us it's working**

1. **Cohort fill rate** — are capped groups actually filling?
2. **Completion rate** — the honest measure of whether the teaching works
3. **Certificates verified by third parties** — proof the credential means something outside our walls
4. **Revenue per tenant, and tenant retention** — the platform business in one pair of numbers
5. **Repeat enrollment** — learners climbing the ladder, the cheapest revenue there is

**The ask**

- **Institutions and companies** ready to run a program on the platform
- **Partner training centers** for the first tenants beyond ourselves
- **Support and investment** to take the system multi-tenant and expand the credential layer

> Live demo on request. If you have one minute, I'll show you a certificate being verified — by you, not by us.
> `<site>` · `<contact>`

*Speaker notes:* End with the demo, not the ask. Let them verify a certificate themselves; the moment their own browser confirms it is the moment the business model becomes obvious.

---

## Appendix — The Questions Juries Actually Ask

**"Why not just use Moodle / Google Classroom / an existing LMS?"**
Slide 4. Content protection, a content model that is multilingual all the way down, and the workflow of a real program — none of the three are things a tenant is permitted to change.

**"What stops a bigger player from copying this?"**
Nothing stops the features. What they will not do is localize for a market this size, or operate a real program to keep the product honest. Our defensibility is the languages, the operating knowledge, and being the only ones present here.

**"Isn't this just a school with a website?"**
It's a school that wrote its own operating system and is now licensing it. Slide 8 is the difference.

**"What is the biggest risk?"**
Concentration: today one program runs on the platform. That is exactly what the multi-tenant phase is for, and why we are here.

**"How much of this is actually built?"**
All of part A. It is in production: 36 data models, 220 automated tests, four languages, certificates being verified today.
