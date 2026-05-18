variable "aws_profile" {
  description = "AWS profile to use (local only, leave null in CI)"
  type        = string
  default     = null
}

variable "dns_access_key" {
  default = null
}

variable "dns_aws_profile" {
  description = "AWS profile for prod account DNS (local only, leave null in CI)"
  type        = string
  default     = null
}

variable "dns_secret_key" {
  default   = null
  sensitive = true
}

variable "dns_session_token" {
  default   = null
  sensitive = true
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
  default = "dev"
}

variable "github_repo" {
  type = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID in prod account"
  type        = string
}

variable "managed_by" {
  type    = string
  default = "terraform"
}

variable "owner" {
  type    = string
  default = "levi"
}

variable "project_name" {
  type    = string
  default = "cairn"
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
