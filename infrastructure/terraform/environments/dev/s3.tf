module "s3" {
  source          = "../../modules/s3"
  environment     = var.environment
  managed_by      = var.managed_by
  owner           = var.owner
  project_name    = var.project_name
  custom_domain   = "media.dev.${var.domain}"
  certificate_arn = aws_acm_certificate_validation.cloudfront.certificate_arn
  allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5180",
    "https://asgard.levismith.us",
    module.cloudfront.cloudfront_url,
  ]
}