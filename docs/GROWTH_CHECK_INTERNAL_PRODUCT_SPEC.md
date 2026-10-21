## Purpose

Build an internal Renvani tool that turns a home service business name or website into an evidence-backed growth diagnosis. The public entry experience stays simple. The internal tool performs the deeper research, organizes findings, and prepares a clear owner-facing report and next-step recommendation.

This supports Renvani’s identity: a growth company for home services helping businesses attract customers through their own channels, convert inquiries into booked jobs, deliver great service, and earn repeat revenue. AI agents power the product; they are not the company identity.

## What the reference experience demonstrates

The supplied Owner Grader screenshots show a flow with these visible stages:

1. A business-name entry point.
2. A scan-in-progress experience that communicates work is happening.
3. A personalized result with an overall grade and category-level findings.
4. Evidence drawn from public business presence, including local listing, reviews, photos, website, mobile experience, and competitive context.
5. A deeper report or follow-up step associated with contact verification.

Renvani should take the useful product principle—make the result specific to the business and useful before asking for a sale—and adapt the research to home services. Do not reproduce Owner’s wording, visual design, category names, score system, competitor callouts, or gated-report mechanics.

## Product definition

**Renvani Growth Check** is an internal prospect research and report-generation workspace. It helps Renvani’s team assess how easily a customer can find a home service business, request service, become a booked job, receive service, and return.

The tool produces two related outputs:

- **Internal diagnostic:** evidence, source links, confidence, unknowns, hypotheses, and detailed opportunities for Renvani’s team.
- **Owner-facing report:** a short plain-language summary with the most useful findings and practical next steps. It must not expose internal-only notes or imply unverified performance results.

## Primary user and job

**Primary user:** Renvani founder, growth team, or authorized operator preparing a business-specific conversation.

**Job to be done:** “Help me quickly understand where this business’s customer and service journey is working or getting stuck, show me the evidence, and prepare a useful next step without guessing about private operations.”

## Core workflow

1. **Start a check.** Enter business name, website, city/service area, and trade. Residential cleaning is the first vertical; keep the model extensible to other home-service trades.
2. **Resolve the business.** Find likely website and public business listings. If multiple businesses match, show candidates and require a human to select the correct one. Record match confidence and the evidence used.
3. **Run the scan.** Show clear progress by research area. Each check returns a finding, evidence source and observation date, confidence, and status: observed, owner-validated, hypothesis, or unknown.
4. **Review and correct.** Internal user can dismiss a false match, edit a finding, mark a check not applicable, add a note, or request owner validation. Preserve the original machine-generated observation in the audit history.
5. **Generate the report.** Rank opportunities by likely customer impact, evidence strength, and practical actionability. Human review is required before sharing externally.
6. **Share or use internally.** Export or copy a concise report for a conversation. Contact capture and any follow-up are separate, consent-based actions; the diagnostic itself should provide value without forcing a phone gate.
7. **Learn from validation.** Record which findings the business confirms, rejects, or cannot answer. Use this to improve the rubric, not to silently treat unverified hypotheses as facts.

## Home-service diagnostic areas

### 1. Can customers find the business?

Review public discovery and trust signals: website presence, branded domain, local listing presence and completeness where accessible, service categories, stated service area, reviews and recency, and consistency of business identity across sources.

### 2. Can customers understand and request service?

Review mobile usability and the branded customer path: services offered, service-area clarity, contact options, click-to-call, estimate or booking request path, form friction, and what the customer is told after submitting. Only report what can be observed. A form’s visible design does not prove whether the business responds.

### 3. Can an inquiry become a booked job?

Public evidence can describe the visible inquiry, estimate, and booking steps. Do not infer response speed, quote conversion, missed leads, availability, or booking completion from public pages. Mark these as unknown until the operator validates them or provides consented data.

### 4. Can the business deliver the work reliably?

Assess only visible service promises and public process signals. Capacity, dispatch quality, crew utilization, job completion, service recovery, and operational bottlenecks require operator validation or authorized business data. These checks connect the Growth Check to Renvani’s full FSM scope, including customer/property records, scheduling, dispatch, jobs, field workflows, estimates, payments, service agreements, and customer communications.

