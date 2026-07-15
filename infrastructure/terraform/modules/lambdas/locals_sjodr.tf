locals {
  lambdas_sjodr = {
    "sjodr-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /sjodr"
    }
    "sjodr-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /sjodr/{id}"
    }
    "sjodr-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /sjodr"
    }
    "sjodr-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /sjodr/{id}"
    }
  }
}
