module "cloudfront" {
  source         = "../../modules/cloudfront"
  environment    = var.environment
  managed_by     = var.managed_by
  owner          = var.owner
  project_name   = var.project_name
  custom_domain  = var.domain
  certificate_arn = aws_acm_certificate_validation.cloudfront.certificate_arn
}