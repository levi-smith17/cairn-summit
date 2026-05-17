locals {
  lambdas_markers = {
    "markers-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /markers"
    }
    "markers-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /markers/{id}"
    }
    "markers-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /markers"
    }
    "markers-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /markers/{id}"
    }
  }
}
