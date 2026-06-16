locals {
  lambdas_burn = {
    "burn-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /burn"
    }
    "burn-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /burn/{id}"
    }
    "burn-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /burn"
    }
    "burn-receipt-delete" = {
      policy_arn = var.lambda_s3_private_media_dynamo_write_policy_arn
      route_key  = "DELETE /burn/receipt-url"
    }
    "burn-receipt-upload-url" = {
      policy_arn = var.lambda_s3_private_media_policy_arn
      route_key  = "POST /burn/receipt-upload-url"
    }
    "burn-receipt-url" = {
      policy_arn = var.lambda_s3_private_media_read_policy_arn
      route_key  = "GET /burn/receipt-url"
    }
    "burn-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /burn/{id}"
    }
  }
}
