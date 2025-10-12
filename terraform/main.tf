# SWEN AI News Pipeline - Terraform Configuration
# Supports both AWS and Alibaba Cloud deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    alicloud = {
      source  = "aliyun/alicloud"
      version = "~> 1.200"
    }
  }
}

# Local variables for configuration
locals {
  project_name = "swen-ai-news-pipeline"
  environment  = var.environment
  region       = var.region
  cloud_provider = var.cloud_provider
}

# Data sources
data "aws_caller_identity" "current" {
  count = local.cloud_provider == "aws" ? 1 : 0
}

data "alicloud_account" "current" {
  count = local.cloud_provider == "alibaba" ? 1 : 0
}

# VPC and Networking
module "networking" {
  source = "./modules/networking"
  
  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  cloud_provider = local.cloud_provider
}

# Container Registry
module "registry" {
  source = "./modules/registry"
  
  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  cloud_provider = local.cloud_provider
}

# Container Orchestration
module "orchestration" {
  source = "./modules/orchestration"
  
  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  cloud_provider = local.cloud_provider
  
  vpc_id = module.networking.vpc_id
  subnet_ids = module.networking.subnet_ids
  
  registry_url = module.registry.registry_url
  registry_secret = module.registry.registry_secret
}

# Load Balancer
module "load_balancer" {
  source = "./modules/load_balancer"
  
  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  cloud_provider = local.cloud_provider
  
  vpc_id = module.networking.vpc_id
  subnet_ids = module.networking.subnet_ids
  target_group_arn = module.orchestration.target_group_arn
}

# Monitoring and Logging
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  cloud_provider = local.cloud_provider
  
  cluster_name = module.orchestration.cluster_name
  service_name = module.orchestration.service_name
}

# Outputs
output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = module.load_balancer.url
}

output "cluster_name" {
  description = "Name of the container cluster"
  value       = module.orchestration.cluster_name
}

output "registry_url" {
  description = "URL of the container registry"
  value       = module.registry.registry_url
}
