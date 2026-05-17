locals {
  lambdas_cache = {
    "cache-carry-over" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /cache/carry-over"
    }
    "cache-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /cache"
    }
    "cache-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /cache/{id}"
    }
    "cache-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /cache"
    }
    "cache-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /cache/{id}"
    }
  }
}
