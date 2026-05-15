# ─── Private media bucket (logs, receipts — presigned reads) ─────────────────

resource "aws_s3_bucket" "private_media" {
  bucket = "${var.project_name}-${var.environment}-private-media"

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

resource "aws_s3_bucket_public_access_block" "private_media" {
  bucket                  = aws_s3_bucket.private_media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "private_media" {
  bucket = aws_s3_bucket.private_media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "private_media" {
  bucket = aws_s3_bucket.private_media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "private_media" {
  bucket = aws_s3_bucket.private_media.id

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_versioning" "private_media" {
  bucket = aws_s3_bucket.private_media.id

  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_policy" "private_media" {
  bucket = aws_s3_bucket.private_media.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.private_media.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.media.arn
          }
        }
      }
    ]
  })
}

# ─── Public media bucket (companions — direct CloudFront reads) ───────────────

resource "aws_s3_bucket" "public_media" {
  bucket = "${var.project_name}-${var.environment}-public-media"

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

resource "aws_s3_bucket_public_access_block" "public_media" {
  bucket                  = aws_s3_bucket.public_media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "public_media" {
  bucket = aws_s3_bucket.public_media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "public_media" {
  bucket = aws_s3_bucket.public_media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "public_media" {
  bucket = aws_s3_bucket.public_media.id

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_versioning" "public_media" {
  bucket = aws_s3_bucket.public_media.id

  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_policy" "public_media" {
  bucket = aws_s3_bucket.public_media.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.public_media.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.media.arn
          }
        }
      }
    ]
  })
}

# ─── OAC ─────────────────────────────────────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "media" {
  name                              = "${var.project_name}-${var.environment}-media"
  description                       = "OAC for ${var.project_name} ${var.environment} media"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ─── Response headers policy (public media — cacheable, open CORS) ────────────

resource "aws_cloudfront_response_headers_policy" "public_media" {
  name = "${var.project_name}-${var.environment}-public-media-headers"

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers { items = ["*"] }
    access_control_allow_methods { items = ["GET", "HEAD"] }
    access_control_allow_origins { items = ["*"] }
    origin_override = true
  }

  security_headers_config {
    content_type_options { override = true }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
  }
}

# ─── CloudFront distribution ──────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "media" {
  aliases         = var.custom_domain != null ? [var.custom_domain] : []
  comment         = "${var.project_name}-${var.environment}-media"
  enabled         = true
  http_version    = "http2and3"
  is_ipv6_enabled = true
  price_class     = "PriceClass_100"

  # ── Origin: private media ──────────────────────────────────────────────────
  origin {
    domain_name              = aws_s3_bucket.private_media.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
    origin_id                = "s3-${aws_s3_bucket.private_media.bucket}"
  }

  # ── Origin: public media ───────────────────────────────────────────────────
  origin {
    domain_name              = aws_s3_bucket.public_media.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
    origin_id                = "s3-${aws_s3_bucket.public_media.bucket}"
  }

  # ── Default behavior — private media (TTL 0, presigned query params) ───────
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 0
    max_ttl                = 0
    min_ttl                = 0
    target_origin_id       = "s3-${aws_s3_bucket.private_media.bucket}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "none"
      }
    }
  }

  # ── /public/* — public media, cacheable ────────────────────────────────────
  ordered_cache_behavior {
    path_pattern               = "/public/*"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    default_ttl                = 86400
    max_ttl                    = 31536000
    min_ttl                    = 0
    target_origin_id           = "s3-${aws_s3_bucket.public_media.bucket}"
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.public_media.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # ── /private/* — private media, no caching ────────────────────────────────
  ordered_cache_behavior {
    path_pattern           = "/private/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 0
    max_ttl                = 0
    min_ttl                = 0
    target_origin_id       = "s3-${aws_s3_bucket.private_media.bucket}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.certificate_arn
    cloudfront_default_certificate = var.certificate_arn == null ? true : false
    minimum_protocol_version       = var.certificate_arn != null ? "TLSv1.2_2021" : null
    ssl_support_method             = var.certificate_arn != null ? "sni-only" : null
  }

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}
