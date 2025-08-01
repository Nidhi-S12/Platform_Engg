# Output values for EC2 deployment
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.ec2_vm.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.ec2_vm.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.ec2_vm.public_dns
}

output "private_key_pem" {
  description = "Private key in PEM format"
  value       = tls_private_key.ec2_key.private_key_pem
  sensitive   = true
}

output "key_pair_name" {
  description = "Name of the AWS key pair"
  value       = aws_key_pair.ec2_key_pair.key_name
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.ec2_sg.id
}

output "ssh_connection_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${aws_key_pair.ec2_key_pair.key_name}.pem ec2-user@${aws_instance.ec2_vm.public_ip}"
}

output "ssm_private_key_parameter" {
  description = "SSM parameter name containing the private key"
  value       = aws_ssm_parameter.private_key.name
}
