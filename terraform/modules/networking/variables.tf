# Networking module variables

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
