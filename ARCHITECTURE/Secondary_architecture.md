হ্যাঁ—এখন আমি এটাকে **final architecture হিসেবে lock** করব, তবে আগের কয়েকটা কথায় একটা গুরুত্বপূর্ণ correction আছে।

Hackathon-এর official page অনুযায়ী **Gemini 3.5 বা newer**, অন্তত একটি Google Agent Framework (ADK / GenAI SDK / Antigravity SDK / GenKit), এবং অন্তত একটি Google Cloud infrastructure service বাধ্যতামূলক। Cloud Run + Firestore + Scheduler ব্যবহার করলে requirement খুব শক্তভাবে satisfy হবে। ([All Things Agentic Hackathon][1])

আর একটা জিনিস: **“১০০% winner”, “১০/১০ guaranteed” বলা ঠিক হবে না।** Architecture যত ভালোই হোক, বিচারকের scoring, execution এবং competing projects-এর ওপর ফল নির্ভর করবে।

# আমার recommendation: এই stack-টাই নাও

### Frontend

**Next.js + TypeScript + Tailwind + shadcn/ui**

### Backend

**Node.js + TypeScript + Genkit**

### AI

**Gemini 3.5 Flash বা hackathon-accepted newer Gemini model**

### Google Cloud

* Cloud Run
* Firestore
* Cloud Scheduler
* Pub/Sub
* Secret Manager
* Artifact Registry
* Cloud Logging / Trace

### External

* Telegram Bot — approval/notification
* Demo-এর জন্য `jobs.json` — real marketplace scraping নয়
* Optional GitHub/public portfolio URLs
* Resume/PDF/image upload

এই architecture-এর সবচেয়ে বড় সুবিধা হলো **একটা language ecosystem**: TypeScript everywhere. Genkit নিজেই multimodal input, structured output, tool calling এবং agentic workflow-এর জন্য তৈরি। ([Firebase][2])

---

# 1. পুরো system-টা আসলে কী?

নাম ধরো:

## **AutoGig — Autonomous Opportunity OS**

User একবার নিজের:

* Resume
* Portfolio
* Skills
* Previous projects
* Preferred technologies
* Minimum acceptable budget
* Availability
* Work preferences

দেবে।

তারপর user-কে প্রতিটা job manually analyse করতে হবে না।

System:

```text
JOB ARRIVES
    ↓
CHEAP FILTER
    ↓
SEMANTIC MATCH
    ↓
OPPORTUNITY SCORING
    ↓
DEEP GEMINI REASONING
    ↓
EVIDENCE RETRIEVAL
    ↓
PROPOSAL GENERATION
    ↓
ANTI-HALLUCINATION VERIFICATION
    ↓
DECISION
    ├── SKIP
    ├── COUNTER-PROPOSAL
    └── RECOMMEND
          ↓
    HUMAN APPROVAL
          ↓
       TELEGRAM
          ↓
      USER DECISION
          ↓
   PREFERENCE MEMORY
          ↓
   SYSTEM IMPROVES
```

এটাই তোমার **core product loop**।

---

# 2. সবচেয়ে গুরুত্বপূর্ণ architecture decision

আগের কথাগুলো থেকে একটা জিনিস আমি বদলাব:

### ❌ সব কাজকে আলাদা আলাদা Agent বানাবে না।

যেমন:

```text
Agent 1
Agent 2
Agent 3
Agent 4
Agent 5
Agent 6
```

এটা দেখতে impressive হলেও latency এবং cost বাড়াবে।

তার বদলে:

## **One Orchestrator + deterministic engines + selective Gemini reasoning**

এটা অনেক বেশি mature architecture।

