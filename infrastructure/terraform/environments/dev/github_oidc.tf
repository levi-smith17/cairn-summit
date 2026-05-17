module "github_oidc" {
  source                  = "../../modules/github_oidc"
  environment             = var.environment
  github_repo             = var.github_repo
  managed_by              = var.managed_by
  owner                   = var.owner
  project_name            = var.project_name
  terraform_state_bucket  = "cairn-dev-terraform-state"

  dynamodb_table_arn = module.dynamodb.table_arn
}