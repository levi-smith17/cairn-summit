variable "aws_profile" {
  description = "AWS profile to use (local only, leave null in CI)"
  type        = string
  default     = null
}

variable "domain" {
  description = "Apex domain name"
}

variable "dynamodb_table_arn" {
  type = string
}

variable "dynamodb_table_name" {
  type = string
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "github_repo" {
  type = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID in prod account"
  type        = string
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

variable "ses_configuration_set_name" {
  description = "SES configuration set name — set after SES is applied"
  type        = string
  default     = ""
}

variable "ses_from_email" {
  description = "SES sender address for outbound emails"
  type        = string
  default     = ""
}
