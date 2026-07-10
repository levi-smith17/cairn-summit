variable "certificate_arn" {
  description = "ACM certificate ARN (us-east-1). Required if custom_domain is set."
  type        = string
  default     = null
}

variable "custom_domain" {
  description = "Primary custom domain e.g. cairn.ing. Leave null to use CloudFront default domain."
  type        = string
  default     = null
}

variable "additional_aliases" {
  description = "Extra alternate domain names served by the same distribution (e.g. levismith.us)."
  type        = list(string)
  default     = []
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