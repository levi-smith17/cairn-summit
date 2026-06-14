variable "cognito_user_pool_arn" {
  type    = string
  default = ""
}

variable "dynamodb_table_arn" {
  type = string
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

variable "project_name" {
  type = string
}