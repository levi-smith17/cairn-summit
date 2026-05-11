output "api_url" {
  value = module.api_gateway.api_url
}

output "cognito_user_pool_id" {
  value = module.cognito.cognito_user_pool_id
}

output "cognito_client_id" {
  value     = module.cognito.cognito_client_id
  sensitive = true
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

output "lambda_markers_get_arn" {
  value = module.lambda_markers_get.function_arn
}

output "lambda_markers_create_arn" {
  value = module.lambda_markers_create.function_arn
}

output "lambda_markers_update_arn" {
  value = module.lambda_markers_update.function_arn
}

output "lambda_markers_delete_arn" {
  value = module.lambda_markers_delete.function_arn
}