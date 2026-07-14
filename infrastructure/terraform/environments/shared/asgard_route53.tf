# Cross-account role for Asgard (homelab k3s) to manage Route53 without
# long-lived Cairn IAM access keys. Asgard's asgard-ssm user assumes this role
# with ExternalId; the AWS SDK refreshes STS credentials automatically.

variable "asgard_aws_account_id" {
  description = "AWS account ID that hosts the asgard-ssm IAM user"
  type        = string
  default     = "910896517350"
}

variable "asgard_ssm_iam_user_name" {
  description = "IAM user name in the Asgard account allowed to assume this role"
  type        = string
  default     = "asgard-ssm"
}

variable "asgard_route53_additional_zone_names" {
  description = "Extra hosted zone names (in this account) Asgard may manage alongside var.domain"
  type        = list(string)
  default     = ["levismith.us"]
}

data "aws_route53_zone" "asgard_route53_extra" {
  for_each = toset(var.asgard_route53_additional_zone_names)
  name     = each.value
}

resource "random_password" "asgard_route53_external_id" {
  length  = 40
  special = false
}

locals {
  asgard_route53_zone_ids = distinct(concat(
    [aws_route53_zone.main.zone_id],
    [for z in data.aws_route53_zone.asgard_route53_extra : z.zone_id],
  ))
  asgard_route53_zone_arns = [
    for id in local.asgard_route53_zone_ids : "arn:aws:route53:::hostedzone/${id}"
  ]
}

data "aws_iam_policy_document" "asgard_route53_trust" {
  statement {
    sid     = "AllowAsgardSsmAssume"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.asgard_aws_account_id}:user/${var.asgard_ssm_iam_user_name}"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [random_password.asgard_route53_external_id.result]
    }
  }
}

data "aws_iam_policy_document" "asgard_route53" {
  statement {
    sid    = "ListHostedZones"
    effect = "Allow"
    actions = [
      "route53:ListHostedZones",
      "route53:ListHostedZonesByName",
      "route53:GetHostedZoneCount",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ManageRecordsOnAllowedZones"
    effect = "Allow"
    actions = [
      "route53:GetHostedZone",
      "route53:ListResourceRecordSets",
      "route53:ChangeResourceRecordSets",
      "route53:ListTagsForResource",
    ]
    resources = local.asgard_route53_zone_arns
  }

  statement {
    sid       = "GetChangeStatus"
    effect    = "Allow"
    actions   = ["route53:GetChange"]
    resources = ["arn:aws:route53:::change/*"]
  }
}

resource "aws_iam_role" "asgard_route53" {
  name               = "asgard-route53"
  description        = "Assumed by Asgard asgard-ssm for Urdarbrunnr Cloud Route53 access"
  assume_role_policy = data.aws_iam_policy_document.asgard_route53_trust.json

  tags = {
    managed_by = var.managed_by
    owner      = var.owner
    project    = var.project_name
    purpose    = "asgard-cross-account-route53"
  }
}

resource "aws_iam_role_policy" "asgard_route53" {
  name   = "asgard-route53-dns"
  role   = aws_iam_role.asgard_route53.id
  policy = data.aws_iam_policy_document.asgard_route53.json
}