### 5. Is it easy to earn the next job?

Review visible recurring-service offers, rebooking prompts, maintenance plans, review requests, referrals, and follow-up calls to action. Do not claim repeat rate, churn, or retention performance without private data and permission.

## Finding format and evidence model

Every finding stores:

- Diagnostic area and check identifier
- Business and selected public identity
- Plain-language observation
- Evidence URL or source record
- Observation date and, where useful, screenshot/capture reference
- Status: observed, owner-validated, hypothesis, unknown, or not applicable
- Confidence and reason for confidence
- Customer consequence, written as a possibility unless directly verified
- Recommended next step
- Internal note, owner-facing wording, and sharing status kept separately

Every outward-facing factual claim must be traceable to evidence. Clearly label estimates and hypotheses. Avoid numeric grades or revenue-lift estimates in the first version; use a small number of grounded findings instead.

## Owner-facing report

Keep it simple for busy owners and operators:

- Business identity and service area checked
- A short summary of what appears to be working
- One to three evidence-backed opportunities, ordered by practical importance
- A concrete next step for each opportunity
- Clear labels for what Renvani observed versus what needs the owner’s confirmation
- An invitation to review the findings or get help improving the customer path

Use plain language. Avoid jargon, dense dashboards, abstract scores, unsupported competitor rankings, and promises of revenue lift.

## Internal workspace screens

1. **Check queue:** businesses researched, owner, status, last scan, review-needed flag.
2. **New check:** business name, website, trade, city/service area, and optional context.
3. **Match review:** candidate businesses and confidence with human selection.
4. **Scan workspace:** progress by diagnostic area, evidence, findings, confidence, and unknowns.
5. **Report editor:** approved owner-facing summary, next steps, and preview.
6. **History:** prior scans, changes, owner validation, and report-sharing record.

## MVP boundary

**MVP includes:** manual business intake; public website and listing research with source capture; a residential-cleaning rubric; scan progress; internal findings workspace; evidence/confidence/status fields; human correction and approval; concise report preview/export; audit history.

**Later:** broader trade templates; scheduled rescans and change detection; consented CRM/booking/estimate imports; private funnel and repeat-service analysis; integrations with FSM systems; report personalization and automated action proposals.

**Out of scope for MVP:** autonomous outreach; scraping private or restricted sources; importing marketplace contacts without rights and consent; public performance claims; automatic customer-facing edits or messages; forced migration from an existing FSM; treating public information as proof of internal conversion or service performance.

## Trust, safety, and data rules

- Public-source findings and private business data must be clearly separated.
- Obtain explicit operator permission before accessing private lead, estimate, booking, customer, or financial data.
- Store only the minimum data needed; redact personal data from project notes and exports.
- Keep human review before an external report is shared.
- Never invent response times, conversion rates, revenue opportunities, availability, or customer outcomes.
- Preserve source links, scan time, and changes so a reviewer can reproduce a finding.
- Respect source terms and applicable privacy, messaging, and data-retention requirements.

## Success measures

- Time to produce a reviewed diagnostic
- Share of findings with usable evidence and correct business match
- Owner validation rate: confirmed, corrected, and unknown findings
- Report usefulness from owner feedback
- Qualified follow-up conversations and pilot interest, measured without claiming causation
- Internal correction rate and unsupported-claim rate
- For consented pilots only: direct inquiries, qualified-to-estimate, estimate-to-confirmed-job, repeat jobs, owner time, and opt-outs under the agreed attribution rules

## Acceptance criteria

- A user can create a check for a residential cleaning business and confirm the correct public identity before scan results are attributed.
- Each surfaced finding has a source, observation date, status, confidence, and proposed next step.
- The system distinguishes observation, owner validation, hypothesis, and unknown in both storage and report presentation.
- A public scan never states that a business misses leads, responds slowly, has weak conversion, or loses revenue unless that claim is supported by authorized evidence.
- A human can edit, reject, or mark a finding unknown, and the audit history retains the prior version.
- The owner-facing report is concise, readable without industry jargon, and reviewed before sharing.
- No customer contact, autonomous outreach, public deployment, or private-data connection occurs as a side effect of running a check.

