# API Architecture

The `web-api` acts as the security and logic gate between the Next.js frontend and the local SQLite database.

## Endpoints
- `GET /api/dashboard/stats`: Aggregated state counts.
- `GET /api/opportunities`: Paginated summary of opportunities.
- `GET /api/opportunities/:id`: Full hydration of Opportunity, Evaluation, Proposal, and Evidence.
- `POST /api/opportunities/:id/approve`: Validates `PENDING_APPROVAL` and `VERIFIED` proposal. Sets `APPROVED`.
- `POST /api/opportunities/:id/counter`: Validates `PENDING_APPROVAL`. Sets `COUNTERED`.
- `POST /api/opportunities/:id/reject`: Transitions to `REJECTED`. Accepts structured `reasonCategory`.
- `GET /api/preferences`: Loads user profiles and preferences.
- `GET /api/runs`: Fetch background worker runs.

## State Safety
No API endpoint updates database status arbitrarily. Endpoints invoke `canTransition()` from the core state machine schema. If an action is invalid, a structured 400 error is returned safely without stack traces.
