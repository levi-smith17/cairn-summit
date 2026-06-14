variable "cognito_user_pool_id" {}
variable "dynamodb_table_name" {}
variable "environment" {}
variable "managed_by" {}
variable "owner" {}
variable "project_name" {}
variable "cloudfront_public_media_url" { default = "" }
variable "lambda_account_delete_policy_arn" {}
variable "lambda_delete_policy_arn" {}
variable "lambda_delete_ssm_policy_arn" {}
variable "lambda_read_policy_arn" {}

variable "lambda_read_ssm_policy_arn" {}
variable "lambda_s3_private_media_policy_arn" {}
variable "lambda_s3_public_media_policy_arn" {}
variable "lambda_write_policy_arn" {}
variable "lambda_ses_write_policy_arn" {}
variable "lambda_write_ssm_policy_arn" {}
variable "media_cdn_url" { default = "" }
variable "ses_configuration_set_name" { default = "" }
variable "ses_from_email" { default = "" }
variable "s3_private_media_bucket" { default = "" }
variable "s3_public_media_bucket" { default = "" }
variable "web_url" { default = "" }
