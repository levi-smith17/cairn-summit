module "lambda_basecamp_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "basecamp-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_basecamp_sidebar" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "basecamp-sidebar"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_basecamp_trail_waypoints" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "basecamp-trail-waypoints"
  handler_path         = "basecamp/trail-waypoints/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_burn_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "burn-create"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_burn_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "burn-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_burn_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "burn-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_burn_receipt_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "burn-receipt-delete"
  handler_path         = "burn/receipt-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_s3_private_media_policy_arn
  project_name         = var.project_name
}

module "lambda_burn_receipt_upload_url" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "burn-receipt-upload-url"
  handler_path         = "burn/receipt-upload-url/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_s3_private_media_policy_arn
  project_name         = var.project_name
}

module "lambda_burn_receipt_url" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "burn-receipt-url"
  handler_path         = "burn/receipt-url/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_s3_private_media_policy_arn
  project_name         = var.project_name
}

module "lambda_burn_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "burn-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_cache_carry_over" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "cache-carry-over"
  handler_path         = "cache/carry-over/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_cache_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "cache-create"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_cache_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "cache-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_cache_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "cache-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_cache_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "cache-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_guides_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "guides-create"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_guides_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "guides-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_guides_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "guides-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_guides_placements_reset" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "guides-placements-reset"
  handler_path         = "guides/placements-reset/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_guides_stones_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "guides-stones-create"
  handler_path         = "guides/stones-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_guides_stones_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "guides-stones-get"
  handler_path         = "guides/stones-get/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_guides_stones_import" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "guides-stones-import"
  handler_path         = "guides/stones-import/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_guides_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "guides-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_itinerary_calendars_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "itinerary-calendars-create"
  handler_path         = "itinerary/calendars-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_itinerary_calendars_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "itinerary-calendars-delete"
  handler_path         = "itinerary/calendars-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_itinerary_calendars_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "itinerary-calendars-update"
  handler_path         = "itinerary/calendars-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_itinerary_subscriptions_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "itinerary-subscriptions-create"
  handler_path         = "itinerary/subscriptions-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_itinerary_subscriptions_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "itinerary-subscriptions-delete"
  handler_path         = "itinerary/subscriptions-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_itinerary_subscriptions_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "itinerary-subscriptions-update"
  handler_path         = "itinerary/subscriptions-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_logs_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "logs-create"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_logs_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "logs-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_logs_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "logs-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_logs_image_url" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "logs-image-url"
  handler_path         = "logs/image-url/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_s3_private_media_policy_arn
  project_name         = var.project_name
  web_url              = module.cloudfront.cloudfront_url
}

module "lambda_logs_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "logs-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_logs_upload_url" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "logs-upload-url"
  handler_path         = "logs/upload-url/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_s3_private_media_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_companions_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-companions-create"
  handler_path         = "manifest/companions-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_companions_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-companions-delete"
  handler_path         = "manifest/companions-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_companions_media_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-companions-media-delete"
  handler_path         = "manifest/companions-media-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_s3_public_media_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_companions_media_upload" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-companions-media-upload"
  handler_path         = "manifest/companions-media-upload/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_s3_public_media_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_companions_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-companions-update"
  handler_path         = "manifest/companions-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_expeditions_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-expeditions-create"
  handler_path         = "manifest/expeditions-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_expeditions_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-expeditions-delete"
  handler_path         = "manifest/expeditions-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_expeditions_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-expeditions-update"
  handler_path         = "manifest/expeditions-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_gear_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-gear-create"
  handler_path         = "manifest/gear-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_gear_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-gear-delete"
  handler_path         = "manifest/gear-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_gear_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-gear-update"
  handler_path         = "manifest/gear-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_landmarks_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-landmarks-create"
  handler_path         = "manifest/landmarks-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_landmarks_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-landmarks-delete"
  handler_path         = "manifest/landmarks-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_landmarks_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-landmarks-update"
  handler_path         = "manifest/landmarks-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_origins_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-origins-update"
  handler_path         = "manifest/origins-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_pathfinding_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-pathfinding-create"
  handler_path         = "manifest/pathfinding-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_pathfinding_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-pathfinding-delete"
  handler_path         = "manifest/pathfinding-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_pathfinding_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-pathfinding-update"
  handler_path         = "manifest/pathfinding-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_settings_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-settings-update"
  handler_path         = "manifest/settings-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_summits_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-summits-create"
  handler_path         = "manifest/summits-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_summits_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-summits-delete"
  handler_path         = "manifest/summits-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_summits_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-summits-update"
  handler_path         = "manifest/summits-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_training_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-training-create"
  handler_path         = "manifest/training-create/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_training_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-training-delete"
  handler_path         = "manifest/training-delete/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_manifest_training_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "manifest-training-update"
  handler_path         = "manifest/training-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_markers_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "markers-create"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_markers_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "markers-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_markers_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "markers-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_markers_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "markers-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_profile_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "profile-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_settings_delete_account" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "settings-delete-account"
  handler_path         = "settings/delete-account/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_settings_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "settings-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_settings_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "settings-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_signals_contact" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "signals-contact"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_signals_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "signals-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_signals_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "signals-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_signals_mark_read" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "signals-mark-read"
  handler_path         = "signals/mark-read/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_signals_public_thread_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "signals-public-thread-get"
  handler_path         = "signals/public-thread-get/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_signals_public_thread_reply" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "signals-public-thread-reply"
  handler_path         = "signals/public-thread-reply/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_signals_reply" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "signals-reply"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_signals_sync" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "signals-sync"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_stones_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "stones-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_stones_placement_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "stones-placement-update"
  handler_path         = "stones/placement-update/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_stones_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "stones-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_supplylines_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "supplylines-create"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_supplylines_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "supplylines-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_supplylines_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "supplylines-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_supplylines_summary" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "supplylines-summary"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_supplylines_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "supplylines-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_trails_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "trails-create"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_trails_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "trails-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_trails_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "trails-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_trails_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "trails-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_waypoints_create" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "waypoints-create"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_waypoints_delete" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "waypoints-delete"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_delete_policy_arn
  project_name         = var.project_name
}

module "lambda_waypoints_fetch_meta" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "waypoints-fetch-meta"
  handler_path         = "waypoints/fetch-meta/handler.handler"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}

module "lambda_waypoints_get" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "waypoints-get"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_read_policy_arn
  project_name         = var.project_name
}

module "lambda_waypoints_update" {
  source               = "../../modules/lambda"
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  environment          = var.environment
  function_name        = "waypoints-update"
  managed_by           = var.managed_by
  owner                = var.owner
  policy_arn           = module.iam.lambda_write_policy_arn
  project_name         = var.project_name
}