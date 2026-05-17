module "api_gateway" {
  source               = "../../modules/api_gateway"
  cognito_client_id    = module.cognito.cognito_client_id
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  environment          = var.environment
  managed_by           = var.managed_by
  owner                = var.owner
  project_name         = var.project_name
  allowed_origins      = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://dev.cairn.ing",
    module.cloudfront.cloudfront_url,
  ]
  lambda_functions = module.lambdas.lambda_functions
}