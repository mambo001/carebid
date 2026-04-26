output "backend_url" {
  description = "Cloud Run backend service URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "artifact_registry_repo" {
  description = "Artifact Registry Docker repository path"
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.backend.repository_id}"
}

output "firebase_api_key" {
  description = "Firebase web app API key"
  value       = data.google_firebase_web_app_config.default.api_key
  sensitive   = true
}

output "firebase_app_id" {
  description = "Firebase web app ID"
  value       = google_firebase_web_app.default.app_id
}

output "firebase_auth_domain" {
  description = "Firebase auth domain"
  value       = data.google_firebase_web_app_config.default.auth_domain
}

output "firebase_project_id" {
  description = "Firebase project ID"
  value       = var.gcp_project_id
}

output "firebase_hosting_url" {
  description = "Firebase Hosting URL for the web app"
  value       = "https://${google_firebase_hosting_site.web.site_id}.web.app"
}
