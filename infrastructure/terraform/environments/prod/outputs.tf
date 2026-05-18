output "api_gateway_domain" {
  value = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].target_domain_name
}

output "api_gateway_zone_id" {
  value = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].hosted_zone_id
}

output "api_url" {
  value = module.api_gateway.api_url
}

output "cloudfront_distribution_id" {
  value = module.cloudfront.cloudfront_distribution_id
}

output "cloudfront_url" {
  value = module.cloudfront.cloudfront_url
}

output "cognito_client_id" {
  value     = module.cognito.cognito_client_id
  sensitive = true
}

output "cognito_user_pool_id" {
  value = module.cognito.cognito_user_pool_id
}

output "cognito_user_pool_arn" {
  value = module.cognito.cognito_user_pool_arn
}

output "dynamodb_table_name" {
  value = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  value = module.dynamodb.table_arn
}

output "github_actions_role_arn" {
  value = module.github_oidc.role_arn
}

output "media_cloudfront_url" {
  value = module.s3.media_cloudfront_url
}

output "ses_configuration_set_name" {
  value = module.ses.configuration_set_name
}

output "ses_dkim_tokens" {
  value = module.ses.dkim_tokens
}

output "web_bucket_name" {
  value = module.cloudfront.bucket_name
}
