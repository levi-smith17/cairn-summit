module "cognito" {
  source        = "../../modules/cognito"
  environment   = var.environment
  managed_by    = var.managed_by
  owner         = var.owner
  project_name  = var.project_name
}