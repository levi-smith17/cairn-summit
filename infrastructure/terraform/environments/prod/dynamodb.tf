module "dynamodb" {
  source        = "../../modules/dynamodb"
  billing_mode  = "PAY_PER_REQUEST"
  environment   = var.environment
  managed_by    = var.managed_by
  owner         = var.owner
  pitr_enabled  = true
  project_name  = var.project_name
}