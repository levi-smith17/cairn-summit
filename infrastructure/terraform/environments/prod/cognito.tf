module "cognito" {
  source        = "../../modules/cognito"
  environment   = var.environment
  managed_by    = var.managed_by
  owner         = var.owner
  project_name  = var.project_name
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "cairn-prod-auth"   # becomes https://cairn-prod-auth.auth.us-east-2.amazoncognito.com
  user_pool_id = module.cognito.cognito_user_pool_id
}

resource "aws_cognito_user_group" "asgard_admins" {
  user_pool_id = module.cognito.cognito_user_pool_id  # reference your existing pool resource
  name         = "asgard-admins"
  description  = "Users allowed to administer Asgard"
}

resource "aws_cognito_user_in_group" "you_asgard_admin" {
  user_pool_id = module.cognito.cognito_user_pool_id
  group_name   = aws_cognito_user_group.asgard_admins.name
  username     = "610b75f0-6031-703c-a794-0924826eaa3f"
}

resource "aws_cognito_user_pool_client" "asgard" {
  name                                 = "asgard"
  user_pool_id                         = module.cognito.cognito_user_pool_id
  generate_secret                      = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = ["https://asgard.levismith.us/oauth2/callback"]
  logout_urls                          = ["https://asgard.levismith.us/oauth2/sign_in"]
}