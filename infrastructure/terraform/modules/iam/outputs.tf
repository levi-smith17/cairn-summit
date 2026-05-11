output "lambda_delete_policy_arn" {
  value = aws_iam_policy.lambda_delete.arn
}

output "lambda_execution_role_arn" {
  value = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  value = aws_iam_role.lambda_execution.name
}

output "lambda_read_policy_arn" {
  value = aws_iam_policy.lambda_read.arn
}

output "lambda_write_policy_arn" {
  value = aws_iam_policy.lambda_write.arn
}