# Tidewell architecture

## Layout

```
prisma/schema.prisma     the database
prisma/seed.ts           builds the database and the message store
src/lib/                 clock, encryption, database client
src/providers/           everything outside our process: message store, email, model
src/services/            rules: who may see what, how offers are matched to needs
src/jobs/                scheduled work
src/controllers/         entry points: the scheduler, a coordinator's screen
tests/
```

Controllers are thin. They name who is asking, call a service or a job, and print the result. Rules live in services; anything that crosses the process boundary goes through a provider.

## Two stores

| What | Where | How you reach it |
|---|---|---|
| People, needs, offers, referrals, reminder history, admin flags | SQLite, through Prisma | `src/lib/db.ts` |
| Chat messages | A separate message store | `src/providers/message-store.ts` |

Chat messages live in the message store and nowhere else. Each call to it is a network round trip; `TIDEWELL_STORE_LATENCY_MS` sets how long that takes.

## People and access

Everyone is a `Person` with a `role`: `RESIDENT`, `COORDINATOR`, `PROVIDER_STAFF` or `ADMIN`.

- A resident belongs to one coordinator's caseload (`coordinatorId`).
- A coordinator sees their own caseload and nobody else's. `src/services/access.ts` enforces that; controllers call it first.
- Names and emails are encrypted at rest. `open()` in `src/lib/crypto.ts` decrypts; `emailHash()` finds a person by email without decrypting.
- A resident may have no email at all.

Three flags on a person are theirs to set:

| Flag | Default | Meaning |
|---|---|---|
| `aiMatchingConsent` | off | "You may use automated matching to suggest services for me." |
| `thirdPartyProcessingConsent` | off | "You may send my information to another company to process." |
| `emailNotificationsEnabled` | on | "Email me about my referrals." |

## How sensitive each field is

| Field | Sensitivity |
|---|---|
| `Need.note`, message bodies | Highest. A resident's own words about their health, money or family. |
| Names, emails | Personal. Encrypted at rest. |
| `Need.category`, `Person.area`, `Person.birthYear` | Personal once attached to an identifiable person. |
| `Offer.title`, `Offer.body`, provider names | Public once the offer is `PUBLISHED`. Written by providers, not by us. |

## What already runs

**Silent referral reminders** (`src/jobs/silent-referral-reminders.ts`), once a day. The operations team's rule:

> After 5 days with no message, remind the people who have not replied. Again after 10. At 14 days, stop emailing and flag it for the admin team.

`ReminderLog` and `AdminFlag` record what it has done. A silent period is identified by when it started, so a thread that goes quiet again is treated as a new period. It has only ever run against a few dozen referrals.

**Offer suggestions** (`src/services/matching.ts`), shown to coordinators for their own caseload: category and area, no model, no free text.

## Offers

A provider writes the title and body and picks the categories and area. Offers start `PENDING`, and a moderator moves them to `PUBLISHED` or `REJECTED`. Anything about who the offer is for, beyond category and area, exists only in the body text.

## Time

All code reads the time from `now()` in `src/lib/clock.ts`. With `TIDEWELL_NOW` set, time is fixed; the seed data is laid out as if the reminders job had run every morning up to the day before.

Coordinators have `workingHours` (Europe/London). Nothing uses it yet.