```text
                 ┌───────────────────┐
                 │   Cloud Scheduler  │
                 └─────────┬─────────┘
                           ↓
                    ┌─────────────┐
                    │   Pub/Sub   │
                    └──────┬──────┘
                           ↓
                  ┌──────────────────┐
                  │ Cloud Run Worker │
                  │   Orchestrator   │
                  └────────┬─────────┘
                           ↓
             ┌─────────────────────────┐
             │      Cheap Filters      │
             │ Rules + Dedup + Budget  │
             └────────────┬────────────┘
                          ↓
                  ┌──────────────┐
                  │ Vector Match │
                  └──────┬───────┘
                         ↓
                 ┌───────────────┐
                 │ Gemini Reason │
                 └───────┬───────┘
                         ↓
                ┌─────────────────┐
                │ Evidence Engine │
                └────────┬────────┘
                         ↓
                ┌─────────────────┐
                │ Draft Generator │
                └────────┬────────┘
                         ↓
                ┌─────────────────┐
                │ Verification    │
                │ / Critic        │
                └────────┬────────┘
                         ↓
                   ┌──────────┐
                   │ Decision │
                   └────┬─────┘
                        ↓
                 Telegram HITL
```

এটাই আমি নিতাম।

---

# 3. Cheap → Fast → Deep

এটা তোমার project's **signature architecture** বানাও।

## Stage 0 — Dedup

প্রথমেই দেখবে:

```text
Have I seen this job before?
```

হলে:

```text
SKIP
```

কোনো Gemini call লাগবে না।

---

## Stage 1 — Rule Engine

Pure code:

```text
budget < minimum → reject

deadline impossible → reject

blocked technology → reject

obvious spam → reject

duplicate → reject
```

Cost:

**$0 AI**

Latency:

**milliseconds**

---

# 4. Stage 2 — Semantic Matching

এখানে portfolio/job meaning compare হবে।

উদাহরণ:

Job:

> Need Next.js, Supabase, RAG and AI integration.

Portfolio:

> Built an AI-powered educational platform using Next.js, Supabase, RAG and multiple LLM providers.

Keyword matching-এর চেয়ে semantic similarity অনেক ভালো signal।

Score:

```text
Technical similarity = 0.91
```

তারপর:

```text
< 0.60 → reject
0.60–0.80 → uncertain
> 0.80 → Gemini reasoning
```

---

# 5. Stage 3 — Opportunity Intelligence

এখন Gemini আসবে।

কিন্তু তাকে শুধু:

> "Write proposal"

বলবে না।

Structured output চাইবে।

যেমন:

```json
{
  "decision": "RECOMMEND",
  "technical_fit": 92,
  "budget_fit": 76,
  "portfolio_fit": 94,
  "risk": 21,
  "opportunity_score": 88,
  "reasoning_summary": "...",
  "evidence_ids": ["EV-14", "EV-27"],
  "recommended_action": "APPLY"
}
```

এতে frontend-এ beautiful scorecard বানাতে পারবে।

---

# 6. Opportunity Score

আমি এটাকে একটু বেশি intelligent করব।

ধরো:

```text
Technical Fit       92
Evidence Strength   94
Budget Fit          76
Time Fit            88
Client Risk         70
Portfolio Relevance 95
Preference Fit      91
──────────────────────
Opportunity Score   88
```

তারপর:

```text
85–100 → STRONG OPPORTUNITY
70–84  → REVIEW
55–69  → LOW PRIORITY
<55    → SKIP
```

**Important:** score যেন শুধু LLM-এর বানানো number না হয়।

যেখানে সম্ভব:

```text
budget
hours
deadline
historical preferences
semantic similarity
```

এসব deterministic calculation দিয়ে করো।

Gemini শুধু ambiguous judgement করবে।

এটাই reliability বাড়াবে।

---

# 7. Multimodal layer

এখানে projectটা আরও interesting হবে।

User upload করতে পারবে:

* PDF resume
* screenshots
* project architecture diagrams
* UI screenshots
* certificates
* portfolio images

Gemini এগুলো analyse করে evidence তৈরি করবে।

উদাহরণ:

```text
EV-001
Type: Project
Source: Prepia screenshot
Skills:
  Next.js
  TypeScript
  RAG
  Supabase
  AI integration
Confidence: 0.94
```

তারপর proposal-এর সময় system বলবে:

> এই claim-এর supporting evidence আছে EV-001-এ।

এটা অনেক বেশি trustworthy।

---

# 8. Evidence Store

