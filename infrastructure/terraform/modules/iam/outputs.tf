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

output "lambda_read_ssm_policy_arn" {
  value = aws_iam_policy.lambda_read_ssm.arn
}

output "lambda_s3_private_media_policy_arn" {
  value = aws_iam_policy.lambda_s3_private_media.arn
}

output "lambda_s3_private_media_read_policy_arn" {
  value = aws_iam_policy.lambda_s3_private_media_read.arn
}

output "lambda_s3_private_media_dynamo_write_policy_arn" {
  value = aws_iam_policy.lambda_s3_private_media_dynamo_write.arn
}

output "lambda_s3_public_media_policy_arn" {
  value = aws_iam_policy.lambda_s3_public_media.arn
}

output "lambda_ses_write_policy_arn" {
  value = aws_iam_policy.lambda_ses_write.arn
}

output "lambda_write_policy_arn" {
  value = aws_iam_policy.lambda_write.arn
}

output "lambda_write_ssm_policy_arn" {
  value = aws_iam_policy.lambda_write_ssm.arn
}

output "lambda_delete_ssm_policy_arn" {
  value = aws_iam_policy.lambda_delete_ssm.arn
}

output "lambda_account_delete_policy_arn" {
  value = aws_iam_policy.lambda_account_delete.arn
}