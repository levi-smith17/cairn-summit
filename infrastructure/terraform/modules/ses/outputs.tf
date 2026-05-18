output "configuration_set_name" {
  value = aws_sesv2_configuration_set.main.configuration_set_name
}

output "dkim_tokens" {
  value = aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens
}
