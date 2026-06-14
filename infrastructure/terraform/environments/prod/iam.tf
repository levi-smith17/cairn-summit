module "iam" {
  source                = "../../modules/iam"
  cognito_user_pool_arn = module.cognito.cognito_user_pool_arn
  dynamodb_table_arn    = module.dynamodb.table_arn
  environment           = var.environment
  managed_by            = var.managed_by
  owner                 = var.owner
  project_name          = var.project_name
}