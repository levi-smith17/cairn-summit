variable "allowed_origins" {
  description = "Origins allowed in CORS rules for presigned PUT uploads."
  type        = list(string)
}

variable "certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1) for the custom domain. If null, CloudFront default certificate is used."
  type        = string
  default     = null
}

variable "custom_domain" {
  description = "Custom domain for the media CloudFront distribution, e.g. media.cairn.ing. Requires certificate_arn."
  type        = string
  default     = null
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

variable "versioning_enabled" {
  description = "Enable S3 versioning on both media buckets."
  type        = bool
  default     = false
}