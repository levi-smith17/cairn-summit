output "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}
