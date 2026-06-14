locals {
  lambdas_signals = {
    "signals-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /signals/{id}"
    }
    "signals-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /signals"
    }
    "signals-mark-read" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /signals/{id}/read"
    }
    "signals-public-thread-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /public/thread/{token}"
    }
    "signals-public-thread-reply" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /public/thread/{token}/reply"
    }
    "signals-reply" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /signals/{id}/reply"
    }
  }
}
