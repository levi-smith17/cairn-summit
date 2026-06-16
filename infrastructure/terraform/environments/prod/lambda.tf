locals {
  web_url       = "https://${var.domain}"
  media_cdn_url = "https://media.${var.domain}"
}

module "lambdas" {
  source                             = "../../modules/lambdas"
  cloudfront_public_media_url        = local.media_cdn_url
  cognito_user_pool_id               = module.cognito.cognito_user_pool_id
  dynamodb_table_name                = module.dynamodb.table_name
  environment                        = var.environment
  managed_by                         = var.managed_by
  media_cdn_url                      = local.media_cdn_url
  owner                              = var.owner
  project_name                       = var.project_name
  lambda_account_delete_policy_arn   = module.iam.lambda_account_delete_policy_arn
  lambda_delete_policy_arn           = module.iam.lambda_delete_policy_arn
  lambda_delete_ssm_policy_arn       = module.iam.lambda_delete_ssm_policy_arn
  lambda_read_policy_arn             = module.iam.lambda_read_policy_arn
  lambda_read_ssm_policy_arn         = module.iam.lambda_read_ssm_policy_arn
  lambda_s3_private_media_policy_arn              = module.iam.lambda_s3_private_media_policy_arn
  lambda_s3_private_media_read_policy_arn         = module.iam.lambda_s3_private_media_read_policy_arn
  lambda_s3_private_media_dynamo_write_policy_arn = module.iam.lambda_s3_private_media_dynamo_write_policy_arn
  lambda_s3_public_media_policy_arn               = module.iam.lambda_s3_public_media_policy_arn
  lambda_ses_write_policy_arn        = module.iam.lambda_ses_write_policy_arn
  lambda_write_policy_arn            = module.iam.lambda_write_policy_arn
  lambda_write_ssm_policy_arn        = module.iam.lambda_write_ssm_policy_arn
  ses_configuration_set_name         = var.ses_configuration_set_name
  ses_from_email                     = var.ses_from_email
  s3_private_media_bucket            = module.s3.private_media_bucket
  s3_public_media_bucket             = module.s3.public_media_bucket
  web_url                            = local.web_url
}
