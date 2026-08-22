# AutoGig: Google Cloud Setup Guide (Windows PowerShell)

This document outlines the required steps to provision the infrastructure for AutoGig on a Windows development environment.

**IMPORTANT PRE-REQUISITE**: The `gcloud` CLI must be installed and authenticated before proceeding.
If `gcloud` is unavailable, please see the **Windows Installation/Authentication Checklist** at the end of this document.

**METHODOLOGY**: Every step follows the **CHECK ? CREATE IF MISSING ? VERIFY** pattern to ensure idempotency. Do not blindly recreate resources.

## 1. Project Initialization

Define your environment variables in your PowerShell session:

```powershell
$PROJECT_ID = "your-gcp-project-id"
$REGION = "us-central1"
```

## 2. Enable Required APIs

**CHECK & ENABLE:**
```powershell
$REQUIRED_APIS = @(
    "run.googleapis.com",
    "firestore.googleapis.com",
    "pubsub.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
    "aiplatform.googleapis.com",
    "storage.googleapis.com",
    "cloudresourcemanager.googleapis.com"
)

foreach ($api in $REQUIRED_APIS) {
    $isEnabled = gcloud services list --enabled --filter="name:$api" --format="value(name)"
    if (-not $isEnabled) {
        Write-Host "Enabling $api..."
        gcloud services enable $api
    } else {
        Write-Host "$api is already enabled."
    }
}
```
**VERIFY:**
```powershell
gcloud services list --enabled
```

## 3. Firestore Configuration

**CHECK & CREATE:**
```powershell
$db = gcloud firestore databases list --format="value(name)"
if (-not $db) {
    Write-Host "Creating Firestore in Native Mode..."
    gcloud firestore databases create --location=$REGION --type=firestore-native
} else {
    Write-Host "Firestore database already exists: $db"
}
```
*(Note: We use native KNN vector search. Do NOT provision Vertex AI Vector Search.)*

## 4. IAM Service Accounts (Base Creation)

Create the required service accounts before assigning them to resources.

```powershell
$SAs = @("ingestion-worker-sa", "opportunity-worker-sa", "web-api-sa", "pubsub-push-sa", "scheduler-sa")

foreach ($sa in $SAs) {
    $email = "$sa@$PROJECT_ID.iam.gserviceaccount.com"
    $exists = gcloud iam service-accounts list --filter="email:$email" --format="value(email)"
    if (-not $exists) {
        Write-Host "Creating service account $sa..."
        gcloud iam service-accounts create $sa
    } else {
        Write-Host "Service account $sa already exists."
    }
}

$INGEST_EMAIL = "ingestion-worker-sa@$PROJECT_ID.iam.gserviceaccount.com"
$OPP_EMAIL = "opportunity-worker-sa@$PROJECT_ID.iam.gserviceaccount.com"
$WEB_EMAIL = "web-api-sa@$PROJECT_ID.iam.gserviceaccount.com"
$PUSH_SA_EMAIL = "pubsub-push-sa@$PROJECT_ID.iam.gserviceaccount.com"
$SCHEDULER_EMAIL = "scheduler-sa@$PROJECT_ID.iam.gserviceaccount.com"
```

## 5. Pub/Sub Configuration

**CHECK & CREATE TOPIC:**
```powershell
$TOPIC_NAME = "autogig-opportunity-events"
$topic = gcloud pubsub topics list --filter="name:projects/$PROJECT_ID/topics/$TOPIC_NAME" --format="value(name)"
if (-not $topic) {
    Write-Host "Creating topic $TOPIC_NAME..."
    gcloud pubsub topics create $TOPIC_NAME
} else {
    Write-Host "Topic $TOPIC_NAME already exists."
}
```

**PUBLISHER PERMISSIONS:**
```powershell
gcloud pubsub topics add-iam-policy-binding $TOPIC_NAME `
  --member="serviceAccount:$INGEST_EMAIL" `
  --role="roles/pubsub.publisher"
```

**CREATE PUSH SUBSCRIPTION:**
*(Note: The Google-managed Pub/Sub Service Agent already has `roles/iam.serviceAccountTokenCreator` by default in modern GCP configurations. Do not manually grant it unless troubleshooting reveals it was revoked.)*