Firestore-এ আমি logical collections রাখতাম:

```text
users/
profiles/
evidence/
jobs/
evaluations/
proposals/
decisions/
preferences/
runs/
```

উদাহরণ:

```text
evidence/EV-001

{
  type: "project",
  title: "Prepia",
  source: "uploaded_screenshot",
  extractedFacts: [...],
  embedding: [...],
  confidence: 0.94
}
```

Firestore-এর free quota-ও ছোট MVP-এর জন্য যথেষ্ট generous—বর্তমানে 50,000 document reads/day, 20,000 writes/day এবং 1 GiB storage free quota আছে। ([Google Cloud][3])

---

# 9. কিন্তু একটা correction: Firestore Vector Search নিয়ে সাবধান

আগের feedback-এ “Firestore Vector DB” খুব confidently বলা হয়েছিল।

আমি implementation-এর সময় **বর্তমান Firestore vector-search capability এবং exact SDK support verify করে** তারপর ব্যবহার করতাম।

Architecture diagram-এ বলতে পারো:

> **Firestore + vector retrieval**

কিন্তু implementation-এর আগে exact supported API confirm করবে।

Hackathon-এর জন্য unnecessarily exotic vector infrastructure যোগ করার দরকার নেই।

---

# 10. Proposal Generator

এখানে Gemini-এর কাজ:

```text
Job
+
User profile
+
Retrieved evidence
+
User preferences
+
Opportunity analysis
```

↓

```text
Proposal
```

কিন্তু prompt:

> **Never claim an experience that cannot be supported by retrieved evidence.**

---

# 11. তারপর আসে সবচেয়ে cool অংশ

## Verification Gate

Draft:

> I have extensive GraphQL experience...

Evidence:

```text
GraphQL → NOT FOUND
```

System:

```text
BLOCK
```

তারপর:

```text
REMOVE UNSUPPORTED CLAIM
```

আবার proposal generate।

Final:

```text
VERIFIED
```

Frontend-এ দেখাতে পারো:

```text
✓ Budget verified
✓ Skills verified
✓ Portfolio evidence verified
✓ No unsupported claims
✓ Client risk checked
```

এটাই তোমার **Trust Layer**।

---

# 12. Counter-Proposal

এটা রাখব।

যেমন:

```text
Job budget: $500
Estimated work: $900
Technical fit: 96%
```

System:

```text
REJECT
```

না।

বরং:

```text
COUNTER-PROPOSAL
```

বলবে:

> Full scope exceeds the available budget. Recommend proposing Phase 1 MVP within the client's current budget.

এতে product শুধু job finder না হয়ে **decision-making assistant** হয়ে যায়।

---

# 13. Human-in-the-loop

এটা খুব গুরুত্বপূর্ণ।

System কখনো নিজে থেকে final action নেবে না।

Telegram:

```text
━━━━━━━━━━━━━━━━
🔥 Opportunity Found
━━━━━━━━━━━━━━━━

Opportunity Score: 91/100

Technical Fit       95
Evidence Strength   93
Budget Fit          81
Risk                Low

Decision:
RECOMMEND

✓ Proposal verified
✓ No unsupported claims

[ APPROVE ]

[ COUNTER ]

[ REJECT ]
```

Reject করলে:

```text
Why?

[ Budget ]
[ Client Risk ]
[ Poor Fit ]
[ Low Priority ]
[ Other ]
```

এগুলো সরাসরি Firestore-এ structured preference হিসেবে যাবে।

LLM call দরকার নেই।

**Cost = practically zero.**

---

# 14. Preference Learning

এখানে system সত্যিই user-specific হবে।

ধরো:

১০ বার:

```text
Reject → low budget
```

তারপর future job এ:

```text
budget sensitivity ↑
```

আবার:

```text
Approve → Next.js + AI
Approve → RAG + AI
Approve → Supabase
```

system বুঝবে:

```text
preferred stack:
Next.js
AI
RAG
Supabase
```

এটা user-এর নিজের historical behaviour থেকে তৈরি হবে।

---

# 15. Weekly Career Intelligence

