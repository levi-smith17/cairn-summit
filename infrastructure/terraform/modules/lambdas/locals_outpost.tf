locals {
  lambdas_outpost = {
    "outpost-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /outpost"
    }
  }
}
