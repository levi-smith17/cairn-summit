locals {
  lambdas_headwaters = {
    "headwaters-kin-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /headwaters/kin"
    }
    "headwaters-kin-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /headwaters/kin/{id}"
    }
    "headwaters-kin-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /headwaters/kin"
    }
    "headwaters-kin-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /headwaters/kin/{id}"
    }
  }
}
