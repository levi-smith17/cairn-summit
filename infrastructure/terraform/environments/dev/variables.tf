variable "aws_profile" {
  description = "AWS profile to use"
  type        = string
}

variable "dns_aws_profile" {
  description = "AWS profile for the prod account (for DNS validation records)"
  type        = string
}

variable "domain" {
  description = "Apex domain name"
}

variable "environment" {
  type    = string
  default = "dev"
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

variable "github_repo" {
  type = string
}