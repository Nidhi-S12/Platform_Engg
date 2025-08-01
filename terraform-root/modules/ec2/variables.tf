variable "aws_region" {
  description = "AWS region to launch the instance"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
  default     = "ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI (x86_64)
}

variable "instance_type" {
  description = "Type of EC2 instance"
  type        = string
  default     = "t2.micro"
  
  validation {
    condition = contains([
      "t2.micro", "t2.small", "t2.medium", "t2.large",
      "t3.micro", "t3.small", "t3.medium", "t3.large"
    ], var.instance_type)
    error_message = "Instance type must be a valid EC2 instance type."
  }
}

variable "instance_name" {
  description = "Name for the EC2 instance"
  type        = string
  default     = "GoldenPath-EC2"
}

variable "app_type" {
  description = "Type of application to deploy"
  type        = string
  default     = "nodejs"
  
  validation {
    condition = contains([
      "nodejs", "python", "static"
    ], var.app_type)
    error_message = "App type must be one of: nodejs, python, static."
  }
}

variable "repo_url" {
  description = "Git repository URL to clone and deploy"
  type        = string
  default     = ""
}
