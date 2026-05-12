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
}