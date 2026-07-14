To execute terraform:

```bash
# Dev
cd infrastructure/terraform/environments/dev
AWS_PROFILE=cairn-dev terraform apply \
  -var-file="../shared.tfvars" \
  -var-file="dev.tfvars"

# Prod (Fjall CORS + Cognito web client callbacks)
cd infrastructure/terraform/environments/prod
AWS_PROFILE=cairn-prod terraform plan \
  -var-file="../shared.tfvars" \
  -var-file="prod.tfvars" \
  -var-file="prod.local.tfvars"
AWS_PROFILE=cairn-prod terraform apply \
  -var-file="../shared.tfvars" \
  -var-file="prod.tfvars" \
  -var-file="prod.local.tfvars"

# Cognito IDs for asgard_fjall (.env):
#   terraform output -raw cognito_user_pool_id
#   terraform output -raw cognito_client_id
```
