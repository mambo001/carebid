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

```bash
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
# DATABASE_URL is stored in Secret Manager; retrieve it or use the Neon dashboard.
bun run db:push

# Add the Redis URL manually after you create the free-tier Redis instance.
# Replace REDIS_URL with the value from the Redis console.
printf '%s' "$REDIS_URL" | gcloud secrets versions add carebid-redis-url --data-file=-
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
   printf '%s' "$REDIS_URL" | gcloud secrets versions add carebid-redis-url --data-file=-
   ```

5. Verify the secret was stored:

   ```bash
   gcloud secrets versions access latest --secret=carebid-redis-url
   ```

6. Re-deploy or refresh Cloud Run so the service picks up the secret value.

## What Terraform Creates

- Artifact Registry Docker repository for backend images
- Cloud Run service running the backend on port 8080
- Secret Manager secrets for `DATABASE_URL` and `REDIS_URL`
- Firebase project and web app
- Neon Postgres project, branch, and database
- Service account for the Cloud Run service
- IAM bindings for secret access and public Cloud Run invocation

## What Terraform Does Not Do

- Run Prisma migrations or manage database schema
- Build or push backend container images
- Configure Firebase sign-in providers
- Configure Firebase authorized domains
- Deploy the web frontend
- Provision Redis infrastructure

## Tearing Down

```bash
terraform destroy -var-file=environments/dev.tfvars
```

This removes all GCP resources. Neon resources are also destroyed.
