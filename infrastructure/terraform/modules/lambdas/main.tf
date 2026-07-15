locals {
  lambdas = merge(
    local.lambdas_admin,
    local.lambdas_auth,
    local.lambdas_basecamp,
    local.lambdas_burn,
    local.lambdas_cache,
    local.lambdas_guides,
    local.lambdas_headwaters,
    local.lambdas_health,
    local.lambdas_invite,
    local.lambdas_itinerary,
    local.lambdas_logs,
    local.lambdas_manifest,
    local.lambdas_markers,
    local.lambdas_outpost,
    local.lambdas_privacy,
    local.lambdas_profile,
    local.lambdas_settings,
    local.lambdas_signals,
    local.lambdas_sjodr,
    local.lambdas_search,
    local.lambdas_starfield,
    local.lambdas_supplylines,
    local.lambdas_trails,
    local.lambdas_waypoints,
  )
}

module "lambda" {
  for_each = local.lambdas

  source                        = "../../modules/lambda"
  cloudfront_public_media_url   = var.cloudfront_public_media_url
  cognito_client_id             = var.cognito_client_id
  cognito_user_pool_id          = var.cognito_user_pool_id
  dynamodb_table_name           = var.dynamodb_table_name
  environment                   = var.environment
  function_name                 = each.key
  managed_by                    = var.managed_by
  media_cdn_url                 = var.media_cdn_url
  owner                         = var.owner
  policy_arn                    = each.value.policy_arn
  project_name                  = var.project_name
  ses_configuration_set_name    = var.ses_configuration_set_name
  ses_from_email                = var.ses_from_email
  s3_private_media_bucket       = var.s3_private_media_bucket
  s3_public_media_bucket        = var.s3_public_media_bucket
  web_url                       = var.web_url
  timeout                       = try(each.value.timeout, 10)
}
