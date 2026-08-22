হ্যাঁ—**একবারে giant prompt দেওয়ার চেয়ে phase-gated prompt system-ই তোমার ক্ষেত্রে বেশি নিরাপদ।** Antigravity-কে architecture lock করে প্রথমে inspect/plan করতে হবে, তারপর একেক phase implement, test, audit, তারপর পরের phase। এতে hallucinated architecture, unnecessary dependencies, accidental rewrites—এসব অনেক কমবে।

একটা গুরুত্বপূর্ণ security correctionও করছি: Antigravity যেন `.env` বানায়, কিন্তু **বাস্তব secrets repository-তে না লেখে, `.gitignore`-এ রাখে, `.env.example` বানায়, আর deployed Cloud Run services-এ Secret Manager ব্যবহার করে।** Local development-এর জন্য `.env.local`/`.env` থাকবে; production secrets environment-injected from Secret Manager. Google-এর Cloud Run/Pub/Sub/Scheduler docs এই ধরনের IAM/OIDC-based service setup support করে। ([Google Cloud Documentation][1])

আর আমি **Gemini API/Genkit integration-কে Vertex AI বা Gemini Developer API-এর মধ্যে একটিতে explicitly choose করতে Antigravity-কে বলব না যতক্ষণ environment verify না করে**। Gemini 3.5 Flash বর্তমানে stable, multimodal, function calling, structured output, caching এবং search grounding support করে; Genkit TypeScript full-stack agentic workflows-এর জন্য appropriate। ([Google AI for Developers][2])

## কীভাবে Antigravity-কে চালাবে

**Phase 0 → Architecture/Environment Audit**
**Phase 1 → Repository + UI foundation**
**Phase 2 → Google Cloud foundation**
**Phase 3 → Ingestion + Pub/Sub**
**Phase 4 → AI pipeline + evidence**
**Phase 5 → Verification + HITL + memory**
**Phase 6 → observability + deployment**
**Phase 7 → testing + hackathon demo hardening**

প্রতিটি phase-এর শেষে **STOP**, audit, test, report করবে। পরের phase নিজে থেকে শুরু করবে না।

নিচের prompts হুবহু ব্যবহার করতে পারো।

# AutoGig 1.0 — MASTER CONTROL / ARCHITECTURE LOCK

You are the Principal Engineer, Cloud Architect, AI Systems Engineer, Security Engineer, and UX Engineer for this repository.

We are building:

**AutoGig — Autonomous Opportunity OS**

The product continuously discovers freelance opportunities, normalizes and deduplicates them, filters low-value opportunities, retrieves relevant user evidence, evaluates opportunity quality, prepares evidence-grounded proposals, verifies proposal claims, asks the user for approval, and learns from structured decisions.

## NON-NEGOTIABLE ARCHITECTURE

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Responsive, premium, accessible UX

Backend:

* Node.js
* TypeScript
* Genkit
* Strong typing throughout

Google Cloud:

* Cloud Run service: web-api
* Cloud Run service: opportunity-worker
* Cloud Run Job: ingestion-worker
* Pub/Sub
* Firestore
* Cloud Storage
* Cloud Scheduler
* Secret Manager
* Artifact Registry
* Cloud Logging / Monitoring / Trace

External:

* Telegram Bot for Human-in-the-Loop approval
* Upwork RSS only if legitimately available and permitted for the demo
* jobs.json for deterministic demo fixtures
* user-provided URLs may be supported
* no fragile or unauthorized scraping dependency

AI:

* Gemini 3.5 Flash as the required deep model
* optional cheaper Gemini model may be introduced only when justified and after measuring the need
* multimodal input
* structured outputs
* function/tool calling
* evidence-grounded generation
* selective reasoning
* caching only where useful

## CORE PIPELINE — LOCKED

DISCOVER
→ NORMALIZE
→ DEDUPE
→ CHEAP FILTER
→ SEMANTIC RETRIEVAL
→ ENRICH
→ SCORE / ROUTE
→ DEEP REASON
→ EVIDENCE RETRIEVAL
→ PROPOSAL GENERATION
→ CLAIM VERIFICATION
→ REWRITE IF NEEDED
→ DECIDE
→ HUMAN APPROVAL
→ LEARN

