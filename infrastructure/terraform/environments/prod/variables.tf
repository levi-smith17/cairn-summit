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

variable "manifest_web_domains" {
  description = "Additional apex/www domains that alias to the prod web CloudFront distribution (e.g. levismith.us manifest)."
  type        = list(string)
  default     = []
}

variable "manifest_hosted_zone_name" {
  description = "Route 53 hosted zone for manifest_web_domains when it differs from var.domain."
  type        = string
  default     = null
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
