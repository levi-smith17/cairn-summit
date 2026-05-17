variable "aws_profile" {
  description = "AWS profile to use"
  type        = string
}

variable "dev_api_gateway_domain" {
  description = "API Gateway regional domain name for dev"
  type        = string
  default     = null
}

variable "dev_api_gateway_zone_id" {
  description = "API Gateway hosted zone ID for dev"
  type        = string
  default     = null
}

# Dev CloudFront domains
variable "dev_web_cloudfront_domain" {
  description = "CloudFront domain for dev web app"
  type        = string
}

variable "dev_media_cloudfront_domain" {
  description = "CloudFront domain for dev media"
  type        = string
}

variable "domain" {
  description = "Apex domain name"
  type        = string
}

variable "github_repo" {}
variable "managed_by" {}
variable "owner" {}
variable "project_name" {}

variable "prod_api_gateway_domain" {
  description = "API Gateway regional domain name for prod"
  type        = string
  default     = null
}

variable "prod_api_gateway_zone_id" {
  description = "API Gateway hosted zone ID for prod"
  type        = string
  default     = null
}

# Prod CloudFront domains
variable "prod_web_cloudfront_domain" {
  description = "CloudFront domain for prod web app"
  type        = string
  default     = null
}

variable "prod_media_cloudfront_domain" {
  description = "CloudFront domain for prod media"
  type        = string
  default     = null
}

variable "region" {
  description = "Primary AWS region"
  type        = string
}
