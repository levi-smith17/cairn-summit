domain                     = "cairn.ing"
dynamodb_table_arn         = "arn:aws:dynamodb:us-east-2:491121232780:table/cairn-prod"
dynamodb_table_name        = "cairn-prod"
environment                = "prod"
hosted_zone_id             = "Z02456308PQX2QC1QSJH"
manifest_hosted_zone_name  = "levismith.us"
# Apex moved to Fjall CloudFront (asgard_fjall). Keep empty so Summit CF releases the CNAMEs.
manifest_web_domains       = []
ses_configuration_set_name = "cairn-prod"
ses_from_email             = "noreply@cairn.ing"