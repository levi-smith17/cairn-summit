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

variable "callback_urls" {
  description = "Allowed OAuth callback URLs for the web app client (Hosted UI / code flow). Empty keeps SRP-only."
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "Allowed OAuth logout URLs for the web app client. Empty keeps SRP-only."
  type        = list(string)
  default     = []
}