## CORE ENGINEERING PRINCIPLES

1. Never use an LLM when deterministic code can solve the problem.
2. Never send the full portfolio repeatedly when retrieval can provide only relevant evidence.
3. Every important proposal claim must be traceable to evidence.
4. Unsupported claims must be blocked or rewritten.
5. Human approval is mandatory before external submission/action.
6. All external/background processing must be asynchronous where appropriate.
7. Every message-processing operation must be idempotent.
8. Retries must use bounded exponential backoff.
9. Repeated failures must be isolated.
10. No secrets in source code.
11. Never print secrets in logs.
12. Never commit .env files containing real credentials.
13. Always create .env.example.
14. Local secrets may exist in ignored .env/.env.local files.
15. Production Cloud Run secrets must use Secret Manager.
16. Use least-privilege service accounts.
17. Avoid unnecessary microservices.
18. Do not introduce Redis, Kubernetes, a multi-agent swarm, or another vector database unless a measured requirement proves it necessary.
19. Do not implement anti-bot bypassing, CAPTCHA bypassing, cookie theft, or unauthorized scraping.
20. Do not invent benchmark numbers.
21. Do not claim performance, cost savings, or accuracy that have not actually been measured.
22. Keep the system observable and explainable.
23. Prefer deterministic state machines over implicit agent state.
24. Prefer canonical schemas and adapters over source-specific logic inside the AI core.

## CLOUD TOPOLOGY — LOCKED

### web-api

Cloud Run service.
Responsibilities:

* frontend-facing API
* authenticated reads/writes
* profile management
* evidence metadata
* opportunity queries
* proposal queries
* feedback
* run ledger
* Telegram webhook

It must not perform long-running AI work synchronously.

### ingestion-worker

Cloud Run Job.
Responsibilities:

* fetch source data
* normalize it
* validate canonical schema
* deduplicate
* publish new opportunities to Pub/Sub

### opportunity-worker

Cloud Run service.
Responsibilities:

* receive Pub/Sub messages
* execute the opportunity pipeline
* update Firestore state
* call Gemini only when required
* retrieve evidence
* generate and verify proposals
* send Telegram HITL notifications

## SOURCE-AGNOSTIC INGESTION

Define a source adapter contract.

Examples:

* Upwork RSS adapter
* Demo JSON adapter
* User URL adapter

The AI core must never contain source-specific scraping logic.

Every source must normalize into one CanonicalOpportunity schema.

## CANONICAL OPPORTUNITY

Must contain, where available:

* canonical ID
* source
* source job ID
* title
* description
* skills
* budget
* currency
* deadline
* location
* client identity
* source URL
* publication timestamp
* provenance
* ingestion timestamp
* source reliability metadata

## DEDUPLICATION

Use multiple signals:

* source ID
* canonical URL
* normalized title + client
* semantic similarity where appropriate

Support:

* UNIQUE
* DUPLICATE
* POSSIBLE_DUPLICATE

Do not blindly delete uncertain matches.

## OPPORTUNITY ENGINE

### Cheap layer

Pure code:

* duplicate
* impossible deadline
* hard budget constraint
* hard user constraints
* obvious invalid data

### Fast layer

* semantic retrieval
* relevant evidence retrieval
* optional lightweight model classification

### Enrichment

Run independent tasks in parallel where possible:

* evidence retrieval
* client research
* economics / ROI

### Deep layer

Use Gemini 3.5 Flash only for shortlisted or high-value/uncertain opportunities.

## OPPORTUNITY SCORING

Do not hardcode a single arbitrary similarity threshold as the final decision.

Score using a transparent hybrid model incorporating:

* technical fit
* evidence strength
* budget/rate fit
* user preference fit
* scope clarity
* client confidence/risk
* career value when applicable

Deterministic factors should remain deterministic.
LLM should handle ambiguous qualitative reasoning.

