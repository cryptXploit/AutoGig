# Cloud Migration Path

This document outlines how the local adapters built during Phase A-F will be replaced by Google Cloud native managed services during Phase G.

The `@autogig/core` domain boundaries and `@autogig/engine` logic **will not change**. Only the dependency injection bindings in the application entry points will swap adapters.

| Local Adapter | Google Cloud Native Equivalent | Description |
|---|---|---|
| `SQLiteOpportunityRepository` | `FirestoreOpportunityRepository` | Opportunities migrate to Firestore documents. |
| `SQLiteEventBus` | `PubSubEventBus` | Asynchronous worker processing uses Cloud Pub/Sub topics. |
| `LocalScheduler` | Cloud Scheduler | Replaces node `setInterval` with serverless CRON pushing to PubSub. |
| `LocalSimilarityRetriever` | `GeminiKNNRetriever` | TF-IDF replaced by Gemini Embeddings (`text-embedding-004`) + Firestore KNN search. |
| `SQLiteEvidenceRepository` | `FirestoreEvidenceRepository` | Metadata in Firestore, raw bytes in GCS (Google Cloud Storage). |
| `EvidenceIngester` | `CloudStorageEventIngester` | Event-driven ingestion when a file is uploaded to GCS. |

Because all repositories implement explicit interfaces in `packages/core/src/interfaces`, the cloud migration is strictly an infrastructural swap.