```powershell
$SUB_NAME = "opportunity-worker-sub"
$sub = gcloud pubsub subscriptions list --filter="name:projects/$PROJECT_ID/subscriptions/$SUB_NAME" --format="value(name)"
if (-not $sub) {
    Write-Host "Creating subscription $SUB_NAME..."
    gcloud pubsub subscriptions create $SUB_NAME `
      --topic=$TOPIC_NAME `
      --push-endpoint="https://<OPPORTUNITY_WORKER_URL>/pubsub/process" `
      --push-auth-service-account=$PUSH_SA_EMAIL
} else {
    Write-Host "Subscription $SUB_NAME already exists."
}
```

## 6. Secret Manager Configuration

**Important Note on Secrets:**
- Local development: `.env` or `.env.local` files are allowed only if they are ignored by Git. Never commit real values.
- Production: Use Secret Manager for Telegram secrets. Use ADC/Vertex AI for Gemini; `GEMINI_API_KEY` is not required in production.

**CHECK & CREATE SECRETS:**
Do NOT use dummy values. Create the resource first, then securely add a version interactively.

```powershell
$SECRETS = @("TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET")
foreach ($secret in $SECRETS) {
    $exists = gcloud secrets list --filter="name:$secret" --format="value(name)"
    if (-not $exists) {
        Write-Host "Creating secret resource $secret..."
        gcloud secrets create $secret
        Write-Host "Please add the real secret value interactively:"
        gcloud secrets versions add $secret --data-file=- 
    } else {
        Write-Host "Secret resource $secret already exists."
    }
}
```

**LEAST PRIVILEGE SECRET ACCESSOR (Resource-level):**
```powershell
gcloud secrets add-iam-policy-binding TELEGRAM_BOT_TOKEN `
  --member="serviceAccount:$OPP_EMAIL" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding TELEGRAM_WEBHOOK_SECRET `
  --member="serviceAccount:$WEB_EMAIL" `
  --role="roles/secretmanager.secretAccessor"
```

## 7. Cloud Storage Configuration

**CHECK & CREATE BUCKET:**
```powershell
$BUCKET_NAME = "$PROJECT_ID-evidence-vault"
$bucket = gcloud storage ls gs://$BUCKET_NAME 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating bucket $BUCKET_NAME..."
    gcloud storage buckets create gs://$BUCKET_NAME --location=$REGION
} else {
    Write-Host "Bucket $BUCKET_NAME already exists."
}
```

**LEAST PRIVILEGE IAM FOR CLOUD STORAGE:**
```powershell
# Web API SA Permissions (upload and view)
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME `
  --member="serviceAccount:$WEB_EMAIL" `
  --role="roles/storage.objectCreator"

gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME `
  --member="serviceAccount:$WEB_EMAIL" `
  --role="roles/storage.objectViewer"

# Opportunity Worker SA Permissions (view only)
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME `
  --member="serviceAccount:$OPP_EMAIL" `
  --role="roles/storage.objectViewer"
```

## 8. Firestore and Vertex AI IAM

**Project-Level IAM for Datastore and AI Platform:**
```powershell
# Opportunity Worker
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$OPP_EMAIL" `
  --role="roles/datastore.user"
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$OPP_EMAIL" `
  --role="roles/aiplatform.user"

# Web API
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$WEB_EMAIL" `
  --role="roles/datastore.user"
```

## 9. Cloud Run & Scheduler Invocation Configuration

*(Note: Run these bindings AFTER deploying the respective Cloud Run services/jobs)*

**PUB/SUB TO OPPORTUNITY WORKER (Service):**
```powershell
# Only grant run.invoker explicitly on the target service
gcloud run services add-iam-policy-binding opportunity-worker `
  --region=$REGION `
  --member="serviceAccount:$PUSH_SA_EMAIL" `
  --role="roles/run.invoker"
```

**SCHEDULER TO INGESTION WORKER (Job):**
```powershell
# Only grant run.invoker explicitly on the target job
gcloud run jobs add-iam-policy-binding ingestion-worker `
  --region=$REGION `
  --member="serviceAccount:$SCHEDULER_EMAIL" `
  --role="roles/run.invoker"
```

---

## Appendix: Windows Installation & Authentication Checklist for gcloud

If `gcloud` is not recognized, STOP infrastructure provisioning and complete these steps:

1. [ ] **Download the Google Cloud CLI installer** for Windows from [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install).
2. [ ] **Run the installer** and ensure the option to add `gcloud` to your `PATH` is checked.
3. [ ] **Restart your PowerShell terminal** so it recognizes the updated `PATH`.
4. [ ] **Initialize the SDK**:
   ```powershell
   gcloud init
   ```
5. [ ] **Login and Set Application Default Credentials (ADC)** (Crucial for Genkit/Vertex AI local testing):
   ```powershell
   gcloud auth application-default login
   ```
6. [ ] **Verify Installation**:
   ```powershell
   gcloud --version
   gcloud auth list
   gcloud config get-value project
   ```
