module "s3" {
  source          = "../../modules/s3"
  environment     = var.environment
  managed_by      = var.managed_by
  owner           = var.owner
  project_name    = var.project_name
  allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    module.cloudfront.cloudfront_url,
  ]
}