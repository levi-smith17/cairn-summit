locals {
  lambdas_search = {
    "search-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /search"
    }
  }
}
