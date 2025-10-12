# Container orchestration module for SWEN AI News Pipeline
# Supports both AWS EKS and Alibaba Cloud ACK

terraform {
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

# AWS EKS Configuration
resource "aws_eks_cluster" "main" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  name     = "${var.project_name}-${var.environment}-cluster"
  role_arn = aws_iam_role.cluster[0].arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.cluster_AmazonEKSVPCResourceController,
  ]

  tags = {
    Name        = "${var.project_name}-${var.environment}-cluster"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_eks_node_group" "main" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  cluster_name    = aws_eks_cluster.main[0].name
  node_group_name = "${var.project_name}-${var.environment}-nodes"
  node_role_arn   = aws_iam_role.node[0].arn
  subnet_ids      = var.subnet_ids

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }

  instance_types = ["t3.medium"]

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]

  tags = {
    Name        = "${var.project_name}-${var.environment}-node-group"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Alibaba Cloud ACK Configuration
resource "alicloud_cs_managed_kubernetes" "main" {
  count = var.cloud_provider == "alibaba" ? 1 : 0
  
  name                 = "${var.project_name}-${var.environment}-cluster"
  cluster_spec         = "ack.pro.small"
  version              = "1.28.15-aliyun.1"
  new_nat_gateway      = true
  node_cidr_mask       = 25
  proxy_mode           = "ipvs"
  service_cidr         = "172.16.0.0/16"
  pod_vswitch_ids      = var.subnet_ids
  worker_vswitch_ids   = var.subnet_ids
  worker_instance_types = ["ecs.c6.large"]

  tags = {
    Name        = "${var.project_name}-${var.environment}-cluster"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Roles for AWS
resource "aws_iam_role" "cluster" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-cluster-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-cluster-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role" "node" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-node-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-node-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSClusterPolicy" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster[0].name
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSVPCResourceController" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.cluster[0].name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKSWorkerNodePolicy" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node[0].name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKS_CNI_Policy" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node[0].name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEC2ContainerRegistryReadOnly" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node[0].name
}

# Kubernetes Deployment
resource "kubernetes_deployment" "app" {
  metadata {
    name      = "${var.project_name}-${var.environment}-app"
    namespace = kubernetes_namespace.main.metadata[0].name
  }

  spec {
    replicas = var.replica_count

    selector {
      match_labels = {
        app = "${var.project_name}-${var.environment}-app"
      }
    }

    template {
      metadata {
        labels = {
          app = "${var.project_name}-${var.environment}-app"
        }
      }

      spec {
        container {
          image = var.container_image
          name  = "app"

          port {
            container_port = var.port
          }

          resources {
            limits = {
              cpu    = var.cpu_limit
              memory = var.memory_limit
            }
            requests = {
              cpu    = "250m"
              memory = "256Mi"
            }
          }

          env {
            name  = "NODE_ENV"
            value = var.node_env
          }

          env {
            name  = "PORT"
            value = tostring(var.port)
          }

          env {
            name = "OPENROUTER_API_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.app_secrets.metadata[0].name
                key  = "openrouter_api_key"
              }
            }
          }


          env {
            name = "PEXELS_API_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.app_secrets.metadata[0].name
                key  = "pexels_api_key"
              }
            }
          }


          env {
            name = "GOOGLE_API_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.app_secrets.metadata[0].name
                key  = "google_api_key"
              }
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = var.port
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = var.port
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }
        }

        image_pull_secrets {
          name = var.registry_secret
        }
      }
    }
  }
}

resource "kubernetes_service" "app" {
  metadata {
    name      = "${var.project_name}-${var.environment}-service"
    namespace = kubernetes_namespace.main.metadata[0].name
  }

  spec {
    selector = {
      app = "${var.project_name}-${var.environment}-app"
    }

    port {
      port        = 80
      target_port = var.port
    }

    type = "ClusterIP"
  }
}

resource "kubernetes_namespace" "main" {
  metadata {
    name = "${var.project_name}-${var.environment}"
  }
}

resource "kubernetes_secret" "app_secrets" {
  metadata {
    name      = "${var.project_name}-${var.environment}-secrets"
    namespace = kubernetes_namespace.main.metadata[0].name
  }

  data = {
    openrouter_api_key = var.openrouter_api_key
    pexels_api_key     = var.pexels_api_key
    google_api_key     = var.google_api_key
  }

  type = "Opaque"
}
