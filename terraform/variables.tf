# SWEN AI News Pipeline - Terraform Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "region" {
  description = "Cloud region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "cloud_provider" {
  description = "Cloud provider (aws or alibaba)"
  type        = string
  default     = "aws"
  
  validation {
    condition     = contains(["aws", "alibaba"], var.cloud_provider)
    error_message = "Cloud provider must be either 'aws' or 'alibaba'."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "swen-ai-news-pipeline"
}

variable "container_image" {
  description = "Container image for the application"
  type        = string
  default     = "swen-ai-news-pipeline:latest"
}

variable "replica_count" {
  description = "Number of container replicas"
  type        = number
  default     = 2
  
  validation {
    condition     = var.replica_count >= 1 && var.replica_count <= 10
    error_message = "Replica count must be between 1 and 10."
  }
}

variable "cpu_limit" {
  description = "CPU limit for containers"
  type        = string
  default     = "500m"
}

variable "memory_limit" {
  description = "Memory limit for containers"
  type        = string
  default     = "512Mi"
}

variable "enable_monitoring" {
  description = "Enable monitoring and logging"
  type        = bool
  default     = true
}

variable "enable_ssl" {
  description = "Enable SSL/TLS termination"
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "SSL certificate ARN (optional)"
  type        = string
  default     = ""
}

# Environment variables for the application
variable "node_env" {
  description = "Node.js environment"
  type        = string
  default     = "production"
}

variable "port" {
  description = "Application port"
  type        = number
  default     = 3000
}

# Secrets (should be provided via environment or secret management)
variable "openrouter_api_key" {
  description = "OpenRouter API key for Qwen"
  type        = string
  default     = ""
  sensitive   = true
}


variable "pexels_api_key" {
  description = "Pexels API key"
  type        = string
  default     = ""
  sensitive   = true
}


variable "google_api_key" {
  description = "Google API key for sentiment, trends, and geocoding"
  type        = string
  default     = ""
  sensitive   = true
}
