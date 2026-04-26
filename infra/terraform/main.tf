# ============================================================================
# Required GCP APIs
# ============================================================================

resource "google_project_service" "run" {
  project = var.gcp_project_id
  service = "run.googleapis.com"
}

resource "google_project_service" "artifactregistry" {
  project = var.gcp_project_id
  service = "artifactregistry.googleapis.com"
}

resource "google_project_service" "secretmanager" {
  project = var.gcp_project_id
  service = "secretmanager.googleapis.com"
}

resource "google_project_service" "firebase" {
  project = var.gcp_project_id
  service = "firebase.googleapis.com"
}

resource "google_project_service" "identitytoolkit" {
  project = var.gcp_project_id
  service = "identitytoolkit.googleapis.com"
}

resource "google_project_service" "iam" {
  project = var.gcp_project_id
  service = "iam.googleapis.com"
}

# ============================================================================
# Firebase
# ============================================================================

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.gcp_project_id
}

resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.gcp_project_id
  display_name = "CareBid Web"

  depends_on = [google_firebase_project.default]
}

data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  web_app_id = google_firebase_web_app.default.app_id
}

# ============================================================================
# Neon Postgres
# ============================================================================

resource "neon_project" "default" {
  name                      = "carebid"
  history_retention_seconds = 21600
}

resource "neon_role" "owner" {
  project_id = neon_project.default.id
  branch_id  = neon_project.default.default_branch_id
  name       = "carebid"
}

resource "neon_database" "default" {
  project_id = neon_project.default.id
  branch_id  = neon_project.default.default_branch_id
  name       = "carebid"
  owner_name = neon_role.owner.name
}

data "neon_branch_role_password" "owner" {
  project_id = neon_project.default.id
  branch_id  = neon_project.default.default_branch_id
  role_name  = neon_role.owner.name
}

# ============================================================================
# Artifact Registry
# ============================================================================

resource "google_artifact_registry_repository" "backend" {
  project       = var.gcp_project_id
  location      = var.gcp_region
  repository_id = "carebid-backend"
  format        = "DOCKER"

  depends_on = [google_project_service.artifactregistry]
}

# ============================================================================
# Service Account for Cloud Run
# ============================================================================

resource "google_service_account" "backend" {
  project      = var.gcp_project_id
  account_id   = "carebid-backend"
  display_name = "CareBid Backend Cloud Run Service Account"
}

# ============================================================================
# Secret Manager
# ============================================================================

resource "google_secret_manager_secret" "database_url" {
  project   = var.gcp_project_id
  secret_id = "carebid-database-url"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${neon_role.owner.name}:${data.neon_branch_role_password.owner.password}@${neon_project.default.database_host}/${neon_database.default.name}?sslmode=require"
}

resource "google_secret_manager_secret" "redis_url" {
  project   = var.gcp_project_id
  secret_id = "carebid-redis-url"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "redis_url_placeholder" {
  secret      = google_secret_manager_secret.redis_url.id
  secret_data = "redis://placeholder:6379"
}

# Grant the service account access to read secrets
resource "google_secret_manager_secret_iam_member" "database_url" {
  project   = var.gcp_project_id
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_secret_manager_secret_iam_member" "redis_url" {
  project   = var.gcp_project_id
  secret_id = google_secret_manager_secret.redis_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

# ============================================================================
# Cloud Run
# ============================================================================

resource "google_cloud_run_v2_service" "backend" {
  project  = var.gcp_project_id
  name     = "carebid-backend"
  location = var.gcp_region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend.email

    containers {
      image = var.backend_image

      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "FIREBASE_PROJECT_ID"
        value = var.firebase_project_id
      }

      env {
        name  = "ALLOWED_ORIGINS"
        value = var.allowed_origins
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "REDIS_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.redis_url.secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  depends_on = [
    google_project_service.run,
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_version.redis_url_placeholder,
  ]
}

# Allow unauthenticated access to the backend API
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.gcp_project_id
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
