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
    set -e
    
    # Update system
    yum update -y
    
    # Install basic packages
    yum install -y git docker wget curl gcc-c++ make
    
    # Install Node.js via official binary for ec2-user (Amazon Linux 2 compatible)
    sudo -u ec2-user bash -c '
      cd /home/ec2-user
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
      export NVM_DIR="/home/ec2-user/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
      nvm install 16.20.2
      nvm use 16.20.2
      nvm alias default 16.20.2
      
      # Add to .bashrc for persistence
      echo "export NVM_DIR=\"/home/ec2-user/.nvm\"" >> /home/ec2-user/.bashrc
      echo "[ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"" >> /home/ec2-user/.bashrc
      echo "[ -s \"\$NVM_DIR/bash_completion\" ] && \. \"\$NVM_DIR/bash_completion\"" >> /home/ec2-user/.bashrc
    '
    
    # Install Python3 and pip
    yum install -y python3 python3-pip
    
    # Install nginx for static sites
    amazon-linux-extras install -y nginx1 || yum install -y nginx
    
    # Start and enable services
    systemctl start docker
    systemctl enable docker
    systemctl enable nginx
    usermod -a -G docker ec2-user
    
    # Create app directory
    mkdir -p /home/ec2-user/app
    chown -R ec2-user:ec2-user /home/ec2-user/app
    
    # Signal completion
    echo "✅ EC2 user data script completed successfully" > /var/log/user-data.log
    date >> /var/log/user-data.log
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
