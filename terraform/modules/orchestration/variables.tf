# Orchestration module variables

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "Cloud region"
  type        = string
}

variable "cloud_provider" {
  description = "Cloud provider (aws or alibaba)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "IDs of the subnets"
  type        = list(string)
}

variable "registry_url" {
  description = "URL of the container registry"
  type        = string
}

variable "registry_secret" {
  description = "Name of the registry secret"
  type        = string
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

variable "port" {
  description = "Application port"
  type        = number
  default     = 3000
}

variable "node_env" {
  description = "Node.js environment"
  type        = string
  default     = "production"
}

variable "openrouter_api_key" {
  description = "OpenRouter API key for Qwen"
  type        = string
  sensitive   = true
}


variable "pexels_api_key" {
  description = "Pexels API key"
  type        = string
  sensitive   = true
}


variable "google_api_key" {
  description = "Google API key for sentiment, trends, and geocoding"
  type        = string
  sensitive   = true
}