এটা আমি রাখব, কিন্তু **MVP-এর core শেষ হওয়ার পরে**।

প্রতি সপ্তাহে:

```text
Jobs scanned: 240

Strong opportunities: 17
Approved: 6
Rejected: 11

Most preferred:
Next.js
AI integration
RAG

Most rejected:
Low budget
Unclear requirements
Legacy stack
```

তারপর:

> Your highest approval rate is coming from AI + Next.js projects. Consider strengthening portfolio evidence around these areas.

এটা product-এর long-term intelligence layer।

---

# 16. Google Cloud architecture

আমি এই architecture নিতাম:

```text
                 INTERNET
                    │
             ┌──────▼──────┐
             │   Next.js   │
             │  Frontend   │
             └──────┬──────┘
                    │ HTTPS
                    ▼
             ┌──────────────┐
             │ Cloud Run API│
             └──────┬───────┘
                    │
        ┌───────────┼────────────┐
        │           │            │
        ▼           ▼            ▼
   Firestore     Pub/Sub     Secret Manager
        │           │
        │           ▼
        │      Cloud Run Worker
        │           │
        │           ▼
        │       Genkit
        │           │
        │           ▼
        │      Gemini API
        │
        ▼
    Run Ledger


Cloud Scheduler
      │
      ▼
    Pub/Sub
      │
      ▼
Cloud Run Worker
      │
      ▼
Autonomous Pipeline
```

Cloud Run-এর pay-per-use model এবং free tier ছোট hackathon workload-এর জন্য যথেষ্ট সুবিধাজনক। ([Google Cloud][4])

Scheduler-এরও বর্তমানে প্রতি billing account-এ 3টি job/month free quota আছে; এরপর job-based billing হয়। ([Google Cloud][5])

---

# 17. Cloud Scheduler → Pub/Sub কেন?

আমি সরাসরি:

```text
Scheduler → Cloud Run
```

করার বদলে:

```text
Scheduler
   ↓
Pub/Sub
   ↓
Worker
```

নেব।

কারণ এতে future-এ:

```text
100 jobs
500 jobs
1000 jobs
```

এলে architecture naturally queue-based হয়ে যায়।

আর retry / decoupling ভালো হয়।

Google-এর Scheduler documentation-ও Pub/Sub target-এর scheduled workflow দেখায়। ([Google Cloud Documentation][6])

---

# 18. Cloud Run-এ দুইটা logical service

### `autogig-api`

Frontend-এর API:

```text
/auth
/profile
/evidence
/jobs
/evaluations
/proposals
/feedback
/dashboard
```

### `autogig-worker`

Background:

```text
consume Pub/Sub
↓
process jobs
↓
evaluate
↓
generate
↓
verify
↓
save
↓
notify
```

এটা অনেক cleaner।

Cloud Run container-based deployment-এর জন্য Artifact Registry ব্যবহার করা recommended path। ([Google Cloud Documentation][7])

---

# 19. Frontend কেমন হবে?

এখানে generic dashboard বানাবে না।

## Dashboard

Hero:

> **Your Opportunity Intelligence**

Cards:

```text
47
Jobs Scanned

6
Strong Opportunities

3
Awaiting Review

91%
Evidence Verification
```

তার নিচে:

### Opportunity Feed

প্রতিটি card:

```text
AI Engineer — RAG Platform

91 Opportunity Score

Technical Fit       94
Budget Fit          82
Evidence            96
Risk                Low

Why this matters:
Your Prepia project directly matches
the client's RAG requirements.

[View Analysis]
```

---

# 20. Job detail page

এখানে wow factor:

```text
OPPORTUNITY SCORE
91
───────────────

Technical Fit     94
Evidence          96
Budget            82
Risk              18
Preference        91
```

তারপর:

### Evidence

```text
✓ EV-001 — Prepia
✓ EV-014 — RAG architecture
✓ EV-022 — Next.js implementation
```

তারপর:

### Decision

```text
RECOMMEND APPLY
```

তারপর:

### Proposal

```text
Verified Proposal

[Copy]
[Edit]
[Approve]
```

