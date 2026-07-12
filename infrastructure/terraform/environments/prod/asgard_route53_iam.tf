# IAM user for Asgard's Urdarbrunnr Cloud tab — Route53 hosted-zone CRUD
# in this account (cairn-prod). Static access keys are bootstrapped into
# Asgard Settings → route53 (access-key-id / secret-access-key / region).

resource "aws_iam_user" "asgard_route53" {
  name = "${var.project_name}-${var.environment}-asgard-route53"

  # Ensure CI role policy gains CreateUser/etc. before this resource runs
  # in the same apply that first introduces the IAM user.
  depends_on = [module.github_oidc]

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
    purpose     = "asgard-urdarbrunnr-cloud"
  }
}

data "aws_iam_policy_document" "asgard_route53" {
  statement {
    sid    = "ListHostedZones"
    effect = "Allow"
    actions = [
      "route53:ListHostedZones",
      "route53:ListHostedZonesByName",
      "route53:GetHostedZone",
      "route53:GetHostedZoneCount",
      "route53:ListTagsForResource",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ManageRecordsInAllZones"
    effect = "Allow"
    actions = [
      "route53:ListResourceRecordSets",
      "route53:GetChange",
      "route53:ChangeResourceRecordSets",
    ]
    resources = [
      "arn:aws:route53:::hostedzone/*",
      "arn:aws:route53:::change/*",
    ]
  }
}

resource "aws_iam_user_policy" "asgard_route53" {
  name   = "${var.project_name}-${var.environment}-asgard-route53"
  user   = aws_iam_user.asgard_route53.name
  policy = data.aws_iam_policy_document.asgard_route53.json
}

resource "aws_iam_access_key" "asgard_route53" {
  user = aws_iam_user.asgard_route53.name
}
