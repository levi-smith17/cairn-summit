output "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "asgard_route53_role_arn" {
  description = "IAM role ARN for Asgard to AssumeRole into for Route53 (Urdarbrunnr Cloud)"
  value       = aws_iam_role.asgard_route53.arn
}

output "asgard_route53_external_id" {
  description = "sts:ExternalId required when Asgard assumes asgard-route53 — store in Asgard SSM /asgard/route53/external-id"
  value       = random_password.asgard_route53_external_id.result
  sensitive   = true
}

output "asgard_route53_zone_ids" {
  description = "Hosted zone IDs the asgard-route53 role can manage"
  value       = local.asgard_route53_zone_ids
}
