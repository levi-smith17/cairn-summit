output "media_cloudfront_distribution_arn" {
  value = aws_cloudfront_distribution.media.arn
}

output "media_cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.media.id
}

output "media_cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.media.domain_name}"
}

output "private_media_bucket" {
  value = aws_s3_bucket.private_media.bucket
}

output "private_media_bucket_arn" {
  value = aws_s3_bucket.private_media.arn
}

output "public_media_bucket" {
  value = aws_s3_bucket.public_media.bucket
}

output "public_media_bucket_arn" {
  value = aws_s3_bucket.public_media.arn
}