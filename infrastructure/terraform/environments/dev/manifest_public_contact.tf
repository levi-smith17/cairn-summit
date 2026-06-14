data "archive_file" "manifest_public_contact" {
  type        = "zip"
  output_path = "${path.module}/placeholders/manifest-public-contact.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'placeholder' })"
    filename = "index.js"
  }
}

resource "aws_iam_role" "manifest_public_contact" {
  name = "cairn-${var.environment}-manifest-public-contact"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "manifest_public_contact_basic" {
  role       = aws_iam_role.manifest_public_contact.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "manifest_public_contact" {
  name = "cairn-${var.environment}-manifest-public-contact"
  role = aws_iam_role.manifest_public_contact.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*",
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      },
    ]
  })
}

resource "aws_lambda_function" "manifest_public_contact" {
  filename         = data.archive_file.manifest_public_contact.output_path
  function_name    = "cairn-${var.environment}-manifest-public-contact"
  handler          = "manifest/public-contact/handler.handler"
  memory_size      = 256
  role             = aws_iam_role.manifest_public_contact.arn
  runtime          = "nodejs22.x"
  source_code_hash = data.archive_file.manifest_public_contact.output_base64sha256
  timeout          = 30

  environment {
    variables = {
      DYNAMODB_TABLE        = var.dynamodb_table_name
      NODE_ENV              = var.environment
      SES_CONFIGURATION_SET = var.ses_configuration_set_name
      SES_FROM_EMAIL        = var.ses_from_email
      WEB_URL               = "https://dev.${var.domain}"
    }
  }

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}
