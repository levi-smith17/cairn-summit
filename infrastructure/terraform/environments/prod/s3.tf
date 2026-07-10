module "s3" {
  source          = "../../modules/s3"
  environment     = var.environment
  managed_by      = var.managed_by
  owner           = var.owner
  project_name    = var.project_name
  custom_domain   = "media.${var.domain}"
  certificate_arn = aws_acm_certificate_validation.cloudfront.certificate_arn
  allowed_origins = concat(
    [
      "https://${var.domain}",
      module.cloudfront.cloudfront_url,
    ],
    [for domain in var.manifest_web_domains : "https://${domain}"]
  )
}