variable "gcp_project_id" {
  description = "GCP project ID where resources are created"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for regional resources"
  type        = string
  default     = "us-central1"
}

variable "neon_api_key" {
  description = "Neon API key"
  type        = string
  sensitive   = true
}

variable "allowed_origins" {
  description = "Comma-separated list of allowed CORS origins for the backend"
  type        = string
  default     = "http://localhost:5173"
}

variable "backend_image" {
  description = "Container image for the backend Cloud Run service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}
