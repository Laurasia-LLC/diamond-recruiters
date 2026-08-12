# diamond-recruiters.com

Marketing and job-board site for Diamond Recruiters, a technical sales search firm working in
US industrial automation, process instrumentation and flow control.

Static site, no database, no CMS. Roles are markdown files. Forms are handled by two small PHP
endpoints on the same host.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Astro 7](https://astro.build) | Ships almost no JavaScript. A content site loads instantly and ranks. |
| Styling | Tailwind CSS 4 | Design tokens live in `src/styles/global.css` under `@theme`. |
| Content | Astro Content Collections | One markdown file per role, schema-validated at build time. |
| Images | Astro `<Image>` + sharp | Auto AVIF/WebP at multiple widths. A 750 kB hero ships as 79 kB. |
| Fonts | Fontsource, self-hosted | No Google Fonts request, so no consent banner needed for fonts. |
| Forms | PHP on all-inkl | Uses the domain's own mailbox — best deliverability, no third-party service. |
| Hosting | all-inkl webspace | Static files over FTPS from GitHub Actions. |

---

## Running it locally

```bash
npm install
npm run dev          # http://localhost:4321
```

| Script | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run check` | TypeScript + Astro diagnostics |
| `npm run check:placeholders` | **Lists every fake value still in the build** |
| `npm run prelaunch` | Build, then run the placeholder check |
| `npm run assets` | Regenerate favicon, OG card and app icons |

The PHP forms do not run under `npm run dev` — Astro's dev server does not execute PHP. To
test them locally you need PHP:

```bash
npm run build
php -S localhost:8000 -t dist
```

---

## Editing content

### Company details — `src/consts.ts`

**This is the only file you need to edit to take the site live.** Contact addresses, phone,
postal address, legal entity, the stats block and the sector list all live there. Every fake
value is marked `PLACEHOLDER` or written as obviously-unreal digits (`000+`, `XX`).

### Adding a role

Create a markdown file in `src/content/jobs/`. The filename becomes the URL:
`sales-engineer-motion-control.md` → `/open-roles/sales-engineer-motion-control`.

Copy an existing role as a template. The frontmatter is schema-validated, so a typo or a
missing field fails the build rather than shipping broken. Every new role automatically gets:

- a card on the homepage (if `featured: true`) and the roles listing
- a detail page with an application form
- an entry in `sitemap-index.xml`
- **schema.org JobPosting structured data**, making it eligible for the Google Jobs box

Set `draft: true` to keep a role out of the build entirely.

### Closing a role

Either delete the file, or set `draft: true`. Note that `validThrough` in the frontmatter is
what tells Google when to stop showing the posting — roles are currently set to expire
**10 November 2026**. Extend that date if a search is still running.

### Changing images

Drop a file into `src/assets/`, update the import. Record the source in `CREDITS.md`.

---

## Going live — checklist

### 1. Fill in the real company data

Edit `src/consts.ts`, then:

```bash
npm run prelaunch
```

It must print **"No placeholders found"**. Until then the site contains invented figures.

Still outstanding at handover:

- [ ] Legal entity name, type, state of incorporation (`LEGAL`)
- [ ] Person responsible for site content (`LEGAL.responsibleParty`)
- [ ] Business postal address (`CONTACT.address`)
- [ ] Phone number (`CONTACT.phone` **and** `CONTACT.phoneHref`)
- [ ] Real figures for the four stats, or delete the `STATS` array to remove the block
- [ ] LinkedIn URL, or leave it — the footer hides the link while it says `PLACEHOLDER`
- [ ] Have an attorney review `/privacy` and `/imprint`

### 2. Set up mail on all-inkl

1. In KAS, confirm the mailbox **apply@diamond-recruiters.com** exists.
2. Create **hello@diamond-recruiters.com** (used as the general contact address), or change
   `CONTACT.general` in `src/consts.ts` to point at `apply@` instead.
3. Optional but recommended: copy `public/api/config.sample.php` to `api/config.php`
   **on the server** and fill in SMTP credentials. Without it the endpoints use PHP `mail()`,
   which works on all-inkl but is less reliable under load.

`api/config.php` is gitignored and excluded from the deploy sync, so your mail password never
reaches GitHub and is never overwritten by a deployment.

### 3. Deploy

Push to `main`. GitHub Actions builds and uploads `dist/` over FTPS.

Required repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | Value | Where to find it |
|---|---|---|
| `FTP_SERVER` | e.g. `w01abcde.kasserver.com` | KAS → FTP accounts |
| `FTP_USERNAME` | FTP user | KAS → FTP accounts |
| `FTP_PASSWORD` | FTP password | KAS → FTP accounts |
| `FTP_REMOTE_DIR` | e.g. `/diamond-recruiters.com/` | The domain's document root in KAS |

`FTP_REMOTE_DIR` must end with a slash. Point it at the **document root of the domain**, not
the FTP account root — getting this wrong publishes the site into a subfolder.

### 4. After the first deploy

- [ ] Visit the site over `https://` and confirm the certificate is valid (KAS → SSL)
- [ ] Submit a test application and confirm it arrives with the resume attached
- [ ] Submit an employer brief and confirm it arrives
- [ ] Check `https://diamond-recruiters.com/robots.txt` and `/sitemap-index.xml` resolve
- [ ] Run both role pages through the [Rich Results Test](https://search.google.com/test/rich-results) — they should report a valid **JobPosting**
- [ ] Submit the sitemap in Google Search Console

---

## How the forms work

```
Browser  ──POST multipart──▶  /api/apply.php  ──▶  _mailer.php  ──▶  apply@diamond-recruiters.com
                                                                      (resume attached)
```

Both endpoints (`apply.php` for candidates, `contact.php` for employers and general enquiries)
share `_mailer.php`. They:

- validate every field server-side, not just in the browser
- verify the upload's real MIME type with `finfo`, not the filename
- cap uploads at 8 MB and accept only PDF/DOC/DOCX/RTF/ODT
- strip CR/LF from user input so mail headers cannot be injected
- **never write the uploaded file into the web root** — it goes straight into the email
- rate-limit to 5 submissions per IP per hour
- use two spam traps: a hidden honeypot field, and a minimum fill time

The forms work without JavaScript (native POST, then a redirect to `/thank-you`). With
JavaScript they submit via `fetch` and show inline success and error states.

---

## Moving off all-inkl

The site itself is portable — it is a plain static build. Deploying `dist/` to Vercel,
Netlify, Cloudflare Pages or any other host needs no code changes at all.

**The only host-specific piece is the two PHP endpoints.** They are deliberately isolated
behind environment variables so nothing else has to change:

```
PUBLIC_APPLY_ENDPOINT=/api/apply.php
PUBLIC_CONTACT_ENDPOINT=/api/contact.php
```

To move the forms to a serverless function:

1. Write the new endpoint (e.g. a Vercel function using [Resend](https://resend.com) to send
   mail). It receives the same `multipart/form-data` field names — see `apply.php` for the
   list.
2. Point the two environment variables at the new URLs.
3. Delete `public/api/`.

No component imports the endpoint path directly, so that is the whole migration. Budget an
afternoon.

**The genuinely sticky part is email, not the website.** `apply@diamond-recruiters.com` is an
all-inkl mailbox. Leaving all-inkl entirely means new email hosting, migrating the mailbox and
cutting MX records without dropping applicant mail mid-flight. Plan that separately.

---

## Project layout

```
src/
  assets/            source images (optimised at build time)
  components/        Astro components
  content/jobs/      ← one markdown file per open role
  layouts/
  lib/               formatting helpers, JobPosting schema builder
  pages/             file-based routing
  styles/global.css  ← design tokens live here
  consts.ts          ← ALL company data lives here
public/
  api/               PHP form endpoints (config.php lives on the server only)
  .htaccess          HTTPS, canonical host, caching, security headers
scripts/             asset generation, placeholder audit
```

---

## Notes

- **Salary transparency.** Role pages state a base and OTE range and label it as Diamond's
  read on comparable roles, not the client's confirmed band. Keep that framing — it is both
  the firm's differentiator and the honest position, and several US states now require pay
  ranges on job postings.
- **No analytics are installed.** If you add any, the privacy policy's cookie section and the
  Content-Security-Policy in `public/.htaccess` both need updating.
- **The CSP is strict** and allows no external scripts, fonts, images or frames. Anything you
  embed later (a video, a tracking pixel, a chat widget) must be allowed there explicitly or
  it will be silently blocked.
