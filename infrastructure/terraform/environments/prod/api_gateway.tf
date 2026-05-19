module "api_gateway" {
  source               = "../../modules/api_gateway"
  cognito_client_id    = module.cognito.cognito_client_id
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  environment          = var.environment
  managed_by           = var.managed_by
  owner                = var.owner
  project_name         = var.project_name
  allowed_origins      = [
    "https://cairn.ing",
    module.cloudfront.cloudfront_url,
  ]
  # Exclude public routes — those are wired explicitly below without JWT auth
  lambda_functions = { for k, v in module.lambdas.lambda_functions : k => v if !contains(["outpost-get", "manifest-public-get", "manifest-public-journey", "manifest-public-contact-get"], k) }
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

resource "aws_apigatewayv2_integration" "manifest_public_get" {
  api_id                 = module.api_gateway.api_id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambdas.lambdas["manifest-public-get"].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "manifest_public_get" {
  api_id             = module.api_gateway.api_id
  authorization_type = "NONE"
  route_key          = "GET /public/manifest/{username}"
  target             = "integrations/${aws_apigatewayv2_integration.manifest_public_get.id}"
}

resource "aws_lambda_permission" "manifest_public_get" {
  action        = "lambda:InvokeFunction"
  function_name = module.lambdas.lambdas["manifest-public-get"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_execution_arn}/*/*"
  statement_id  = "AllowAPIGateway-manifest-public-get"
}

resource "aws_apigatewayv2_integration" "manifest_public_journey" {
  api_id                 = module.api_gateway.api_id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambdas.lambdas["manifest-public-journey"].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "manifest_public_journey" {
  api_id             = module.api_gateway.api_id
  authorization_type = "NONE"
  route_key          = "GET /public/manifest/{username}/journey"
  target             = "integrations/${aws_apigatewayv2_integration.manifest_public_journey.id}"
}

resource "aws_lambda_permission" "manifest_public_journey" {
  action        = "lambda:InvokeFunction"
  function_name = module.lambdas.lambdas["manifest-public-journey"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_execution_arn}/*/*"
  statement_id  = "AllowAPIGateway-manifest-public-journey"
}

resource "aws_apigatewayv2_integration" "manifest_public_contact_get" {
  api_id                 = module.api_gateway.api_id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambdas.lambdas["manifest-public-contact-get"].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "manifest_public_contact_get" {
  api_id             = module.api_gateway.api_id
  authorization_type = "NONE"
  route_key          = "GET /public/manifest/{username}/contact"
  target             = "integrations/${aws_apigatewayv2_integration.manifest_public_contact_get.id}"
}

resource "aws_lambda_permission" "manifest_public_contact_get" {
  action        = "lambda:InvokeFunction"
  function_name = module.lambdas.lambdas["manifest-public-contact-get"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_execution_arn}/*/*"
  statement_id  = "AllowAPIGateway-manifest-public-contact-get"
}

resource "aws_apigatewayv2_integration" "manifest_public_contact" {
  api_id                 = module.api_gateway.api_id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.manifest_public_contact.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "manifest_public_contact" {
  api_id             = module.api_gateway.api_id
  authorization_type = "NONE"
  route_key          = "POST /public/manifest/{username}/contact"
  target             = "integrations/${aws_apigatewayv2_integration.manifest_public_contact.id}"
}

resource "aws_lambda_permission" "manifest_public_contact" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.manifest_public_contact.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_execution_arn}/*/*"
  statement_id  = "AllowAPIGateway-manifest-public-contact"
}