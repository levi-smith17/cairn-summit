locals {
  lambdas_privacy = {
    "privacy-contact" = {
      policy_arn = var.lambda_ses_write_policy_arn
      route_key  = "POST /privacy"
    }
  }
}
