# AQEAW Server

Backend API for the Dr. Ayed Alqarni Excellence Award site: the public
application form, the admin dashboard, and the anonymised judging portal.

Express 4 · Mongoose 8 · MongoDB (files in GridFS) · Nodemailer · ExcelJS.
No build step — plain ES modules on Node 20.

## Setup

```bash
npm install
cp .env.example .env   # then fill it in
npm run dev            # nodemon on http://localhost:5000
```

`npm start` runs it without nodemon (this is what the `Procfile` uses).

Every value in `.env` is documented in [`.env.example`](.env.example). The ones
you cannot skip are `MONGODB_URI`, `ADMIN_SECRET`, and `ADMIN_PASSWORD` for the
first boot.

`GET /health` returns `{ ok: true }` once it is up.

## Dashboard accounts

Accounts live in the `dashboard_users` collection, with one of three roles:

| Role | Can reach |
| --- | --- |
| `superadmin` | Everything an admin can, **plus** `/admin/users` — the only role that can create, delete, re-role or reset the password of any account |
| `admin` | The dashboard: applications, exports, judging settings, evaluations, profile cards. No access to accounts (403 on `/admin/users`) |
| `judge` | Only `/judge/*` — candidates anonymised behind a code, no names |

Manage accounts in the dashboard at **`/admin/users`**, which only a superadmin
can open. The link appears in the dashboard header for that role alone.

**On boot** the server makes sure a superadmin exists:

1. One already exists → nothing happens.
2. No superadmin but exactly one admin → that admin is promoted (this is the
   migration from the older two-role setup) and the promotion is logged.
3. No superadmin and several admins → it refuses to guess and tells you to
   promote one with the CLI.
4. No accounts at all → creates `admin` as a **superadmin**, using `ADMIN_PASSWORD`.

The last active superadmin cannot be deleted, disabled or demoted, and nobody
can delete their own account.

Create or reset an account from the command line:

```bash
npm run user:create -- <username> <superadmin|admin|judge> "<Full Name>" <password> [email]
```

The password must be at least 8 characters. If the username already exists its
name, role and password are updated and the account is re-enabled.

List every account, with a warning if no active superadmin exists:

```bash
npm run user:list
```

Change only someone's role — password, email and active flag are left alone,
so promoting a person doesn't reset their password or switch off their
two-step login:

```bash
npm run user:role -- <username> <superadmin|admin|judge>
```

**The optional `email` turns on two-step login.** With one set, signing in sends
a 6-digit code to that address which must be entered to finish; without one, the
password alone signs you in. Codes last 10 minutes, allow 5 wrong tries, and can
be resent after 30 seconds. Login is also rate-limited to 10 failures per IP per
15 minutes.

Passwords are hashed with scrypt (`src/services/passwords.js`). Sessions are
HMAC-signed tokens valid for 12 hours; changing `ADMIN_SECRET` invalidates all
of them at once.

## Judging

Judges rate six weighted criteria from 1 to 5 (`src/config/criteria.js`):

| Criterion | Weight |
| --- | --- |
| Community impact | 30 |
| Exceptional contribution | 20 |
| Innovation & distinction | 15 |
| Lasting impact | 15 |
| Evidence & attribution | 10 |
| Role model & integrity | 10 |

Each rating becomes `(weight × rating) ÷ 5`, so a total is out of **100**.
Judges never see applicant names — only a candidate code from
`src/services/anonymize.js`.

When an application arrives, every **active judge with an email on file** gets a
notice that something is waiting, carrying only the candidate code and a link to
the judging page — never the applicant's name, contact details or category. Each
judge is mailed separately so they don't see one another's addresses, and the
whole thing is fire-and-forget: a mail failure can never fail a submission.
Judges without an email are simply not notified; they still see the candidate
when they sign in.

A candidate's result comes from the average across judges, against two settings
admins edit in the dashboard (`passScore`, default 70; `minJudges`, default 1):
`pending` until enough judges have scored, then `winner` if the average is
**above** the pass mark, otherwise `notWinner`.

## API

Public:

- `POST /submit-application` — the form, `multipart/form-data`, up to 4 attachments
- `GET  /profile-cards`, `GET /profile-cards/photo/:id`
- `POST /admin/login`, `/admin/login/verify`, `/admin/login/resend`

Admin (`Authorization: Bearer <token>`, role `admin`):

- `GET    /admin/stats`
- `GET    /admin/applications` — `type`, `search`, `affiliation`, `from`, `to`, `result`, `sort`, `limit`, `skip`
- `GET    /admin/applications/export.xlsx`
- `GET    /admin/applications/file/:fileId`
- `GET    /admin/applications/:type/:id`
- `GET    /admin/me`
- `POST   /admin/test-email` — sends a test message to `NOTIFY_TO` and returns what the mail server said. The recipient always comes from the environment, never the request, so it can't be used to mail third parties. Use it to tell "SMTP is misconfigured" apart from "the message was sent but never arrived".
- `GET/POST/PATCH/DELETE /admin/users[/:id]`
- `GET/PUT /admin/settings`
- `DELETE /admin/evaluations/:id`, `DELETE /admin/applications/:type/:id/evaluations`
- `GET/POST/PATCH/DELETE /admin/profile-cards[/:id]`

Judge (role `judge`):

- `GET /judge/criteria`
- `GET /judge/applications`, `GET /judge/applications/:ref`
- `GET /judge/applications/:ref/file/:index`
- `PUT /judge/applications/:ref/evaluation`

## Layout

```
src/
  index.js              app wiring, CORS, first-boot admin
  config/   db.js, criteria.js
  middleware/  adminAuth.js (tokens + requireRole), upload.js (multer)
  models/   Application.js, User.js, Evaluation.js, Settings.js, ProfileCard.js
  routes/   applications.js, admin.js, auth.js, judge.js, profileCards.js
  services/ gridfsStorage.js, mailer.js, emailTemplate.js,
            excelExport.js, passwords.js, anonymize.js
scripts/create-user.js
```

## Notes

- Uploads go to **GridFS**, not the filesystem. `uploads/` is a leftover from
  the old disk-based storage and is gitignored.
- `migrate-files.js` is a one-off script for back-filling files submitted before
  GridFS. It matches filenames loosely, so a wrong match can attach one
  applicant's document to another's record — check its output before trusting
  it. Its input folder `migrate-files/` holds real applicants' documents and is
  gitignored.
- **CORS fails closed.** Only the origins in `CORS_ORIGINS` are accepted. The
  convenience that also allows localhost and private LAN addresses — so the
  site works from a phone on the same Wi-Fi — is off unless you explicitly set
  `ALLOW_LAN_ORIGINS=true`, and `NODE_ENV=production` disables it regardless.
  Leave the flag out of any deployed environment. Blocked origins are logged,
  and the startup banner prints which mode is active.
