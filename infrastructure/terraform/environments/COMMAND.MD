To execute terraform:
AWS_PROFILE=cairn-dev terraform apply -var-file="../shared.tfvars" -var-file="dev.tfvars"