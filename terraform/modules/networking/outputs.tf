# Networking module outputs

output "vpc_id" {
  description = "ID of the VPC"
  value = var.cloud_provider == "aws" ? aws_vpc.main[0].id : alicloud_vpc.main[0].id
}

output "subnet_ids" {
  description = "IDs of the public subnets"
  value = var.cloud_provider == "aws" ? aws_subnet.public[*].id : alicloud_vswitch.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value = var.cloud_provider == "aws" ? aws_subnet.private[*].id : alicloud_vswitch.private[*].id
}

output "security_group_id" {
  description = "ID of the security group"
  value = var.cloud_provider == "aws" ? aws_security_group.main[0].id : alicloud_security_group.main[0].id
}

output "internet_gateway_id" {
  description = "ID of the internet gateway (AWS only)"
  value = var.cloud_provider == "aws" ? aws_internet_gateway.main[0].id : null
}
