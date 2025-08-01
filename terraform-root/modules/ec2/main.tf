provider "aws" {
  region = var.aws_region
}

# Generate SSH Key Pair
resource "tls_private_key" "ec2_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "ec2_key_pair" {
  key_name   = "${var.instance_name}-key"
  public_key = tls_private_key.ec2_key.public_key_openssh
}

# Create Security Group
resource "aws_security_group" "ec2_sg" {
  name_prefix = "${var.instance_name}-sg"
  
  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Node.js default port
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Python Flask default port
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.instance_name}-security-group"
  }
}

# Create EC2 Instance
resource "aws_instance" "ec2_vm" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name              = aws_key_pair.ec2_key_pair.key_name
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  
  # User data script for initial setup
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y git docker
    
    # Install Node.js
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
    
    # Install Python3 and pip
    yum install -y python3 python3-pip
    
    # Start Docker
    service docker start
    usermod -a -G docker ec2-user
    
    # Create app directory
    mkdir -p /home/ec2-user/app
    chown ec2-user:ec2-user /home/ec2-user/app
  EOF

  tags = {
    Name = var.instance_name
    Type = "GitHubActions-Provisioned"
    Environment = "Development"
  }
}

# Store private key in SSM Parameter Store (encrypted)
resource "aws_ssm_parameter" "private_key" {
  name  = "/${var.instance_name}/private-key"
  type  = "SecureString"
  value = tls_private_key.ec2_key.private_key_pem
  
  tags = {
    Name = "${var.instance_name}-private-key"
  }
}
