locals {
  lambdas = merge(
    local.lambdas_basecamp,
    local.lambdas_burn,
    local.lambdas_cache,
    local.lambdas_guides,
    local.lambdas_headwaters,
    local.lambdas_itinerary,
    local.lambdas_logs,
    local.lambdas_manifest,
    local.lambdas_markers,
    local.lambdas_profile,
    local.lambdas_settings,
    local.lambdas_signals,
    local.lambdas_starfield,
    local.lambdas_supplylines,
    local.lambdas_trails,
    local.lambdas_waypoints,
  )
}

module "lambda" {
  for_each = local.lambdas

  source               = "../../modules/lambda"
  cognito_user_pool_id = var.cognito_user_pool_id
  dynamodb_table_name  = var.dynamodb_table_name
  environment          = var.environment
  function_name        = each.key
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = each.value.policy_arn
  project_name         = var.project_name
}
