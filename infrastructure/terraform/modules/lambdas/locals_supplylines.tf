locals {
  lambdas_supplylines = {
    "supplylines-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /supplylines"
    }
    "supplylines-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /supplylines/{id}"
    }
    "supplylines-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /supplylines"
    }
    "supplylines-summary" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /supplylines/summary"
    }
    "supplylines-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /supplylines/{id}"
    }
  }
}