## Relationship to Renvani products

Growth Check is an internal product and acquisition/research workflow. It previews the connected Renvani portfolio:

- **Growth:** local discovery and owned branded customer paths.
- **Revenue:** inquiry handling, qualification, estimates, follow-up, and booking conversion.
- **Operations:** scheduling, dispatch, jobs, crew workflows, and service delivery.
- **Retention:** recurring work, rebooking, reviews, referrals, and win-back.
- **Command Center:** oversight, evidence, approvals, and exceptions.

The diagnostic should reveal opportunities across the full product scope. The growth wedge sets the entry point and sequence; it does not exclude the full FSM suite.

## Design direction

Design the internal workspace for fast, careful research by a small Renvani team. Make evidence and uncertainty easy to see. Keep the eventual owner-facing experience simple and calm. Use the supplied screenshots as workflow reference only; create a distinct Renvani information architecture, wording, visual language, and report presentation.


## Detailed reference capture — Owner Grader report screenshot

The latest supplied screenshot shows the report state behind the scan, with the full report partly obscured by a phone-verification overlay. Visible report details:

- An overall **77/100** online-health grade labeled **Fair**.
- Three category summaries: **Search Results, 33/40 (Good)**; **Guest Experience, 26/40 (Fair)**; **Local Listings, 18/20 (Good)**.
- A dollarized headline: **“You could be losing ~$1,687/month due to 8 problems.”**
- A competitor-ranking panel claiming the business is first among competitors.
- Search-query rows with Google results, ranking/competitor labels, and organic/map-result status.
- A centered **“Unlock your free report”** phone-verification overlay with phone-number input, send-code action, CAPTCHA/verification language, and Terms of Service/Privacy Policy consent text.

### Renvani product implications

1. **Internal report should be richer than the public preview.** The internal workspace needs category-level findings, query/source evidence, diagnostic severity, and a reviewable opportunity list. The owner-facing report can still open with one or two useful findings in plain language.
2. **Keep scoring as an internal option, not the first public promise.** The screenshot demonstrates a simple aggregate grade plus category scores. Renvani may use an internal rubric to prioritize research, but any score must have a defined denominator, explainable checks, and evidence coverage. Do not display a numeric score until it is validated for cleaning businesses and understandable to operators.
3. **Do not copy unsupported financial-loss claims.** The “losing $X/month” headline is not suitable for Renvani unless a transparent, validated calculation uses the business’s authorized data and clearly stated assumptions. Public-only observations cannot substantiate lost revenue.
4. **Competitor comparisons are optional and sensitive.** The screenshot uses ranking against named competitors. Renvani should not make competitor rank or “who is beating you” a default hook. If a future research view includes local search comparisons, keep query, location, date, source, and limitations visible; require internal review and avoid implying causal or revenue conclusions.
5. **Separate public scan from private validation.** The visible phone gate is a conversion mechanic in the reference. Renvani should not require phone verification before giving the promised useful preview. If contact details are collected for follow-up, explain the purpose and obtain consent. The internal report should label which findings need owner data.
6. **Report structure should be evidence-first.** Each issue should expand to show what was checked, the source, the observation date, why it matters to a home-service customer, confidence/status, and a practical next step. Keep actionable issues distinct from category rollups.

### Proposed report anatomy for Renvani

- **Top summary:** business name, trade, service area, scan date, and a short plain-language readout.
- **Journey sections:** Find the business; understand/request service; turn the inquiry into a booked job; deliver the work; earn the next job.
- **Finding cards:** one observation per card, with evidence, status/confidence, customer impact stated carefully, and next action.
- **Opportunity summary:** a small number of highest-priority actions, ordered by evidence strength and practical impact.
- **Unknowns to validate:** internal operational questions that public research cannot answer, such as response speed, estimate conversion, capacity, repeat rate, and owner time.
- **Optional category summary:** only after the rubric is tested; show what is included and do not convert the score into projected revenue loss.

The screenshot therefore sharpens the target from a simple scan summary into a complete **internal grader and report-authoring product**, while preserving a deliberately simple public entry and a distinct Renvani report experience.
