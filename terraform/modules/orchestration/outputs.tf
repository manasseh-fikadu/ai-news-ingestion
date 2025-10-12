# Orchestration module outputs

output "cluster_name" {
  description = "Name of the Kubernetes cluster"
  value = var.cloud_provider == "aws" ? aws_eks_cluster.main[0].name : alicloud_cs_managed_kubernetes.main[0].name
}

output "cluster_endpoint" {
  description = "Endpoint of the Kubernetes cluster"
  value = var.cloud_provider == "aws" ? aws_eks_cluster.main[0].endpoint : alicloud_cs_managed_kubernetes.main[0].connections.api_server_internet
}

output "cluster_ca_certificate" {
  description = "CA certificate of the Kubernetes cluster"
  value = var.cloud_provider == "aws" ? aws_eks_cluster.main[0].certificate_authority[0].data : alicloud_cs_managed_kubernetes.main[0].certificate_authority
}

output "target_group_arn" {
  description = "ARN of the target group for load balancer"
  value = var.cloud_provider == "aws" ? aws_lb_target_group.main[0].arn : null
}

output "service_name" {
  description = "Name of the Kubernetes service"
  value = kubernetes_service.app.metadata[0].name
}

output "namespace" {
  description = "Name of the Kubernetes namespace"
  value = kubernetes_namespace.main.metadata[0].name
}