---

# 21. Trace page

এটা demo-এর জন্য অসাধারণ।

```text
Run #A72F

✓ Dedup                 4ms
✓ Rule Filter           2ms
✓ Semantic Match       41ms
✓ Gemini Evaluation   1.8s
✓ Evidence Retrieval   72ms
✓ Proposal             1.4s
✓ Verification         0.8s
✓ Firestore            21ms

Total: 4.1s
```

আর পাশে:

```text
AI COST
────────
Rules              $0
Retrieval          ~$0
Gemini             $X
Firestore          ~$0

Saved 86% AI calls
```

**তবে actual measurements না থাকলে fabricated “86%” বলবে না।** Demo-তে সত্যিকারের benchmark চালিয়ে number দেখাবে।

---

# 22. Latency optimization

এখানেই তোমার architecture অন্যদের থেকে ভালো হতে পারে।

### Do:

**1. Deterministic filters first**

LLM-এর আগে।

**2. Dedup before embeddings**

একই job আবার process করবে না।

**3. Parallel retrieval**

Evidence + preference + job metadata একসাথে fetch।

**4. Structured output**

JSON schema।

**5. Small prompts**

পুরো portfolio বারবার Gemini-কে পাঠাবে না।

**6. Cache stable context**

Resume/profile বারবার পুনরায় process করবে না।

**7. Limit deep reasoning**

১০০ job → ৫ job → Gemini।

**8. Batch operations where appropriate**

Firestore/API calls unnecessarily serial করবে না।

Cloud Run-এর Node.js optimization documentation-ও startup latency কমানোর জন্য সরাসরি Node process চালানোর মতো optimization উল্লেখ করে। ([Google Cloud Documentation][8])

---

# 23. Cost optimization

Architecture-এর golden rule:

> **Don't use an LLM to solve a problem that code can solve.**

Example:

```text
Duplicate?
→ Code

Budget threshold?
→ Code

Deadline?
→ Code

Score calculation?
→ Code

Semantic meaning?
→ Embedding

Ambiguous judgement?
→ Gemini

Proposal?
→ Gemini

Verification?
→ Gemini
```

এটাই intelligent hybrid system।

---

# 24. Python না Node.js?

## আমার vote: **Node.js + TypeScript**

তোমার ক্ষেত্রে:

### Frontend

Next.js/TypeScript

### Backend

Node.js/TypeScript

### Agent

Genkit/TypeScript

### Database

Firestore

### Deployment

Cloud Run

সব জায়গায় একই ecosystem।

এতে ৭ দিনে context switching কমবে।

Genkit full-stack AI applications-এর জন্য এবং structured outputs, multimodal content, tool calling ও agentic workflows support করে। ([Firebase][2])

Python + ADK technically খুব ভালো option, কিন্তু তোমার এই specific project-এ আমি **Node/TypeScript + Genkit** নেব।

---

# 25. External service কয়টা লাগবে?

আমি ইচ্ছা করে কম রাখব।

| Service            | দরকার? | কাজ                 |
| ------------------ | ------ | ------------------- |
| Google Cloud       | ✅      | infrastructure      |
| Gemini             | ✅      | intelligence        |
| Genkit             | ✅      | agent orchestration |
| Cloud Run          | ✅      | backend/worker      |
| Firestore          | ✅      | state/memory        |
| Pub/Sub            | ✅      | async queue         |
| Cloud Scheduler    | ✅      | background trigger  |
| Secret Manager     | ✅      | secrets             |
| Artifact Registry  | ✅      | container           |
| Telegram Bot       | ✅      | HITL                |
| GitHub             | ✅      | source              |
| Real Upwork API    | ❌ MVP  | unnecessary risk    |
| Scraper            | ❌ MVP  | unnecessary risk    |
| Redis              | ❌      | not needed          |
| Kubernetes         | ❌      | overkill            |
| Separate vector DB | ❌      | unnecessary         |

---

# 26. Google Cloud setup-এর actual order

প্রথমে:

### Step 1

Google Cloud project তৈরি।

### Step 2

Billing attach / available credits activate।

