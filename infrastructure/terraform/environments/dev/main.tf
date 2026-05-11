terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "cairn-terraform-state"
    key     = "dev/terraform.tfstate"
    region  = "us-east-2"
    profile = "cairn-dev"
  }
}

provider "aws" {
  region  = "us-east-2"
  profile = var.aws_profile
}

module "cognito" {
  source        = "../../modules/cognito"
  environment   = var.environment
  managed_by    = var.managed_by
  owner         = var.owner
  project_name  = var.project_name
}

module "dynamodb" {
  source        = "../../modules/dynamodb"
  environment   = var.environment
  managed_by    = var.managed_by
  owner         = var.owner
  pitr_enabled  = false
  project_name  = var.project_name
}

module "iam" {
  source             = "../../modules/iam"
  dynamodb_table_arn = module.dynamodb.table_arn
  environment        = var.environment
  managed_by         = var.managed_by
  owner              = var.owner
  project_name       = var.project_name
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

module "github_oidc" {
  source      = "../../modules/github_oidc"
  environment = var.environment
  github_repo = "levi-smith17/cairn-summit"
  managed_by  = var.managed_by
  owner       = var.owner
  project_name = var.project_name

  dynamodb_table_arn = module.dynamodb.table_arn
  lambda_function_arns = [
    module.lambda_markers_create.function_arn,
    module.lambda_markers_delete.function_arn,
    module.lambda_markers_get.function_arn,
    module.lambda_markers_update.function_arn,
  ]
}

module "api_gateway" {
  source               = "../../modules/api_gateway"
  cognito_client_id    = module.cognito.cognito_client_id
  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  environment          = var.environment
  managed_by           = var.managed_by
  owner                = var.owner
  project_name         = var.project_name

  lambda_functions = {
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
  }
}