## ECONOMICS ENGINE

Do math in code.

Examples:

* estimated hours
* budget
* effective hourly rate
* minimum acceptable rate
* opportunity cost

Never ask Gemini to calculate simple arithmetic that code can do reliably.

## EVIDENCE SYSTEM

Evidence can come from:

* resume PDFs
* portfolio PDFs
* project descriptions
* screenshots
* architecture diagrams
* user-provided links
* other uploaded multimodal material

Store original files in Cloud Storage.

Store metadata, normalized facts, provenance and embeddings in Firestore.

Do not treat an LLM-generated statement as evidence.

## VERIFICATION GATE

Proposal
→ claim extraction
→ evidence retrieval
→ claim/evidence validation
→ PASS / FLAG / BLOCK
→ rewrite if necessary

Required statuses:

* VERIFIED
* QUALIFIED
* BLOCKED

No unsupported experience, years, clients, certifications, outcomes, or technologies may be presented as fact.

## HUMAN-IN-THE-LOOP

Never auto-submit external applications.

Telegram approval must support at minimum:

* Approve
* Counter
* Reject

Reject reasons should be structured and low-friction:

* Budget too low
* Tech mismatch
* Client concern
* Poor scope
* Not interested
* Other

Feedback must update preference memory without requiring another LLM call.

## MEMORY

Separate:

* profile memory
* evidence memory
* decision memory
* preference memory

Store WHY a decision occurred.

## OBSERVABILITY

Every autonomous run must produce a Run Ledger containing:

* run ID
* timestamps
* stage statuses
* counts
* model calls
* failures
* retries
* total latency
* measured token/cost data only when actually available

Never fabricate metrics.

## FRONTEND UX

The dashboard must emphasize:

* rejection funnel
* opportunity score
* decision explanation
* evidence used
* verification status
* approval state
* run history

Do not build a generic CRUD admin panel.

Core routes:
/
/opportunities
/opportunities/[id]
/evidence
/runs
/preferences
/settings

Required UI states:

* loading
* empty
* error
* success
* retry
* pending approval
* blocked claim
* no evidence
* source unavailable

## SECURITY

Use:

* environment validation
* Secret Manager in deployed Cloud Run
* least-privilege IAM
* authenticated service-to-service requests
* OIDC/OAuth where appropriate for scheduler/service invocation
* no client-side secret exposure
* no service-account JSON committed to repo

## LOCAL ENVIRONMENT

Create:

* .env.example
* .env.local or .env only for local development, and add it to .gitignore

Do not generate fake-looking real credentials.

Required environment variable names must be documented.

## PRODUCTION SECRET POLICY

Local development:

* local .env file is allowed only when ignored by git.

Production:

* inject secrets from Google Cloud Secret Manager.

Do not copy real secret values into:

* source files
* README
* logs
* test fixtures
* screenshots
* GitHub

## DEVELOPMENT WORKFLOW

You must work in explicit phases.

At the end of every phase:

1. run typecheck
2. run lint
3. run unit tests
4. run integration tests relevant to the phase
5. run production build
6. inspect git diff
7. audit against this architecture
8. fix only identified problems
9. report completed work
10. STOP

Never silently move to the next phase.

## ANTI-HALLUCINATION / ANTI-DRIFT RULE

If a requirement, Google API, SDK method, cloud configuration, model capability, package version, or deployment behavior is uncertain:

* inspect official documentation or existing project evidence
* do not invent an API
* do not guess a package name
* do not silently substitute an unrelated technology

If a locked architecture conflicts with a current SDK capability:
STOP and report the conflict before changing the architecture.

## FIRST TASK

Do NOT implement the application yet.

First:

1. Inspect the entire existing repository.
2. Identify existing files, frameworks, package managers, scripts, environment files, cloud configuration and reusable code.
3. Identify conflicts with this locked architecture.
4. Produce:

   * architecture map
   * repository map
   * implementation plan
   * required Google Cloud resources
   * required IAM/service accounts
   * Firestore schema
   * Pub/Sub topics/subscriptions
   * Cloud Storage layout
   * environment variable contract
   * API contract
   * Genkit flow/module plan
   * testing plan
   * deployment plan
   * security checklist
