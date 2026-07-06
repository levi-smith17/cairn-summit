module "auth_authorizer" {
  source = "../../modules/lambda"

  cloudfront_public_media_url = var.cloudfront_public_media_url
  cognito_client_id           = var.cognito_client_id
  cognito_user_pool_id        = var.cognito_user_pool_id
  dynamodb_table_name         = var.dynamodb_table_name
  environment                 = var.environment
  function_name               = "auth-authorizer"
  managed_by                  = var.managed_by
  media_cdn_url               = var.media_cdn_url
  owner                       = var.owner
  policy_arn                  = var.lambda_read_policy_arn
  project_name                = var.project_name
  ses_configuration_set_name  = var.ses_configuration_set_name
  ses_from_email              = var.ses_from_email
  s3_private_media_bucket     = var.s3_private_media_bucket
  s3_public_media_bucket      = var.s3_public_media_bucket
  web_url                     = var.web_url
  timeout                     = 10
}
