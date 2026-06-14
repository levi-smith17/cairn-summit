locals {
  lambdas_invite = {
    "invite-public-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /public/invite/{token}"
    }
    "invite-public-accept" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /public/invite/{token}/accept"
    }
  }
}