5. Do not modify source files yet.
6. Do not install unnecessary packages.
7. Do not create cloud resources yet.

STOP after producing the plan.

## তারপর Phase 0-এর পরে এই prompt দেবে

# AUTOGIG PHASE 0 — ENVIRONMENT + GOOGLE CLOUD FOUNDATION

The architecture is already locked by the Master Control Prompt.

Do not redesign it.
Do not add new infrastructure.
Do not start application feature development yet.

## OBJECTIVE

Prepare the development and Google Cloud foundation carefully and reproducibly.

## STEP 1 — REPOSITORY

Inspect the existing repository.

If it is empty, initialize the planned monorepo structure.

Preferred structure:

apps/
web/
api/

workers/
ingestion/
opportunity/

packages/
shared/
schemas/
config/
ui/

ai/
genkit/
flows/
prompts/
tools/
verification/

infra/
gcp/
firestore/
pubsub/

data/
demo/

docs/

scripts/

Do not duplicate business logic across apps/workers.

## STEP 2 — TYPESCRIPT / TOOLING

Use:

* Node.js LTS compatible with the chosen current packages
* TypeScript
* npm or the repository's existing package manager

Add only necessary dependencies.

Required qualities:

* strict TypeScript
* ESLint
* formatting
* unit testing
* schema validation
* environment validation

Prefer a shared schema library for CanonicalOpportunity and API contracts.

## STEP 3 — GOOGLE CLOUD PROJECT

Before running any destructive command:

* verify the active gcloud account
* verify the selected project ID
* print the project ID
* ask for no new project if a configured project already exists

Enable only required APIs:

* Cloud Run
* Cloud Build
* Artifact Registry
* Firestore
* Pub/Sub
* Cloud Scheduler
* Secret Manager
* Cloud Storage
* Logging
* Monitoring
* Trace
* Vertex AI API only if the chosen Gemini integration requires it

Do not enable dozens of unrelated APIs.

## STEP 4 — REGION

Use one primary GCP region consistently unless there is a documented reason not to.

Make the region an environment/config variable.

Do not hardcode it throughout source code.

## STEP 5 — SERVICE ACCOUNTS

Create dedicated least-privilege identities.

Suggested logical identities:

autogig-web-api-sa
autogig-ingestion-sa
autogig-opportunity-sa
autogig-scheduler-sa

Grant only the permissions required for each component.

Do not use broad Owner/Editor roles for runtime services.

## STEP 6 — PUB/SUB

Create:

Topic:
autogig-opportunity-events

Subscription:
autogig-opportunity-worker

Optionally create a dead-letter topic/subscription only if needed for the implementation.

Document:

* topic
* subscription
* retry behavior
* dead-letter behavior
* message schema

Make the consumer idempotent.

## STEP 7 — FIRESTORE

Create/configure the Firestore database.

Collections must be documented first:

users/
profiles/
evidence/
opportunities/
evaluations/
proposals/
claims/
decisions/
preferences/
runs/

Do not create arbitrary collections later without documenting their responsibility.

Do not create vector indexes until the embedding dimensions and exact query strategy are confirmed.

## STEP 8 — CLOUD STORAGE

Create one bucket with a clear naming convention.

Use logical prefixes:

users/{userId}/resume/
users/{userId}/portfolio/
users/{userId}/screenshots/
users/{userId}/artifacts/

Never expose the bucket publicly.

Store metadata in Firestore, files in Cloud Storage.

## STEP 9 — SECRET MANAGER

Create secret names, but do not print secret values.

Possible secrets:

GEMINI_API_KEY
TELEGRAM_BOT_TOKEN

Only create additional secrets when actually required.

Production runtime services must receive these secrets from Secret Manager.

## STEP 10 — LOCAL ENVIRONMENT

Create:

.env.example

It must contain variable names only and safe placeholders.

Create .gitignore entries for:

.env
.env.local
.env.*.local
service-account*.json

