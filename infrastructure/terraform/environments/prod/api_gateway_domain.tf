resource "aws_apigatewayv2_domain_name" "main" {
  domain_name = "api.${var.domain}"

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.regional.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

resource "aws_apigatewayv2_api_mapping" "main" {
  api_id      = module.api_gateway.api_id
  domain_name = aws_apigatewayv2_domain_name.main.id
  stage       = module.api_gateway.stage_id
}
