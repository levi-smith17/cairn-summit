output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.web.id
  sensitive   = true
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}