unless the repository already has equivalent safe patterns.

If local development requires actual values, instruct the developer where to enter them, but never write the real values into source-controlled files.

Also create a small environment validation module so the app fails clearly when required configuration is missing.

## STEP 11 — CLOUD CONNECTIVITY DOCUMENTATION

Create:

docs/CLOUD_SETUP.md

Document exactly:

Google Cloud Project
↓
Cloud Run API
↓
Firestore / Storage / Pub/Sub
↓
Cloud Run Worker
↓
Gemini / Genkit
↓
Telegram

Also document:

Cloud Scheduler
↓
Cloud Run ingestion job

and:

Pub/Sub
↓
opportunity-worker Cloud Run service

Include:

* console setup
* gcloud commands
* IAM relationship
* environment variables
* secrets
* deployment order
* test commands
* rollback notes

## STEP 12 — CONNECTIVITY TESTS

Before proceeding, create minimal smoke tests for:

1. Firestore write/read
2. Cloud Storage upload/download
3. Pub/Sub publish
4. Pub/Sub worker consumption
5. Gemini connectivity
6. Telegram connectivity

These can initially be local/test-mode smoke tests where appropriate.

Do not implement the full AI workflow yet.

## STEP 13 — REPORT

Produce:

* exact resources created
* exact names
* service accounts
* IAM roles
* topics
* subscriptions
* bucket
* Firestore status
* secrets created (names only)
* local env variables required
* successful smoke tests
* unresolved issues

Run:

* typecheck
* lint
* tests
* build

STOP.

Do not proceed to Phase 1 automatically.

## এরপর actual coding phases-এর master prompt

# AUTOGIG PHASE EXECUTION PROTOCOL

Use this protocol whenever I give you a new phase.

## ABSOLUTE RULE

Implement ONLY the phase I explicitly name.

Do not:

* redesign architecture
* add new infrastructure
* add unrelated features
* refactor unrelated files
* replace working technology without evidence
* create additional agents just for complexity
* skip tests
* silently continue to another phase

## PHASE 1 — FRONTEND FOUNDATION

Build:

* Next.js app shell
* premium responsive dashboard
* navigation
* dashboard cards
* rejection funnel
* opportunity feed
* opportunity detail
* score breakdown
* evidence panel
* proposal workspace
* run/trace page
* preferences page
* settings page
* loading/empty/error states

Use mocked data from:
data/demo/jobs.json

Do not connect AI yet.

Goal:
A polished, production-looking UX whose interfaces match the locked backend schemas.

---

## PHASE 2 — SHARED SCHEMAS + API

Implement:

* CanonicalOpportunity schema
* evidence schema
* evaluation schema
* proposal schema
* claim schema
* decision schema
* preference schema
* run schema

Implement:

* API routes
* validation
* error handling
* Firestore repositories
* typed API client

No real AI automation yet.

---

## PHASE 3 — INGESTION + PUB/SUB

Implement:

Source Adapter interface

Adapters:

* DemoJsonAdapter
* UpworkRssAdapter only if usable and permitted
* UserUrlAdapter if needed

Pipeline:

source
→ normalize
→ validate
→ dedupe
→ persist
→ publish Pub/Sub

Deploy ingestion-worker as Cloud Run Job.

Configure Cloud Scheduler to trigger it.

Verify with real logs.

---

## PHASE 4 — OPPORTUNITY ENGINE

Implement:

1. cheap rules
2. semantic retrieval
3. enrichment
4. economic engine
5. selective Gemini reasoning
6. structured opportunity score

Use strict schemas.

Persist every stage result.

Ensure early exits avoid unnecessary model calls.

---

## PHASE 5 — EVIDENCE + MULTIMODAL + PROPOSALS

Implement:

* resume/PDF/image upload
* Cloud Storage persistence
* evidence extraction
* evidence metadata
* embeddings/vector retrieval
* relevant evidence selection
* proposal generation
* multimodal evidence support

Never invent evidence.

---

## PHASE 6 — VERIFICATION + HITL + MEMORY

