locals {
  lambdas_auth = {
    "auth-context" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /auth/context"
    }
  }
}
