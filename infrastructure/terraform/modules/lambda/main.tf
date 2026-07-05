# Placeholder zip so Terraform can create the function before code is deployed
data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholders/${var.function_name}.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'placeholder' })"
    filename = "index.js"
  }
}

locals {
  parts        = split("-", var.function_name)
  domain       = local.parts[0]
  operation    = join("-", slice(local.parts, 1, length(local.parts)))
  handler_path = "${local.domain}/${local.operation}/handler.handler"
}

resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-${var.environment}-${var.function_name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    environment = var.environment
    feature     = var.function_name
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "feature" {
  role       = aws_iam_role.lambda.name
  policy_arn = var.policy_arn
}

resource "aws_lambda_function" "main" {
  filename         = data.archive_file.placeholder.output_path
  function_name    = "${var.project_name}-${var.environment}-${var.function_name}"
  handler          = local.handler_path
  memory_size      = var.memory_size
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  source_code_hash = data.archive_file.placeholder.output_base64sha256
  timeout          = var.timeout

  environment {
    variables = {
      CLOUDFRONT_PUBLIC_MEDIA_URL = var.cloudfront_public_media_url
      COGNITO_CLIENT_ID           = var.cognito_client_id
      COGNITO_USER_POOL_ID        = var.cognito_user_pool_id
      DYNAMODB_TABLE              = var.dynamodb_table_name
      MEDIA_CDN_URL               = var.media_cdn_url
      NODE_ENV                    = var.environment
      S3_PRIVATE_MEDIA_BUCKET     = var.s3_private_media_bucket
      S3_PUBLIC_MEDIA_BUCKET      = var.s3_public_media_bucket
      SES_CONFIGURATION_SET       = var.ses_configuration_set_name
      SES_FROM_EMAIL              = var.ses_from_email
      WEB_URL                     = var.web_url
    }
  }

  tags = {
    environment = var.environment
    feature     = var.function_name
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}
