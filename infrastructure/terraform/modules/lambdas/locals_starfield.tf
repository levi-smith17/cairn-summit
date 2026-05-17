locals {
  lambdas_starfield = {
    "starfield-network-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /starfield/networks"
    }
    "starfield-network-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /starfield/networks/{id}"
    }
    "starfield-network-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /starfield/networks/{id}"
    }
    "starfield-networks-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /starfield/networks"
    }
    "starfield-outpost-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /starfield/outposts"
    }
    "starfield-outpost-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /starfield/outposts/{id}"
    }
    "starfield-outpost-position" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PATCH /starfield/outposts/{id}/position"
    }
    "starfield-outpost-resource-delete" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "DELETE /starfield/outposts/{outpostId}/resources/{resourceId}"
    }
    "starfield-outpost-resource-upsert" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /starfield/outposts/{outpostId}/resources/{resourceId}"
    }
    "starfield-outpost-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /starfield/outposts/{id}"
    }
    "starfield-outposts-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /starfield/outposts"
    }
    "starfield-resource-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /starfield/resources"
    }
    "starfield-resource-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /starfield/resources/{id}"
    }
    "starfield-resource-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /starfield/resources/{id}"
    }
    "starfield-resources-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /starfield/resources"
    }
    "starfield-system-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /starfield/systems"
    }
    "starfield-system-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /starfield/systems/{id}"
    }
    "starfield-system-planet-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /starfield/systems/{id}/planets"
    }
    "starfield-system-planet-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /starfield/systems/{id}/planets/{planetId}"
    }
    "starfield-system-planet-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /starfield/systems/{id}/planets/{planetId}"
    }
    "starfield-system-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /starfield/systems/{id}"
    }
    "starfield-systems-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /starfield/systems"
    }
  }
}
