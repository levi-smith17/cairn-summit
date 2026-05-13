# Placeholder zip so Terraform can create the function before code is deployed
data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'placeholder' })"
    filename = "index.js"
  }
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
  handler          = var.handler_path != null ? var.handler_path : "${replace(var.function_name, "-", "/")}/handler.handler"
  memory_size      = var.memory_size
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  source_code_hash = data.archive_file.placeholder.output_base64sha256
  timeout          = var.timeout

  environment {
    variables = {
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      DYNAMODB_TABLE       = var.dynamodb_table_name
      NODE_ENV             = var.environment
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
