locals {
  lambdas_profile = {
    "profile-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /profile"
    }
  }
}
