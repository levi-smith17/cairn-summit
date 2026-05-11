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
    key     = "prod/terraform.tfstate"
    region  = "us-east-2"
    profile = "cairn-prod"
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

variable "aws_profile" {
  type    = string
  default = "cairn-prod"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "manage_by" {
  type    = string
  default = "terraform"
}

variable "owner" {
  type    = string
  default = "levi"
}

variable "project_name" {
  type    = string
  default = "cairn"
}

