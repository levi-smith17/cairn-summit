variable "environment" {
  type = string
}

variable "managed_by" {
  type = string
}

variable "owner" {
  type = string
}

variable "project_name" {
  type = string
}

variable "github_repo" {
  description = "GitHub repo in format owner/repo"
  type        = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "lambda_function_arns" {
  description = "List of Lambda function ARNs CI can update"
  type        = list(string)
}