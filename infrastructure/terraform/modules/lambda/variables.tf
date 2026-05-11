variable "cognito_user_pool_id" {
  type = string
}

variable "dynamodb_table_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "function_name" {
  description = "Feature name e.g. markers, waypoints"
  type        = string
}

variable "managed_by" {
  type = string
}

variable "memory_size" {
  type    = number
  default = 128
}

variable "owner" {
  type = string
}

variable "policy_arn" {
  description = "IAM policy ARN to attach to this function"
  type        = string
}

variable "project_name" {
  type = string
}

variable "timeout" {
  type    = number
  default = 10
}