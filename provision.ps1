$ErrorActionPreference = "Stop"
$env:PATH += ";C:\Users\omars\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

$PROJECT_ID = "autogig-omarsunny18"
$REGION = "us-central1"

Write-Host "--- PHASE 0B PROVISIONING ---"

# 1. APIs
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
        gcloud services enable $api --project $PROJECT_ID
    } else {
        Write-Host "$api is already enabled."
    }
}

# 2. Firestore
$db = gcloud firestore databases list --project $PROJECT_ID --format="value(name)"
if (-not $db) {
    Write-Host "Creating Firestore in Native Mode..."
    gcloud firestore databases create --location=$REGION --type=firestore-native --project $PROJECT_ID
} else {
    Write-Host "Firestore database already exists: $db"
}

# 3. Service Accounts
$SAs = @("ingestion-worker-sa", "opportunity-worker-sa", "web-api-sa", "pubsub-push-sa", "scheduler-sa")

foreach ($sa in $SAs) {
    $email = "$sa@$PROJECT_ID.iam.gserviceaccount.com"
    $exists = gcloud iam service-accounts list --project $PROJECT_ID --filter="email:$email" --format="value(email)"
    if (-not $exists) {
        Write-Host "Creating service account $sa..."
        gcloud iam service-accounts create $sa --project $PROJECT_ID
    } else {
        Write-Host "Service account $sa already exists."
    }
}

$INGEST_EMAIL = "ingestion-worker-sa@$PROJECT_ID.iam.gserviceaccount.com"
$OPP_EMAIL = "opportunity-worker-sa@$PROJECT_ID.iam.gserviceaccount.com"
$WEB_EMAIL = "web-api-sa@$PROJECT_ID.iam.gserviceaccount.com"
$PUSH_SA_EMAIL = "pubsub-push-sa@$PROJECT_ID.iam.gserviceaccount.com"
$SCHEDULER_EMAIL = "scheduler-sa@$PROJECT_ID.iam.gserviceaccount.com"

# 4. Pub/Sub Topic
$TOPIC_NAME = "autogig-opportunity-events"
$topic = gcloud pubsub topics list --project $PROJECT_ID --filter="name:projects/$PROJECT_ID/topics/$TOPIC_NAME" --format="value(name)"
if (-not $topic) {
    Write-Host "Creating topic $TOPIC_NAME..."
    gcloud pubsub topics create $TOPIC_NAME --project $PROJECT_ID
} else {
    Write-Host "Topic $TOPIC_NAME already exists."
}

# Pub/Sub Publisher IAM
Write-Host "Configuring Pub/Sub Topic IAM..."
gcloud pubsub topics add-iam-policy-binding $TOPIC_NAME `
  --project $PROJECT_ID `
  --member="serviceAccount:$INGEST_EMAIL" `
  --role="roles/pubsub.publisher"

# 5. Secret Manager
$SECRETS = @("TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET")
foreach ($secret in $SECRETS) {
    $exists = gcloud secrets list --project $PROJECT_ID --filter="name:$secret" --format="value(name)"
    if (-not $exists) {
        Write-Host "Creating secret resource $secret (resource ONLY)..."
        gcloud secrets create $secret --project $PROJECT_ID
        Write-Host "Note: Secret $secret created without a version. A real value must be added securely later."
    } else {
        Write-Host "Secret resource $secret already exists."
    }
}

# Secret IAM
Write-Host "Configuring Secret Manager IAM..."
gcloud secrets add-iam-policy-binding TELEGRAM_BOT_TOKEN `
  --project $PROJECT_ID `
  --member="serviceAccount:$OPP_EMAIL" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding TELEGRAM_WEBHOOK_SECRET `
  --project $PROJECT_ID `
  --member="serviceAccount:$WEB_EMAIL" `
  --role="roles/secretmanager.secretAccessor"

# 6. Cloud Storage
$BUCKET_NAME = "$PROJECT_ID-evidence-vault"
$bucket = gcloud storage ls gs://$BUCKET_NAME 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating bucket $BUCKET_NAME..."
    gcloud storage buckets create gs://$BUCKET_NAME --project $PROJECT_ID --location=$REGION
} else {
    Write-Host "Bucket $BUCKET_NAME already exists."
}

# Storage IAM
Write-Host "Configuring Storage IAM..."
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME `
  --member="serviceAccount:$WEB_EMAIL" `
  --role="roles/storage.objectCreator"

gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME `
  --member="serviceAccount:$WEB_EMAIL" `
  --role="roles/storage.objectViewer"

gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME `
  --member="serviceAccount:$OPP_EMAIL" `
  --role="roles/storage.objectViewer"

# 7. Project-Level IAM (Firestore, Vertex AI)
Write-Host "Configuring Project-Level IAM..."
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$OPP_EMAIL" `
  --role="roles/datastore.user"
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$OPP_EMAIL" `
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$WEB_EMAIL" `
  --role="roles/datastore.user"

Write-Host "--- VERIFICATION COMPLETE ---"
