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
| `npm run validate:schema` | **Validates JobPosting JSON-LD against Google's rules** |
| `npm run check:placeholders` | **Lists every fake value still in the build** |
| `npm run notify:google` | Push new/closed roles to the Google Indexing API |
| `npm run prelaunch` | Build, validate schema, then check placeholders |
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
`sales-engineer-motion-control.md` → `/jobs/sales-engineer-motion-control`.

Copy an existing role as a template. The frontmatter is schema-validated, so a typo or a
missing field fails the build rather than shipping broken. Every new role automatically gets:

- a card on the homepage (if `featured: true`) and the roles listing
- a detail page with an application form and a mobile apply bar
- an entry in `sitemap-index.xml`, stamped with `lastmod`
- **schema.org JobPosting structured data**, making it eligible for the Google Jobs box
- a push to the Google Indexing API on the next deploy

Set `draft: true` to keep a role out of the build entirely.

### The posting lifecycle

`validThrough` is **derived, not written by hand**: it is `datePosted + 45 days`
(`VALID_DAYS` in `src/lib/jobStatus.ts`). Google wants a 30–45 day window and treats stale
postings as a quality signal against the **whole domain**, not just the one listing.

| You want to… | Do this |
|---|---|
| Re-post / extend a role | Bump `datePosted`. `validThrough` follows automatically. |
| Close a role now | Set `status: filled` or `status: closed` |
| Pin a hard end date | Set `validThrough` explicitly (overrides the 45-day default) |
| Hide it completely | Set `draft: true` |

When a role expires or is closed, the next build automatically:

- **strips the JobPosting schema** from the page
- adds `noindex, follow`
- removes it from the roles listing, the homepage and the sitemap
- keeps the URL alive with a "this search has closed" notice, so inbound links and
  anything already shared do not 404
- sends `URL_DELETED` to the Indexing API so Google drops it promptly

**This is why the deploy workflow runs on a daily cron.** `validThrough` is evaluated at
build time, so a rebuild is what actually retires a posting. Without the scheduled run, a
closed role would keep serving live schema until someone happened to push a commit.

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

Still outstanding:

- [ ] Person responsible for site content (`LEGAL.responsibleParty`) — **the last placeholder
      in the build**
- [ ] LinkedIn URL, if one is ever created — set `CONTACT.social.linkedin` and the footer link
      appears on its own. Empty is fine; the footer hides it.
- [ ] Have an attorney review `/privacy` and `/imprint`

Done:

- [x] Legal entity — Talent Scope Group LLC, a Wyoming LLC (`LEGAL`)
- [x] Registered address, Sheridan WY (`CONTACT.address`)
- [x] Phone number (`CONTACT.phone` / `CONTACT.phoneHref`)
- [x] The invented stats band is gone. It was replaced with `PROOF` — four commitments a
      client can hold the firm to, rather than placement counts and retention percentages a
      new firm cannot evidence. See the comment on `PROOF` in `src/consts.ts` before
      reintroducing numbers.

### 2. Set up mail on all-inkl

1. In KAS, confirm the mailbox **apply@diamond-recruiters.com** exists.
2. **hello@diamond-recruiters.com** needs no mailbox — a catch-all on the domain forwards
   everything to `ph@skytz-consulting.com`. Keep that catch-all in place, or `hello@`, the
   address printed on the contact, imprint, privacy and 404 pages, starts bouncing.
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

---

## Google for Jobs

The site is built to be eligible for the Google Jobs box. Eligibility is not the same as
ranking: valid markup gets you into the auction, domain authority decides where you land.
On a new domain expect weeks to index and months before meaningful traffic. The niche helps
— nobody is fighting hard for *"control valve sales engineer Houston"*.

### What is already done

- One dedicated, static, crawlable URL per role at `/jobs/<slug>` — no JS-rendered content
- Self-referencing canonical on every page
- Full JobPosting JSON-LD: `title`, `description` (as HTML), `datePosted`, `validThrough`,
  `hiringOrganization`, `jobLocation`, plus `baseSalary`, `employmentType`, `identifier`,
  `directApply` and `url`
- `jobLocationType: TELECOMMUTE` is emitted **only** for roles flagged `remote: true`, and
  never alongside `jobLocation` — combining them is a documented error. Set `remote: true`
  in frontmatter and the schema switches form automatically.
- `applicantLocationRequirements` appears only on remote roles, where it is meaningful
- Automatic expiry, enforced daily by the scheduled build (see "The posting lifecycle")
- `npm run validate:schema` blocks the deploy on any malformed posting

### Setup you still need to do

**1. Search Console — do this before the first role goes live.**

Add `diamond-recruiters.com` as a **Domain property** (not a URL-prefix property) and verify
by DNS TXT record in the all-inkl KAS DNS editor. Domain properties cover every subdomain
and both protocols, which saves pain later.

If you prefer HTML-file verification, drop the `google*.html` file Google gives you into
`public/` — anything in there is copied to the web root on deploy.

Then submit `https://diamond-recruiters.com/sitemap-index.xml` once. There is nothing to
re-submit afterwards: **Google retired the sitemap ping endpoint in 2023.** Search Console
re-reads a submitted sitemap on its own schedule, and the Indexing API below is the way to
request fast crawling.

**2. Indexing API — optional but high value.**

`JobPosting` is one of only two schema types the Indexing API accepts. It takes a new role
from published to crawled in minutes instead of days, and tells Google to drop a closed role
promptly.

1. Google Cloud console → new project → enable **Indexing API**
2. Create a service account and generate a JSON key
3. Search Console → your property → **Settings → Users and permissions** → add the service
   account's `client_email` as an **Owner**. Skipping this gives 403 on every call.
4. Add the entire JSON key as the `GOOGLE_SERVICE_ACCOUNT_JSON` repository secret

Test it without sending anything:

```bash
npm run notify:google -- --dry-run
```

Once the secret is set the deploy workflow calls it automatically, and only for roles whose
posting date or status actually changed — unchanged roles do not burn the 200/day quota.

**3. Validate on the live URLs.**

`npm run validate:schema` checks everything Google's own test would, but it cannot see your
live site. After the first deploy, run both role URLs through the
[Rich Results Test](https://search.google.com/test/rich-results) once. Re-run it whenever
`src/lib/jobSchema.ts` changes.

### Where the traffic actually comes from

Worth knowing: **LinkedIn does not syndicate to Google for Jobs**, and **Indeed withdrew in
2019**. The advice that you get Google for Jobs "for free" by posting to LinkedIn is wrong.
Boards that do feed it include ZipRecruiter, Glassdoor, Monster and most ATS platforms. Your
own site emitting valid schema is the most direct route you have, which is exactly what this
build gives you.

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
