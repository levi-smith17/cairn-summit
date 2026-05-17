locals {
  lambdas_basecamp = {
    "basecamp-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /basecamp"
    }
    "basecamp-sidebar" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /basecamp/sidebar"
    }
    "basecamp-trail-waypoints" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /basecamp/trail-waypoints"
    }
  }
}
