module "api_gateway" {
  source               = "../../modules/api_gateway"
  cognito_client_id    = module.cognito.cognito_client_id
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  environment          = var.environment
  managed_by           = var.managed_by
  owner                = var.owner
  project_name         = var.project_name
  allowed_origins      = [
    "http://localhost:3000",
    "http://localhost:5173",
    module.cloudfront.cloudfront_url,
  ]

  lambda_functions = {
    basecamp-get = {
      invoke_arn    = module.lambda_basecamp_get.invoke_arn
      function_name = module.lambda_basecamp_get.function_name
      route_key     = "GET /basecamp"
    }
    basecamp-sidebar = {
      invoke_arn    = module.lambda_basecamp_sidebar.invoke_arn
      function_name = module.lambda_basecamp_sidebar.function_name
      route_key     = "GET /basecamp/sidebar"
    }
    basecamp-trails-waypoints = {
      invoke_arn    = module.lambda_basecamp_trail_waypoints.invoke_arn
      function_name = module.lambda_basecamp_trail_waypoints.function_name
      route_key     = "GET /basecamp/trail-waypoints"
    }
    burn-create = {
      invoke_arn    = module.lambda_burn_create.invoke_arn
      function_name = module.lambda_burn_create.function_name
      route_key     = "POST /burn"
    }
    burn-delete = {
      invoke_arn    = module.lambda_burn_delete.invoke_arn
      function_name = module.lambda_burn_delete.function_name
      route_key     = "DELETE /burn/{id}"
    }
    burn-get = {
      invoke_arn    = module.lambda_burn_get.invoke_arn
      function_name = module.lambda_burn_get.function_name
      route_key     = "GET /burn"
    }
    burn-receipt-delete = {
      invoke_arn    = module.lambda_burn_receipt_delete.invoke_arn
      function_name = module.lambda_burn_receipt_delete.function_name
      route_key     = "DELETE /burn/receipt-url"
    }
    burn-receipt-upload-url = {
      invoke_arn    = module.lambda_burn_receipt_upload_url.invoke_arn
      function_name = module.lambda_burn_receipt_upload_url.function_name
      route_key     = "POST /burn/receipt-upload-url"
    }
    burn-receipt-url = {
      invoke_arn    = module.lambda_burn_receipt_url.invoke_arn
      function_name = module.lambda_burn_receipt_url.function_name
      route_key     = "GET /burn/receipt-url"
    }
    burn-update = {
      invoke_arn    = module.lambda_burn_update.invoke_arn
      function_name = module.lambda_burn_update.function_name
      route_key     = "PUT /burn/{id}"
    }
    cache-carry-over = {
      invoke_arn    = module.lambda_cache_carry_over.invoke_arn
      function_name = module.lambda_cache_carry_over.function_name
      route_key     = "POST /cache/carry-over"
    }
    cache-create = {
      invoke_arn    = module.lambda_cache_create.invoke_arn
      function_name = module.lambda_cache_create.function_name
      route_key     = "POST /cache"
    }
    cache-delete = {
      invoke_arn    = module.lambda_cache_delete.invoke_arn
      function_name = module.lambda_cache_delete.function_name
      route_key     = "DELETE /cache/{id}"
    }
    cache-get = {
      invoke_arn    = module.lambda_cache_get.invoke_arn
      function_name = module.lambda_cache_get.function_name
      route_key     = "GET /cache"
    }
    cache-update = {
      invoke_arn    = module.lambda_cache_update.invoke_arn
      function_name = module.lambda_cache_update.function_name
      route_key     = "PUT /cache/{id}"
    }
    guides-create = {
      invoke_arn    = module.lambda_guides_create.invoke_arn
      function_name = module.lambda_guides_create.function_name
      route_key     = "POST /guides"
    }
    guides-delete = {
      invoke_arn    = module.lambda_guides_delete.invoke_arn
      function_name = module.lambda_guides_delete.function_name
      route_key     = "DELETE /guides/{id}"
    }
    guides-get = {
      invoke_arn    = module.lambda_guides_get.invoke_arn
      function_name = module.lambda_guides_get.function_name
      route_key     = "GET /guides"
    }
    guides-placements-reset = {
      invoke_arn    = module.lambda_guides_placements_reset.invoke_arn
      function_name = module.lambda_guides_placements_reset.function_name
      route_key     = "POST /guides/{guideId}/placements/reset"
    }
    guides-stones-create = {
      invoke_arn    = module.lambda_guides_stones_create.invoke_arn
      function_name = module.lambda_guides_stones_create.function_name
      route_key     = "POST /guides/{guideId}/stones"
    }
    guides-stones-get = {
      invoke_arn    = module.lambda_guides_stones_get.invoke_arn
      function_name = module.lambda_guides_stones_get.function_name
      route_key     = "GET /guides/{guideId}/stones"
    }
    guides-stones-import = {
      invoke_arn    = module.lambda_guides_stones_import.invoke_arn
      function_name = module.lambda_guides_stones_import.function_name
      route_key     = "POST /guides/{guideId}/stones/import"
    }
    guides-update = {
      invoke_arn    = module.lambda_guides_update.invoke_arn
      function_name = module.lambda_guides_update.function_name
      route_key     = "PUT /guides/{id}"
    }
    itinerary-calendars-create = {
      invoke_arn    = module.lambda_itinerary_calendars_create.invoke_arn
      function_name = module.lambda_itinerary_calendars_create.function_name
      route_key     = "POST /itinerary"
    }
    itinerary-calendars-delete = {
      invoke_arn    = module.lambda_itinerary_calendars_delete.invoke_arn
      function_name = module.lambda_itinerary_calendars_delete.function_name
      route_key     = "DELETE /itinerary/{id}"
    }
    itinerary-calendars-update = {
      invoke_arn    = module.lambda_itinerary_calendars_update.invoke_arn
      function_name = module.lambda_itinerary_calendars_update.function_name
      route_key     = "PUT /itinerary/{id}"
    }
    itinerary-subscriptions-create = {
      invoke_arn    = module.lambda_itinerary_subscriptions_create.invoke_arn
      function_name = module.lambda_itinerary_subscriptions_create.function_name
      route_key     = "POST /itinerary-subscriptions"
    }
    itinerary-subscriptions-delete = {
      invoke_arn    = module.lambda_itinerary_subscriptions_delete.invoke_arn
      function_name = module.lambda_itinerary_subscriptions_delete.function_name
      route_key     = "DELETE /itinerary-subscriptions/{id}"
    }
    itinerary-subscriptions-update = {
      invoke_arn    = module.lambda_itinerary_subscriptions_update.invoke_arn
      function_name = module.lambda_itinerary_subscriptions_update.function_name
      route_key     = "PUT /itinerary-subscriptions/{id}"
    }
    logs-create = {
      invoke_arn    = module.lambda_logs_create.invoke_arn
      function_name = module.lambda_logs_create.function_name
      route_key     = "POST /logs"
    }
    logs-delete = {
      invoke_arn    = module.lambda_logs_delete.invoke_arn
      function_name = module.lambda_logs_delete.function_name
      route_key     = "DELETE /logs/{id}"
    }
    logs-get = {
      invoke_arn    = module.lambda_logs_get.invoke_arn
      function_name = module.lambda_logs_get.function_name
      route_key     = "GET /logs"
    }
    logs-image-url = {
      invoke_arn    = module.lambda_logs_image_url.invoke_arn
      function_name = module.lambda_logs_image_url.function_name
      route_key     = "GET /logs/image-url"
    }
    logs-update = {
      invoke_arn    = module.lambda_logs_update.invoke_arn
      function_name = module.lambda_logs_update.function_name
      route_key     = "PUT /logs/{id}"
    }
    logs-upload-url = {
      invoke_arn    = module.lambda_logs_upload_url.invoke_arn
      function_name = module.lambda_logs_upload_url.function_name
      route_key     = "POST /logs/upload-url"
    }
    manifest-companions-create = {
      invoke_arn    = module.lambda_manifest_companions_create.invoke_arn
      function_name = module.lambda_manifest_companions_create.function_name
      route_key     = "POST /companions"
    }
    manifest-companions-delete = {
      invoke_arn    = module.lambda_manifest_companions_delete.invoke_arn
      function_name = module.lambda_manifest_companions_delete.function_name
      route_key     = "DELETE /companions/{id}"
    }
    manifest-companions-media-delete = {
      invoke_arn    = module.lambda_manifest_companions_media_delete.invoke_arn
      function_name = module.lambda_manifest_companions_media_delete.function_name
      route_key     = "DELETE /companions/media"
    }
    manifest-companions-media-upload = {
      invoke_arn    = module.lambda_manifest_companions_media_upload.invoke_arn
      function_name = module.lambda_manifest_companions_media_upload.function_name
      route_key     = "POST /companions/upload-url"
    }
    manifest-companions-update = {
      invoke_arn    = module.lambda_manifest_companions_update.invoke_arn
      function_name = module.lambda_manifest_companions_update.function_name
      route_key     = "PUT /companions/{id}"
    }
    manifest-expeditions-create = {
      invoke_arn    = module.lambda_manifest_expeditions_create.invoke_arn
      function_name = module.lambda_manifest_expeditions_create.function_name
      route_key     = "POST /expeditions"
    }
    manifest-expeditions-delete = {
      invoke_arn    = module.lambda_manifest_expeditions_delete.invoke_arn
      function_name = module.lambda_manifest_expeditions_delete.function_name
      route_key     = "DELETE /expeditions/{id}"
    }
    manifest-expeditions-update = {
      invoke_arn    = module.lambda_manifest_expeditions_update.invoke_arn
      function_name = module.lambda_manifest_expeditions_update.function_name
      route_key     = "PUT /expeditions/{id}"
    }
    manifest-gear-create = {
      invoke_arn    = module.lambda_manifest_gear_create.invoke_arn
      function_name = module.lambda_manifest_gear_create.function_name
      route_key     = "POST /gear"
    }
    manifest-gear-delete = {
      invoke_arn    = module.lambda_manifest_gear_delete.invoke_arn
      function_name = module.lambda_manifest_gear_delete.function_name
      route_key     = "DELETE /gear/{id}"
    }
    manifest-gear-update = {
      invoke_arn    = module.lambda_manifest_gear_update.invoke_arn
      function_name = module.lambda_manifest_gear_update.function_name
      route_key     = "PUT /gear/{id}"
    }
    manifest-get = {
      invoke_arn    = module.lambda_manifest_get.invoke_arn
      function_name = module.lambda_manifest_get.function_name
      route_key     = "GET /manifest"
    }
    manifest-landmarks-create = {
      invoke_arn    = module.lambda_manifest_landmarks_create.invoke_arn
      function_name = module.lambda_manifest_landmarks_create.function_name
      route_key     = "POST /landmarks"
    }
    manifest-landmarks-delete = {
      invoke_arn    = module.lambda_manifest_landmarks_delete.invoke_arn
      function_name = module.lambda_manifest_landmarks_delete.function_name
      route_key     = "DELETE /landmarks/{id}"
    }
    manifest-landmarks-update = {
      invoke_arn    = module.lambda_manifest_landmarks_update.invoke_arn
      function_name = module.lambda_manifest_landmarks_update.function_name
      route_key     = "PUT /landmarks/{id}"
    }
    manifest-origins-update = {
      invoke_arn    = module.lambda_manifest_origins_update.invoke_arn
      function_name = module.lambda_manifest_origins_update.function_name
      route_key     = "PUT /manifest/origins"
    }
    manifest-pathfinding-create = {
      invoke_arn    = module.lambda_manifest_pathfinding_create.invoke_arn
      function_name = module.lambda_manifest_pathfinding_create.function_name
      route_key     = "POST /pathfinding"
    }
    manifest-pathfinding-delete = {
      invoke_arn    = module.lambda_manifest_pathfinding_delete.invoke_arn
      function_name = module.lambda_manifest_pathfinding_delete.function_name
      route_key     = "DELETE /pathfinding/{id}"
    }
    manifest-pathfinding-update = {
      invoke_arn    = module.lambda_manifest_pathfinding_update.invoke_arn
      function_name = module.lambda_manifest_pathfinding_update.function_name
      route_key     = "PUT /pathfinding/{id}"
    }
    manifest-settings-update = {
      invoke_arn    = module.lambda_manifest_settings_update.invoke_arn
      function_name = module.lambda_manifest_settings_update.function_name
      route_key     = "PUT /manifest/settings"
    }
    manifest-summits-create = {
      invoke_arn    = module.lambda_manifest_summits_create.invoke_arn
      function_name = module.lambda_manifest_summits_create.function_name
      route_key     = "POST /summits"
    }
    manifest-summits-delete = {
      invoke_arn    = module.lambda_manifest_summits_delete.invoke_arn
      function_name = module.lambda_manifest_summits_delete.function_name
      route_key     = "DELETE /summits/{id}"
    }
    manifest-summits-update = {
      invoke_arn    = module.lambda_manifest_summits_update.invoke_arn
      function_name = module.lambda_manifest_summits_update.function_name
      route_key     = "PUT /summits/{id}"
    }
    manifest-training-create = {
      invoke_arn    = module.lambda_manifest_training_create.invoke_arn
      function_name = module.lambda_manifest_training_create.function_name
      route_key     = "POST /training"
    }
    manifest-training-delete = {
      invoke_arn    = module.lambda_manifest_training_delete.invoke_arn
      function_name = module.lambda_manifest_training_delete.function_name
      route_key     = "DELETE /training/{id}"
    }
    manifest-training-update = {
      invoke_arn    = module.lambda_manifest_training_update.invoke_arn
      function_name = module.lambda_manifest_training_update.function_name
      route_key     = "PUT /training/{id}"
    }
    markers-create = {
      invoke_arn    = module.lambda_markers_create.invoke_arn
      function_name = module.lambda_markers_create.function_name
      route_key     = "POST /markers"
    }
    markers-delete = {
      invoke_arn    = module.lambda_markers_delete.invoke_arn
      function_name = module.lambda_markers_delete.function_name
      route_key     = "DELETE /markers/{id}"
    }
    markers-get = {
      invoke_arn    = module.lambda_markers_get.invoke_arn
      function_name = module.lambda_markers_get.function_name
      route_key     = "GET /markers"
    }
    markers-update = {
      invoke_arn    = module.lambda_markers_update.invoke_arn
      function_name = module.lambda_markers_update.function_name
      route_key     = "PUT /markers/{id}"
    }
    profile-get = {
      invoke_arn    = module.lambda_profile_get.invoke_arn
      function_name = module.lambda_profile_get.function_name
      route_key     = "GET /profile"
    }
    settings-delete-account = {
      invoke_arn    = module.lambda_settings_delete_account.invoke_arn
      function_name = module.lambda_settings_delete_account.function_name
      route_key     = "DELETE /account"
    }
    settings-get = {
      invoke_arn    = module.lambda_settings_get.invoke_arn
      function_name = module.lambda_settings_get.function_name
      route_key     = "GET /settings"
    }
    settings-update = {
      invoke_arn    = module.lambda_settings_update.invoke_arn
      function_name = module.lambda_settings_update.function_name
      route_key     = "PUT /settings/{section}"
    }
    signals-contact = {
      invoke_arn    = module.lambda_signals_contact.invoke_arn
      function_name = module.lambda_signals_contact.function_name
      route_key     = "POST /signals/contact/{username}"
    }
    signals-delete = {
      invoke_arn    = module.lambda_signals_delete.invoke_arn
      function_name = module.lambda_signals_delete.function_name
      route_key     = "DELETE /signals/{id}"
    }
    signals-get = {
      invoke_arn    = module.lambda_signals_get.invoke_arn
      function_name = module.lambda_signals_get.function_name
      route_key     = "GET /signals"
    }
    signals-mark-read = {
      invoke_arn    = module.lambda_signals_mark_read.invoke_arn
      function_name = module.lambda_signals_mark_read.function_name
      route_key     = "PUT /signals/{id}/read"
    }
    signals-public-thread-get = {
      invoke_arn    = module.lambda_signals_public_thread_get.invoke_arn
      function_name = module.lambda_signals_public_thread_get.function_name
      route_key     = "GET /public/thread/{token}"
    }
    signals-public-thread-reply = {
      invoke_arn    = module.lambda_signals_public_thread_reply.invoke_arn
      function_name = module.lambda_signals_public_thread_reply.function_name
      route_key     = "POST /public/thread/{token}/reply"
    }
    signals-reply = {
      invoke_arn    = module.lambda_signals_reply.invoke_arn
      function_name = module.lambda_signals_reply.function_name
      route_key     = "POST /signals/{id}/replies"
    }
    signals-sync = {
      invoke_arn    = module.lambda_signals_sync.invoke_arn
      function_name = module.lambda_signals_sync.function_name
      route_key     = "POST /signals/sync"
    }
    starfield-network-create = {
      invoke_arn    = module.lambda_starfield_network_create.invoke_arn
      function_name = module.lambda_starfield_network_create.function_name
      route_key     = "POST /starfield/networks"
    }
    starfield-network-delete = {
      invoke_arn    = module.lambda_starfield_network_delete.invoke_arn
      function_name = module.lambda_starfield_network_delete.function_name
      route_key     = "DELETE /starfield/networks/{id}"
    }
    starfield-networks-get = {
      invoke_arn    = module.lambda_starfield_networks_get.invoke_arn
      function_name = module.lambda_starfield_networks_get.function_name
      route_key     = "GET /starfield/networks/"
    }
    starfield-network-update = {
      invoke_arn    = module.lambda_starfield_network_update.invoke_arn
      function_name = module.lambda_starfield_network_update.function_name
      route_key     = "PUT /starfield/networks/{id}"
    }
    starfield-outpost-create = {
      invoke_arn    = module.lambda_starfield_outpost_create.invoke_arn
      function_name = module.lambda_starfield_outpost_create.function_name
      route_key     = "POST /starfield/outposts"
    }
    starfield-outpost-delete = {
      invoke_arn    = module.lambda_starfield_outpost_delete.invoke_arn
      function_name = module.lambda_starfield_outpost_delete.function_name
      route_key     = "DELETE /starfield/outposts/{id}"
    }
    starfield-outpost-position = {
      invoke_arn    = module.lambda_starfield_outpost_position.invoke_arn
      function_name = module.lambda_starfield_outpost_position.function_name
      route_key     = "PATCH /starfield/outposts/{id}/position"
    }
    starfield-outpost-resource-delete = {
      invoke_arn    = module.lambda_starfield_outpost_resource_delete.invoke_arn
      function_name = module.lambda_starfield_outpost_resource_delete.function_name
      route_key     = "DELETE /starfield/outposts/{outpostId}/resources/{resourceId}"
    }
    starfield-outpost-resource-upsert = {
      invoke_arn    = module.lambda_starfield_outpost_resource_upsert.invoke_arn
      function_name = module.lambda_starfield_outpost_resource_upsert.function_name
      route_key     = "PUT /starfield/outposts/{outpostId}/resources/{resourceId}"
    }
    starfield-outpost-update = {
      invoke_arn    = module.lambda_starfield_outpost_update.invoke_arn
      function_name = module.lambda_starfield_outpost_update.function_name
      route_key     = "PUT /starfield/outposts/{id}"
    }
    starfield-outposts-get = {
      invoke_arn    = module.lambda_starfield_outposts_get.invoke_arn
      function_name = module.lambda_starfield_outposts_get.function_name
      route_key     = "GET /starfield/outposts"
    }
    starfield-resource-create = {
      invoke_arn    = module.lambda_starfield_resource_create.invoke_arn
      function_name = module.lambda_starfield_resource_create.function_name
      route_key     = "POST /starfield/resources"
    }
    starfield-resource-delete = {
      invoke_arn    = module.lambda_starfield_resource_delete.invoke_arn
      function_name = module.lambda_starfield_resource_delete.function_name
      route_key     = "DELETE /starfield/resources/{id}"
    }
    starfield-resource-update = {
      invoke_arn    = module.lambda_starfield_resource_update.invoke_arn
      function_name = module.lambda_starfield_resource_update.function_name
      route_key     = "PUT /starfield/resources/{id}"
    }
    starfield-resources-get = {
      invoke_arn    = module.lambda_starfield_resources_get.invoke_arn
      function_name = module.lambda_starfield_resources_get.function_name
      route_key     = "GET /starfield/resources"
    }
    starfield-system-create = {
      invoke_arn    = module.lambda_starfield_system_create.invoke_arn
      function_name = module.lambda_starfield_system_create.function_name
      route_key     = "POST /starfield/systems"
    }
    starfield-system-delete = {
      invoke_arn    = module.lambda_starfield_system_delete.invoke_arn
      function_name = module.lambda_starfield_system_delete.function_name
      route_key     = "DELETE /starfield/systems/{id}"
    }
    starfield-system-planet-create = {
      invoke_arn    = module.lambda_starfield_system_planet_create.invoke_arn
      function_name = module.lambda_starfield_system_planet_create.function_name
      route_key     = "POST /starfield/systems/{id}/planets"
    }
    starfield-system-planet-delete = {
      invoke_arn    = module.lambda_starfield_system_planet_delete.invoke_arn
      function_name = module.lambda_starfield_system_planet_delete.function_name
      route_key     = "DELETE /starfield/systems/{id}/planets/{planetId}"
    }
    starfield-system-planet-update = {
      invoke_arn    = module.lambda_starfield_system_planet_update.invoke_arn
      function_name = module.lambda_starfield_system_planet_update.function_name
      route_key     = "PUT /starfield/systems/{id}/planets/{planetId}"
    }
    starfield-system-update = {
      invoke_arn    = module.lambda_starfield_system_update.invoke_arn
      function_name = module.lambda_starfield_system_update.function_name
      route_key     = "PUT /starfield/systems/{id}"
    }
    starfield-systems-get = {
      invoke_arn    = module.lambda_starfield_systems_get.invoke_arn
      function_name = module.lambda_starfield_systems_get.function_name
      route_key     = "GET /starfield/systems"
    }
    stones-delete = {
      invoke_arn    = module.lambda_stones_delete.invoke_arn
      function_name = module.lambda_stones_delete.function_name
      route_key     = "DELETE /stones/{id}"
    }
    stones-placement-update = {
      invoke_arn    = module.lambda_stones_placement_update.invoke_arn
      function_name = module.lambda_stones_placement_update.function_name
      route_key     = "PUT /stones/{id}/placement"
    }
    stones-update = {
      invoke_arn    = module.lambda_stones_update.invoke_arn
      function_name = module.lambda_stones_update.function_name
      route_key     = "PUT /stones/{id}"
    }
    supplylines-create = {
      invoke_arn    = module.lambda_supplylines_create.invoke_arn
      function_name = module.lambda_supplylines_create.function_name
      route_key     = "POST /supplylines"
    }
    supplylines-delete = {
      invoke_arn    = module.lambda_supplylines_delete.invoke_arn
      function_name = module.lambda_supplylines_delete.function_name
      route_key     = "DELETE /supplylines/{id}"
    }
    supplylines-get = {
      invoke_arn    = module.lambda_supplylines_get.invoke_arn
      function_name = module.lambda_supplylines_get.function_name
      route_key     = "GET /supplylines"
    }
    supplylines-summary = {
      invoke_arn    = module.lambda_supplylines_summary.invoke_arn
      function_name = module.lambda_supplylines_summary.function_name
      route_key     = "GET /supplylines/summary"
    }
    supplylines-update = {
      invoke_arn    = module.lambda_supplylines_update.invoke_arn
      function_name = module.lambda_supplylines_update.function_name
      route_key     = "PUT /supplylines/{id}"
    }
    trails-create = {
      invoke_arn    = module.lambda_trails_create.invoke_arn
      function_name = module.lambda_trails_create.function_name
      route_key     = "POST /trails"
    }
    trails-delete = {
      invoke_arn    = module.lambda_trails_delete.invoke_arn
      function_name = module.lambda_trails_delete.function_name
      route_key     = "DELETE /trails/{id}"
    }
    trails-get = {
      invoke_arn    = module.lambda_trails_get.invoke_arn
      function_name = module.lambda_trails_get.function_name
      route_key     = "GET /trails"
    }
    trails-update = {
      invoke_arn    = module.lambda_trails_update.invoke_arn
      function_name = module.lambda_trails_update.function_name
      route_key     = "PUT /trails/{id}"
    }
    waypoints-create = {
      invoke_arn    = module.lambda_waypoints_create.invoke_arn
      function_name = module.lambda_waypoints_create.function_name
      route_key     = "POST /waypoints"
    }
    waypoints-delete = {
      invoke_arn    = module.lambda_waypoints_delete.invoke_arn
      function_name = module.lambda_waypoints_delete.function_name
      route_key     = "DELETE /waypoints/{id}"
    }
    waypoints-fetch-meta = {
      invoke_arn    = module.lambda_waypoints_fetch_meta.invoke_arn
      function_name = module.lambda_waypoints_fetch_meta.function_name
      route_key     = "GET /waypoints/fetch-meta"
    }
    waypoints-get = {
      invoke_arn    = module.lambda_waypoints_get.invoke_arn
      function_name = module.lambda_waypoints_get.function_name
      route_key     = "GET /waypoints"
    }
    waypoints-update = {
      invoke_arn    = module.lambda_waypoints_update.invoke_arn
      function_name = module.lambda_waypoints_update.function_name
      route_key     = "PUT /waypoints/{id}"
    }
  }
}