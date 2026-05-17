"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_VIDEO_DURATION_SECONDS = exports.ALLOWED_VIDEO_TYPES = exports.ALLOWED_IMAGE_TYPES = exports.PRESIGN_EXPIRES = exports.MEDIA_CDN_URL = exports.PUBLIC_MEDIA_BUCKET = exports.PRIVATE_MEDIA_BUCKET = exports.s3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
exports.s3 = new client_s3_1.S3Client({ region: process.env.AWS_REGION ?? 'us-east-2' });
// private, presigned URL reads
exports.PRIVATE_MEDIA_BUCKET = process.env.S3_PRIVATE_MEDIA_BUCKET ?? 'cairn-private-media';
// public reads via CloudFront media distribution
exports.PUBLIC_MEDIA_BUCKET = process.env.S3_PUBLIC_MEDIA_BUCKET ?? 'cairn-public-media';
// Media CloudFront base URL — used to construct public URLs
// e.g. https://media.cairn.ing/companions/{userId}/{filename}
exports.MEDIA_CDN_URL = process.env.MEDIA_CDN_URL ?? '';
exports.PRESIGN_EXPIRES = 3600; // 1 hour
// Allowed MIME types per bucket
exports.ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
exports.ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm'];
exports.MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes — enforced at presign time if duration metadata is available
//# sourceMappingURL=s3.js.map