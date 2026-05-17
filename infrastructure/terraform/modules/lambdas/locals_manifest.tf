locals {
  lambdas_manifest = {
    "manifest-companions-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /companions"
    }
    "manifest-companions-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /companions/{id}"
    }
    "manifest-companions-media-delete" = {
      policy_arn = var.lambda_s3_public_media_policy_arn
      route_key  = "DELETE /companions/media"
    }
    "manifest-companions-media-upload" = {
      policy_arn = var.lambda_s3_public_media_policy_arn
      route_key  = "POST /companions/upload-url"
    }
    "manifest-companions-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /companions/{id}"
    }
    "manifest-expeditions-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /expeditions"
    }
    "manifest-expeditions-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /expeditions/{id}"
    }
    "manifest-expeditions-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /expeditions/{id}"
    }
    "manifest-gear-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /gear"
    }
    "manifest-gear-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /gear/{id}"
    }
    "manifest-gear-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /gear/{id}"
    }
    "manifest-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /manifest"
    }
    "manifest-landmarks-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /landmarks"
    }
    "manifest-landmarks-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /landmarks/{id}"
    }
    "manifest-landmarks-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /landmarks/{id}"
    }
    "manifest-origins-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /manifest/origins"
    }
    "manifest-pathfinding-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /pathfinding"
    }
    "manifest-pathfinding-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /pathfinding/{id}"
    }
    "manifest-pathfinding-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /pathfinding/{id}"
    }
    "manifest-summits-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /summits"
    }
    "manifest-summits-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /summits/{id}"
    }
    "manifest-summits-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /summits/{id}"
    }
    "manifest-training-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /training"
    }
    "manifest-training-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /training/{id}"
    }
    "manifest-training-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /training/{id}"
    }
  }
}
