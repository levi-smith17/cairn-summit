locals {
  lambdas_health = {
    "health-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /health"
    }
  }
}
