locals {
  lambdas_guides = {
    "guides-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /guides"
    }
    "guides-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /guides/{id}"
    }
    "guides-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /guides"
    }
    "guides-get-one" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /guides/{id}"
    }
    "guides-placements-reset" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /guides/{guideId}/placements/reset"
    }
    "guides-stones-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /guides/{guideId}/stones"
    }
    "guides-stones-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /guides/stones/{id}"
    }
    "guides-stones-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /guides/{guideId}/stones"
    }
    "guides-stones-import" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /guides/{guideId}/stones/import"
    }
    "guides-stones-placement-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /guides/stones/{id}/placement"
    }
    "guides-stones-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /guides/stones/{id}"
    }
    "guides-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /guides/{id}"
    }
  }
}
