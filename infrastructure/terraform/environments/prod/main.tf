terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "cairn-prod-terraform-state"
    key     = "prod/terraform.tfstate"
    region  = "us-east-2"
  }
}

provider "aws" {
  region = "us-east-2"
}

module "cognito" {
  source       = "../../modules/cognito"
  environment  = var.environment
  managed_by   = var.managed_by
  owner        = var.owner
  project_name = var.project_name
}

module "dynamodb" {
  source       = "../../modules/dynamodb"
  environment  = var.environment
  managed_by   = var.managed_by
  owner        = var.owner
  project_name = var.project_name
  pitr_enabled = true
}

module "iam" {
  source             = "../../modules/iam"
  dynamodb_table_arn = module.dynamodb.table_arn
  environment        = var.environment
  managed_by         = var.managed_by
  owner              = var.owner
  project_name       = var.project_name
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

module "github_oidc" {
  source                  = "../../modules/github_oidc"
  environment             = var.environment
  github_repo             = var.github_repo
  managed_by              = var.managed_by
  owner                   = var.owner
  project_name            = var.project_name
  terraform_state_bucket  = "cairn-prod-terraform-state"

  dynamodb_table_arn = module.dynamodb.table_arn
  lambda_function_arns = [
    module.lambda_logs_create.function_arn,
    module.lambda_logs_delete.function_arn,
    module.lambda_logs_get.function_arn,
    module.lambda_logs_update.function_arn,
    module.lambda_markers_create.function_arn,
    module.lambda_markers_delete.function_arn,
    module.lambda_markers_get.function_arn,
    module.lambda_markers_update.function_arn,
    module.lambda_profile_get.function_arn,
    module.lambda_signals_contact.function_arn,
    module.lambda_signals_delete.function_arn,
    module.lambda_signals_get.function_arn,
    module.lambda_signals_mark_read.function_arn,
    module.lambda_signals_public_thread_get.function_arn,
    module.lambda_signals_public_thread_reply.function_arn,
    module.lambda_signals_reply.function_arn,
    module.lambda_signals_sync.function_arn,
    module.lambda_trails_create.function_arn,
    module.lambda_trails_delete.function_arn,
    module.lambda_trails_get.function_arn,
    module.lambda_trails_update.function_arn,
    module.lambda_waypoints_create.function_arn,
    module.lambda_waypoints_delete.function_arn,
    module.lambda_waypoints_get.function_arn,
    module.lambda_waypoints_update.function_arn,
  ]
}

module "cloudfront" {
  source       = "../../modules/cloudfront"
  environment  = var.environment
  managed_by   = var.managed_by
  owner        = var.owner
  project_name = var.project_name
}

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
    logs-update = {
      invoke_arn    = module.lambda_logs_update.invoke_arn
      function_name = module.lambda_logs_update.function_name
      route_key     = "PUT /logs/{id}"
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
