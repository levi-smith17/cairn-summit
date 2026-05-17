module "lambdas" {
  source                             = "../../modules/lambdas"
  cognito_user_pool_id               = module.cognito.cognito_user_pool_id
  dynamodb_table_name                = module.dynamodb.table_name
  environment                        = var.environment
  managed_by                         = var.managed_by
  owner                              = var.owner
  project_name                       = var.project_name
  lambda_delete_policy_arn           = module.iam.lambda_delete_policy_arn
  lambda_read_policy_arn             = module.iam.lambda_read_policy_arn
  lambda_s3_private_media_policy_arn = module.iam.lambda_s3_private_media_policy_arn
  lambda_s3_public_media_policy_arn  = module.iam.lambda_s3_public_media_policy_arn
  lambda_write_policy_arn            = module.iam.lambda_write_policy_arn
}