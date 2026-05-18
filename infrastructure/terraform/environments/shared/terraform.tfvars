region         = "us-east-2"
domain         = "cairn.ing"

# Dev
dev_api_gateway_domain      = "d-dtsxrj2do3.execute-api.us-east-2.amazonaws.com"
dev_api_gateway_zone_id     = "ZOJJZC49E0EPZ"
dev_web_cloudfront_domain   = "d1zhadt1d80odb.cloudfront.net"
dev_media_cloudfront_domain = "d7zu9t8oo15aj.cloudfront.net"
dev_ses_dkim_tokens         = [
  "3wxvv5txbqsfkx7kt2bcaw5b43bcwvkm",
  "pqnue2movkush4lrvlyw52ofgu6v7lyb",
  "wfxvaqy3dxeazck33sj5kqmgi52xbprp",
]

# Prod — fill in after prod rebuild
prod_api_gateway_domain      = "d-ilbisepsga.execute-api.us-east-2.amazonaws.com"
prod_api_gateway_zone_id     = "ZOJJZC49E0EPZ"
prod_web_cloudfront_domain   = "dse7slt4rd81w.cloudfront.net"
prod_media_cloudfront_domain = "d31agp12kzn8wp.cloudfront.net"
prod_ses_dkim_tokens         = [
  "wjydqqnfx6j5x525mgptmlvbxav2xb6d",
  "qbr4au2jd33wv3oxnvqyujyqkyyrmzqz",
  "pjscxecbeczwf6a5th3geg3mxigxsrfa",
]
