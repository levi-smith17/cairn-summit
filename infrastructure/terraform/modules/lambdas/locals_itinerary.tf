locals {
  lambdas_itinerary = {
    "itinerary-events-get" = {
      policy_arn = var.lambda_read_ssm_policy_arn
      route_key  = "GET /itinerary/events"
      timeout    = 30
    }
    "itinerary-calendars-create" = {
      policy_arn = var.lambda_write_ssm_policy_arn
      route_key  = "POST /itinerary"
    }
    "itinerary-calendars-delete" = {
      policy_arn = var.lambda_delete_ssm_policy_arn
      route_key  = "DELETE /itinerary/{id}"
    }
    "itinerary-calendars-update" = {
      policy_arn = var.lambda_write_ssm_policy_arn
      route_key  = "PUT /itinerary/{id}"
    }
    "itinerary-subscriptions-create" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "POST /itinerary-subscriptions"
    }
    "itinerary-subscriptions-delete" = {
      policy_arn = var.lambda_delete_policy_arn
      route_key  = "DELETE /itinerary-subscriptions/{id}"
    }
    "itinerary-subscriptions-update" = {
      policy_arn = var.lambda_write_policy_arn
      route_key  = "PUT /itinerary-subscriptions/{id}"
    }
  }
}
