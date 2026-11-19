# CareerConnect

A job board built with Next.js (App Router), PostgreSQL and Prisma.

## 🔗 Live demo

**<https://careerconnect-five-bay.vercel.app>**

Deployed on Vercel with a Neon Postgres database.

Try it with the demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Recruiter | `priya.recruiter@example.com` | `RecruiterPass123` |
| Candidate | `amit.candidate@example.com` | `CandidatePass123` |

## Features

- **Candidates** browse jobs, apply (with a required resume link and an
  optional cover letter) and track their application status.
- **Recruiters** set up a company profile, post/close/delete jobs, and move
  applications through a status workflow.

## Requirements

- Node.js 20.11 or newer
- PostgreSQL 14 or newer

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file from the example and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — PostgreSQL connection string, e.g.
     `postgresql://postgres:postgres@localhost:5432/careerconnect?schema=public`
   - `SESSION_SECRET` — at least 32 characters. Generate one with:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. Create the database schema:

   ```bash
   npm run db:deploy     # apply committed migrations
   # or, while changing the schema:
   npm run db:migrate
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Demo data (optional)

Register a recruiter account in the app first, then:

```bash
npm run db:seed
```

The seed attaches a demo company ("TechNova Solutions") and six sample jobs to
the recruiter account. It uses `SEED_RECRUITER_EMAIL` from `.env` when set,
otherwise the oldest recruiter account. It never creates users and never
overwrites a company profile you already configured.

## How the app works

| Route | Who | Purpose |
| --- | --- | --- |
| `/` | everyone | Landing page with real featured jobs and search |
| `/jobs` | everyone | Search, filter, paginate jobs; apply when signed in |
| `/my-applications` | candidates | Application list with status filter |
| `/recruiter/company` | recruiters | Create or edit the company profile |
| `/recruiter/jobs` | recruiters | Post jobs, close/reopen, delete |
| `/recruiter/applications` | recruiters | Review candidates and update status |

Protected pages are guarded by `src/proxy.js` (Next.js 16's replacement for
`middleware.js`), and every API route re-checks the session and reloads the
user from the database.

## Session and security notes

- Passwords are hashed with bcrypt (cost 12).
- Sessions are signed JWTs in an `httpOnly`, `sameSite=lax` cookie, valid for 7
  days. `POST /api/logout` clears it.
- Login and registration are rate limited **in memory** per server process.
  For multi-instance or serverless deployments, move
  `src/lib/rate-limit.js` to Redis or another shared store.
- API input is validated and length-capped server-side.

## Known limitations

- No email verification or password reset yet — accounts are usable right after
  registration.
- Resume upload is not implemented. Applying requires a **resume link**
  (Drive, Dropbox, portfolio, LinkedIn), which is validated to be an
  `http`/`https` URL; the cover letter stays optional. Both are stored as text
  and shown to the recruiter.
- `ADMIN` exists in the `UserRole` enum but is reserved: registration only
  allows candidate/recruiter accounts, and no admin screens exist yet.
- Rate limiting is per process (see above), so it is not shared across
  instances.
- `x-forwarded-for` is trusted for client IPs; run behind a trusted proxy in
  production.

## Troubleshooting

**`character with byte sequence 0xe2 0x82 0xb9 ... has no equivalent in encoding "WIN1252"`**

The database was created with a non-UTF-8 encoding (common with the default
Windows locale), so it cannot store characters like `₹`. Create the database
with UTF-8:

```sql
CREATE DATABASE careerconnect WITH ENCODING 'UTF8' TEMPLATE template0;
```

Then run `npm run db:deploy`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply committed migrations (production) |
| `npm run db:seed` | Seed demo company and jobs |
| `npm run db:studio` | Open Prisma Studio |

## Deploying

Set `DATABASE_URL` and `SESSION_SECRET` in the hosting environment, run
`npm run db:deploy` against the production database, then `npm run build`.

This project is live on Vercel (<https://careerconnect-five-bay.vercel.app>)
using the Neon Postgres integration from the Vercel Marketplace. Pushes to
`main` deploy automatically, and `postinstall` runs `prisma generate` during
the build.

---

## ⭐ Support

If you like this project, please consider giving it a **star** on GitHub — it
really helps and keeps the motivation going!

<div align="center">

**[⭐ Star this repository](https://github.com/Tushar-507/CareerConnect--Job-Portal-)**

Made with ❤️ by [Tushar](https://github.com/Tushar-507)

</div>