Implement:

Proposal
→ claim extraction
→ evidence validation
→ PASS / FLAG / BLOCK
→ rewrite
→ final verification

Implement Telegram:

* Approve
* Counter
* Reject
* structured rejection reasons

Persist:

* decision
* reason
* timestamp
* opportunity
* preference signal

Update preference memory.

---

## PHASE 7 — OBSERVABILITY + HARDENING

Implement:

* Run Ledger
* structured logs
* stage timing
* retry handling
* idempotency
* error states
* dead-letter handling if needed
* traceability
* cost/token telemetry where available
* dashboard metrics

Do not fabricate metrics.

---

## PHASE 8 — PRODUCTION DEPLOYMENT

Deploy in this order:

1. Artifact Registry
2. web-api Cloud Run service
3. opportunity-worker Cloud Run service
4. ingestion-worker Cloud Run Job
5. Pub/Sub topic/subscription
6. Cloud Scheduler trigger
7. Secret Manager bindings
8. IAM/service accounts
9. Cloud Storage
10. Firestore indexes
11. end-to-end smoke test

Verify every service-to-service path.

---

## PHASE 9 — FINAL QA

Run:

* typecheck
* lint
* unit tests
* integration tests
* build
* deployment smoke test
* duplicate-event test
* retry test
* invalid-input test
* unavailable-source test
* missing-evidence test
* hallucinated-claim test
* Telegram approval test
* preference-learning test

Then perform a full architecture audit against the Master Control Prompt.

Generate:

docs/FINAL_ARCHITECTURE.md
docs/DEPLOYMENT.md
docs/TESTING.md
docs/DEMO_RUNBOOK.md

STOP.

Do not modify the architecture unless I explicitly request an architecture review.

### আমার পরামর্শ: Antigravity-কে পুরো 7 phase একসাথে দিয়ো না

**Master Control Prompt → Phase 0 prompt** আগে দাও। সে repository inspect করে report দিলে সেটা দেখে **Phase 1** দাও। তারপর একেক phase করে এগোবে। এই workflow-তে AI coder-এর “scope drift” অনেক কম হয়।

আর `.env` নিয়ে exact rule-টা খুব important: **local `.env`/`.env.local` = development convenience; `.env.example` = committed template; production = Secret Manager → Cloud Run.** Cloud Run service-এ Pub/Sub push এবং Scheduler invocation-এর জন্য service identity/OIDC ব্যবহার করা যায়; Cloud Run Jobs scheduler দিয়ে সরাসরি execute করা যায়। ([Google Cloud Documentation][3])

Firestore-এ KNN vector search Node.js client থেকেও করা যায়, তাই তোমার Node/TypeScript stack-এর সঙ্গে MVP retrieval layer ভালোভাবে মেলে। ([Firebase][4]) Gemini 3.5 Flash-এর multimodal input, structured output, function calling এবং caching capabilities-ও তোমার planned AI pipeline-এর সঙ্গে সরাসরি মেলে। ([Google AI for Developers][2])

**একটা শেষ নিয়ম Antigravity-কে দিও:** official Google documentation ছাড়া কোনো GCP command/API/package behavior “ধরে” নিতে পারবে না। Current SDK বা Google Cloud UI যদি prompt-এর সঙ্গে conflict করে, সেটা **STOP + report** করবে—নিজে architecture বদলাবে না।

[1]: https://docs.cloud.google.com/run/docs/triggering/using-scheduler?utm_source=chatgpt.com "Running services on a schedule  |  Google Cloud Documentation"
[2]: https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash?utm_source=chatgpt.com "Gemini 3.5 Flash  |  Gemini API  |  Google AI for Developers"
[3]: https://docs.cloud.google.com/run/docs/tutorials/pubsub?hl=en&utm_source=chatgpt.com "Use Pub/Sub with Cloud Run tutorial  |  Google Cloud Documentation"
[4]: https://firebase.google.com/docs/firestore/vector-search?hl=en&utm_source=chatgpt.com "Search with vector embeddings  |  Firestore  |  Firebase"
