# Tidewell take-home

A small, working codebase for you to extend. It is a miniature of the two builds in your plan of 9 November, set in a different domain so you can work with realistic data and none of ours.

Budget **six to eight hours**, spread over up to a week. We would rather see a small thing finished and explained than a large thing half-built.

## The setting

Tidewell is a fictional community care network. Three kinds of people use it:

- **Residents** need help with something: getting about, food, money, repairs, company. Many are older, some are young carers, and a good number have no email address.
- **Coordinators** each look after a caseload of residents. They are the people a resident already trusts.
- **Providers** are local organisations. They publish **offers**, and their staff talk to residents.

When a resident and a provider are put in touch, that is a **referral**, with a message thread between the resident, the provider's staff and the resident's coordinator.

Tidewell is already running. Read `docs/ARCHITECTURE.md` and then the code before you design anything. Your plan was written before you had seen a codebase, so we expect it to change. Tell us what changed and why.

## What to build

### Part 1: the stalled-referral nudge

Your "14-day nudge", in this codebase. When a referral has gone quiet, the right person should be prompted to move it forward, and should be able to say in one click what happened: still working together, need met, or no longer needed. That answer should end up on the referral.

### Part 2: new-offer routing, dry run only

Your "new post routing". When an offer is published, work out who it is relevant to and prepare the notes that would go out. **Nothing is sent.** Drafts land in an approval queue that a person could review, each with the reason it was written.

Decide who the system should contact, and how. That decision is the main thing we want to see you reason about.

### Part 3: scale and schedule

`npm run setup:scale` rebuilds the world with 1,000 more residents. Run your work against it and report, with numbers:

- wall-clock time, message-store calls, emails, and model calls for one run of each job
- what breaks first as the numbers grow, and what you did about it
- what time of day, and on which days, each job should run, and why

### Part 4: DESIGN.md

Fill in `DESIGN.md`. Three pages at most. The headings are already there.

## House rules

These are not suggestions. A submission that breaks one is not acceptable however good the rest is.

1. **A resident's personal data does not leave the process.** Names, email addresses, the text of a need, and message bodies do not go to a model, a log line, or an error message.
2. **Consent means what it says.** The flags on a person are their decision, not a default to work around.
3. **Text that a provider or resident typed is untrusted input**, wherever it ends up.
4. **Every email can be explained.** Who it went to, which job sent it, and why, recorded where it can be queried later.
5. **This code is in production.** Extend what is there before adding something beside it. If you change existing behaviour, say so and say who would need to agree.
6. **Tests run offline against the fixed clock.** No network, no real model, no real time.

No real email is ever sent from this repo; `OutboxEmailProvider` writes files to `./outbox`.

## What we look at

- Whether you read the existing system before changing it.
- Where you drew the line around personal data, and whether the code holds that line.
- The cases you thought of without being told about them.
- Whether your tests would catch the mistakes that matter.
- How it behaves at 1,000 residents, and how you know.
- Whether DESIGN.md says plainly what you chose not to build.

## Using a model, and using AI tools

You may use a language model in your design, or none. Either can be the right answer; say why. If you use one, implement `LlmProvider` in `src/providers/llm.ts` for the provider you would choose, keep tests on a fake, and put a few real request and response pairs in `evidence/` so we can see what it does.

Use whatever AI coding tools you normally use. Say which and how in DESIGN.md. In the walkthrough we will ask you to explain and change parts of the code live, so make sure you understand every line you submit.

## Questions

Ask them. On a real team you would, and a good question counts in your favour. Send them to Erdem at erdem@stumbl.io; answers that matter to everyone go in this README.

## Handing it in

1. Work on a branch and open a pull request against `main`. Write the description as you would for a colleague.
2. Include `DESIGN.md`, your tests, and an `evidence/` folder with the output of one dry run at each scale.
3. We then book a 30-minute walkthrough.

## Setup

Node 20 or later.

```bash
cp .env.example .env
npm install
npm run setup            # database + message store, 28 residents
npm test
npm run job:reminders    # the job that already exists
npm run coordinator -- coord_eastfield
npm run setup:scale      # the same world plus 1,000 residents
```

`npm run setup` rebuilds everything from nothing each time, so you can always get back to a known state. Time is fixed by `TIDEWELL_NOW` in `.env`; the data only makes sense against that date.
