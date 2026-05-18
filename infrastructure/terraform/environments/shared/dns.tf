resource "aws_route53_zone" "main" {
  name = var.domain

  tags = {
    managed_by = var.managed_by
    owner      = var.owner
    project    = var.project_name
  }
}

# ── Email records (iCloud) ─────────────────────────────────────────────────────

resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "MX"
  ttl     = 3600
  records = [
    "10 mx01.mail.icloud.com.",
    "10 mx02.mail.icloud.com.",
  ]
}

resource "aws_route53_record" "txt" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "TXT"
  ttl     = 3600
  records = [
    "v=spf1 include:icloud.com ~all",
    "apple-domain=6lGZBFkCGvtArMB3",
  ]
}

resource "aws_route53_record" "dkim" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "sig1._domainkey"
  type    = "CNAME"
  ttl     = 3600
  records = ["sig1.dkim.cairn.ing.at.icloudmailadmin.com."]
}

# ── Dev records ────────────────────────────────────────────────────────────────

resource "aws_route53_record" "dev_api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.dev.${var.domain}"
  type    = "A"

  alias {
    name                   = var.dev_api_gateway_domain
    zone_id                = var.dev_api_gateway_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "dev_web" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "dev.${var.domain}"
  type    = "A"

  alias {
    name                   = var.dev_web_cloudfront_domain
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront hosted zone ID (always this value)
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "dev_media" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "media.dev.${var.domain}"
  type    = "A"

  alias {
    name                   = var.dev_media_cloudfront_domain
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

# ── Prod records (conditional on CloudFront domains being set) ─────────────────

resource "aws_route53_record" "prod_api" {
  count   = var.prod_api_gateway_domain != null ? 1 : 0
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain}"
  type    = "A"

  alias {
    name                   = var.prod_api_gateway_domain
    zone_id                = var.prod_api_gateway_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "prod_web" {
  count   = var.prod_web_cloudfront_domain != null ? 1 : 0
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "A"

  alias {
    name                   = var.prod_web_cloudfront_domain
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "prod_media" {
  count   = var.prod_media_cloudfront_domain != null ? 1 : 0
  zone_id = aws_route53_zone.main.zone_id
  name    = "media.${var.domain}"
  type    = "A"

  alias {
    name                   = var.prod_media_cloudfront_domain
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}
