# Manifest custom domain — levismith.us aliases to the same prod web CloudFront distribution as cairn.ing.
# CloudFront must list these domains as alternate names and the ACM cert must cover them before Route 53
# alias records can be created (console alias picker enforces this).

data "aws_route53_zone" "manifest" {
  count = length(var.manifest_web_domains) > 0 && var.manifest_hosted_zone_name != null ? 1 : 0
  name  = var.manifest_hosted_zone_name
}

locals {
  manifest_web_alias_targets = {
    for domain in var.manifest_web_domains : domain => {
      name    = domain == var.manifest_hosted_zone_name ? "" : replace(domain, ".${var.manifest_hosted_zone_name}", "")
      zone_id = data.aws_route53_zone.manifest[0].zone_id
    }
  }
}

resource "aws_route53_record" "manifest_web" {
  for_each = local.manifest_web_alias_targets

  zone_id = each.value.zone_id
  name    = each.value.name
  type    = "A"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront hosted zone ID (global constant)
    evaluate_target_health = false
  }
}