বর্তমান Google Cloud docs নতুন users-এর জন্য $300 credits উল্লেখ করছে; তবে **তোমার hackathon resource benefit যদি আলাদা হয়, সেটার exact amount/eligibility আলাদাভাবে check করবে**—আগের text-এ $150 বলা হয়েছিল, সেটা আমি official hackathon requirement হিসেবে ধরে নিচ্ছি না। ([Google Cloud Documentation][9])

### Step 3

Enable:

```text
Cloud Run
Firestore
Pub/Sub
Cloud Scheduler
Secret Manager
Artifact Registry
Cloud Logging
Cloud Trace
```

### Step 4

Firestore database।

### Step 5

Pub/Sub:

```text
job-discovery
job-processing
```

### Step 6

Service account।

### Step 7

Secrets:

```text
GEMINI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

**কোডে hardcode করবে না।**

### Step 8

Cloud Run API।

### Step 9

Cloud Run Worker।

### Step 10

Scheduler।

---

# 27. আনুমানিক setup time

তুমি যদি আগে থেকে Google Cloud-এর basic interface জানো:

| কাজ                        |       সময় |
| -------------------------- | --------: |
| GCP project                | 10–20 min |
| APIs                       |    10 min |
| Firestore                  | 10–15 min |
| Pub/Sub                    | 10–15 min |
| Secret Manager             |    10 min |
| Telegram bot               | 10–20 min |
| Cloud Run first deployment | 20–40 min |
| Scheduler                  | 10–15 min |
| Genkit setup               | 20–40 min |
| Frontend foundation        |    1–2 hr |
| Backend foundation         |    1–2 hr |

**প্রথমদিন infrastructure + skeleton: প্রায় 4–6 ঘণ্টা** ধরো।

তারপর actual development।

---

# 28. ৭ দিনের realistic breakdown

তুমি যেহেতু Antigravity দিয়ে accelerate করবে:

### Day 1

Architecture + Cloud + repo + frontend shell

### Day 2

User onboarding + resume/evidence ingestion

### Day 3

Job pipeline:

```text
JSON
→ dedup
→ rules
→ semantic match
```

### Day 4

Gemini:

```text
evaluate
→ score
→ proposal
```

### Day 5

Verification + Telegram + feedback memory

### Day 6

UI polish + trace + metrics + cloud deployment

### Day 7

Testing + demo + README + submission

**শেষ দিন নতুন feature নয়।**

---

# 29. Antigravity-কে কী বলবে?

এখানে সবচেয়ে গুরুত্বপূর্ণ অংশ।

একবারে:

> "Build the entire application."

বলবে না।

তাহলে সে অনেক code generate করে architecture নষ্ট করে দিতে পারে।

বরং প্রথম prompt হবে **Architecture Lock**।

তুমি Antigravity-তে এটা দিতে পারো:

```text
You are the Principal Engineer for this project.

We are building "AutoGig — Autonomous Opportunity OS"
for the All Things Agentic Hackathon.

IMPORTANT:
Do not start implementing yet.

First create a complete implementation plan and inspect the
existing repository.

LOCK THESE ARCHITECTURAL DECISIONS:

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- modern responsive dashboard

Backend:
- Node.js
- TypeScript
- Genkit

Google Cloud:
- Cloud Run API
- Cloud Run Worker
- Firestore
- Pub/Sub
- Cloud Scheduler
- Secret Manager
- Artifact Registry
- Cloud Logging/Trace

AI:
- Gemini 3.5 or newer accepted by the hackathon
- structured outputs
- multimodal input
- evidence-grounded generation
- selective reasoning

External:
- Telegram Bot for human approval
- Local deterministic jobs.json for MVP/demo
- No marketplace scraping in MVP

CORE ARCHITECTURE:

Cheap → Fast → Deep

1. Deduplication
2. Deterministic rule filtering
3. Semantic matching
4. Opportunity scoring
5. Gemini reasoning
6. Evidence retrieval
7. Proposal generation
8. Verification gate
9. Decision
10. Human approval
11. Preference learning

IMPORTANT ENGINEERING RULES:

