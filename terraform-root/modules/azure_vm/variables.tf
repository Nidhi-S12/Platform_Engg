variable "resource_group_name" {
  type    = string
  default = "rg-goldenpath"
}

variable "location" {
  type    = string
  default = "East US"
}

variable "vm_name" {
  type    = string
  default = "goldenpath-vm"
}

variable "vm_size" {
  type    = string
  default = "Standard_B1s"
}

variable "admin_username" {
  type    = string
  default = "azureuser"
}

variable "admin_password" {
  type        = string
  description = "Password for admin user"
  default     = "P@ssw0rd1234!" # 🚫 for demo/testing only
}
