# Tidewell take-home

A small, working codebase for you to extend with two automations. It is a miniature of the kind of work we do, set in a different domain so you can work with realistic data and none of ours.

Budget **six to eight hours**, spread over up to a week. We would rather see a small thing finished and explained than a large thing half-built.

## The setting

Tidewell is a fictional community care network. Three kinds of people use it:

- **Residents** need help with something: getting about, food, money, repairs, company. Many are older, some are young carers, and a good number have no email address.
- **Coordinators** each look after a caseload of residents. They are the people a resident already trusts.
- **Providers** are local organisations. They publish **offers**, and their staff talk to residents.

When a resident and a provider are put in touch, that is a **referral**, with a message thread between the resident, the provider's staff and the resident's coordinator.

Tidewell is already running.

## Getting your copy

Click **Use this template** on GitHub, create a **private** repository under your own account, and invite `ErdemCanK` as a collaborator. Do all your work there.

## What to build

### Part 0: a one-page plan, before any code

Read this README and `docs/ARCHITECTURE.md`, then write `PLAN.md`: one page on how you intend to build Parts 1 and 2. Who gets contacted, what triggers each job, what data each step touches, whether a model is involved, and what you are unsure about.

Commit `PLAN.md` on its own **before you write any code**, and do not edit it afterwards. If you have already sent us a plan, commit that document unchanged instead.

We expect the plan to be wrong in places. Reading the code will change your mind, and DESIGN.md asks you what changed and why. A plan that survives untouched is not the goal.

### Part 1: the stalled-referral nudge

When a referral has gone quiet, the right person should be prompted to move it forward, and should be able to say in one click what happened: still working together, need met, or no longer needed. That answer should end up on the referral.

### Part 2: new-offer routing, dry run only

When an offer is published, work out who it is relevant to and prepare the notes that would go out. **Nothing is sent.** Drafts land in an approval queue that a person could review, each with the reason it was written.

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

Use whatever AI coding tools you normally use. In the walkthrough we will ask you to explain and change parts of the code live, so make sure you understand every line you submit.

We ask you to show that use, because directing these tools well is part of the job:

- **`ai-log/`**: every prompt you gave an AI tool for this exercise, in order. Exported session transcripts are best; a file of the prompts copied verbatim is fine. Do not tidy them up. Remove any secrets first.
- **`AI_USAGE.md`**: fill in the table that is already there: per tool, the model, the number of prompts, input and output tokens, and the cost. Say where each number comes from (the tool's usage report, the provider's dashboard, or your own estimate). If a tool does not report tokens, say so and estimate.

A low number does not score higher than a high one. We look at what you asked for, what you checked, and what you threw away. If you used no AI tools, say that in `AI_USAGE.md` and leave `ai-log/` out.

## Questions

Ask them. On a real team you would, and a good question counts in your favour. Send them to Erdem at erdem@stumbl.io; answers that matter to everyone go in this README.

## Handing it in

1. In your own repository, work on a branch and open a pull request against `main`. Write the description as you would for a colleague.
2. Include `PLAN.md`, `DESIGN.md`, `AI_USAGE.md`, `ai-log/`, your tests, and an `evidence/` folder with the output of one dry run at each scale.
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
