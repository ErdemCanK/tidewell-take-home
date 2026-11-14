# Design

Three pages at most. Replace each prompt with your answer. Short and specific beats long.

## 1. What changed from the plan of 9 November

What you proposed, what you found when you read this codebase, and what you built instead.

## 2. Who gets contacted, and why

For each job: who the system contacts, through what, and who it deliberately does not contact.

## 3. Data boundary

One table per job. For every step: which fields are read, and which of them leave the process (to a model, to email, to a log).

## 4. Existing behaviour

What you extended, what you changed, what you left alone. For anything you changed: who would need to agree before it shipped.

## 5. The model

Whether you used one and for which step. Which provider and model you would choose and why. What each call costs and how long it takes. What you would check before changing the model version.

## 6. Failure modes

What can go wrong, and what in the code stops it or catches it. Include at least: wrong or invented content in a note, hostile text in an offer, a job that stops halfway, a job that runs twice.

## 7. Evaluation

How you would know each job is doing good. The metric, today's value where you can measure it from this data, the target, and how you would tell the job's effect apart from what would have happened anyway. How long before the numbers mean anything at this volume.

## 8. Scale and schedule

Measurements at 28 and at 1,028 residents. What broke first. When each job should run and why.

## 9. Not built

What you left out, and what you would do next with another week.

## 10. Tools

Which AI coding tools you used and how you checked what they produced.
