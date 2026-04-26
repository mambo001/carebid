# CareBid Infrastructure

Terraform-based infrastructure for the CareBid backend on GCP.

## Prerequisites

- Terraform >= 1.5.0
- A GCP project with billing enabled
- A Neon account with an API key
- `gcloud` CLI installed and authenticated

## Quick Start

```bash
cd infra/terraform

# Initialize Terraform
terraform init

# First apply uses a placeholder backend image
terraform plan -var-file=environments/dev.tfvars

# Apply
terraform apply -var-file=environments/dev.tfvars
```

## First Apply Flow

1. Keep `backend_image = "us-docker.pkg.dev/cloudrun/container/hello"` for the first apply.
2. Run `terraform apply -var-file=environments/dev.tfvars`.
3. Build and push the real backend image to Artifact Registry.
4. Update `backend_image` in `environments/dev.tfvars` to the pushed image.
5. Run `terraform apply -var-file=environments/dev.tfvars` again.

## Deployment After Apply

Run these commands from the repository root.

```bash
GCP_PROJECT=$(terraform -chdir=infra/terraform output -raw firebase_project_id)

# Build the backend Docker image
docker build -t carebid-backend -f apps/backend/Dockerfile .

# Tag for Artifact Registry
docker tag carebid-backend \
  $(terraform -chdir=infra/terraform output -raw artifact_registry_repo)/carebid-backend:latest

# Authenticate Docker to GCP
gcloud auth configure-docker $(terraform -chdir=infra/terraform output -raw artifact_registry_repo | cut -d/ -f1)

# Push the image
docker push $(terraform -chdir=infra/terraform output -raw artifact_registry_repo)/carebid-backend:latest

# Prisma schema push against the provisioned Neon database.
# Reads DATABASE_URL from Secret Manager into the command environment without printing it.
DATABASE_URL=$(gcloud secrets versions access latest --secret=carebid-database-url --project="$GCP_PROJECT") bun run db:push

# Add the Redis URL manually after you create the free-tier Redis instance.
# Replace REDIS_URL with the value from the Redis console.
printf '%s' "$REDIS_URL" | gcloud secrets versions add carebid-redis-url --data-file=- --project="$GCP_PROJECT"
```

## Redis Setup (Manual)

1. Create a free-tier Redis database in your Redis provider console.
2. Copy the connection string or host, port, and password.
3. Build a Redis URL in this form:

   ```text
   redis://default:<password>@<host>:<port>
   ```

4. Add it to Secret Manager:

   ```bash
   GCP_PROJECT=$(terraform -chdir=infra/terraform output -raw firebase_project_id)
   printf '%s' "$REDIS_URL" | gcloud secrets versions add carebid-redis-url --data-file=- --project="$GCP_PROJECT"
   ```

5. Verify the secret was stored:

   ```bash
   GCP_PROJECT=$(terraform -chdir=infra/terraform output -raw firebase_project_id)
   gcloud secrets versions list carebid-redis-url --limit=1 --project="$GCP_PROJECT"
   ```

6. Re-deploy or refresh Cloud Run so the service picks up the secret value.

## Web Deployment

Terraform provisions the Firebase Hosting site and emits the production web build
configuration. Export those values before building the web app:

```bash
cd infra/terraform
export VITE_API_BASE_URL=$(terraform output -raw backend_url)
export VITE_FIREBASE_API_KEY=$(terraform output -raw firebase_api_key)
export VITE_FIREBASE_AUTH_DOMAIN=$(terraform output -raw firebase_auth_domain)
export VITE_FIREBASE_PROJECT_ID=$(terraform output -raw firebase_project_id)
export VITE_FIREBASE_APP_ID=$(terraform output -raw firebase_app_id)
cd ../..
bun run --filter @carebid/web build
npx firebase-tools deploy --only hosting --project "$VITE_FIREBASE_PROJECT_ID"
```

The explicit build command is useful for verifying the production bundle before
deployment. `firebase deploy` also runs the `firebase.json` predeploy build.
The `.firebaserc` default project is a convenience for `carebid-demo`; passing
`--project` from Terraform output is safer for production deploys.

After Terraform outputs `firebase_hosting_url`, add that origin to
`allowed_origins` in `infra/terraform/environments/dev.tfvars` and re-apply
Terraform:

```bash
cd infra/terraform
terraform apply -var-file=environments/dev.tfvars
```

## What Terraform Creates

- Artifact Registry Docker repository for backend images
- Cloud Run service running the backend on port 8080
- Secret Manager secrets for `DATABASE_URL` and `REDIS_URL`
- Firebase project and web app
- Firebase Hosting site for the web app
- Neon Postgres project, branch, and database
- Service account for the Cloud Run service
- IAM bindings for secret access and public Cloud Run invocation

## What Terraform Does Not Do

- Run Prisma migrations or manage database schema
- Build or push backend container images
- Configure Firebase sign-in providers
- Configure Firebase authorized domains
- Upload Firebase Hosting static assets
- Provision Redis infrastructure

## Tearing Down

```bash
terraform destroy -var-file=environments/dev.tfvars
```

This removes all GCP resources. Neon resources are also destroyed.
