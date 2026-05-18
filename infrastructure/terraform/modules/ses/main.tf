resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.domain

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }

  tags = {
    Environment = var.environment
    ManagedBy   = var.managed_by
    Owner       = var.owner
    Project     = var.project_name
  }
}

resource "aws_sesv2_email_identity_mail_from_attributes" "domain" {
  email_identity   = aws_sesv2_email_identity.domain.email_identity
  mail_from_domain = "mail.${var.domain}"
}

resource "aws_sesv2_configuration_set" "main" {
  configuration_set_name = "${var.project_name}-${var.environment}"

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }

  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }

  delivery_options {
    tls_policy = "REQUIRE"
  }

  tags = {
    Environment = var.environment
    ManagedBy   = var.managed_by
    Owner       = var.owner
    Project     = var.project_name
  }
}
