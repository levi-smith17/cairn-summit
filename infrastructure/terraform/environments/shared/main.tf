terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Without a remote backend this env used empty local state on every CI run,
  # so `terraform apply` recreated the cairn.ing hosted zone each time shared/
  # changed (that is how the duplicate zone appeared). Persist state in S3.
  backend "s3" {
    bucket = "cairn-prod-terraform-state"
    key    = "shared/terraform.tfstate"
    region = "us-east-2"
  }
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile
}

# ACM requires us-east-1 for CloudFront
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile
}
