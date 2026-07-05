locals {
  lambdas_settings = {
    "settings-delete-account" = {
      policy_arn = var.lambda_account_delete_policy_arn
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
    "settings-api-token-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /settings/api-token"
    }
    "settings-api-token-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /settings/api-token"
    }
    "settings-api-token-revoke" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "DELETE /settings/api-token"
    }
  }
}
