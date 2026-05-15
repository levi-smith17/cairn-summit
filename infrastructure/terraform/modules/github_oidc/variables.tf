variable "environment" {
  type = string
}

variable "managed_by" {
  type = string
}

variable "owner" {
  type = string
}

variable "project_name" {
  type = string
}

variable "github_repo" {
  description = "GitHub repo in format owner/repo"
  type        = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "terraform_state_bucket" {
  type = string
}