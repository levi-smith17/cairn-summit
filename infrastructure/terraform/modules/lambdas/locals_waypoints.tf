locals {
  lambdas_waypoints = {
    "waypoints-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /waypoints"
    }
    "waypoints-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /waypoints/{id}"
    }
    "waypoints-fetch-meta" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "GET /waypoints/fetch-meta"
    }
    "waypoints-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /waypoints"
    }
    "waypoints-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /waypoints/{id}"
    }
  }
}