- Never call an LLM when deterministic code can solve the problem.
- Never send the complete portfolio to Gemini repeatedly.
- Never generate unsupported claims.
- Every proposal claim must be traceable to evidence.
- Never allow the system to automatically send a final application.
- Human approval is mandatory.
- All background work must be asynchronous.
- All secrets must use environment variables / Secret Manager.
- No hardcoded credentials.
- All important operations must be idempotent.
- Add retries with exponential backoff where appropriate.
- Add structured logging.
- Track latency and estimated AI usage per run.
- Avoid unnecessary agents.
- Prefer one orchestrator with specialized deterministic engines.
- Keep the MVP reliable over feature-rich.
- Do not introduce Redis, Kubernetes, or additional vector databases
  unless there is a demonstrated requirement.

Before coding, produce:

1. Complete system architecture
2. Repository structure
3. Firestore schema
4. Pub/Sub topics
5. Cloud Run services
6. API contracts
7. Genkit flow design
8. AI prompt strategy
9. Evidence model
10. Opportunity scoring formula
11. Verification strategy
12. Telegram interaction design
13. Error handling strategy
14. Security strategy
15. Cost optimization strategy
16. Latency optimization strategy
17. Testing strategy
18. 7-day implementation plan

DO NOT IMPLEMENT YET.

Wait for approval after presenting the plan.
```

---

# 30. তারপর দ্বিতীয় prompt

Plan approve করার পর:

```text
Now implement Phase 1 only.

Do not implement future phases.

Phase 1:
- Next.js application shell
- TypeScript
- Tailwind
- shadcn/ui
- dashboard layout
- navigation
- Opportunity Feed
- Opportunity Detail page
- Trace page
- Settings page
- responsive design
- loading states
- empty states
- error states
- reusable UI components

Use realistic mock data.

Do NOT connect Gemini or Google Cloud yet.

Keep the UI production-quality and prepare clean interfaces
for the future backend.

After implementation:
1. run typecheck
2. run lint
3. run tests
4. build production bundle
5. report all errors
6. fix them before finishing

Do not move to Phase 2.
```

তারপর Phase 2, 3, 4 করে এগোবে।

---

# 31. সবচেয়ে গুরুত্বপূর্ণ: Antigravity-কে autonomous বানাতে গিয়ে নিজে autonomous হয়ো না 😄

প্রতিটি phase-এর পরে বলবে:

```text
STOP.

Do not add new features.

Audit the implementation against the locked architecture.

Check:
- type safety
- race conditions
- duplicate processing
- error handling
- secret leakage
- unnecessary Gemini calls
- unnecessary Firestore reads/writes
- latency
- retry behavior
- idempotency

Fix only issues found in this audit.

Then stop.
```

এটা খুব useful হবে।

---

# 32. আর একটা জিনিস আমি অবশ্যই রাখব

## **Run Ledger**

প্রতিটি autonomous execution-এর record:

```text
runId
startedAt
completedAt

jobsDiscovered: 20
jobsDeduplicated: 4
ruleRejected: 8
semanticRejected: 5
deepEvaluated: 3

proposalsGenerated: 2
proposalsVerified: 2

geminiCalls: 5
estimatedTokens: ...
estimatedCost: ...

totalLatencyMs: ...
status: SUCCESS
```

এটা তোমার project-এর **observability + demo gold**।

---

# 33. Demo-তে আসল WOW হবে

তুমি দেখাবে:

```text
Scheduler triggered
        ↓
20 jobs discovered
        ↓
8 rejected by rules
        ↓
5 rejected semantically
        ↓
3 sent to Gemini
        ↓
2 strong opportunities
        ↓
1 proposal initially failed verification
        ↓
verification blocked unsupported claim
        ↓
proposal regenerated
        ↓
verified
        ↓
Telegram approval
        ↓
user rejects because "budget too low"
        ↓
