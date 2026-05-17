provider "aws" {
  region  = "us-east-2"
  profile = var.aws_profile
}

# us-east-1 required for ACM with CloudFront
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile
}

# Cross-account provider for writing DNS validation records
# to the hosted zone in the prod account
provider "aws" {
  alias   = "dns"
  region  = "us-east-1"
  profile = var.dns_aws_profile
}
