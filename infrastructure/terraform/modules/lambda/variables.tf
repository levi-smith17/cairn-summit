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

variable "handler_path" {
  description = "Explicit handler path override (e.g. guides/stones-get/handler.handler). Required when the function directory uses a hyphenated sub-path that would be mangled by the default dash→slash replacement."
  type        = string
  default     = null
}

variable "timeout" {
  type    = number
  default = 10
}