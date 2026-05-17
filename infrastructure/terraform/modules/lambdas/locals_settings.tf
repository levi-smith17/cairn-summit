locals {
  lambdas_settings = {
    "settings-delete-account" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "DELETE /account"
    }
    "settings-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /settings"
    }
    "settings-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /settings/{section}"
    }
  }
}
