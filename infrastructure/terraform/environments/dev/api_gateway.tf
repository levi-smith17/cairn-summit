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
  # Exclude public routes — those are wired explicitly below without JWT auth
  lambda_functions = { for k, v in module.lambdas.lambda_functions : k => v if k != "outpost-get" }
}

# Public routes — authorization_type = "NONE", defined outside the module
# which forces JWT auth on everything it manages.

locals {
  api_execution_arn = "arn:aws:execute-api:us-east-2:${data.aws_caller_identity.current.account_id}:${module.api_gateway.api_id}"
}

resource "aws_apigatewayv2_integration" "outpost_get" {
  api_id                 = module.api_gateway.api_id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambdas.lambdas["outpost-get"].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "outpost_get" {
  api_id             = module.api_gateway.api_id
  authorization_type = "NONE"
  route_key          = "GET /outpost"
  target             = "integrations/${aws_apigatewayv2_integration.outpost_get.id}"
}

resource "aws_lambda_permission" "outpost_get" {
  action        = "lambda:InvokeFunction"
  function_name = module.lambdas.lambdas["outpost-get"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_execution_arn}/*/*"
  statement_id  = "AllowAPIGateway-outpost-get"
}

resource "aws_apigatewayv2_integration" "signals_contact" {
  api_id                 = module.api_gateway.api_id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.signals_contact.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "signals_contact" {
  api_id             = module.api_gateway.api_id
  authorization_type = "NONE"
  route_key          = "POST /signals/contact/{username}"
  target             = "integrations/${aws_apigatewayv2_integration.signals_contact.id}"
}

resource "aws_lambda_permission" "signals_contact" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.signals_contact.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_execution_arn}/*/*"
  statement_id  = "AllowAPIGateway-signals-contact"
}