# Networking module for SWEN AI News Pipeline
# Supports both AWS and Alibaba Cloud

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

# AWS VPC Configuration
resource "aws_vpc" "main" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_internet_gateway" "main" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  vpc_id = aws_vpc.main[0].id

  tags = {
    Name        = "${var.project_name}-${var.environment}-igw"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_subnet" "public" {
  count = var.cloud_provider == "aws" ? 2 : 0
  
  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available[0].names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    Type        = "public"
  }
}

resource "aws_subnet" "private" {
  count = var.cloud_provider == "aws" ? 2 : 0
  
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available[0].names[count.index]

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    Type        = "private"
  }
}

resource "aws_route_table" "public" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_route_table_association" "public" {
  count = var.cloud_provider == "aws" ? 2 : 0
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Alibaba Cloud VPC Configuration
resource "alicloud_vpc" "main" {
  count = var.cloud_provider == "alibaba" ? 1 : 0
  
  vpc_name   = "${var.project_name}-${var.environment}-vpc"
  cidr_block = "10.0.0.0/16"
}

resource "alicloud_vswitch" "public" {
  count = var.cloud_provider == "alibaba" ? 2 : 0
  
  vpc_id     = alicloud_vpc.main[0].id
  cidr_block = "10.0.${count.index + 1}.0/24"
  zone_id    = data.alicloud_zones.available[0].zones[count.index].id
}

resource "alicloud_vswitch" "private" {
  count = var.cloud_provider == "alibaba" ? 2 : 0
  
  vpc_id     = alicloud_vpc.main[0].id
  cidr_block = "10.0.${count.index + 10}.0/24"
  zone_id    = data.alicloud_zones.available[0].zones[count.index]
}

# Data sources
data "aws_availability_zones" "available" {
  count = var.cloud_provider == "aws" ? 1 : 0
  state = "available"
}

data "alicloud_zones" "available" {
  count = var.cloud_provider == "alibaba" ? 1 : 0
}

# Security Groups
resource "aws_security_group" "main" {
  count = var.cloud_provider == "aws" ? 1 : 0
  
  name_prefix = "${var.project_name}-${var.environment}-"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "alicloud_security_group" "main" {
  count = var.cloud_provider == "alibaba" ? 1 : 0
  
  name   = "${var.project_name}-${var.environment}-sg"
  vpc_id = alicloud_vpc.main[0].id
}

resource "alicloud_security_group_rule" "ingress_http" {
  count = var.cloud_provider == "alibaba" ? 1 : 0
  
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "80/80"
  priority          = 1
  security_group_id = alicloud_security_group.main[0].id
  cidr_ip           = "0.0.0.0/0"
}

resource "alicloud_security_group_rule" "ingress_https" {
  count = var.cloud_provider == "alibaba" ? 1 : 0
  
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "443/443"
  priority          = 1
  security_group_id = alicloud_security_group.main[0].id
  cidr_ip           = "0.0.0.0/0"
}

resource "alicloud_security_group_rule" "ingress_app" {
  count = var.cloud_provider == "alibaba" ? 1 : 0
  
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "3000/3000"
  priority          = 1
  security_group_id = alicloud_security_group.main[0].id
  cidr_ip           = "10.0.0.0/16"
}

resource "alicloud_security_group_rule" "egress_all" {
  count = var.cloud_provider == "alibaba" ? 1 : 0
  
  type              = "egress"
  ip_protocol       = "all"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "-1/-1"
  priority          = 1
  security_group_id = alicloud_security_group.main[0].id
  cidr_ip           = "0.0.0.0/0"
}
