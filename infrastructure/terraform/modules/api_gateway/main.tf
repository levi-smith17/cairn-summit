resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["authorization", "content-type"]
    allow_methods = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
    allow_origins = var.allowed_origins
    max_age       = 300
  }

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

# Authorizer and stage — depend on API
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito"

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = "https://cognito-idp.us-east-2.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  auto_deploy = true
  name        = var.environment

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

# Integrations and permissions — depend on API and Lambda
resource "aws_apigatewayv2_integration" "main" {
  for_each = var.lambda_functions

  api_id                 = aws_apigatewayv2_api.main.id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_lambda_permission" "api_gateway" {
  for_each = var.lambda_functions

  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
  statement_id  = "AllowAPIGateway-${each.key}"
}

# Routes — depend on API, authorizer, and integrations
resource "aws_apigatewayv2_route" "main" {
  for_each = var.lambda_functions

  api_id             = aws_apigatewayv2_api.main.id
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
  route_key          = each.value.route_key
  target             = "integrations/${aws_apigatewayv2_integration.main[each.key].id}"
}