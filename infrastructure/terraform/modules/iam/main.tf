resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-${var.environment}-lambda-execution"

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
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

# IAM policies — no dependencies
resource "aws_iam_policy" "lambda_delete" {
  name = "${var.project_name}-${var.environment}-lambda-delete"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*",
        ]
      }
    ]
  })

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

resource "aws_iam_policy" "lambda_read" {
  name = "${var.project_name}-${var.environment}-lambda-read"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*",
        ]
      }
    ]
  })

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

resource "aws_iam_policy" "lambda_s3_private_media" {
  name        = "${var.project_name}-${var.environment}-lambda-s3-private-media"
  description = "Lambda access to private media bucket (logs, receipts)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-private-media",
          "arn:aws:s3:::${var.project_name}-${var.environment}-private-media/*",
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_s3_public_media" {
  name        = "${var.project_name}-${var.environment}-lambda-s3-public-media"
  description = "Lambda access to public media bucket (companions)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-public-media",
          "arn:aws:s3:::${var.project_name}-${var.environment}-public-media/*",
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_write" {
  name = "${var.project_name}-${var.environment}-lambda-write"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:PutItem",
          "dynamodb:TransactWriteItems",
          "dynamodb:UpdateItem",
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*",
        ]
      }
    ]
  })

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}
