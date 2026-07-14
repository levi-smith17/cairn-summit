# Fjall (asgard.levismith.us) uses the secretless web client below, not the
# oauth2-proxy "asgard" client. After apply, set in asgard_fjall:
#   VITE_COGNITO_USER_POOL_ID = us-east-2_lf42INJJ7
#   VITE_COGNITO_CLIENT_ID    = 4sqhce1qj85imq4sk8i9dei36d
# (confirm with: terraform output cognito_user_pool_id / cognito_client_id)
module "cognito" {
  source       = "../../modules/cognito"
  environment  = var.environment
  managed_by   = var.managed_by
  owner        = var.owner
  project_name = var.project_name

  # Fjall public origin + local Vite (port 5180). Trailing-slash variants included.
  callback_urls = [
    "https://asgard.levismith.us",
    "https://asgard.levismith.us/",
    "http://localhost:5180",
    "http://localhost:5180/",
  ]
  logout_urls = [
    "https://asgard.levismith.us",
    "https://asgard.levismith.us/",
    "http://localhost:5180",
    "http://localhost:5180/",
  ]
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