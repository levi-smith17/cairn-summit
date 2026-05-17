variable "aws_profile" {
  description = "AWS profile to use (local only, leave null in CI)"
  type        = string
  default     = null
}

variable "domain" {
  description = "Apex domain name"
}

variable "environment" {
  type    = string
  default = "prod"
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

variable "github_repo" {
  type = string
}