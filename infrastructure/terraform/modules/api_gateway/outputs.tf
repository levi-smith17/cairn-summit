output "api_id" {
  value = aws_apigatewayv2_api.main.id
}

output "api_url" {
  value = aws_apigatewayv2_stage.main.invoke_url
}

output "stage_id" {
  value = aws_apigatewayv2_stage.main.id
}