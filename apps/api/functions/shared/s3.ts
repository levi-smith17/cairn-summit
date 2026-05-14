import { S3Client } from '@aws-sdk/client-s3'

export const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-2' })

// private, presigned URL reads
export const PRIVATE_MEDIA_BUCKET = process.env.S3_PRIVATE_MEDIA_BUCKET ?? 'cairn-private-media'

// public reads via CloudFront media distribution
export const PUBLIC_MEDIA_BUCKET = process.env.S3_PUBLIC_MEDIA_BUCKET ?? 'cairn-public-media'

// Media CloudFront base URL — used to construct public URLs
// e.g. https://media.cairn.ing/companions/{userId}/{filename}
export const MEDIA_CDN_URL = process.env.MEDIA_CDN_URL ?? ''

export const PRESIGN_EXPIRES = 3600 // 1 hour

// Allowed MIME types per bucket
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm']
export const MAX_VIDEO_DURATION_SECONDS = 300 // 5 minutes — enforced at presign time if duration metadata is available