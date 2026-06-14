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

variable "cloudfront_public_media_url" {
  description = "CloudFront base URL for public media (e.g. https://media.cairn.ing)"
  type        = string
  default     = ""
}

variable "media_cdn_url" {
  description = "Media CDN base URL for constructing public asset URLs"
  type        = string
  default     = ""
}

variable "s3_private_media_bucket" {
  type    = string
  default = ""
}

variable "s3_public_media_bucket" {
  type    = string
  default = ""
}

variable "ses_configuration_set_name" {
  type    = string
  default = ""
}

variable "ses_from_email" {
  type    = string
  default = ""
}

variable "web_url" {
  description = "Web CloudFront URL for CORS allowed origin"
  type        = string
  default     = ""
}