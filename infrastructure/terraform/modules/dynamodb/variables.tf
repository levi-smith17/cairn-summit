variable "billing_mode" {
  type    = string
  default = "PROVISIONED"
}

variable "environment" {
  type = string
}

variable "managed_by" {
  type = string
}

variable "owner" {
  type = string
}

variable "pitr_enabled" {
  type    = bool
  default = false
}

variable "project_name" {
  type = string
}

variable "read_capacity" {
  type    = number
  default = 25
}

variable "write_capacity" {
  type    = number
  default = 25
}