# Preview publication blockers (not on the public site)

Internal checklist for PR review. Do not link from the marketing site.

## Phone (hidden from UI)

| Field | Value |
|-------|--------|
| Number | `+1 307 429 0181` (`CONTACT.phone` / `CONTACT.phoneHref`) |
| Public source | [skytz-consulting.com](https://skytz-consulting.com/en) contact block |
| Site flag | `CONTACT.showPhoneInUI: false` — no tel links in footer, HumanContact, imprint, or JSON-LD |
| Blocker | Call routing / monitoring on Diamond not verified in this preview |

## Email

| Address | Role | Blocker |
|---------|------|---------|
| `hello@diamond-recruiters.com` | Employer general (`CONTACT.general`) | Inbox monitoring / routing not verified |
| `apply@diamond-recruiters.com` | Applications (`CONTACT.applications`) | Form delivery assumed via server config; not live-tested here |

## Booking

| Field | Value |
|-------|--------|
| URL | `BOOKING.url` in `src/consts.ts` (`https://calendar.app.google/5xbLcjnJdEKsHMqy9`) |
| Blocker | Philipp to confirm this calendar is the intended public employer scheduler |

## Deploy

Merging to `main` runs FTPS deploy (`.github/workflows/deploy.yml`). Hold until blockers clear.
