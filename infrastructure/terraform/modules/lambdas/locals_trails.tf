locals {
  lambdas_trails = {
    "trails-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /trails"
    }
    "trails-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /trails/{id}"
    }
    "trails-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /trails"
    }
    "trails-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /trails/{id}"
    }
  }
}