preference stored
```

এখানে তুমি বলতে পারবে:

> **“The intelligence isn't that my agent uses an LLM everywhere. The intelligence is knowing when not to use one.”**

এটাই আমার মতে তোমার project-এর সবচেয়ে শক্তিশালী technical story।

---

## Final stack — আমি আর পরিবর্তন করতাম না

```text
                    AUTOGIG
             Autonomous Opportunity OS

Frontend
└── Next.js + TypeScript
    ├── Tailwind
    ├── shadcn/ui
    └── Recharts

Backend
└── Node.js + TypeScript
    ├── Genkit
    ├── API Service
    └── Worker Service

Google Cloud
├── Cloud Run
├── Firestore
├── Pub/Sub
├── Cloud Scheduler
├── Secret Manager
├── Artifact Registry
└── Cloud Logging/Trace

AI
└── Gemini 3.5+ accepted model
    ├── Multimodal extraction
    ├── Semantic reasoning
    ├── Opportunity evaluation
    ├── Proposal generation
    └── Verification

External
├── Telegram
└── jobs.json (MVP/demo source)

Core Intelligence
├── Dedup
├── Rule Engine
├── Semantic Matching
├── Opportunity Scoring
├── Evidence RAG
├── Proposal Generator
├── Verification Gate
├── Counter-Proposal
├── HITL
└── Preference Learning
```

এটা **feature-maximal architecture নয়; reliability-maximal architecture**। সেটাই ৭ দিনের individual hackathon-এর জন্য বেশি গুরুত্বপূর্ণ।

আর সবচেয়ে ভালো ব্যাপার হলো, hackathon-এর official description-ও ঠিক এই direction-টাই চাচ্ছে—**standard chatbot নয়, background-এ asynchronousভাবে কাজ করা agent, complete workflow, action নেওয়া, এবং real specific problem solve করা।** ([All Things Agentic Hackathon][1])

তোমার submission-এর জন্য Google Cloud usage-ও খুব পরিষ্কারভাবে demonstrate করা যাবে; official rules অনুযায়ী app submission-এর সময় public/live থাকতেই হবে এমন নয়—Cloud deployment-এর প্রমাণ demo/repository-তে দেখানো যায়। ([All Things Agentic Hackathon][1])

**সুতরাং এখন আর architecture brainstorm করার stage না। এখন implementation stage।** প্রথম কাজ হবে Antigravity-তে উপরের **Architecture Lock prompt** দেওয়া, ওকে implementation-এর আগে plan তৈরি করতে বাধ্য করা।

[1]: https://allthingsagentichackathon.devpost.com/?ref_content=featured&ref_feature=challenge&ref_medium=portfolio&utm_source=chatgpt.com "All Things Agentic Hackathon: Ready, Set, Agent! Build next-generation agents that run in the background, handle the heavy lifting of massive datasets, and automate complex workflows asynchronously. - Devpost"
[2]: https://firebase.google.com/docs/genkit/?utm_source=chatgpt.com "Genkit  |  Firebase"
[3]: https://cloud.google.com/firestore/pricing?utm_source=chatgpt.com "Firestore pricing | Google Cloud"
[4]: https://cloud.google.com/run/pricing?utm_source=chatgpt.com "Cloud Run pricing | Google Cloud"
[5]: https://cloud.google.com/scheduler/pricing?authuser=19&hl=en&utm_source=chatgpt.com "Pricing  |  Cloud Scheduler  |  Google Cloud"
[6]: https://docs.cloud.google.com/scheduler/docs/schedule-run-cron-job-gcloud?utm_source=chatgpt.com "Quickstart: Schedule and run a cron job using the Google Cloud CLI  |  Cloud Scheduler  |  Google Cloud Documentation"
[7]: https://docs.cloud.google.com/run/docs/deploying?utm_source=chatgpt.com "Deploy container images to Cloud Run services  |  Google Cloud Documentation"
[8]: https://docs.cloud.google.com/run/docs/tips/nodejs?utm_source=chatgpt.com "Optimize Node.js applications for Cloud Run  |  Google Cloud Documentation"
[9]: https://docs.cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service?utm_source=chatgpt.com "Quickstart: Build and deploy a Node.js web app to Google Cloud with Cloud Run  |  Google Cloud Documentation"
