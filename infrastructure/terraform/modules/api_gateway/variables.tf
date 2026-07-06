variable "allowed_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = ["http://localhost:3000", "http://localhost:5173"]
}

variable "authorizer_function_name" {
  type = string
}

variable "authorizer_invoke_arn" {
  type = string
}

variable "cognito_client_id" {
  type = string
}

variable "cognito_user_pool_id" {
  type = string
}

variable "environment" {
  type = string
}

variable "lambda_functions" {
  description = "Map of route key to Lambda invoke ARN and function name"
  type = map(object({
    invoke_arn    = string
    function_name = string
    route_key     = string
  }))
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