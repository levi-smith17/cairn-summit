locals {
  lambdas_admin = {
    "admin-get" = {
      policy_arn = var.lambda_read_policy_arn
      route_key  = "GET /admin"
    }
    "admin-invitation-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /admin/invitations"
    }
    "admin-invitation-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /admin/invitations/{id}"
    }
    "admin-wayfarer-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /admin/wayfarers"
    }
    "admin-wayfarer-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /admin/wayfarers/{id}"
    }
    "admin-wayfarer-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /admin/wayfarers/{id}"
    }
    "admin-wayfarers-bulk-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /admin/wayfarers/bulk"
    }
    "admin-wayfarers-bulk-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /admin/wayfarers/bulk"
    }
  }
}
