locals {
  lambdas_logs = {
    "logs-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /logs"
    }
    "logs-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /logs/{id}"
    }
    "logs-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /logs"
    }
    "logs-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /logs/{id}"
    }
    "logs-upload-url" = {
      policy_arn = var.lambda_s3_public_media_policy_arn
      route_key  = "POST /logs/upload-url"
    }
  }
}
